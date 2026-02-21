import pygame
import random
import math
from typing import List, Tuple, Dict, Any, Optional, Set, Deque
from collections import deque
import numpy as np
from utils.color_utils import calculate_color_contrast, hsv_to_rgb_int
from utils.logging_utils import get_logger
from utils.math_utils import compute_flocking_forces
from entities.chunk import Chunk, GluedChunk

_logger = get_logger(__name__)


class WormHistory:
    """Represents a single chunk's history entry for the worm."""
    def __init__(self, chunk_surface: pygame.Surface, hsv_color: Tuple[float, float, float],
                 wild: bool = False, stretch: bool = False, contrast_pct: Optional[float] = None):
        self.chunk_surface = chunk_surface
        self.hsv_color = hsv_color
        self.rgb_color = hsv_to_rgb_int(hsv_color)
        self.wild = wild
        self.stretch = stretch
        self.contrast_pct = contrast_pct  # Cone distance % for wild/stretch picks


class Glue:
    """Manages a collection of chunks attracted by a single glue point."""
    def __init__(self, position: Tuple[float, float], worm_history: List[WormHistory], config: Dict[str, Any], source_worm: Optional['Worm'] = None):
        self.position = position
        self.worm_history = worm_history
        self.source_worm = source_worm
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
        self.vicinity_cfg = self.glue_cfg["color_attraction"]
        self.min_difference = self.vicinity_cfg["min_difference"]
        self.max_difference = self.vicinity_cfg["max_difference"]
        
        # Flocking parameters (shared by all glued chunks)
        flocking_cfg = self.glue_cfg["flocking"]
        self.maxspeed = flocking_cfg["maxspeed"]
        self.maxforce = flocking_cfg["maxforce"]
        self.desired_separation = flocking_cfg["desired_separation"]
        self.separate_force_mult = flocking_cfg["separate_force_mult"]
        self.seek_force_mult = flocking_cfg["seek_force_mult"]

        # Cached window dimensions for torus wrapping
        win_cfg = config["simulation"]["window"]
        self._win_width = win_cfg["width"]
        self._win_height = win_cfg["height"]

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
                self.glued_chunks.append(GluedChunk(chosen, meal_rgb))
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
        self.pulse_time += self.pulse_speed

        n = len(self.glued_chunks)
        if n == 0:
            return

        # Gather positions and velocities from physics bodies
        positions = np.empty((n, 2), dtype=np.float64)
        velocities = np.empty((n, 2), dtype=np.float64)
        for i, gc in enumerate(self.glued_chunks):
            p = gc.chunk.body.position
            v = gc.chunk.body.velocity
            positions[i] = (p.x, p.y)
            velocities[i] = (v.x, v.y)

        # Compute all forces in one vectorized call
        world_size = (self._win_width, self._win_height) if torus_world else None
        forces = compute_flocking_forces(
            positions, velocities, self.position,
            self.desired_separation, self.maxspeed, self.maxforce,
            self.separate_force_mult, self.seek_force_mult,
            world_size,
        )

        # Apply combined forces back to physics bodies
        for i, gc in enumerate(self.glued_chunks):
            gc.chunk.body.apply_force_at_world_point(
                (forces[i, 0], forces[i, 1]), gc.chunk.body.position
            )
            
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
    def __init__(self, config: Dict[str, Any],
                 appetite_min: float = 0.0, appetite_max: float = 1.0,
                 available_chunks: int = 0):
        """
        Initialize a new worm.

        Args:
            config (Dict[str, Any]): The configuration dictionary.
            appetite_min: Inherited minimum contrast (cone distance %).
            appetite_max: Inherited maximum contrast (cone distance %).
            available_chunks: Number of available (non-glued) chunks at spawn time.
        """
        self.config = config
        worm_cfg = config["worm"]
        hard_max = worm_cfg["max_meals"]
        min_meals = worm_cfg.get("min_meals", 5)
        max_meal_pct = worm_cfg.get("max_meal_pct", 0.02)
        # Dynamic max: % of available chunks, floored by min_meals, capped by hard max
        pct_limit = max(min_meals, int(available_chunks * max_meal_pct))
        self.max_meals = min(hard_max, pct_limit)
        appetite_cfg = worm_cfg["appetite"]
        self.appetite_min = appetite_min
        self.appetite_max = appetite_max
        # Panel configuration
        panel_cfg = config["simulation"]["ui"]["worm_history_panel"]
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
        self.show_contrast_markers = panel_cfg.get("show_contrast_markers", True)

        # Colors
        self.panel_bg_color = tuple(config["colors"]["PANEL_BG"])

        # Jitter: chance scales as appetite band narrows
        self.jitter_wide = appetite_cfg.get("jitter_wide", 0.05)
        self.jitter_narrow = appetite_cfg.get("jitter_narrow", 0.50)
        self.jitter_curve = appetite_cfg.get("jitter_curve", 3)

        # State
        self.history: List[WormHistory] = []
        self.last_color: Optional[Tuple[float, float, float]] = None
        self.is_dead = False
        self._next_is_wild: bool = False
        self._next_is_stretch: bool = False
        self._next_contrast_pct: Optional[float] = None
        # Last chunk reference and glue
        self.last_chunk: Optional[Chunk] = None
        self.glue: Optional[Glue] = None

        # Glue configuration
        self.glue_enabled = worm_cfg.get("glue", {}).get("enabled", False)

    @property
    def jitter_chance(self) -> float:
        spread = self.appetite_max - self.appetite_min
        return self.jitter_wide + (self.jitter_narrow - self.jitter_wide) * ((1.0 - spread) ** self.jitter_curve)

    def is_valid_next_chunk(self, chunk: Chunk) -> bool:
        """
        Check if chunk has color contrast within the appetite range vs the last meal.

        Returns True for the first chunk (no last_color yet).
        """
        if self.last_color is None:
            return True
        chunk_color = chunk.cached_hsv_color
        difference = calculate_color_contrast(self.last_color, chunk_color, self.config)
        return self.appetite_min <= difference <= self.appetite_max

    def consume_chunk(self, chunk: Chunk) -> None:
        """
        Consume a chunk, recording its color information.

        Args:
            chunk (Chunk): The chunk to consume.
        """
        if self.is_dead:
            return

        self.last_chunk = chunk
        hsv_color = chunk.cached_hsv_color

        self.last_color = hsv_color

        # Create history entry with HSV color
        is_stretch = self._next_is_stretch
        history_entry = WormHistory(
            chunk.segment_surface, hsv_color,
            wild=self._next_is_wild,
            stretch=is_stretch,
            contrast_pct=self._next_contrast_pct,
        )
        self._next_is_wild = False
        self._next_is_stretch = False
        self._next_contrast_pct = None
        self.history.append(history_entry)

        # Stretch meal is the last meal — die immediately after eating it
        if is_stretch or len(self.history) >= self.max_meals:
            self.mark_as_dead()

    def mark_as_dead(self) -> None:
        """Mark the worm as dead and create glue at the last meal site if enabled."""
        if self.is_dead:
            return
        self.is_dead = True
        _logger.debug("Worm died after consuming %d chunks", len(self.history))

        # Create glue at the last meal site if enabled and we have at least one meal
        if self.glue_enabled and self.last_chunk is not None and len(self.history) > 0:
            position = (self.last_chunk.body.position.x, self.last_chunk.body.position.y)
            self.glue = Glue(position, self.history, self.config, source_worm=self)
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
        # Draw appetite range header
        font = pygame.font.SysFont(None, self.text_height)
        appetite_text = f"[{self.appetite_min:.0%}-{self.appetite_max:.0%}] j:{self.jitter_chance:.0%}"
        appetite_surf = font.render(appetite_text, True, (180, 180, 180))
        surface.blit(appetite_surf, (self.panel_x + self.spacing + x_offset, self.panel_y + self.spacing))
        # Compute consecutive distances and find min/max indices
        cons_dists = []
        cons_min_idx = -1
        cons_max_idx = -1
        if len(self.history) >= 2:
            cons_dists = [
                calculate_color_contrast(
                    self.history[i].hsv_color, self.history[i + 1].hsv_color, self.config
                )
                for i in range(len(self.history) - 1)
            ]
            min_d = min(cons_dists)
            max_d = max(cons_dists)
            if min_d != max_d:
                cons_min_idx = cons_dists.index(min_d) + 1
                cons_max_idx = cons_dists.index(max_d) + 1

        # Draw each history entry
        y_offset = self.panel_y + self.spacing + self.text_height + self.spacing
        for idx, entry in enumerate(self.history):
            # Draw chunk preview
            preview = pygame.transform.scale(entry.chunk_surface,
                                          (self.chunk_preview_size, self.chunk_preview_size))
            preview_rect = preview.get_rect(topleft=(self.panel_x + self.spacing + x_offset, y_offset))
            surface.blit(preview, preview_rect)

            # Chunk preview border: wild (red) or stretch (yellow)
            if self.show_contrast_markers:
                if entry.wild:
                    pygame.draw.rect(surface, (255, 60, 60), preview_rect, 2)
                elif entry.stretch:
                    pygame.draw.rect(surface, (255, 200, 40), preview_rect, 2)

            # Draw color swatch
            swatch_rect = pygame.Rect(preview_rect.right + self.spacing, y_offset,
                                    self.chunk_preview_size, self.chunk_preview_size)
            pygame.draw.rect(surface, entry.rgb_color, swatch_rect)

            # Swatch border and contrast percentage overlay
            is_min = idx == cons_min_idx
            is_max = idx == cons_max_idx
            swatch_pct = None
            pct_color = None
            if self.show_contrast_markers:
                # Swatch border: green for max, blue for min consecutive distance
                if is_max:
                    pygame.draw.rect(surface, (60, 255, 120), swatch_rect, 2)
                elif is_min:
                    pygame.draw.rect(surface, (100, 160, 255), swatch_rect, 2)

                # Contrast % text: wild/stretch show their own, min/max show consecutive
                if entry.wild:
                    swatch_pct, pct_color = entry.contrast_pct, (255, 60, 60)
                elif entry.stretch:
                    swatch_pct, pct_color = entry.contrast_pct, (255, 200, 40)
                elif is_max:
                    swatch_pct, pct_color = cons_dists[idx - 1], (60, 255, 120)
                elif is_min:
                    swatch_pct, pct_color = cons_dists[idx - 1], (100, 160, 255)

            if swatch_pct is not None:
                pct_text = f"{swatch_pct:.0%}"
                pct_surf = font.render(pct_text, True, pct_color)
                pct_rect = pct_surf.get_rect(center=swatch_rect.center)
                surface.blit(pct_surf, pct_rect)
            elif self.show_hsv_text:
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

        - First chunk: random pick.
        - Subsequent: must fall within [appetite_min, appetite_max] of last meal.
        - Stretching: when no valid food in range, eat the nearest out-of-range
          chunk as a last meal, then die immediately.

        Args:
            chunks: Available chunks to choose from.

        Returns:
            The selected chunk, or None if no valid chunk found.
        """
        if self.is_dead:
            return None

        # Die immediately if already at capacity
        if len(self.history) >= self.max_meals:
            self.mark_as_dead()
            return None

        # No food available — die regardless of meal count
        if not chunks:
            self.mark_as_dead()
            return None

        # First chunk: select randomly
        if self.last_color is None:
            return random.choice(chunks)

        # Jitter: chance scales as appetite band narrows (spread 1.0->wide, 0.0->narrow)
        if random.random() < self.jitter_chance:
            best_diff, best_chunk = max(
                (calculate_color_contrast(self.last_color, c.cached_hsv_color, self.config), c)
                for c in chunks
            )
            self._next_is_wild = True
            self._next_contrast_pct = best_diff
            _logger.debug("Worm jitter! eating furthest chunk, contrast=%.4f", best_diff)
            return best_chunk

        # Find valid chunks within appetite range, weighted by contrast
        valid_chunks = []
        weights = []
        for chunk in chunks:
            diff = calculate_color_contrast(self.last_color, chunk.cached_hsv_color, self.config)
            if self.appetite_min <= diff <= self.appetite_max:
                valid_chunks.append(chunk)
                weights.append(diff)
        if valid_chunks:
            try:
                return random.choices(valid_chunks, weights=weights, k=1)[0]
            except ValueError:
                return random.choice(valid_chunks)

        # No valid chunks — stretch (eat one last out-of-range meal, then die)
        return self._stretch_and_pick(chunks)

    def _stretch_and_pick(self, chunks: List[Chunk]) -> Optional[Chunk]:
        """
        Pick the nearest out-of-range chunk as a last meal (worm dies after eating it).

        Finds the chunk whose contrast to last_color is closest to the
        current [appetite_min, appetite_max] range boundary.
        Does not modify appetite — the worm dies after this meal.
        """
        best_chunk = None
        best_gap = float("inf")
        best_diff = 0.0

        for chunk in chunks:
            diff = calculate_color_contrast(self.last_color, chunk.cached_hsv_color, self.config)
            if diff < self.appetite_min:
                gap = self.appetite_min - diff
            else:
                gap = diff - self.appetite_max
            if gap < best_gap:
                best_gap = gap
                best_chunk = chunk
                best_diff = diff

        if best_chunk is None:
            self.mark_as_dead()
            return None

        self._next_is_stretch = True
        self._next_contrast_pct = best_diff
        _logger.debug(
            "Worm stretch pick: contrast=%.4f, range=[%.4f, %.4f] (meal %d)",
            best_diff, self.appetite_min, self.appetite_max, len(self.history) + 1,
        )
        return best_chunk
