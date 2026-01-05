"""Worm lifecycle and scheduling management."""
import pygame
import pymunk
from typing import Dict, Any, List, Optional, Tuple
from entities import Worm, Glue, Chunk
from utils.logging_utils import get_logger

_logger = get_logger(__name__)


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
        self._active_worm: Optional[Worm] = None
        self._spawn_pending: int = 0
        self._spawn_batch_total: int = 0
        self.history_panel_enabled: bool = config["worm"]["history_panel"]["enabled"]

    def schedule_worms(self, count: int) -> None:
        """
        Schedule spawning of 'count' worms sequentially.
        If none active, spawn immediately.

        Args:
            count: Number of worms to schedule
        """
        if count <= 0:
            return
        self._spawn_pending += count
        self._spawn_batch_total += count
        # If no active worm, start immediately
        if not self._active_worm:
            self._spawn_next_worm()

    def _spawn_next_worm(self) -> None:
        """Spawn the next worm in the current schedule batch."""
        if self._spawn_pending <= 0:
            return
        new_worm = Worm(self.config)
        new_worm.panel_enabled = self.history_panel_enabled
        self.current_worm = new_worm
        self.worms.append(new_worm)
        self._active_worm = new_worm
        # Decrement pending and report progress
        self._spawn_pending -= 1
        spawned_so_far = self._spawn_batch_total - self._spawn_pending
        total = self._spawn_batch_total
        _logger.info("Spawned worm %d of %d", spawned_so_far, total)

    def check_worm_completion(self) -> None:
        """Advance scheduling when the active worm finishes eating."""
        if not self._active_worm:
            return
        if self._active_worm.is_dead:
            if self._spawn_pending > 0:
                self._spawn_next_worm()
            else:
                self._active_worm = None
                # Reset batch counters
                self._spawn_batch_total = 0
                self._spawn_pending = 0
                _logger.debug("All scheduled worms completed")

    def spawn_worms_for_upload(self, upload_type: str, total_particles: int) -> None:
        """
        Spawn worms for an upload. During superabundance, spawn more; otherwise one.
        Worms are scheduled to spawn sequentially (wait for one to finish before next).

        Args:
            upload_type: Type of upload ("image" or "sound")
            total_particles: Current total particle/chunk count
        """
        superabundance_cfg = self.config["worm"].get("superabundance", {})
        threshold = superabundance_cfg.get("threshold", 1000)
        worms_per_upload = superabundance_cfg.get("worms_per_upload", 2)
        is_superabundant = total_particles > threshold
        worms_to_spawn = worms_per_upload if is_superabundant else 1

        if is_superabundant:
            _logger.info("SUPERABUNDANCE: %d particles, scheduling %d worms for %s", total_particles, worms_to_spawn, upload_type)
        else:
            _logger.debug("Normal abundance: %d particles, scheduling %d worm for %s", total_particles, worms_to_spawn, upload_type)

        # Schedule sequential spawning
        self.schedule_worms(worms_to_spawn)

    def toggle_history_panel(self) -> None:
        """Toggle the visibility of all worm history panels."""
        self.history_panel_enabled = not self.history_panel_enabled
        for worm in self.worms:
            worm.panel_enabled = self.history_panel_enabled

    def clear(self) -> None:
        """Clear all worms."""
        self.worms.clear()
        self.current_worm = None
        self._active_worm = None
        self._spawn_pending = 0
        self._spawn_batch_total = 0

    def update_worm_and_glues(
        self,
        glues_list: List[Glue],
        available_chunks: List[Chunk],
        space: pymunk.Space,
        chunks_list: List[Chunk],
        glue_visuals_enabled: bool,
        screen: pygame.Surface
    ) -> None:
        """
        Update current worm (feeding) and all glues (attraction/update).

        Args:
            glues_list: Reference to simulation's glues list
            available_chunks: Chunks available for worm/glues
            space: Pymunk physics space
            chunks_list: Reference to simulation's chunks list
            glue_visuals_enabled: Whether to draw glue visuals
            screen: Pygame screen for rendering
        """
        # Update worm (feeding)
        worm = self.current_worm
        if worm and not worm.is_dead:
            next_chunk = worm.select_next_chunk(available_chunks)
            if next_chunk:
                space.remove(next_chunk.shape, next_chunk.body)
                chunks_list.remove(next_chunk)
                worm.consume_chunk(next_chunk)

        # Add dead worm's glue to glues list
        if worm and worm.is_dead and worm.glue:
            if worm.glue not in glues_list:
                glues_list.append(worm.glue)

        # Update all glues
        for glue in glues_list:
            glue.try_attract_chunks(available_chunks)
            glue.update()
            if glue_visuals_enabled:
                glue.draw(screen)

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
        superabundance_cfg = self.config["worm"].get("superabundance", {})
        threshold = superabundance_cfg.get("threshold", 1000)
        glue_cfg = self.config["worm"].get("glue", {})
        max_active = int(glue_cfg.get("max_active_glues", 5))
        auto_export_age_ms = int(superabundance_cfg.get("auto_export_capped_after_ms", 60_000))

        # Check if we're in superabundance
        if total_chunks > threshold:
            now_ms = pygame.time.get_ticks()
            expired_glues = [
                g for g in glues_list
                if getattr(g, "capped_at_ms", None) is not None
                and len(g.glued_chunks) >= getattr(g, "max_glued_chunks", 0)
                and now_ms - int(g.capped_at_ms) >= auto_export_age_ms
            ]
            if expired_glues:
                over_limit = len(glues_list) > max_active
                return (expired_glues, not over_limit)

        # Check if active glues exceed configured limit
        if len(glues_list) > max_active:
            now_ms = pygame.time.get_ticks()
            over_limit_candidates = [
                g for g in glues_list
                if getattr(g, "capped_at_ms", None) is not None
                and len(g.glued_chunks) >= getattr(g, "max_glued_chunks", 0)
                and now_ms - int(g.capped_at_ms) >= auto_export_age_ms
            ]
            if over_limit_candidates:
                return (over_limit_candidates, False)

        return ([], False)
