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
from utils import scale_image_to_fit, quit_program
from worm import Worm, Glue
from chunk_thingie import Chunk
import sys

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
        clear_rect = pygame.Rect(
            upload_rect.right + self.button_gap,
            (self.ui_bar_height - self.button_height) // 2,
            self.button_width,
            self.button_height
        )
        quit_rect = pygame.Rect(
            clear_rect.right + self.button_gap,
            (self.ui_bar_height - self.button_height) // 2,
            self.button_width,
            self.button_height
        )
        return [upload_rect, clear_rect, quit_rect]

    def draw_ui(self, debug_mode: bool, torus_world: bool = False, history_panel_enabled: bool = True) -> None:
        """
        Draw the UI bar, buttons, and optional debug text.

        Args:
            debug_mode (bool): Whether to show debug mode status on the UI bar.
            torus_world (bool): Whether the simulation is in torus world mode.
            history_panel_enabled (bool): Whether the history panel is visible.
        """
        ui_bar_rect = pygame.Rect(0, 0, self.width, self.ui_bar_height)
        pygame.draw.rect(self.screen, self.colors["UI_BG"], ui_bar_rect)

        button_texts = ["Upload Image", "Clear Canvas", "Quit"]
        for rect, text in zip(self.buttons, button_texts):
            self._draw_button(rect, text)

        # Show debug mode
        debug_text = f"Debug: {'ON' if debug_mode else 'OFF'} (D)"
        debug_surface = self.font.render(debug_text, True, self.colors["WHITE"])
        self.screen.blit(debug_surface, (self.width - 300, (self.ui_bar_height - debug_surface.get_height()) // 2))
        
        # Show world type
        world_text = f"World: {'Torus' if torus_world else 'Rigid Walls'} (T)"
        world_surface = self.font.render(world_text, True, self.colors["WHITE"])
        self.screen.blit(world_surface, (self.width - 500, (self.ui_bar_height - world_surface.get_height()) // 2))

        # Show history panel status
        history_text = f"History: {'ON' if history_panel_enabled else 'OFF'} (H)"
        history_surface = self.font.render(history_text, True, self.colors["WHITE"])
        self.screen.blit(history_surface, (self.width - 700, (self.ui_bar_height - history_surface.get_height()) // 2))

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

        # Create boundaries
        self._create_boundaries()

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
        self.ui_manager.draw_ui(self.debug_mode, self.torus_world, self.history_panel_enabled)

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
        # Draw worm history panels for all worms, offsetting each to the right
        panel_spacing = 20
        for i, worm in enumerate(self.worms):
            if worm:
                x_offset = i * (worm.panel_width + panel_spacing)
                worm.draw(self.screen, x_offset=x_offset)

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
        upload_rect, clear_rect, quit_rect = self.ui_manager.buttons
        if upload_rect.collidepoint(mouse_pos):
            self.upload_image()
        elif clear_rect.collidepoint(mouse_pos):
            self.clear_chunks()
        elif quit_rect.collidepoint(mouse_pos):
            quit_program()

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
            # Reset the worm but keep existing glues
            self.worm = None
        
            # Scale the image to fit the screen (treat UI bar as overlay)
            max_width = self.width
            max_height = self.height  # Use full height, ignore UI bar
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
