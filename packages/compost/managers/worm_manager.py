"""Worm lifecycle and scheduling management."""
import math
import random
import pygame
from typing import Callable, Dict, Any, List, Optional, Tuple
from entities import Worm, Glue, Chunk
from utils.color_utils import compute_consecutive_extremes, hsv_to_rgb_int
from utils.logging_utils import get_logger

_logger = get_logger(__name__)


class _Particle:
    """A single fading particle for consumption burst effects."""
    __slots__ = ('x', 'y', 'vx', 'vy', 'color', 'alpha', 'radius', 'life', 'max_life')

    def __init__(self, x: float, y: float, vx: float, vy: float,
                 color: Tuple[int, int, int], radius: int, life: int):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.color = color
        self.alpha = 255
        self.radius = radius
        self.life = life
        self.max_life = life


class WormManager:
    """Manages worm spawning, lifecycle, and scheduling."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the worm manager.

        Args:
            config: Global configuration dict
        """
        self.config = config
        self.worms: List[Worm] = []
        self.current_worm: Optional[Worm] = None
        self._spawn_pending: int = 0
        self._spawn_batch_total: int = 0
        self._available_at_spawn: int = 0  # Available chunk count for dynamic max_meals
        self.history_panel_enabled: bool = config["simulation"]["ui"]["worm_history_panel"]["enabled"]

        # Inherited appetite range (cone distance %, 0.0-1.0)
        appetite_cfg = config["worm"]["appetite"]
        self.inherited_appetite_min: float = appetite_cfg.get("initial_min", 0.0)
        self.inherited_appetite_max: float = appetite_cfg.get("initial_max", 1.0)

        # Consumption particle effects
        self._particles: List[_Particle] = []
        self._dot_cache: Dict[Tuple, pygame.Surface] = {}  # (radius, color, alpha) -> surface
        p_cfg = config["worm"].get("consumption_particles", {})
        self._particles_enabled: bool = p_cfg.get("enabled", True)
        self._particle_min_count: int = p_cfg.get("min_count", 5)
        self._particle_max_count: int = p_cfg.get("max_count", 50)
        self._particle_max_size: float = float(p_cfg.get("max_size", 200))
        self._particle_speed: float = p_cfg.get("speed", 1.0)
        self._particle_lifetime: int = p_cfg.get("lifetime_frames", 150)
        self._particle_radius: int = p_cfg.get("radius", 1)
        self._particle_radius_jitter: int = p_cfg.get("radius_jitter", 1)
        self._particle_drag: float = p_cfg.get("drag", 0.97)

        # Cache superabundance config
        sa_cfg = config["worm"].get("superabundance", {})
        self._sa_threshold: int = sa_cfg.get("threshold", 1000)
        self._sa_worms_per_upload: int = sa_cfg.get("worms_per_upload", 2)
        self._sa_auto_export_age_ms: int = int(sa_cfg.get("auto_export_capped_after_ms", 60_000))
        glue_cfg = config["worm"].get("glue", {})
        self._max_active_glues: int = int(glue_cfg.get("max_active_glues", 5))

    def schedule_worms(self, count: int, available_chunks: int = 0) -> None:
        """
        Schedule spawning of 'count' worms sequentially.
        If none active, spawn immediately.

        Args:
            count: Number of worms to schedule
            available_chunks: Current available (non-glued) chunk count
        """
        if count <= 0:
            return
        self._available_at_spawn = available_chunks
        self._spawn_pending += count
        self._spawn_batch_total += count
        # Only spawn immediately if no worm at all.
        # A dead worm still needs check_worm_completion to promote its glue first.
        if self.current_worm is None:
            self._spawn_next_worm()

    def _spawn_next_worm(self) -> None:
        """Spawn the next worm in the current schedule batch."""
        if self._spawn_pending <= 0:
            return
        new_worm = Worm(
            self.config,
            appetite_min=self.inherited_appetite_min,
            appetite_max=self.inherited_appetite_max,
            available_chunks=self._available_at_spawn,
        )
        new_worm.panel_enabled = self.history_panel_enabled
        self.current_worm = new_worm
        self.worms.append(new_worm)
        # Decrement pending and report progress
        self._spawn_pending -= 1
        spawned_so_far = self._spawn_batch_total - self._spawn_pending
        total = self._spawn_batch_total
        _logger.info("Spawned worm %d of %d (max_meals=%d, available=%d)",
                     spawned_so_far, total, new_worm.max_meals, self._available_at_spawn)

    def check_worm_completion(self, available_chunk_count: int, glues_list: List[Glue]) -> None:
        """Advance scheduling when the current worm finishes eating."""
        if self.current_worm is None or not self.current_worm.is_dead:
            return

        # Promote glue to simulation list immediately
        if self.current_worm.glue and self.current_worm.glue not in glues_list:
            glues_list.append(self.current_worm.glue)

        # Update inherited appetite from the dead worm's meal pairwise distances
        self._inherit_appetite(self.current_worm)

        if self._spawn_pending > 0 and available_chunk_count > 0:
            self._available_at_spawn = available_chunk_count
            self._spawn_next_worm()
        else:
            if self._spawn_pending > 0:
                _logger.info("Cancelled %d pending worms (no food)", self._spawn_pending)
            self.current_worm = None
            self._spawn_batch_total = 0
            self._spawn_pending = 0

    def _inherit_appetite(self, worm: Worm) -> None:
        """Compute consecutive meal distances from a dead worm and update inherited appetite."""
        num_meals = len(worm.history)
        hsv_colors = [entry.hsv_color for entry in worm.history]
        result = compute_consecutive_extremes(hsv_colors, self.config)

        if result is None:
            _logger.debug(
                "Worm died with %d meals (< 2), inherited appetite unchanged [%.4f, %.4f]",
                num_meals, self.inherited_appetite_min, self.inherited_appetite_max,
            )
            return

        cons_min, cons_max = result
        # With only 2 meals (1 step), min is not meaningful — keep floor at 0
        self.inherited_appetite_min = 0.0 if num_meals == 2 else cons_min
        self.inherited_appetite_max = cons_max

        _logger.info(
            "Worm died with %d meals, consecutive [%.4f, %.4f] -> inherited appetite [%.4f, %.4f]",
            num_meals, cons_min, cons_max,
            self.inherited_appetite_min, self.inherited_appetite_max,
        )

    def is_superabundant(self, total_chunks: int) -> bool:
        """Check if the simulation is in superabundance state."""
        return total_chunks > self._sa_threshold

    def spawn_worms_for_upload(self, upload_type: str, total_particles: int, available_chunks: int = 0) -> None:
        """
        Spawn worms for an upload. During superabundance, spawn more; otherwise one.
        Worms are scheduled to spawn sequentially (wait for one to finish before next).
        Cancels any stale pending worms from previous batches (e.g. post-export).

        Args:
            upload_type: Type of upload ("image" or "sound")
            total_particles: Current total particle/chunk count (for superabundance check)
            available_chunks: Current available (non-glued) chunk count (for dynamic max_meals)
        """
        # Cancel stale pending from previous batches
        if self._spawn_pending > 0:
            _logger.info("Cancelled %d stale pending worms from previous batch", self._spawn_pending)
            self._spawn_pending = 0
            self._spawn_batch_total = 0

        is_super = self.is_superabundant(total_particles)
        worms_to_spawn = self._sa_worms_per_upload if is_super else 1

        if is_super:
            _logger.info("SUPERABUNDANCE: %d particles, scheduling %d worms for %s", total_particles, worms_to_spawn, upload_type)
        else:
            _logger.debug("Normal abundance: %d particles, scheduling %d worm for %s", total_particles, worms_to_spawn, upload_type)

        # Schedule sequential spawning
        self.schedule_worms(worms_to_spawn, available_chunks=available_chunks)

    def toggle_history_panel(self) -> None:
        """Toggle the visibility of all worm history panels."""
        self.history_panel_enabled = not self.history_panel_enabled
        for worm in self.worms:
            worm.panel_enabled = self.history_panel_enabled

    def cleanup_after_export(self, exported_glues: List[Glue]) -> None:
        """Clean up worm state after their glues have been exported."""
        exported_glue_ids = {id(g) for g in exported_glues}
        for worm in self.worms:
            if worm.glue is not None and id(worm.glue) in exported_glue_ids:
                worm.glue = None
                worm.history.clear()

    def clear(self) -> None:
        """Clear all worms and reset inherited appetite to config defaults."""
        self.worms.clear()
        self.current_worm = None
        self._spawn_pending = 0
        self._spawn_batch_total = 0
        self._available_at_spawn = 0
        self._particles.clear()
        self._dot_cache.clear()
        appetite_cfg = self.config["worm"]["appetite"]
        self.inherited_appetite_min = appetite_cfg.get("initial_min", 0.0)
        self.inherited_appetite_max = appetite_cfg.get("initial_max", 1.0)

    # ----------------------------------------------------------------
    # Consumption particle effects
    # ----------------------------------------------------------------
    def _spawn_particles(self, chunk: Chunk) -> None:
        """Scatter particles across the chunk's surface area with gentle random drift."""
        if not self._particles_enabled:
            return
        pos = chunk.body.position
        rgb = hsv_to_rgb_int(chunk.cached_hsv_color)
        surf = chunk.segment_surface
        # Account for in-progress shrink animation
        if chunk._shrink_start_ms is not None:
            elapsed = pygame.time.get_ticks() - chunk._shrink_start_ms
            shrink_t = min(1.0, elapsed / chunk._shrink_duration_ms) if chunk._shrink_duration_ms > 0 else 1.0
            scale = 1.0 + (chunk._shrink_target_scale - 1.0) * shrink_t
        else:
            scale = 1.0
        chunk_extent = max(surf.get_width(), surf.get_height()) * scale
        spread = chunk_extent * 0.5
        # Lerp count between min and max based on chunk size
        size_ratio = min(1.0, chunk_extent / self._particle_max_size)
        count = int(self._particle_min_count + (self._particle_max_count - self._particle_min_count) * size_ratio)
        for _ in range(count):
            a = random.uniform(0, 2 * math.pi)
            r = spread * math.sqrt(random.random())
            sx = pos.x + math.cos(a) * r
            sy = pos.y + math.sin(a) * r
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(0, self._particle_speed)
            life = random.randint(1, self._particle_lifetime)
            radius = random.randint(
                max(1, self._particle_radius - self._particle_radius_jitter),
                self._particle_radius + self._particle_radius_jitter,
            )
            self._particles.append(_Particle(
                sx, sy,
                math.cos(angle) * speed, math.sin(angle) * speed,
                rgb, radius, life,
            ))

    def update_and_draw_particles(self, screen: pygame.Surface) -> None:
        """Step all particles forward one frame and draw survivors."""
        if not self._particles:
            return
        alive: List[_Particle] = []
        drag = self._particle_drag
        cache = self._dot_cache
        for p in self._particles:
            p.life -= 1
            if p.life <= 0:
                continue
            p.x += p.vx
            p.y += p.vy
            p.vx *= drag
            p.vy *= drag
            # Quantize alpha to 16 buckets for cache efficiency
            alpha = max(0, int(255 * (p.life / p.max_life)))
            alpha_bucket = (alpha >> 4) << 4
            p.alpha = alpha
            alive.append(p)
            # Draw particle from cache
            key = (p.radius, p.color, alpha_bucket)
            dot = cache.get(key)
            if dot is None:
                d = p.radius * 2
                dot = pygame.Surface((d, d), pygame.SRCALPHA)
                pygame.draw.circle(dot, p.color + (alpha_bucket,), (p.radius, p.radius), p.radius)
                cache[key] = dot
            screen.blit(dot, (int(p.x) - p.radius, int(p.y) - p.radius))
        self._particles = alive
        if not alive:
            self._dot_cache.clear()

    def update_worm_and_glues(
        self,
        glues_list: List[Glue],
        available_chunks: List[Chunk],
        remove_chunk: Callable[[Chunk], bool],
        glue_visuals_enabled: bool,
        screen: pygame.Surface,
        torus_world: bool = False
    ) -> None:
        """
        Update current worm (feeding) and all glues (attraction/update).

        Args:
            glues_list: Reference to simulation's glues list
            available_chunks: Chunks available for worm/glues
            remove_chunk: Callback to remove a chunk from the simulation
            glue_visuals_enabled: Whether to draw glue visuals
            screen: Pygame screen for rendering
            torus_world: Whether torus wrapping is enabled
        """
        # Update worm (feeding)
        worm = self.current_worm
        if worm and not worm.is_dead:
            next_chunk = worm.select_next_chunk(available_chunks)
            if next_chunk:
                self._spawn_particles(next_chunk)
                remove_chunk(next_chunk)
                available_chunks.remove(next_chunk)
                worm.consume_chunk(next_chunk)

        # Update all glues
        available_ids = {id(c) for c in available_chunks}
        for glue in glues_list:
            glue.try_attract_chunks(available_chunks, available_ids)
            glue.update(torus_world)
            if glue_visuals_enabled:
                glue.draw(screen)

    def _find_expired_glues(self, glues_list: List[Glue], min_age_ms: int) -> List[Glue]:
        """Find glues that are capped and have exceeded the minimum age."""
        now_ms = pygame.time.get_ticks()
        return [
            g for g in glues_list
            if getattr(g, "capped_at_ms", None) is not None
            and len(g.glued_chunks) >= getattr(g, "max_glued_chunks", 0)
            and now_ms - int(g.capped_at_ms) >= min_age_ms
        ]

    def get_glues_for_auto_export(
        self,
        glues_list: List[Glue],
        total_chunks: int
    ) -> Tuple[List[Glue], bool]:
        """
        Check for glues that should be auto-exported during superabundance.

        Args:
            glues_list: Reference to simulation's glues list
            total_chunks: Current total chunk count

        Returns:
            Tuple of (glues_to_export, schedule_worms)
        """
        # Check if we're in superabundance
        if self.is_superabundant(total_chunks):
            expired_glues = self._find_expired_glues(glues_list, self._sa_auto_export_age_ms)
            if expired_glues:
                over_limit = len(glues_list) > self._max_active_glues
                return (expired_glues, not over_limit)

        # Check if active glues exceed configured limit
        if len(glues_list) > self._max_active_glues:
            expired_glues = self._find_expired_glues(glues_list, self._sa_auto_export_age_ms)
            if expired_glues:
                return (expired_glues, False)

        return ([], False)
