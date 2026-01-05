import pygame
import random
import math
from typing import List, Tuple, Dict, Any, Optional, Set, Deque
from collections import deque
from utils.color_utils import calculate_color_contrast, hsv_to_rgb_int
from utils.logging_utils import get_logger
from entities.chunk import Chunk, GluedChunk

_logger = get_logger(__name__)


class WormHistory:
    """Represents a single chunk's history entry for the worm."""
    def __init__(self, chunk_surface: pygame.Surface, hsv_color: Tuple[float, float, float]):
        self.chunk_surface = chunk_surface
        self.hsv_color = hsv_color
        self.rgb_color = hsv_to_rgb_int(hsv_color)


class Glue:
    """Manages a collection of chunks attracted by a single glue point."""
    def __init__(self, position: Tuple[float, float], worm_history: List[WormHistory], config: Dict[str, Any]):
        self.position = position
        self.worm_history = worm_history
        self.config = config
        self.glued_chunks: List[GluedChunk] = []
        self.attracted_chunk_ids: Set[int] = set()  # Track IDs of chunks we've already attracted
        self.evaluated_chunk_ids: Set[int] = set()  # Track IDs of chunks we've already evaluated
        # Timestamp (ms) when this glue first became full ("capped"). None if not yet capped
        self.capped_at_ms: Optional[int] = None
        self.sound_chunk_count: int = 0  # Track sound chunks for efficient cap checking

        # Get glue configuration
        self.glue_cfg = config["worm"]["glue"]
        self.max_glued_chunks = self.glue_cfg["max_glued_chunks"]
        self.sound_cap = self.glue_cfg.get("sound_cap")  # None means no limit
        self.vicinity_cfg = self.glue_cfg["vicinity"]
        self.min_difference = self.vicinity_cfg["min_difference"]
        self.max_difference = self.vicinity_cfg["max_difference"]
        
        # Glowing effect parameters from config
        visual_cfg = self.glue_cfg.get("visual", {})
        self.glow_radius = visual_cfg.get("glow_radius", 15)
        self.pulse_speed = visual_cfg.get("pulse_speed", 0.05)
        self.pulse_min = visual_cfg.get("pulse_min", 0.7)
        self.pulse_max = visual_cfg.get("pulse_max", 1.0)
        self.glow_alpha_max = visual_cfg.get("glow_alpha_max", 150)
        self.full_ring_width = visual_cfg.get("full_ring_width", 2)
        self.spin_speed = visual_cfg.get("spin_speed", 1.0)
        self.min_quality_steps = visual_cfg.get("min_quality_steps", 6)
        self.pulse_time = 0
        self._glow_cache: Dict[int, pygame.Surface] = {}  # Cache glow surfaces by radius
        # Compute colors from worm history
        self._init_history_colors()

    def _init_history_colors(self) -> None:
        """Prepare meal colors and mixed glow color from worm history."""
        # Collect HSV colors from history
        hsv_colors = [entry.hsv_color for entry in self.worm_history if entry and entry.hsv_color]
        if not hsv_colors:
            # Fallback to a default tint if no history; should not happen due to constructor guard
            self.glow_rgb = (255, 255, 255)
            self.meal_rgbs = []
            return

        # Convert each HSV to RGB for wheel segments
        self.meal_rgbs = [hsv_to_rgb_int(hsv) for hsv in hsv_colors]

        # Average HSV for glow color, handling circular hue
        # Hue is in degrees [0,360)
        sum_sin = 0.0
        sum_cos = 0.0
        sum_s = 0.0
        sum_v = 0.0
        n = float(len(hsv_colors))
        for (h, s, v) in hsv_colors:
            rad = h * math.pi / 180.0
            sum_sin += math.sin(rad)
            sum_cos += math.cos(rad)
            sum_s += s
            sum_v += v
        mean_h_rad = math.atan2(sum_sin / n, sum_cos / n)
        mean_h = (mean_h_rad * 180.0 / math.pi) % 360.0
        mean_s = sum_s / n
        mean_v = sum_v / n
        self.glow_rgb = hsv_to_rgb_int((mean_h, mean_s, mean_v))
    
    def _find_nearest_meal_index(self, chunk: Chunk) -> Optional[Tuple[int, float]]:
        """
        Find the meal index with smallest color difference within vicinity thresholds.

        Returns:
            (meal_index, difference) or None if no match
        """
        best_idx: Optional[int] = None
        best_diff: Optional[float] = None

        for idx, entry in enumerate(self.worm_history):
            diff = calculate_color_contrast(entry.hsv_color, chunk.cached_hsv_color, self.config)
            if self.min_difference <= diff <= self.max_difference:
                if best_diff is None or diff < best_diff:
                    best_diff = diff
                    best_idx = idx

        if best_idx is not None and best_diff is not None:
            return (best_idx, best_diff)
        return None

    def _build_candidate_lists(
        self,
        available_chunks: List[Chunk]
    ) -> Dict[int, Deque[Tuple[float, Chunk]]]:
        """
        Build candidate lists per meal color, sorted by color difference.

        Returns:
            Dict mapping meal_index to deque of (difference, chunk) tuples
        """
        meal_to_candidates: Dict[int, List[Tuple[float, Chunk]]] = {}

        for chunk in available_chunks:
            chunk_id = id(chunk)
            if chunk_id in self.attracted_chunk_ids or chunk_id in self.evaluated_chunk_ids:
                continue

            match = self._find_nearest_meal_index(chunk)
            if match is not None:
                meal_idx, diff = match
                meal_to_candidates.setdefault(meal_idx, []).append((diff, chunk))

            self.evaluated_chunk_ids.add(chunk_id)

        # Sort and convert to deques
        result: Dict[int, Deque[Tuple[float, Chunk]]] = {}
        for idx, candidates in meal_to_candidates.items():
            result[idx] = deque(sorted(candidates, key=lambda t: t[0]))

        return result

    def _record_cap_time(self) -> None:
        """Record the timestamp when glue became full."""
        if self.capped_at_ms is None:
            try:
                self.capped_at_ms = pygame.time.get_ticks()
            except Exception:
                self.capped_at_ms = 0

    def _is_sound_capped(self) -> bool:
        """Check if sound cap has been reached."""
        return self.sound_cap is not None and self.sound_chunk_count >= self.sound_cap

    def try_attract_chunks(self, available_chunks: List[Chunk], available_ids: Set[int]) -> None:
        """Attract chunks in a balanced way across history colors (round-robin)."""
        if len(self.glued_chunks) >= self.max_glued_chunks:
            self._record_cap_time()
            return

        # Clean up stale IDs from removed chunks
        self.evaluated_chunk_ids &= available_ids
        self.attracted_chunk_ids &= available_ids

        # Build candidate lists per meal color
        meal_candidates = self._build_candidate_lists(available_chunks)
        if not meal_candidates:
            return

        # Rank meals from lowest candidate count to highest
        ordered_meals = sorted(meal_candidates.keys(), key=lambda k: len(meal_candidates[k]))

        # Round-robin pick until capacity reached
        capacity_remaining = self.max_glued_chunks - len(self.glued_chunks)
        while capacity_remaining > 0:
            progressed = False
            sound_capped = self._is_sound_capped()

            for meal_idx in ordered_meals:
                candidates = meal_candidates[meal_idx]

                # Skip sound chunks if sound-capped
                while candidates and sound_capped and candidates[0][1].audio_path:
                    candidates.popleft()
                if not candidates:
                    continue

                # Pick next candidate
                _, chosen = candidates.popleft()
                meal_rgb = self.meal_rgbs[meal_idx]
                self.glued_chunks.append(GluedChunk(chosen, self.position, self.config, meal_rgb))
                self.attracted_chunk_ids.add(id(chosen))
                if chosen.audio_path:
                    self.sound_chunk_count += 1
                capacity_remaining -= 1
                progressed = True

                if capacity_remaining <= 0:
                    break

            if not progressed:
                break

        # Record cap time if now full
        if len(self.glued_chunks) >= self.max_glued_chunks:
            self._record_cap_time()
    
    def update(self, torus_world: bool = False) -> None:
        """Update the behavior of all glued chunks."""
        # Update pulsing effect
        self.pulse_time += self.pulse_speed

        # Apply flocking behavior
        for glued_chunk in self.glued_chunks:
            glued_chunk.apply_behaviors(self.glued_chunks, torus_world)
            
    def _get_cached_glow(self, outer_radius: int) -> pygame.Surface:
        """Get or create cached glow surface for given radius."""
        if outer_radius not in self._glow_cache:
            glow = pygame.Surface((outer_radius * 2, outer_radius * 2), pygame.SRCALPHA)
            for r in range(outer_radius, 0, -1):
                alpha = max(0, self.glow_alpha_max - (r * self.glow_alpha_max // outer_radius))
                pygame.draw.circle(glow, self.glow_rgb + (alpha,), (outer_radius, outer_radius), r)
            self._glow_cache[outer_radius] = glow
        return self._glow_cache[outer_radius]

    def draw(self, surface: pygame.Surface) -> None:
        """Draw the glue as a glowing dot with mixed colors from worm history and a spinning color wheel."""
        pulse_factor = self.pulse_min + (self.pulse_max - self.pulse_min) * math.sin(self.pulse_time)
        outer_radius = int(self.glow_radius * 2 * pulse_factor)
        if outer_radius <= 0:
            return

        # Get cached glow base and copy it
        glow_surface = self._get_cached_glow(outer_radius).copy()

        # Draw the center as a spinning color wheel made from meal colors
        core_radius = int(self.glow_radius * pulse_factor)
        if core_radius > 0 and self.meal_rgbs:
            self._draw_color_wheel(glow_surface, (outer_radius, outer_radius), core_radius, angle_offset=self.pulse_time)
            # If full, draw an outer white ring around the wheel
            if len(self.glued_chunks) >= self.max_glued_chunks:
                pygame.draw.circle(glow_surface, (255, 255, 255, 255), (outer_radius, outer_radius), max(1, core_radius + 2), self.full_ring_width)

        # Draw onto main surface at the glue position
        glow_rect = glow_surface.get_rect(center=(int(self.position[0]), int(self.position[1])))
        surface.blit(glow_surface, glow_rect)

    def _draw_color_wheel(self, surface: pygame.Surface, center: Tuple[int, int], radius: int, angle_offset: float = 0.0) -> None:
        """Draw a simple pie-slice color wheel of meal colors, rotated by angle_offset (radians)."""
        num_segments = len(self.meal_rgbs)
        if num_segments <= 0:
            return
        # Convert offset to radians for rotation
        start_angle = angle_offset * self.spin_speed
        segment_angle = 2 * math.pi / num_segments
        steps_per_segment = max(self.min_quality_steps, int(radius / 2))
        cx, cy = center
        for idx, color in enumerate(self.meal_rgbs):
            a0 = start_angle + idx * segment_angle
            a1 = a0 + segment_angle
            points = [(cx, cy)]
            for s in range(steps_per_segment + 1):
                t = a0 + (a1 - a0) * (s / steps_per_segment)
                x = cx + int(math.cos(t) * radius)
                y = cy + int(math.sin(t) * radius)
                points.append((x, y))
            pygame.draw.polygon(surface, color + (255,), points)


class Worm:
    """
    A worm that consumes chunks based on their color contrast and records their colors.
    """
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize a new worm.
        
        Args:
            config (Dict[str, Any]): The configuration dictionary.
        """
        self.config = config  # Store the config
        worm_cfg = config["worm"]
        self.max_chunks = worm_cfg["max_chunks"]
        appetite_cfg = worm_cfg["appetite"]
        self.min_difference = appetite_cfg["min_difference"]  # Minimum color difference required
        self.max_difference = appetite_cfg["max_difference"]  # Maximum color difference allowed
        
        # Panel configuration
        panel_cfg = worm_cfg["history_panel"]
        self.panel_enabled = panel_cfg["enabled"]
        display_area = panel_cfg["display_area"]
        self.panel_x = display_area["x"]
        self.panel_y = display_area["y"]
        self.panel_width = display_area["width"]
        self.panel_height = display_area["height"]
        
        # History panel settings
        self.chunk_preview_size = panel_cfg["chunk_preview_size"]
        self.text_height = panel_cfg["text_height"]
        self.spacing = panel_cfg["spacing"]
        self.show_hsv_text = panel_cfg.get("show_hsv_text", True)
        
        # Colors
        self.panel_bg_color = tuple(config["colors"]["PANEL_BG"])
        
        # State
        self.history: List[WormHistory] = []
        self.last_color: Optional[Tuple[float, float, float]] = None
        self.is_dead = False
        
        # Last chunk reference and glue
        self.last_chunk: Optional[Chunk] = None
        self.glue: Optional[Glue] = None
        
        # Glue configuration
        self.glue_enabled = worm_cfg.get("glue", {}).get("enabled", False)

    def is_valid_next_chunk(self, chunk: Chunk) -> bool:
        """
        Check if chunk has color difference within the allowed range compared to the previous chunk.
        
        Args:
            chunk (Chunk): The chunk to evaluate.
            
        Returns:
            bool: True if the chunk's color difference is between min and max thresholds.
        """
        if self.last_color is None:
            return True
            
        # Get this chunk's cached color
        chunk_color = chunk.cached_hsv_color
        
        # Calculate color difference between chunks
        difference = calculate_color_contrast(self.last_color, chunk_color, self.config)
        
        # Print debug info
        # print(f"Last color (HSV): {self.last_color}")
        # print(f"Current color (HSV): {chunk_color}")
        # print(f"Color difference: {difference:.2f}")
        # print(f"Valid range: {self.min_difference} to {self.max_difference}")
        
        # Check if difference is within thresholds
        return self.min_difference <= difference <= self.max_difference

    def consume_chunk(self, chunk: Chunk) -> None:
        """
        Consume a chunk, recording its color information.
        
        Args:
            chunk (Chunk): The chunk to consume.
        """
        if self.is_dead:
            return
            
        # Store reference to the last chunk consumed
        self.last_chunk = chunk
            
        # Get the cached HSV color
        hsv_color = chunk.cached_hsv_color
        self.last_color = hsv_color
        # print(f"Consumed chunk with HSV color: {hsv_color}")
        
        # Create history entry with HSV color
        history_entry = WormHistory(chunk.segment_surface, hsv_color)
        self.history.append(history_entry)
        
        # Check if worm should die
        if len(self.history) >= self.max_chunks:
            self.mark_as_dead()

    def mark_as_dead(self) -> None:
        """Mark the worm as dead and create glue at the last meal site if enabled."""
        self.is_dead = True
        _logger.debug("Worm died after consuming %d chunks", len(self.history))

        # Create glue at the last meal site if enabled and we have at least one meal
        if self.glue_enabled and self.last_chunk is not None and len(self.history) > 0:
            position = (self.last_chunk.body.position.x, self.last_chunk.body.position.y)
            self.glue = Glue(position, self.history, self.config)
            _logger.debug("Created glue at (%.1f, %.1f)", position[0], position[1])

    def draw(self, surface: pygame.Surface, x_offset: int = 0) -> None:
        """
        Draw the worm's history panel and glue if it exists.
        Args:
            surface (pygame.Surface): The surface to draw on.
            x_offset (int): Horizontal offset for the panel (for multi-worm display).
        """
        # Only draw panel if enabled and there is content
        if not self.panel_enabled or len(self.history) == 0:
            return
        # Draw panel background (use compact width if HSV text hidden)
        panel_rect = pygame.Rect(self.panel_x + x_offset, self.panel_y, self.get_panel_width(), self.panel_height)
        pygame.draw.rect(surface, self.panel_bg_color, panel_rect)
        # Draw each history entry
        font = pygame.font.SysFont(None, self.text_height)
        y_offset = self.panel_y + self.spacing
        for entry in self.history:
            # Draw chunk preview
            preview = pygame.transform.scale(entry.chunk_surface, 
                                          (self.chunk_preview_size, self.chunk_preview_size))
            preview_rect = preview.get_rect(topleft=(self.panel_x + self.spacing + x_offset, y_offset))
            surface.blit(preview, preview_rect)
            # Draw color swatch
            swatch_rect = pygame.Rect(preview_rect.right + self.spacing, y_offset,
                                    self.chunk_preview_size, self.chunk_preview_size)
            pygame.draw.rect(surface, entry.rgb_color, swatch_rect)
            # Draw HSV values (optional)
            if self.show_hsv_text:
                h, s, v = entry.hsv_color
                hsv_text = f"H:{h:.0f}° S:{s:.2f} V:{v:.2f}"
                text = font.render(hsv_text, True, (255, 255, 255))
                text_rect = text.get_rect(midleft=(swatch_rect.right + self.spacing,
                                                 y_offset + self.chunk_preview_size // 2))
                surface.blit(text, text_rect)
            # Advance to next row
            y_offset += self.chunk_preview_size + self.spacing

    def get_panel_width(self) -> int:
        """Return effective panel width; compact when HSV text is hidden."""
        if self.show_hsv_text:
            return self.panel_width
        # Compact layout: preview + swatch + paddings
        return min(self.panel_width, (self.spacing * 3) + (self.chunk_preview_size * 2))

    def select_next_chunk(self, chunks: List[Chunk]) -> Optional[Chunk]:
        """
        Select the next chunk to consume based on color contrast rules.
        
        Args:
            chunks (List[Chunk]): Available chunks to choose from.
            
        Returns:
            Optional[Chunk]: The selected chunk, or None if no valid chunk found.
        """
        if self.is_dead or not chunks:
            return None
            
        # For first chunk, select randomly
        if self.last_color is None:
            return random.choice(chunks)
            
        # Find all valid chunks based on contrast
        valid_chunks = [chunk for chunk in chunks if self.is_valid_next_chunk(chunk)]
        if not valid_chunks:
            # If no valid chunks are found, the worm dies
            # print("No valid chunks found - worm dies!")
            self.mark_as_dead()
            return None
            
        return random.choice(valid_chunks) 