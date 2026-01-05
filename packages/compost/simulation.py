"""Main simulation orchestrator."""
import pygame
import pymunk
import os
from tkinter import filedialog
from typing import List, Dict, Any, Set, Optional

from entities import Worm, Glue, Chunk
from managers import (
    AudioManager,
    BoundaryManager,
    ExportManager,
    QueueManager,
    WormManager,
)
from processors import pick_image_file
from ui import UIManager
from utils.system_utils import quit_program
from utils.logging_utils import get_logger

_logger = get_logger(__name__)


class Simulation:
    """
    Orchestrates the Felzenszwalb-based chunk simulation.
    Delegates responsibilities to specialized managers.
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
            config: The entire configuration loaded from YAML.
            space: The physics space.
            screen: The main Pygame window surface.
            font: Font for rendering text/UI.
        """
        self.config = config
        self.space = space
        self.screen = screen
        self.font = font
        self.debug_mode = False
        self.glue_visuals_enabled = config["worm"]["glue"]["visual"].get("enabled", True)
        self.ui_enabled = config["simulation"].get("ui_enabled", True)

        # Local references
        self.width = config["simulation"]["window"]["width"]
        self.height = config["simulation"]["window"]["height"]
        self.ui_bar_height = config["simulation"]["window"]["ui_bar_height"]
        self.colors = config["colors"]

        # Core state
        self.chunks: List[Chunk] = []
        self.glues: List[Glue] = []

        # Initialize managers
        self.ui_manager = UIManager(config, screen, font)
        self.audio_manager = AudioManager(config)
        self.boundary_manager = BoundaryManager(config, space, self.width, self.height)
        self.worm_manager = WormManager(config)
        self.export_manager = ExportManager(config, self.width, self.height)
        self.queue_manager = QueueManager(config, space, self.width, self.height)

        # Connect queue manager to chunks list and batch completion callback
        self.queue_manager.set_chunks_list(self.chunks)
        self.queue_manager.set_batch_complete_callback(self._on_batch_complete)

    # ----------------------------------------------------------------
    # Properties (externally-used only)
    # ----------------------------------------------------------------
    @property
    def torus_world(self) -> bool:
        return self.boundary_manager.torus_world

    @torus_world.setter
    def torus_world(self, value: bool) -> None:
        self.boundary_manager.torus_world = value

    # ----------------------------------------------------------------
    # Delegation methods
    # ----------------------------------------------------------------
    def handle_audio_hover(self, mouse_pos) -> None:
        """Handle proximity-based audio playback."""
        self.audio_manager.handle_audio_hover(mouse_pos, self.chunks)

    def cleanup_finished_audio(self) -> None:
        """Clean up finished audio channels."""
        self.audio_manager.cleanup_finished_audio()

    def clear_boundaries(self) -> None:
        """Remove existing boundary walls."""
        self.boundary_manager.clear_boundaries()

    def _create_boundaries(self) -> None:
        """Create boundaries based on configuration."""
        self.boundary_manager._create_boundaries()

    def toggle_history_panel(self) -> None:
        """Toggle history panel visibility."""
        self.worm_manager.toggle_history_panel()

    def on_upload_received(self, image_bytes: bytes, target_width: int = None, target_height: int = None) -> None:
        """Handle incoming image upload (from HTTP server)."""
        self.queue_manager.on_upload_received(image_bytes, target_width, target_height)

    def process_pending_uploads(self, max_items: int = None) -> None:
        """Process pending uploads from HTTP queue."""
        if max_items is None:
            max_items = self.config.get("queue", {}).get("max_upload_drain", 4)
        self.queue_manager._process_pending_uploads(max_items)

    def receive_chunks(self, max_items: int = None) -> None:
        """Receive processed chunks from background."""
        if max_items is None:
            max_items = self.config.get("queue", {}).get("max_chunk_drain", 15)
        self.queue_manager.receive_chunks(max_items)

    def cleanup(self) -> None:
        """Clean up resources before shutdown."""
        self.queue_manager.cleanup()
        self.audio_manager.stop_all()

    # ----------------------------------------------------------------
    # Callback for batch completion
    # ----------------------------------------------------------------
    def _on_batch_complete(self, upload_type: str) -> None:
        """Called when a processing batch completes."""
        _logger.info("Spawning worms for %s upload", upload_type)
        self.worm_manager.spawn_worms_for_upload(upload_type, len(self.chunks))

    # ----------------------------------------------------------------
    # UI methods
    # ----------------------------------------------------------------
    def draw_ui(self) -> None:
        """Draw the UI bar, buttons, and debug status."""
        if not self.ui_enabled:
            return
        self.ui_manager.draw_ui(
            self.debug_mode,
            self.boundary_manager.torus_world,
            self.worm_manager.history_panel_enabled,
            self.glue_visuals_enabled,
            self.ui_enabled,
            len(self.chunks),
        )

    def handle_button_click(self, mouse_pos) -> None:
        """Handle button clicks based on mouse position."""
        if not self.ui_enabled:
            return
        button = self.ui_manager.handle_click(mouse_pos)
        if button == "upload_image":
            self.upload_image()
        elif button == "upload_sound":
            self.upload_sound()
        elif button == "clear":
            self.clear_chunks()
        elif button == "export":
            self.export_glues()
        elif button == "quit":
            quit_program()

    # ----------------------------------------------------------------
    # Upload methods
    # ----------------------------------------------------------------
    def upload_image(self) -> None:
        """Let the user pick an image and submit for processing."""
        image = pick_image_file()
        if image:
            self.queue_manager.submit_image(image, None, None)

    def upload_sound(self) -> None:
        """Let the user pick an audio file and submit for processing."""
        file_path = filedialog.askopenfilename(
            title="Select an audio file",
            filetypes=[
                ("Audio files", ("*.wav", "*.mp3", "*.flac", "*.ogg", "*.m4a")),
                ("All files", ("*.*",)),
            ],
        )
        if file_path and os.path.exists(file_path):
            try:
                self.queue_manager.submit_audio(file_path)
            except Exception as e:
                _logger.warning("Failed to submit audio: %s", e)

    def submit_image(self, image: pygame.Surface, target_width: int = None, target_height: int = None) -> None:
        """Submit an image for background processing."""
        self.queue_manager.submit_image(image, target_width, target_height)

    def submit_audio(self, audio_path: str) -> None:
        """Submit an audio file for background processing."""
        self.queue_manager.submit_audio(audio_path)

    # ----------------------------------------------------------------
    # Core update methods
    # ----------------------------------------------------------------
    def update_chunks(self) -> None:
        """Update (draw) all chunks in the simulation and process worm behavior."""
        # Check if we need to spawn a new worm after export
        self.worm_manager.check_worm_completion()

        # Apply torus wrapping if enabled
        if self.boundary_manager.torus_world:
            self.boundary_manager.handle_torus_wrapping()

        # Draw non-glued chunks
        glued_chunk_ids = self.get_all_glued_chunk_ids()
        for chunk in self.chunks:
            if id(chunk) not in glued_chunk_ids:
                volume = self.audio_manager.get_volume(chunk)
                chunk.draw(self.screen, debug_mode=self.debug_mode, torus_world=self.boundary_manager.torus_world, volume=volume)

        # Draw glued chunks and glue visuals
        self._draw_glued_chunks(glued_chunk_ids)

        # Update worm + glues (delegated to WormManager)
        available_chunks = self.get_available_chunks(glued_chunk_ids)
        self.worm_manager.update_worm_and_glues(
            self.glues,
            available_chunks,
            self.space,
            self.chunks,
            self.glue_visuals_enabled,
            self.screen
        )

        # Auto-export check (delegated to WormManager)
        expired_glues, schedule_worms = self.worm_manager.get_glues_for_auto_export(
            self.glues,
            len(self.chunks)
        )
        if expired_glues:
            self._do_export(expired_glues, schedule_worms)

        # Draw worm history panels
        self._draw_history_panels()

    def _draw_glued_chunks(self, glued_chunk_ids: Set[int]) -> None:
        """Draw glued chunks and glue visuals."""
        if self.glue_visuals_enabled:
            for glue in self.glues:
                for glued_chunk in glue.glued_chunks:
                    volume = self.audio_manager.get_volume(glued_chunk.chunk)
                    glued_chunk.draw(self.screen, debug_mode=self.debug_mode, torus_world=self.boundary_manager.torus_world, volume=volume)
            for glue in self.glues:
                glue.draw(self.screen)
        else:
            # Draw glued chunks without tint
            for glue in self.glues:
                for glued_chunk in glue.glued_chunks:
                    volume = self.audio_manager.get_volume(glued_chunk.chunk)
                    glued_chunk.chunk.draw(self.screen, debug_mode=self.debug_mode, torus_world=self.boundary_manager.torus_world, volume=volume)

    def _draw_history_panels(self) -> None:
        """Draw worm history panels."""
        panel_spacing = 20
        x_cursor = 0
        for worm in self.worm_manager.worms:
            if worm and worm.panel_enabled and len(worm.history) > 0:
                worm.draw(self.screen, x_offset=x_cursor)
                try:
                    x_cursor += worm.get_panel_width() + panel_spacing
                except Exception:
                    x_cursor += worm.panel_width + panel_spacing

    # ----------------------------------------------------------------
    # Chunk availability methods
    # ----------------------------------------------------------------
    def get_all_glued_chunk_ids(self) -> Set[int]:
        """Get the IDs of all chunks that are already glued by any glue."""
        glued_chunk_ids = set()

        for glue in self.glues:
            glued_chunk_ids.update(id(glued.chunk) for glued in glue.glued_chunks)

        worm = self.worm_manager.current_worm
        if worm and worm.is_dead and worm.glue and worm.glue not in self.glues:
            glued_chunk_ids.update(id(glued.chunk) for glued in worm.glue.glued_chunks)

        return glued_chunk_ids

    def get_available_chunks(self, glued_chunk_ids: Set[int]) -> List[Chunk]:
        """Get chunks available for worm/glue interaction (not already glued)."""
        return [chunk for chunk in self.chunks if id(chunk) not in glued_chunk_ids]

    def get_chunks_at_mouse(self, mouse_pos) -> List[Chunk]:
        """Find ALL chunks under the mouse cursor."""
        point_queries = self.space.point_query(mouse_pos, 0, pymunk.ShapeFilter())
        found_chunks = []
        if point_queries:
            for point_query in point_queries:
                if point_query.shape:
                    for chunk in self.chunks:
                        if chunk.shape == point_query.shape:
                            found_chunks.append(chunk)
                            break
        return found_chunks

    # ----------------------------------------------------------------
    # Export methods
    # ----------------------------------------------------------------
    def export_glues(self, glues: Optional[List[Glue]] = None, schedule_worms: bool = True) -> None:
        """Export glues to files."""
        glues_to_export = list(glues) if glues else list(self.glues)
        worm = self.worm_manager.current_worm
        if worm and worm.is_dead and worm.glue and worm.glue not in glues_to_export:
            glues_to_export.append(worm.glue)

        self._do_export(glues_to_export, schedule_worms)

    def _do_export(self, glues_to_export: List[Glue], schedule_worms: bool) -> None:
        """Perform the actual export."""
        def on_export_complete(count: int) -> None:
            if schedule_worms and count > 0:
                self.worm_manager.schedule_worms(count)

        # Pass the ACTUAL glues list so export_manager can modify it
        count = self.export_manager.export_glues(
            glues=glues_to_export,
            glues_list=self.glues,  # Pass reference to main list
            worm=self.worm_manager.current_worm,
            worms=self.worm_manager.worms,
            space=self.space,
            chunks=self.chunks,
            on_complete=on_export_complete
        )

    # ----------------------------------------------------------------
    # Clear methods
    # ----------------------------------------------------------------
    def clear_chunks(self) -> None:
        """Remove all chunks from the simulation and reset worms and glues."""
        for chunk in self.chunks:
            self.space.remove(chunk.shape, chunk.body)
        _logger.info("Removed %d chunks from the simulation", len(self.chunks))
        self.chunks.clear()
        self.worm_manager.clear()
        self.glues.clear()
