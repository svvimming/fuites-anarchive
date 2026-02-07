import pygame
import pymunk
import math
from typing import List, Tuple, Dict, Any, Optional
import numpy as np
import random
from utils.geometry_utils import build_curve_surface
from utils.logging_utils import get_logger
from utils.math_utils import lerp

_logger = get_logger(__name__)


class Chunk:
    """Handles a single polygon chunk with physics and a surface."""

    def __init__(
        self,
        segment_surface: pygame.Surface,
        vertices: List[Tuple[float, float]],
        config: Dict[str, Any],
        space: pymunk.Space,
        downsized: bool = False,  # Indicates if the segment has been downsized
        audio_path: str = None  # Path to audio file for sound chunks
    ) -> None:
        """
        Initialize an Chunk instance.
        
        Args:
            segment_surface (pygame.Surface): Cropped surface of the image segment.
            vertices (List[Tuple[float, float]]): The polygon vertices for the chunk.
            config (Dict[str, Any]): The entire config dictionary loaded from YAML.
            space (pymunk.Space): The Pymunk physics space.
            downsized (bool): Indicates if the segment has been downsized.
        """
        self.config = config
        self.space = space
        self.segment_surface = segment_surface
        self.audio_path = audio_path  # Store audio file path for sound chunks
        # Store original line properties for sound chunks (curve data for redrawing)
        self.original_line_width = None
        self.curve_data = None  # Will store (points_xy01, rgba, width, height, padding) for redrawing
        self._cached_surfaces = {}  # Cache surfaces by line_width to avoid redrawing every frame
        self._last_volume = -1.0  # Track last volume to avoid unnecessary redraws

        sim_cfg = config["simulation"]
        self.width = sim_cfg["window"]["width"]
        self.height = sim_cfg["window"]["height"]
        self.ui_bar_height = sim_cfg["ui"]["ui_bar_height"]
        vel_min = sim_cfg["physics"]["chunk"]["velocity_min"]
        vel_max = sim_cfg["physics"]["chunk"]["velocity_max"]

        if downsized:
            # Resize the segment_surface to a smaller size
            downsample_factor = config["image"]["compression"].get("downsample_factor", 0.5)
            new_width = max(1, int(segment_surface.get_width() * downsample_factor))
            new_height = max(1, int(segment_surface.get_height() * downsample_factor))
            self.segment_surface = pygame.transform.scale(segment_surface, (new_width, new_height))
            # print(f"Downsized chunk to ({new_width}, {new_height})")
            # Optionally, scale down the vertices as well
            self.vertices = [(x * downsample_factor, y * downsample_factor) for (x, y) in vertices]
        else:
            self.segment_surface = segment_surface
            self.vertices = vertices

        # Cache the HSV color once to avoid expensive recalculations
        from utils.color_utils import calculate_chunk_color
        self.cached_hsv_color = calculate_chunk_color(self.segment_surface)

        # Store original chunk properties for volume-based scaling
        # Original opacity: default to 255 (full opacity)
        # Chunks are created with full opacity, this represents the baseline
        self.original_opacity = 255
        
        # Original line width: will be set when chunk is created from sound curve
        # For image chunks, this will remain None
        if self.original_line_width is None:
            # Try to get from config if it's a sound chunk
            if self.audio_path:
                snd_cfg = config.get("sound", {})
                surf_cfg = snd_cfg.get("chunk_rendering", {})
                self.original_line_width = int(surf_cfg.get("line_width", 5))

        # Compute a valid random position using bounding-box constraints
        random_x, random_y = self._get_random_position_in_bounds(self.vertices)

        # Setup physics body and shape using shared method
        self._setup_physics_body(self.vertices, random_x, random_y, vel_min, vel_max)

    @classmethod
    def from_segment(
        cls,
        surface_bytes: bytes,
        surface_size: Tuple[int, int],
        vertices: List[Tuple[float, float]],
        config: Dict[str, Any],
        space: "pymunk.Space",
        downsized: bool = False,
        cached_hsv_color: Optional[Tuple[float, float, float]] = None,
        audio_path: Optional[str] = None,
        curve_data: Optional[Tuple] = None,
        original_line_width: Optional[int] = None,
        spawn_position: Optional[Tuple[float, float]] = None,
        spawn_velocity: Optional[Tuple[float, float]] = None,
    ) -> "Chunk":
        """
        Create a Chunk from segmentation result data.
        Fast and main-thread safe - bypasses heavy processing.

        Args:
            surface_bytes: RGBA pixel data as bytes (from numpy array.tobytes())
            surface_size: (width, height)
            vertices: Convex hull vertices centered at origin
            config: Configuration dictionary
            space: Pymunk physics space
            downsized: Whether this chunk was downsampled
            cached_hsv_color: Pre-calculated HSV color (H, S, V) each 0-1
            audio_path: Path to audio file for sound chunks
            curve_data: Curve rendering data for sound chunks
            original_line_width: Line width for sound chunk redrawing

        Returns:
            Chunk: Fully initialized chunk with physics body
        """
        width, height = surface_size

        # Reconstruct pygame surface from bytes
        rgba_array = np.frombuffer(surface_bytes, dtype=np.uint8).reshape((height, width, 4))

        # Create pygame surface
        surface = pygame.Surface((width, height), pygame.SRCALPHA)
        # Convert numpy array to pygame surface
        # pygame expects (width, height, channels) but we have (height, width, channels)
        rgb_transposed = rgba_array[:, :, :3].swapaxes(0, 1)
        alpha_transposed = rgba_array[:, :, 3].swapaxes(0, 1)
        pygame.surfarray.blit_array(surface, rgb_transposed)
        # Set alpha channel
        alpha_surface = pygame.surfarray.pixels_alpha(surface)
        alpha_surface[:] = alpha_transposed
        del alpha_surface  # Release lock

        # Create instance without calling __init__
        chunk = cls.__new__(cls)

        # Set required attributes manually (mirroring __init__)
        chunk.config = config
        chunk.space = space
        chunk.segment_surface = surface
        chunk.audio_path = audio_path
        chunk.original_line_width = original_line_width
        chunk._cached_surfaces = {}
        chunk._last_volume = -1.0

        # Handle curve_data - convert list back to numpy array if needed
        if curve_data is not None:
            pts, rgba, surf_w, surf_h, padding = curve_data
            if isinstance(pts, list):
                pts = np.array(pts)
            chunk.curve_data = (pts, rgba, surf_w, surf_h, padding)
        else:
            chunk.curve_data = None

        sim_cfg = config["simulation"]
        chunk.width = sim_cfg["window"]["width"]
        chunk.height = sim_cfg["window"]["height"]
        chunk.ui_bar_height = sim_cfg["ui"]["ui_bar_height"]
        vel_min = sim_cfg["physics"]["chunk"]["velocity_min"]
        vel_max = sim_cfg["physics"]["chunk"]["velocity_max"]

        # Handle gradual shrinkage for downsized chunks
        if downsized:
            compress_cfg = config.get("image", {}).get("compression", {})
            downsample_factor = compress_cfg.get("downsample_factor", 0.5)
            shrink_secs = float(compress_cfg.get("shrink_duration_seconds", 2.0))
            physics_vertices = [(x * downsample_factor, y * downsample_factor) for x, y in vertices]
            chunk._shrink_start_ms = pygame.time.get_ticks()
            chunk._shrink_target_scale = downsample_factor
            chunk._shrink_duration_ms = shrink_secs * 1000
        else:
            physics_vertices = vertices
            chunk._shrink_start_ms = None
            chunk._shrink_target_scale = 1.0
            chunk._shrink_duration_ms = 0

        chunk.vertices = physics_vertices

        # Use pre-calculated HSV color if provided
        if cached_hsv_color is not None:
            chunk.cached_hsv_color = cached_hsv_color
        else:
            from utils.color_utils import calculate_chunk_color
            chunk.cached_hsv_color = calculate_chunk_color(surface)

        chunk.original_opacity = 255

        # Position: use explicit spawn_position or fall back to random
        if spawn_position is not None:
            pos_x, pos_y = spawn_position
        else:
            pos_x, pos_y = chunk._get_random_position_in_bounds(physics_vertices)

        # Setup physics body (velocity handled below)
        chunk._setup_physics_body(physics_vertices, pos_x, pos_y, vel_min, vel_max)

        # Override velocity if explicit spawn_velocity provided
        if spawn_velocity is not None:
            chunk.body.velocity = spawn_velocity

        return chunk

    def _get_random_position_in_bounds(
        self,
        vertices: List[Tuple[float, float]]
    ) -> Tuple[float, float]:
        """
        Compute a valid random (x,y) for this chunk, ensuring it remains within screen boundaries.
        The UI bar is treated as an overlay, so objects can be placed across the full screen.

        Args:
            vertices (List[Tuple[float, float]]): Polygon vertices for this chunk.

        Returns:
            (random_x, random_y): A valid position where the chunk can be placed.
        """
        # 1) Compute bounding box
        xs = [v[0] for v in vertices]
        ys = [v[1] for v in vertices]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)

        # 2) Determine allowable placement range
        allowed_min_x = -min_x
        allowed_max_x = self.width - max_x
        allowed_min_y = -min_y  # Allow placement from top of screen
        allowed_max_y = self.height - max_y

        # 3) Generate a valid random position
        if allowed_min_x > allowed_max_x or allowed_min_y > allowed_max_y:
            # If polygon is too large, clamp to a default position
            random_x = max(0, allowed_min_x)
            random_y = max(0, allowed_min_y)  # Start from top of screen
        else:
            random_x = random.uniform(allowed_min_x, allowed_max_x)
            random_y = random.uniform(allowed_min_y, allowed_max_y)

        return random_x, random_y

    def _setup_physics_body(
        self,
        vertices: List[Tuple[float, float]],
        pos_x: float,
        pos_y: float,
        vel_min: float,
        vel_max: float
    ) -> None:
        """
        Set up pymunk body and shape for the chunk.

        Args:
            vertices: Polygon vertices for the physics shape
            pos_x: Initial x position
            pos_y: Initial y position
            vel_min: Minimum velocity for random initial velocity
            vel_max: Maximum velocity for random initial velocity
        """
        # Get physics constants from config
        physics_cfg = self.config.get("simulation", {}).get("physics", {}).get("chunk", {})
        mass = physics_cfg.get("mass", 1.0)
        elasticity = physics_cfg.get("elasticity", 1.0)
        friction = physics_cfg.get("friction", 5.0)
        shape_filter_group = physics_cfg.get("shape_filter_group", 1)

        # Create body
        moment = pymunk.moment_for_poly(mass, vertices)
        self.body = pymunk.Body(mass, moment)
        self.body.position = (pos_x, pos_y)
        self.body.velocity = (
            random.uniform(vel_min, vel_max),
            random.uniform(vel_min, vel_max),
        )

        # Create shape
        self.shape = pymunk.Poly(self.body, vertices)
        self.shape.elasticity = elasticity
        self.shape.friction = friction
        self.shape.filter = pymunk.ShapeFilter(group=shape_filter_group)

        # Add to physics space
        self.space.add(self.body, self.shape)

    def _get_volume_scaled_surface(
        self,
        volume: float
    ) -> Tuple[pygame.Surface, int]:
        """
        Get surface scaled by volume for sound chunks.

        Args:
            volume: Volume level (0.0-1.0)

        Returns:
            (surface, alpha) tuple
        """
        drawing_cfg = self.config.get("sound", {}).get("hover", {}).get("volume_scaling", {})
        perceptual_exp = drawing_cfg.get("perceptual_exponent", 0.7)
        line_mult = drawing_cfg.get("line_width_multiplier", 2.0)
        alpha_boost = drawing_cfg.get("alpha_boost", 0.5)

        perceptual_volume = math.pow(volume, perceptual_exp)

        # Scale line width
        scaled_line_width = max(1, int(self.original_line_width * (1.0 + perceptual_volume * line_mult)))

        # Scale opacity
        pts, rgba, surf_w, surf_h, padding = self.curve_data
        original_alpha = rgba[3]
        scaled_alpha = min(1.0, original_alpha * (1.0 + perceptual_volume * alpha_boost))
        scaled_rgba = (rgba[0], rgba[1], rgba[2], scaled_alpha)

        # Cache by rounded values
        line_cache_key = (scaled_line_width // 2) * 2
        alpha_cache_key = int(scaled_alpha * 10) / 10.0
        cache_key = (line_cache_key, alpha_cache_key)

        if cache_key not in self._cached_surfaces:
            self._cached_surfaces[cache_key] = build_curve_surface(
                pts, scaled_rgba, surf_w, surf_h,
                line_width=line_cache_key, padding=padding
            )

        return self._cached_surfaces[cache_key], 255

    def _get_torus_positions(
        self,
        pos_x: float,
        pos_y: float,
        rect: pygame.Rect,
        width: int,
        height: int
    ) -> List[Tuple[float, float]]:
        """
        Calculate all positions to draw chunk at for torus wrapping.

        Args:
            pos_x: Current x position
            pos_y: Current y position
            rect: Bounding rectangle of rotated surface
            width: Screen width
            height: Screen height

        Returns:
            List of (x, y) positions to draw at
        """
        positions = [(pos_x, pos_y)]

        # Horizontal wrap
        if rect.left < 0:
            positions.append((pos_x + width, pos_y))
        elif rect.right > width:
            positions.append((pos_x - width, pos_y))

        # Vertical wrap
        if rect.top < 0:
            positions.append((pos_x, pos_y + height))
        elif rect.bottom > height:
            positions.append((pos_x, pos_y - height))

        # Corner wrap
        if rect.left < 0 and rect.top < 0:
            positions.append((pos_x + width, pos_y + height))
        elif rect.left < 0 and rect.bottom > height:
            positions.append((pos_x + width, pos_y - height))
        elif rect.right > width and rect.top < 0:
            positions.append((pos_x - width, pos_y + height))
        elif rect.right > width and rect.bottom > height:
            positions.append((pos_x - width, pos_y - height))

        return positions

    def _draw_debug_outline(
        self,
        surface: pygame.Surface,
        center_x: float,
        center_y: float
    ) -> None:
        """Draw debug physics outline at given center position."""
        colors = self.config["colors"]
        cos_a = math.cos(self.body.angle)
        sin_a = math.sin(self.body.angle)
        transformed_vertices = [
            (
                v.x * cos_a - v.y * sin_a + center_x,
                v.x * sin_a + v.y * cos_a + center_y
            )
            for v in self.shape.get_vertices()
        ]
        pygame.draw.polygon(surface, colors["RED"], transformed_vertices, width=1)

    def draw(self, surface: pygame.Surface, debug_mode: bool = False, torus_world: bool = False, volume: float = 0.0) -> None:
        """
        Draw the chunk on a Pygame surface.

        Args:
            surface: The surface to draw on
            debug_mode: Whether to draw debug outlines
            torus_world: Whether the simulation uses torus wrapping
            volume: Volume level (0.0-1.0) for highlighting active sound chunks
        """
        pos = self.body.position
        angle_degrees = math.degrees(-self.body.angle)

        # Get working surface (volume-scaled for sound chunks, or original)
        if volume > 0.0 and self.curve_data is not None and self.original_line_width is not None:
            working_surface, chunk_alpha = self._get_volume_scaled_surface(volume)
        else:
            working_surface = self.segment_surface
            chunk_alpha = self.original_opacity

        # Gradual shrinkage animation for entropy-downsized chunks
        if self._shrink_start_ms is not None:
            elapsed = pygame.time.get_ticks() - self._shrink_start_ms
            t = min(1.0, elapsed / self._shrink_duration_ms) if self._shrink_duration_ms > 0 else 1.0
            scale = lerp(1.0, self._shrink_target_scale, t)
            new_w = max(1, int(working_surface.get_width() * scale))
            new_h = max(1, int(working_surface.get_height() * scale))
            working_surface = pygame.transform.scale(working_surface, (new_w, new_h))
            if t >= 1.0:
                self.segment_surface = working_surface
                self._shrink_start_ms = None

        rotated_surface = pygame.transform.rotate(working_surface, angle_degrees)
        rotated_surface.set_alpha(chunk_alpha)

        width, height = surface.get_size()

        # Get positions to draw at (handles torus wrapping)
        if torus_world:
            rect = rotated_surface.get_rect(center=(int(pos.x), int(pos.y)))
            positions = self._get_torus_positions(pos.x, pos.y, rect, width, height)
        else:
            positions = [(pos.x, pos.y)]

        # Draw at all positions
        for x, y in positions:
            rect = rotated_surface.get_rect(center=(int(x), int(y)))
            surface.blit(rotated_surface, rect)
            if debug_mode:
                self._draw_debug_outline(surface, x, y) 


class GluedChunk:
    """A chunk that has been attracted to glue. Thin wrapper for rendering."""
    def __init__(self, chunk: Chunk, tint_rgb: tuple):
        self.chunk = chunk
        self.tint_rgb = tint_rgb

    def draw(self, surface: pygame.Surface, debug_mode: bool = False, torus_world: bool = False, volume: float = 0.0):
        self.chunk.draw(surface, debug_mode=debug_mode, torus_world=torus_world, volume=volume)
        centroid = self.chunk.body.position
        pygame.draw.circle(surface, self.tint_rgb, (int(centroid.x), int(centroid.y)), 5)