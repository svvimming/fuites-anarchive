import pygame
import pymunk
import math
import random
from typing import List, Tuple, Dict, Any, Optional
import numpy as np
from utils.geometry_utils import build_curve_surface
from utils.logging_utils import get_logger
from utils.math_utils import lerp

_logger = get_logger(__name__)


class Chunk:
    """Handles a single polygon chunk with physics and a surface."""

    @classmethod
    def from_segment(
        cls,
        surface_bytes: bytes,
        surface_size: Tuple[int, int],
        vertices: List[Tuple[float, float]],
        config: Dict[str, Any],
        space: "pymunk.Space",
        spawn_position: Tuple[float, float],
        spawn_velocity: Tuple[float, float],
        downsized: bool = False,
        cached_hsv_color: Optional[Tuple[float, float, float]] = None,
        audio_path: Optional[str] = None,
        curve_data: Optional[Tuple] = None,
        original_line_width: Optional[int] = None,
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

        chunk._setup_physics_body(physics_vertices, spawn_position, spawn_velocity)

        return chunk

    @classmethod
    def spawn_batch_explosion(
        cls,
        batch_items: List,
        config: Dict[str, Any],
        space: "pymunk.Space",
        screen_width: int,
        screen_height: int,
    ) -> List["Chunk"]:
        """
        Spawn all chunks from a batch as an explosion: reconstruct spatial layout
        at a random screen position, then assign outward velocities.

        Args:
            batch_items: List of ChunkData from background processing
            config: Configuration dictionary
            space: Pymunk physics space
            screen_width: Screen width for bounds clamping
            screen_height: Screen height for bounds clamping

        Returns:
            List of created Chunk instances
        """
        explosion_cfg = (
            config.get("simulation", {})
            .get("physics", {})
            .get("chunk", {})
            .get("explosion", {})
        )
        speed_min = float(explosion_cfg.get("speed_min", 50))
        speed_max = float(explosion_cfg.get("speed_max", 200))

        # Collect source offsets (fall back to (0, 0) if missing)
        offsets = [
            item.source_offset if item.source_offset is not None else (0.0, 0.0)
            for item in batch_items
        ]

        # Compute batch centroid and relative offsets
        cx = sum(o[0] for o in offsets) / len(offsets)
        cy = sum(o[1] for o in offsets) / len(offsets)
        rel_offsets = [(o[0] - cx, o[1] - cy) for o in offsets]

        # Compute bounding box of relative offsets to constrain spawn center
        rel_xs = [r[0] for r in rel_offsets]
        rel_ys = [r[1] for r in rel_offsets]
        min_rel_x, max_rel_x = min(rel_xs), max(rel_xs)
        min_rel_y, max_rel_y = min(rel_ys), max(rel_ys)

        # Allowed spawn center range (ensure all chunks stay on screen)
        spawn_min_x = -min_rel_x
        spawn_max_x = screen_width - max_rel_x
        spawn_min_y = -min_rel_y
        spawn_max_y = screen_height - max_rel_y

        if spawn_min_x > spawn_max_x:
            spawn_x = (spawn_min_x + spawn_max_x) / 2
        else:
            spawn_x = random.uniform(spawn_min_x, spawn_max_x)

        if spawn_min_y > spawn_max_y:
            spawn_y = (spawn_min_y + spawn_max_y) / 2
        else:
            spawn_y = random.uniform(spawn_min_y, spawn_max_y)

        # Create all chunks with explosion positions and velocities
        chunks = []
        for item, rel in zip(batch_items, rel_offsets):
            pos_x = spawn_x + rel[0]
            pos_y = spawn_y + rel[1]

            # Velocity: outward from spawn center
            dist = math.sqrt(rel[0] ** 2 + rel[1] ** 2)
            if dist > 1e-6:
                dir_x = rel[0] / dist
                dir_y = rel[1] / dist
            else:
                angle = random.uniform(0, 2 * math.pi)
                dir_x = math.cos(angle)
                dir_y = math.sin(angle)

            speed = random.uniform(speed_min, speed_max)

            chunk = cls.from_segment(
                surface_bytes=item.surface_bytes,
                surface_size=item.surface_size,
                vertices=item.vertices,
                config=config,
                space=space,
                downsized=item.downsized,
                cached_hsv_color=item.cached_hsv_color,
                audio_path=item.audio_path,
                curve_data=item.curve_data,
                original_line_width=item.original_line_width,
                spawn_position=(pos_x, pos_y),
                spawn_velocity=(dir_x * speed, dir_y * speed),
            )
            chunks.append(chunk)

        return chunks

    def _setup_physics_body(
        self,
        vertices: List[Tuple[float, float]],
        position: Tuple[float, float],
        velocity: Tuple[float, float],
    ) -> None:
        """
        Set up pymunk body and shape for the chunk.

        Args:
            vertices: Polygon vertices for the physics shape
            position: Initial position
            velocity: Initial velocity
        """
        physics_cfg = self.config.get("simulation", {}).get("physics", {}).get("chunk", {})
        mass = physics_cfg.get("mass", 1.0)
        elasticity = physics_cfg.get("elasticity", 1.0)
        friction = physics_cfg.get("friction", 5.0)
        shape_filter_group = physics_cfg.get("shape_filter_group", 1)

        moment = pymunk.moment_for_poly(mass, vertices)
        self.body = pymunk.Body(mass, moment)
        self.body.position = position
        self.body.velocity = velocity

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