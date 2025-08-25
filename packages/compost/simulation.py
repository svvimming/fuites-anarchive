import pygame
import pymunk
import random
import os
import math
import numpy as np
from tkinter import filedialog
from typing import List, Tuple, Dict, Any, Set
from skimage.segmentation import felzenszwalb
from skimage.color import rgba2rgb, rgb2gray
from skimage.util import img_as_ubyte
from skimage.transform import resize
from scipy.spatial import ConvexHull, QhullError
from utils import scale_image_to_fit, quit_program, resize_image_to_dimensions, build_curve_surface, convex_hull_vertices_from_curve
from worm import Worm, Glue
from chunk_thingie import Chunk
import sys
import io
from queue import Queue, Empty

# ------------------------------------------------------------
#  ChunkFactory: Responsible for creating Chunk objects
# ------------------------------------------------------------
class ChunkFactory:
    """
    Converts labeled segments from an image into Chunk objects.
    """

    def __init__(self, config: Dict[str, Any], space: pymunk.Space) -> None:
        """
        Args:
            config (Dict[str, Any]): Global config dictionary.
            space (pymunk.Space): Pymunk space for physics objects.
        """
        self.config = config
        self.space = space

    def create_chunks_from_segments(
        self,
        img: pygame.Surface,
        segments: np.ndarray,
        labels_to_downsize: List[int]
    ) -> List[Chunk]:
        """
        Create chunk objects from the labeled image segments.

        Args:
            img (pygame.Surface): The original (scaled) image surface.
            segments (np.ndarray): Label matrix from Felzenszwalb.
            labels_to_downsize (List[int]): List of segment labels that should be downsized.

        Returns:
            List[Chunk]: A list of chunk objects.
        """
        chunks: List[Chunk] = []

        unique_labels = np.unique(segments)
        for segment_label in unique_labels:
            mask = (segments == segment_label)
            coords = np.argwhere(mask)
            if len(coords) < 3:
                continue

            centroid = coords.mean(axis=0)  # (y, x)
            cy, cx = centroid
            min_y, min_x = coords.min(axis=0)
            max_y, max_x = coords.max(axis=0)

            width = max_x - min_x + 1
            height = max_y - min_y + 1

            # Extract the sub-surface
            raw_segment_surface = pygame.Surface((width, height), pygame.SRCALPHA)
            for y, x in coords:
                raw_segment_surface.set_at((x - min_x, y - min_y), img.get_at((x, y)))

            # Shift coords so centroid is (0,0)
            vertices = [(x - cx, y - cy) for (y, x) in coords]
            vertices_array = np.array(vertices)

            # Attempt to form a hull
            try:
                hull = ConvexHull(vertices_array)
            except QhullError:
                continue
            hull_vertices = [tuple(vertices_array[i]) for i in hull.vertices]

            # Calculate bounding box of hull
            hull_xs = [v[0] for v in hull_vertices]
            hull_ys = [v[1] for v in hull_vertices]
            hull_width = max(hull_xs) - min(hull_xs)
            hull_height = max(hull_ys) - min(hull_ys)

            surface_width = max(1, int(math.ceil(hull_width)))
            surface_height = max(1, int(math.ceil(hull_height)))
            centered_surface = pygame.Surface((surface_width, surface_height), pygame.SRCALPHA)

            offset_x = surface_width / 2
            offset_y = surface_height / 2

            # Blit pixels onto centered surface
            for y in range(height):
                for x in range(width):
                    color = raw_segment_surface.get_at((x, y))
                    if color.a > 0:
                        blit_x = int(x - (cx - min_x) + offset_x)
                        blit_y = int(y - (cy - min_y) + offset_y)
                        if 0 <= blit_x < surface_width and 0 <= blit_y < surface_height:
                            centered_surface.set_at((blit_x, blit_y), color)

            # Check if this segment is marked for downsizing
            downsized = segment_label in labels_to_downsize

            # Create the chunk
            chunk = Chunk(
                segment_surface=centered_surface,
                vertices=hull_vertices,
                config=self.config,
                space=self.space,
                downsized=downsized  # Indicate if this chunk should be downsized
            )
            chunks.append(chunk)

        return chunks

# ------------------------------------------------------------
#  ImageProcessor: Responsible for loading & segmenting images
# ------------------------------------------------------------
class ImageProcessor:
    """
    Handles image loading, optional scaling, Felzenszwalb segmentation,
    and compression of low complexity, large segments by marking them for downsizing.
    """

    def __init__(self, config: Dict[str, Any]) -> None:
        """
        Args:
            config (Dict[str, Any]): The entire config dictionary (for segmentation params, compression thresholds, etc.)
        """
        self.config = config

    def load_image_via_dialog(self) -> pygame.Surface:
        """
        Opens a file dialog to load an image via Tkinter.
        
        Returns:
            pygame.Surface: The loaded image (with alpha), or None if canceled.
        """
        file_path = filedialog.askopenfilename(
            title="Select an image",
            filetypes=[("Image files", ("*.png", "*.jpg", "*.jpeg", "*.bmp", "*.gif"))],
        )
        if file_path and os.path.exists(file_path):
            try:
                return pygame.image.load(file_path).convert_alpha()
            except pygame.error as e:
                print(f"Unable to load image: {e}")
        return None

    def segment_image(self, image: pygame.Surface) -> Tuple[np.ndarray, List[int]]:
        """
        Perform Felzenszwalb segmentation on a Pygame image surface,
        then mark segments that are too large and not very complex for downsizing.

        Args:
            image (pygame.Surface): The surface to segment.

        Returns:
            Tuple[np.ndarray, List[int]]: The labeled segments array and list of segment labels to downsize.
        """
        # Convert Pygame surface to numpy array
        numpy_image = pygame.surfarray.array3d(image).swapaxes(0, 1)

        # RGBA → RGB if needed
        if numpy_image.shape[-1] == 4:
            numpy_image = rgba2rgb(numpy_image)
            numpy_image = img_as_ubyte(numpy_image)
            numpy_image = numpy_image[:, :, :3]

        felz_cfg = self.config["segmentation"]["felzenszwalb"]
        segments = felzenszwalb(
            numpy_image,
            scale=felz_cfg["scale"],
            sigma=felz_cfg["sigma"],
            min_size=felz_cfg["min_size"],
        )

        # Compress segments that are too large and not very complex by marking them
        compress_cfg = self.config.get("compression", {})
        max_size = compress_cfg.get("max_size", 5000)          # Default threshold
        min_entropy = compress_cfg.get("min_entropy", 4.0)     # Default entropy threshold

        # Convert RGB image to grayscale for entropy calculation
        grayscale_image = rgb2gray(numpy_image)
        grayscale_image = img_as_ubyte(grayscale_image)  # Convert to 0-255

        unique_labels = np.unique(segments)
        labels_to_downsize: List[int] = []

        for label in unique_labels:
            mask = segments == label
            size = np.sum(mask)
            if size < 3:
                continue  # Ignore very small segments

            # Calculate entropy
            entropy = self._calculate_entropy(grayscale_image, mask)
            # print(f"Segment {label}: size={size}, entropy={entropy}")

            if size > max_size and entropy < min_entropy:
                # print('entropy', entropy)
                # Mark this segment for downsizing
                labels_to_downsize.append(label)
                # print(f"Marking segment {label} for downsizing.")

        return segments, labels_to_downsize

    def _calculate_entropy(self, grayscale_image: np.ndarray, mask: np.ndarray) -> float:
        """
        Calculate the entropy of the given mask in the grayscale image.

        Args:
            grayscale_image (np.ndarray): Grayscale version of the original image.
            mask (np.ndarray): Boolean mask where True represents the segment.

        Returns:
            float: Entropy value.
        """
        # Extract the pixel values within the mask
        pixel_values = grayscale_image[mask]

        if pixel_values.size == 0:
            return 0.0

        # Calculate histogram
        histogram, _ = np.histogram(pixel_values, bins=256, range=(0, 256), density=True)
        histogram = histogram[histogram > 0]  # Remove zero entries to avoid log2 issues

        # Calculate entropy
        entropy = -np.sum(histogram * np.log2(histogram))
        return entropy

# ------------------------------------------------------------
#  UIManager: Responsible for drawing UI elements
# ------------------------------------------------------------
class UIManager:
    """
    Handles creation and rendering of the UI (buttons, bar, debug text).
    """

    def __init__(
        self,
        config: Dict[str, Any],
        screen: pygame.Surface,
        font: pygame.font.Font
    ) -> None:
        """
        Args:
            config (Dict[str, Any]): Global config dict (for colors, button dims, etc.)
            screen (pygame.Surface): The main window surface for drawing.
            font (pygame.font.Font): The font object for text rendering.
        """
        self.config = config
        self.screen = screen
        self.font = font

        sim_cfg = config["simulation"]
        self.width = sim_cfg["window"]["width"]
        self.height = sim_cfg["window"]["height"]
        self.ui_bar_height = sim_cfg["window"]["ui_bar_height"]
        self.colors = config["colors"]

        # Button dims
        self.button_width = sim_cfg["buttons"]["width"]
        self.button_height = sim_cfg["buttons"]["height"]
        self.button_gap = sim_cfg["buttons"]["gap"]

        self.buttons = self._create_buttons()

    def _create_buttons(self) -> List[pygame.Rect]:
        """Create UI button rectangles."""
        upload_rect = pygame.Rect(
            10,
            (self.ui_bar_height - self.button_height) // 2,
            self.button_width,
            self.button_height
        )
        upload_sound_rect = pygame.Rect(
            upload_rect.right + self.button_gap,
            (self.ui_bar_height - self.button_height) // 2,
            self.button_width,
            self.button_height
        )
        clear_rect = pygame.Rect(
            upload_sound_rect.right + self.button_gap,
            (self.ui_bar_height - self.button_height) // 2,
            self.button_width,
            self.button_height
        )
        export_rect = pygame.Rect(
            clear_rect.right + self.button_gap,
            (self.ui_bar_height - self.button_height) // 2,
            self.button_width,
            self.button_height
        )
        quit_rect = pygame.Rect(
            export_rect.right + self.button_gap,
            (self.ui_bar_height - self.button_height) // 2,
            self.button_width,
            self.button_height
        )
        return [upload_rect, upload_sound_rect, clear_rect, export_rect, quit_rect]

    def draw_ui(self, debug_mode: bool, torus_world: bool = False, history_panel_enabled: bool = True, glue_visuals_enabled: bool = True, ui_enabled: bool = True, chunk_count: int = 0) -> None:
        """
        Draw the UI bar, buttons, and optional debug text.

        Args:
            debug_mode (bool): Whether to show debug mode status on the UI bar.
            torus_world (bool): Whether the simulation is in torus world mode.
            history_panel_enabled (bool): Whether the history panel is visible.
            glue_visuals_enabled (bool): Whether glue visuals are visible.
            ui_enabled (bool): Whether UI is currently enabled.
        """
        ui_bar_rect = pygame.Rect(0, 0, self.width, self.ui_bar_height)
        pygame.draw.rect(self.screen, self.colors["UI_BG"], ui_bar_rect)

        button_texts = ["Upload Image", "Upload Sound", "Clear Canvas", "Export Glues (E)", "Quit"]
        for rect, text in zip(self.buttons, button_texts):
            self._draw_button(rect, text)

        # Build right-aligned status texts with shortcuts; lay them out from right edge
        status_texts = [
            f"Chunks: {chunk_count}",
            f"UI: {'ON' if ui_enabled else 'OFF'} (U)",
            f"Glue Visuals: {'ON' if glue_visuals_enabled else 'OFF'} (G)",
            f"History: {'ON' if history_panel_enabled else 'OFF'} (H)",
            f"World: {'Torus' if torus_world else 'Rigid Walls'} (T)",
            f"Debug: {'ON' if debug_mode else 'OFF'} (D)",
        ]
        gap = 20
        x_right = self.width - 10
        y_center = (self.ui_bar_height) // 2
        # Place each status block from right to left
        for text in status_texts:
            surface = self.font.render(text, True, self.colors["WHITE"])
            x_right -= surface.get_width()
            self.screen.blit(surface, (x_right, y_center - surface.get_height() // 2))
            x_right -= gap

    def _draw_button(self, rect: pygame.Rect, text: str) -> None:
        """Draw a single button."""
        pygame.draw.rect(self.screen, self.colors["DARK_GRAY"], rect, border_radius=5)
        text_surface = self.font.render(text, True, self.colors["WHITE"])
        text_rect = text_surface.get_rect(center=rect.center)
        self.screen.blit(text_surface, text_rect)

# ------------------------------------------------------------
#  Simulation: Orchestrates the physics, UI, and chunk management
# ------------------------------------------------------------
class Simulation:
    """
    Orchestrates the Felzenszwalb-based chunk simulation using the above components.
    """

    def __init__(
        self,
        config: Dict[str, Any],
        space: pymunk.Space,
        screen: pygame.Surface,
        font: pygame.font.Font
    ) -> None:
        """
        Initialize the simulation with provided parameters.

        Args:
            config (Dict[str, Any]): The entire configuration loaded from YAML.
            space (pymunk.Space): The physics space.
            screen (pygame.Surface): The main Pygame window surface.
            font (pygame.font.Font): Font for rendering text/UI.
        """
        self.config = config
        self.space = space
        self.screen = screen
        self.font = font
        self.debug_mode = False
        self.glue_visuals_enabled = config["worm"]["glue"]["visual"].get("enabled", True)
        self.history_panel_enabled = config["worm"]["history_panel"]["enabled"]
        self.ui_enabled = config["simulation"].get("ui_enabled", True)

        # Build sub-components
        self.ui_manager = UIManager(config, screen, font)
        self.chunk_factory = ChunkFactory(config, space)
        self.image_processor = ImageProcessor(config)

        # Local references
        self.width = config["simulation"]["window"]["width"]
        self.height = config["simulation"]["window"]["height"]
        self.ui_bar_height = config["simulation"]["window"]["ui_bar_height"]
        self.colors = config["colors"]
        self.torus_world = config["simulation"].get("torus_world", False)

        self.chunks: List[Chunk] = []
        self.worm: Worm = None
        self.worms: List[Worm] = []
        self.glues: List[Glue] = []  # List to store all active glues
        self.boundary_walls = []
        # Thread-safe queue for incoming uploads from background server
        self._upload_queue: "Queue[Tuple[bytes, int, int]]" = Queue()
        
        # Audio playback for sound chunks
        self.playing_chunks = {}  # Track currently playing chunks: {chunk: channel}
        self.last_hovered_chunks = set()  # Track chunks that were hovered last frame
        
        # Initialize pygame mixer for audio playback with multiple channels
        try:
            pygame.mixer.init(frequency=22050, size=-16, channels=2, buffer=512)
            pygame.mixer.set_num_channels(16)  # Allow up to 16 simultaneous sounds
            print("Audio mixer initialized successfully with 16 channels")
        except pygame.error as e:
            print(f"Failed to initialize audio mixer: {e}")

        # Create boundaries
        self._create_boundaries()

    def get_chunks_at_mouse(self, mouse_pos: Tuple[int, int]) -> List[Chunk]:
        """
        Find ALL chunks under the mouse cursor using physics collision detection.
        
        Args:
            mouse_pos: (x, y) mouse position
            
        Returns:
            List of Chunk objects found at position
        """
        # Get all shapes at the mouse position (not just nearest)
        point_queries = self.space.point_query(mouse_pos, 0, pymunk.ShapeFilter())
        
        found_chunks = []
        if point_queries:
            # Find all chunks that own these physics shapes
            for point_query in point_queries:
                if point_query.shape:
                    for chunk in self.chunks:
                        if chunk.shape == point_query.shape:
                            found_chunks.append(chunk)
                            break
        
        return found_chunks

    def handle_audio_hover(self, mouse_pos: Tuple[int, int]) -> None:
        """
        Handle audio playback when hovering over sound chunks.
        Detects ALL overlapping chunks and plays them simultaneously.
        
        Args:
            mouse_pos: (x, y) mouse position
        """
        hovered_chunks = set(self.get_chunks_at_mouse(mouse_pos))
        
        # Find newly hovered chunks (not hovered in previous frame)
        newly_hovered = hovered_chunks - self.last_hovered_chunks
        
        # Start playing audio for newly hovered chunks
        for chunk in newly_hovered:
            if chunk.audio_path and chunk not in self.playing_chunks:
                try:
                    sound = pygame.mixer.Sound(chunk.audio_path)
                    channel = sound.play()
                    if channel:
                        self.playing_chunks[chunk] = channel
                        print(f"Playing audio: {os.path.basename(chunk.audio_path)}")
                except pygame.error as e:
                    print(f"Failed to play audio {chunk.audio_path}: {e}")
        
        # Update tracking for next frame
        self.last_hovered_chunks = hovered_chunks

    def cleanup_finished_audio(self) -> None:
        """
        Clean up the playing_chunks dict by removing chunks whose audio channels have finished.
        This is lightweight and runs every frame to dynamically track individual completions.
        """
        # Create a list of chunks to remove (can't modify dict while iterating)
        finished_chunks = []
        
        for chunk, channel in self.playing_chunks.items():
            if not channel.get_busy():  # Channel is no longer playing
                finished_chunks.append(chunk)
        
        # Remove finished chunks from the tracking dict
        for chunk in finished_chunks:
            del self.playing_chunks[chunk]

    def _create_boundaries(self) -> None:
        """
        Create boundaries based on the configuration.
        If torus_world is True, creates a torus world without walls.
        If False, creates rigid walls around the simulation area.
        Note: The UI bar is treated as an overlay, with rigid walls at the screen edges.
        """
        if not self.torus_world:
            # Create traditional rigid walls at screen edges
            static_lines = [
                pymunk.Segment(self.space.static_body, (0, 0), (self.width, 0), 1),
                pymunk.Segment(self.space.static_body, (0, 0), (0, self.height), 1),
                pymunk.Segment(self.space.static_body, (0, self.height), (self.width, self.height), 1),
                pymunk.Segment(self.space.static_body, (self.width, 0), (self.width, self.height), 1),
            ]
            for line in static_lines:
                line.elasticity = 1.0
                line.friction = 5.0
            self.space.add(*static_lines)
            # Store references to these walls to be able to remove them later
            self.boundary_walls = static_lines
        else:
            # For torus world, no walls are needed
            self.boundary_walls = []

    def clear_boundaries(self) -> None:
        """
        Remove any existing boundary walls from the space.
        """
        # Only attempt removal if there are walls and they were previously added
        if hasattr(self, 'boundary_walls') and self.boundary_walls:
            for wall in self.boundary_walls:
                self.space.remove(wall)
            self.boundary_walls = []

    def handle_torus_wrapping(self) -> None:
        """
        Handle the torus wrapping for all bodies in the space.
        If a body goes beyond an edge, wrap it to the opposite edge.
        This creates a seamless torus world effect.
        Note: The UI bar is treated as an overlay, with wrapping happening across the full screen.
        """
        # Check all bodies in the space
        for body in self.space.bodies:
            # Skip static bodies
            if body.body_type == pymunk.Body.STATIC:
                continue
                
            position = body.position
            
            # Get the shape if present (to determine object size)
            shape = None
            for s in self.space.shapes:
                if s.body == body:
                    shape = s
                    break
                
            # Only teleport when completely beyond the boundary
            # We'll use a small margin to avoid flickering at the boundaries
            margin = 0
            if shape:
                # If we have a shape, use it to determine when to teleport
                # (only when the entire shape is beyond the boundary)
                if hasattr(shape, 'radius'):
                    margin = shape.radius
                elif hasattr(shape, 'get_vertices'):
                    vertices = shape.get_vertices()
                    if vertices:
                        # Find furthest point from center in each direction
                        max_x = max(abs(v.x) for v in vertices)
                        max_y = max(abs(v.y) for v in vertices)
                        margin = max(max_x, max_y)
                
            # Check x-axis boundaries - only teleport when fully beyond boundary
            if position.x < -margin:
                body.position = pymunk.Vec2d(self.width + position.x, position.y)
            elif position.x > self.width + margin:
                body.position = pymunk.Vec2d(position.x - self.width, position.y)
                
            # Check y-axis boundaries - treat top of screen as top boundary (ignore UI bar)
            if position.y < -margin:
                body.position = pymunk.Vec2d(position.x, self.height + position.y)
            elif position.y > self.height + margin:
                body.position = pymunk.Vec2d(position.x, position.y - self.height)

    def draw_ui(self) -> None:
        """
        Draw the UI bar, buttons, and debug status.
        """
        if not self.ui_enabled:
            return
        self.ui_manager.draw_ui(
            self.debug_mode,
            self.torus_world,
            self.history_panel_enabled,
            self.glue_visuals_enabled,
            self.ui_enabled,
            len(self.chunks),
        )

    def update_chunks(self) -> None:
        """
        Update (draw) all chunks in the simulation and process worm behavior.
        """
        # Apply torus wrapping if enabled
        if self.torus_world:
            self.handle_torus_wrapping()
        # Draw non-glued chunks
        glued_chunk_ids = self.get_all_glued_chunk_ids()
        for chunk in self.chunks:
            if id(chunk) not in glued_chunk_ids:
                chunk.draw(self.screen, debug_mode=self.debug_mode, torus_world=self.torus_world)
        # Draw glued chunks and glue visuals if enabled
        if self.glue_visuals_enabled:
            for glue in self.glues:
                for glued_chunk in glue.glued_chunks:
                    glued_chunk.draw(self.screen, debug_mode=self.debug_mode, torus_world=self.torus_world)
            for glue in self.glues:
                glue.draw(self.screen)
        else:
            # Draw glued chunks without tint
            for glue in self.glues:
                for glued_chunk in glue.glued_chunks:
                    glued_chunk.chunk.draw(self.screen, debug_mode=self.debug_mode, torus_world=self.torus_world)
        # Update worm if it exists
        if self.worm and not self.worm.is_dead:
            available_chunks = self.get_available_chunks_for_worm()
            next_chunk = self.worm.select_next_chunk(available_chunks)
            if next_chunk:
                self.space.remove(next_chunk.shape, next_chunk.body)
                self.chunks.remove(next_chunk)
                self.worm.consume_chunk(next_chunk)
        # Update the current worm's glue if it has just died
        if self.worm and self.worm.is_dead and self.worm.glue:
            if self.worm.glue not in self.glues:
                self.glues.append(self.worm.glue)
        # Update all glues
        for glue in self.glues:
            available_chunks = self.get_available_chunks_for_glue(glue)
            glue.try_attract_chunks(available_chunks)
            glue.update()
            if self.glue_visuals_enabled:
                glue.draw(self.screen)
        # Draw worm history panels for all worms, compactly offsetting only visible panels
        panel_spacing = 20
        visible_index = 0
        for worm in self.worms:
            if worm and worm.panel_enabled and len(worm.history) > 0:
                x_offset = visible_index * (worm.panel_width + panel_spacing)
                worm.draw(self.screen, x_offset=x_offset)
                visible_index += 1

    def get_all_glued_chunk_ids(self) -> Set[int]:
        """
        Get the IDs of all chunks that are already glued by any glue.
        
        Returns:
            Set[int]: Set of chunk IDs that are already glued.
        """
        glued_chunk_ids = set()
        
        # Add chunks from all glues
        for glue in self.glues:
            glued_chunk_ids.update(id(glued.chunk) for glued in glue.glued_chunks)
            
        # Add chunks from current worm's glue if it exists but isn't in the glues list yet
        if self.worm and self.worm.is_dead and self.worm.glue and self.worm.glue not in self.glues:
            glued_chunk_ids.update(id(glued.chunk) for glued in self.worm.glue.glued_chunks)
            
        return glued_chunk_ids
            
    def get_available_chunks_for_worm(self) -> List[Chunk]:
        """
        Get chunks that aren't already glued by any glue.
        These are the chunks available for the worm to eat.
        
        Returns:
            List[Chunk]: Available chunks for the worm.
        """
        # Get IDs of all glued chunks
        glued_chunk_ids = self.get_all_glued_chunk_ids()
        
        # Return only chunks that aren't glued
        return [chunk for chunk in self.chunks if id(chunk) not in glued_chunk_ids]
        
    def get_available_chunks_for_glue(self, current_glue: Glue) -> List[Chunk]:
        """
        Get chunks that aren't already glued by any glue.
        These are the chunks available for a specific glue to attract.
        
        Args:
            current_glue (Glue): The glue that's trying to attract chunks.
            
        Returns:
            List[Chunk]: Available chunks for the glue.
        """
        # Get IDs of chunks already attracted by any glue
        glued_chunk_ids = self.get_all_glued_chunk_ids()
        
        # Return only chunks that aren't glued by any glue
        return [chunk for chunk in self.chunks if id(chunk) not in glued_chunk_ids]

    def handle_button_click(self, mouse_pos: Tuple[int, int]) -> None:
        """
        Handle button clicks based on mouse position.

        Args:
            mouse_pos (Tuple[int, int]): The (x,y) position of the mouse click.
        """
        if not self.ui_enabled:
            return
        upload_rect, upload_sound_rect, clear_rect, export_rect, quit_rect = self.ui_manager.buttons
        if upload_rect.collidepoint(mouse_pos):
            self.upload_image()
        elif upload_sound_rect.collidepoint(mouse_pos):
            self.upload_sound()
        elif clear_rect.collidepoint(mouse_pos):
            self.clear_chunks()
        elif export_rect.collidepoint(mouse_pos):
            self.export_glues()
        elif quit_rect.collidepoint(mouse_pos):
            quit_program()

    def export_glues(self) -> None:
        """
        Export each glue's glued chunks to a PNG (without glue visuals) and
        remove those glued chunks and their glue from the simulation.
        """
        # Collect glues to export, including a dead worm's glue not yet appended
        glues_to_export: List[Glue] = list(self.glues)
        if self.worm and self.worm.is_dead and self.worm.glue and self.worm.glue not in glues_to_export:
            glues_to_export.append(self.worm.glue)

        if not glues_to_export:
            print("No glues to export.")
            return

        # Ensure export directory exists (packages/compost/exports)
        base_dir = os.path.dirname(__file__)
        export_dir = os.path.join(base_dir, "exports")
        os.makedirs(export_dir, exist_ok=True)

        exported_count = 0

        for glue in glues_to_export:
            glued_chunks = glue.glued_chunks
            if not glued_chunks:
                continue

            # Build list of rotated surfaces and their destination rects (screen coords)
            rotated_surfaces = []
            for glued in glued_chunks:
                chunk = glued.chunk
                angle_degrees = math.degrees(-chunk.body.angle)
                rotated_surface = pygame.transform.rotate(chunk.segment_surface, angle_degrees)
                pos = chunk.body.position
                rect = rotated_surface.get_rect(center=(int(pos.x), int(pos.y)))
                rotated_surfaces.append((rotated_surface, rect))

            # Create a full-screen transparent surface; blitting will clip to simulation bounds
            offscreen_full = pygame.Surface((self.width, self.height), pygame.SRCALPHA)
            for rotated_surface, rect in rotated_surfaces:
                offscreen_full.blit(rotated_surface, rect)

            # Compute the tightest bounding box of visible pixels and crop
            crop_rect = offscreen_full.get_bounding_rect(min_alpha=1)
            if crop_rect.width <= 0 or crop_rect.height <= 0:
                continue
            image_to_save = offscreen_full.subsurface(crop_rect).copy()

            # Save PNG to file
            timestamp = pygame.time.get_ticks()
            rand_suffix = random.randint(0, 999999)
            filename = f"glue_{timestamp:010d}_{rand_suffix:06d}_{exported_count}.png"
            filepath = os.path.join(export_dir, filename)
            try:
                pygame.image.save(image_to_save, filepath)
                print(f"Exported glue PNG to: {filepath}")
            except Exception as exc:
                print(f"Failed to export glue PNG: {exc}")

            # Export mixed audio if there are sound chunks in this glue
            self._export_glue_audio(glued_chunks, export_dir, timestamp, rand_suffix, exported_count)
            exported_count += 1

            # Remove glued chunks' bodies and shapes from space and simulation
            for glued in list(glued_chunks):
                chunk = glued.chunk
                try:
                    if chunk.shape in self.space.shapes or chunk.body in self.space.bodies:
                        self.space.remove(chunk.shape, chunk.body)
                except Exception:
                    # Ignore if already removed
                    pass
                # Remove from simulation's chunk list if present
                if chunk in self.chunks:
                    try:
                        self.chunks.remove(chunk)
                    except ValueError:
                        pass

            # Clear glue contents
            glue.glued_chunks.clear()

        # Remove exported glues from simulation tracking
        for glue in glues_to_export:
            if glue in self.glues:
                try:
                    self.glues.remove(glue)
                except ValueError:
                    pass

        # Also clear any reference from the current worm
        if self.worm and self.worm.glue in glues_to_export:
            self.worm.glue = None

        # Clear histories for all worms after export
        for worm in self.worms:
            if worm:
                worm.history.clear()
                worm.last_color = None

        print(f"Export complete. {exported_count} glue images saved. Removed glued chunks and cleaned up glues. Cleared worm history panels.")

    def _export_glue_audio(self, glued_chunks, export_dir: str, timestamp: int, rand_suffix: int, exported_count: int) -> None:
        """
        Export a mixed audio file from all sound chunks in a glue.
        Positions each audio randomly within the duration of the longest audio.
        """
        # Collect all audio files from chunks that have them
        audio_files = []
        for glued in glued_chunks:
            chunk = glued.chunk
            if chunk.audio_path and os.path.exists(chunk.audio_path):
                audio_files.append(chunk.audio_path)
        
        if not audio_files:
            return  # No audio to mix
        
        try:
            import librosa
            import soundfile as sf
            import numpy as np
        except ImportError:
            print("librosa and soundfile required for audio mixing")
            return
        
        try:
            # Load all audio files and find the longest duration
            audio_data = []
            sample_rates = []
            max_duration = 0.0
            
            for audio_file in audio_files:
                y, sr = librosa.load(audio_file, sr=None)
                duration = len(y) / sr
                audio_data.append((y, sr))
                sample_rates.append(sr)
                max_duration = max(max_duration, duration)
            
            if max_duration == 0:
                return
            
            # Use the most common sample rate (or first one if tie)
            target_sr = max(set(sample_rates), key=sample_rates.count)
            
            # Create output buffer
            output_samples = int(max_duration * target_sr)
            mixed_audio = np.zeros(output_samples, dtype=np.float32)
            
            # Mix each audio at a random position within the max duration
            for i, (y, sr) in enumerate(audio_data):
                # Resample to target sample rate if needed
                if sr != target_sr:
                    y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
                
                # Random start position within the available time
                audio_length = len(y)
                max_start_samples = max(0, output_samples - audio_length)
                start_sample = random.randint(0, max_start_samples) if max_start_samples > 0 else 0
                end_sample = min(start_sample + audio_length, output_samples)
                
                # Add to mix with overlap handling
                mix_length = end_sample - start_sample
                mixed_audio[start_sample:end_sample] += y[:mix_length]
                
                print(f"  Mixed audio {i+1}/{len(audio_data)}: {os.path.basename(audio_files[i])} at {start_sample/target_sr:.2f}s")
            
            # Normalize to prevent clipping
            if np.max(np.abs(mixed_audio)) > 0:
                mixed_audio = mixed_audio / np.max(np.abs(mixed_audio)) * 0.95
            
            # Save mixed audio
            audio_filename = f"glue_{timestamp:010d}_{rand_suffix:06d}_{exported_count}_mixed.wav"
            audio_filepath = os.path.join(export_dir, audio_filename)
            sf.write(audio_filepath, mixed_audio, target_sr)
            print(f"Exported mixed audio to: {audio_filepath}")
            
        except Exception as exc:
            print(f"Failed to export mixed audio: {exc}")

    def toggle_history_panel(self) -> None:
        """
        Toggle the visibility of all worm history panels.
        """
        self.history_panel_enabled = not self.history_panel_enabled
        for worm in self.worms:
            worm.panel_enabled = self.history_panel_enabled

    def upload_image(self) -> None:
        """
        Let the user pick an image and create chunks from its Felzenszwalb segments.
        The UI bar is treated as an overlay, so the entire screen is available for image processing.
        """
        image = self.image_processor.load_image_via_dialog()
        if image:
            self.process_image_surface(image, None, None)

    def process_image_surface(self, image: pygame.Surface, target_width: int = None, target_height: int = None) -> None:
        """
        Process a provided pygame Surface as if it were uploaded via the UI.

        Args:
            image (pygame.Surface): Loaded image surface to process.
            target_width (int, optional): Target width for the image.
            target_height (int, optional): Target height for the image.
        """
        # Reset the current worm but keep existing glues
        self.worm = None

        # Scale the image to fit the screen (treat UI bar as overlay)
        max_width = self.width
        max_height = self.height  # Use full height, ignore UI bar
        
        # Use target dimensions if provided, otherwise use screen dimensions
        if target_width is not None and target_height is not None:
            print(f"Using target dimensions: {target_width}x{target_height}")
            image = resize_image_to_dimensions(image, target_width, target_height, max_width, max_height)
        else:
            # No target dimensions, scale to fit screen
            print(f"No target dimensions provided, scaling to fit screen: {max_width}x{max_height}")
            image = scale_image_to_fit(image, max_width, max_height)
            
        print(f"Image loaded and scaled to {image.get_size()}.")

        # Segment the image (with size reduction)
        segments, labels_to_downsize = self.image_processor.segment_image(image)
        print(f"Segmentation completed. {len(labels_to_downsize)} segments marked for downsizing.")

        # Create chunks and store them
        new_chunks = self.chunk_factory.create_chunks_from_segments(image, segments, labels_to_downsize)
        self.chunks.extend(new_chunks)
        print(f"Created {len(new_chunks)} new chunks.")

        # Create a new worm each time an image is uploaded
        new_worm = Worm(self.config)
        # Set panel enabled based on global state
        new_worm.panel_enabled = self.history_panel_enabled
        self.worm = new_worm
        self.worms.append(new_worm)

    def upload_sound(self) -> None:
        """
        Let the user pick a sound file and create curve-based chunks from its Felzenszwalb segments.
        """
        file_path = filedialog.askopenfilename(
            title="Select an audio file",
            filetypes=[
                ("Audio files", ("*.wav", "*.mp3", "*.flac", "*.ogg", "*.m4a")),
                ("All files", ("*.*",)),
            ],
        )
        if file_path and os.path.exists(file_path):
            try:
                self.process_sound_file(file_path)
            except Exception as e:
                print(f"Failed to process sound: {e}")

    def process_sound_file(self, song_path: str) -> None:
        """
        Use sound_chunking to segment audio into shapes, generate 2D curve profiles with color mapping,
        and instantiate physics chunks from those curves.
        """
        # Reset the current worm but keep existing glues
        self.worm = None

        # Lazy-import the sound_chunking module from the local sound directory
        import sys as _sys
        import os as _os
        base_dir = _os.path.dirname(__file__)
        sound_dir = _os.path.join(base_dir, "sound")
        if sound_dir not in _sys.path:
            _sys.path.append(sound_dir)
        try:
            import sound_chunking as sc  # type: ignore
        except Exception as exc:
            print(f"Unable to import sound_chunking: {exc}")
            return

        snd_cfg = self.config.get("sound", {})
        felz = snd_cfg.get("felzenszwalb", {})
        output_dir = os.path.join("sound_chunks", f"chunks_detailed_{os.path.basename(song_path).split('.')[0]}")
        # Run segmentation (mirrors defaults used in sound_chunking.main)
        saved_paths, kept_segments = sc.split_audio_felzenszwalb_2d(
            song_path,
            output_dir=output_dir,
            scale=int(felz.get("scale", 150)),
            sigma=float(felz.get("sigma", 3)),
            min_size=int(felz.get("min_size", 20)),
            max_shapes=int(snd_cfg.get("max_shapes", 50)),
            min_area_pixels=int(snd_cfg.get("min_area_pixels", 300)),
            min_time_seconds=float(snd_cfg.get("min_time_seconds", 0.5)),
            min_energy_ratio=float(snd_cfg.get("min_energy_ratio", 0.001)),
            min_loudness_db=float(snd_cfg.get("min_loudness_db", -70.0)),
            show_plots=False,  # Disable matplotlib windows
        )

        # Create 2D path visualization data (returns curves and their RGBA colors)
        _X, _Y, curve_chunks_2d, _profiles = sc.create_2d_path_visualization(
            kept_segments,
            song_path,
            points_per_second=int(snd_cfg.get("points_per_second", 100)),
            resampled_points_per_chunk=int(snd_cfg.get("resampled_points_per_chunk", 128)),
            show_plots=False,  # Disable matplotlib windows
        )

        # Build chunks from curve profiles
        surf_cfg = snd_cfg.get("chunk_surface", {})
        line_w = int(surf_cfg.get("line_width", 6))
        padding = int(surf_cfg.get("padding", 6))
        # Dynamic sizing by duration
        size_cfg = snd_cfg.get("duration_size", {})
        min_sec = float(size_cfg.get("min_seconds", 0.5))
        max_sec = float(size_cfg.get("max_seconds", 60.0))
        min_w = int(size_cfg.get("min_width", 200))
        min_h = int(size_cfg.get("min_height", 200))
        max_w = int(size_cfg.get("max_width", 500))
        max_h = int(size_cfg.get("max_height", 500))

        def lerp(a: float, b: float, t: float) -> float:
            return a + (b - a) * t

        new_chunks: List[Chunk] = []
        for item in curve_chunks_2d:
            x_res = np.asarray(item.get("x_resampled", []), dtype=float)
            y_res = np.asarray(item.get("y_resampled", []), dtype=float)
            if x_res.size < 2 or y_res.size < 2:
                continue
            pts = np.stack([x_res, y_res], axis=-1)
            rgba = item.get("color_rgba", (1.0, 1.0, 1.0, 1.0))
            # Compute per-chunk dimensions based on duration
            t0 = float(item.get("t_start", 0.0))
            t1 = float(item.get("t_end", 0.0))
            duration = max(0.0, t1 - t0)
            if max_sec > min_sec:
                u = (duration - min_sec) / (max_sec - min_sec)
            else:
                u = 0.0
            u = float(np.clip(u, 0.0, 1.0))
            surf_w = int(round(lerp(min_w, max_w, u)))
            surf_h = int(round(lerp(min_h, max_h, u)))

            surface = build_curve_surface(pts, rgba, surf_w, surf_h, line_width=line_w, padding=padding)
            # Use convex hull around actual curve points for physics body
            vertices = convex_hull_vertices_from_curve(pts, surf_w, surf_h, padding=padding, line_width=line_w)
            
            # Find the corresponding kept_segment to get the audio path
            audio_path = None
            chunk_idx = item.get("idx", -1)
            for seg in kept_segments:
                if seg.get("idx") == chunk_idx:
                    audio_path = seg.get("path")
                    break
            
            chunk = Chunk(
                segment_surface=surface,
                vertices=vertices,
                config=self.config,
                space=self.space,
                downsized=False,
                audio_path=audio_path,
            )
            new_chunks.append(chunk)

        self.chunks.extend(new_chunks)
        print(f"Created {len(new_chunks)} new sound curve chunks.")

        # Create a new worm after processing sound
        new_worm = Worm(self.config)
        new_worm.panel_enabled = self.history_panel_enabled
        self.worm = new_worm
        self.worms.append(new_worm)

    def process_image_bytes(self, image_bytes: bytes, target_width: int = None, target_height: int = None) -> bool:
        """
        Load an image from raw bytes and process it into chunks, like a UI upload.

        Args:
            image_bytes (bytes): Raw image data.
            target_width (int, optional): Target width for the image.
            target_height (int, optional): Target height for the image.

        Returns:
            bool: True if processing succeeded, False otherwise.
        """
        try:
            bytes_io = io.BytesIO(image_bytes)
            image = pygame.image.load(bytes_io).convert_alpha()
        except Exception as exc:
            print(f"Failed to load image from bytes: {exc}")
            return False

        self.process_image_surface(image, target_width, target_height)
        return True

    def enqueue_image_bytes(self, image_bytes: bytes, target_width: int = None, target_height: int = None) -> None:
        """Enqueue raw image bytes and target dimensions to be processed on the main thread."""
        if image_bytes:
            self._upload_queue.put((image_bytes, target_width, target_height))

    def drain_upload_queue(self, max_items: int = 4) -> None:
        """Drain up to max_items from the upload queue and process them."""
        processed = 0
        while processed < max_items:
            try:
                data_tuple = self._upload_queue.get_nowait()
            except Empty:
                break
            try:
                image_bytes, target_width, target_height = data_tuple
                self.process_image_bytes(image_bytes, target_width, target_height)
            finally:
                processed += 1

    def clear_chunks(self) -> None:
        """
        Remove all chunks from the simulation and reset the worm and all glues.
        """
        for chunk in self.chunks:
            self.space.remove(chunk.shape, chunk.body)
        print(f"Removed {len(self.chunks)} chunks from the simulation.")
        self.chunks.clear()
        self.worm = None
        self.worms.clear()
        self.glues.clear()  # Clear all glues when clearing chunks
