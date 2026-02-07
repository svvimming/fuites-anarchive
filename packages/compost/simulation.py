"""Main simulation orchestrator."""
import pygame
import pymunk
from typing import List, Dict, Any, Set, Optional

from entities import Worm, Glue, Chunk
from managers import (
    AudioManager,
    BoundaryManager,
    ExportManager,
    InputManager,
    QueueManager,
    WormManager,
)
from ui import UIManager
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
        self.ui_enabled = config["simulation"]["ui"].get("enabled", True)

        # Local references
        self.width = config["simulation"]["window"]["width"]
        self.height = config["simulation"]["window"]["height"]
        self.ui_bar_height = config["simulation"]["ui"]["ui_bar_height"]
        self.colors = config["colors"]

        # Core state
        self.chunks: List[Chunk] = []
        self.glues: List[Glue] = []
        self.should_quit = False  # Signal for main loop to stop

        # Initialize managers
        self.ui_manager = UIManager(config, screen, font)
        self.audio_manager = AudioManager(config)
        self.boundary_manager = BoundaryManager(config, space, self.width, self.height)
        self.worm_manager = WormManager(config)
        self.export_manager = ExportManager(config, self.width, self.height)
        self.input_manager = InputManager(config)
        self.queue_manager = QueueManager(config, space, self.width, self.height)

        # Connect queue manager to chunks list and batch completion callback
        self.queue_manager.set_chunks_list(self.chunks)
        self.queue_manager.set_batch_complete_callback(self._on_batch_complete)

    # ----------------------------------------------------------------
    # Delegation methods
    # ----------------------------------------------------------------
    def handle_audio_hover(self, mouse_pos) -> None:
        """Handle proximity-based audio playback."""
        self.audio_manager.handle_audio_hover(mouse_pos, self.chunks)


    def toggle_torus_world(self) -> None:
        """Toggle between torus world and rigid wall boundaries."""
        self.boundary_manager.toggle_mode()

    def toggle_history_panel(self) -> None:
        """Toggle history panel visibility."""
        self.worm_manager.toggle_history_panel()

    def _toggle_audio_in_recording(self) -> None:
        """Toggle audio input recording."""
        is_recording, saved_path = self.input_manager.toggle_recording()
        if not is_recording and saved_path:
            self.submit_audio(saved_path)

    def _toggle_compost_recording(self) -> None:
        """Toggle compost output recording."""
        self.export_manager.toggle_compost_recording(self.audio_manager)

    def on_upload_received(self, image_bytes: bytes, target_width: int = None, target_height: int = None) -> None:
        """Handle incoming image upload (from HTTP server)."""
        self.queue_manager.on_upload_received(image_bytes, target_width, target_height)

    def process_pending_uploads(self, max_items: int = None) -> None:
        """Process pending uploads from HTTP queue."""
        if max_items is None:
            max_items = self.config.get("queue", {}).get("max_http_upload_drain", 4)
        self.queue_manager._process_pending_uploads(max_items)

    def receive_chunks(self) -> None:
        """Receive processed chunks from background."""
        self.queue_manager.receive_chunks()

    def cleanup(self) -> None:
        """Clean up resources before shutdown."""
        self.queue_manager.cleanup()
        self.audio_manager.cleanup()

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
            audio_in_recording=self.input_manager.recording,
            audio_out_recording=self.export_manager.compost_recording,
        )

    def handle_button_click(self, mouse_pos) -> None:
        """Handle button clicks based on mouse position."""
        if not self.ui_enabled:
            return
        button = self.ui_manager.handle_click(mouse_pos)
        if button == "upload":
            self.upload_file()
        elif button == "audio_in":
            self._toggle_audio_in_recording()
        elif button == "audio_out":
            self._toggle_compost_recording()
        elif button == "clear":
            self.clear_chunks()
        elif button == "export":
            self.export_glues()
        elif button == "quit":
            self.should_quit = True

    # ----------------------------------------------------------------
    # Upload methods
    # ----------------------------------------------------------------
    def upload_file(self) -> None:
        """Open file picker for image or audio (non-blocking)."""
        self.queue_manager.open_file_dialog()

    def process_file_dialogs(self) -> None:
        """Process completed file dialog results."""
        self.queue_manager.process_dialogs()

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

        # Apply torus wrapping (internally checks if enabled)
        self.boundary_manager.handle_torus_wrapping()

        # Cache torus_world state for this frame
        torus_world = self.boundary_manager.torus_world

        # Draw non-glued chunks
        glued_chunk_ids = self.get_all_glued_chunk_ids()
        for chunk in self.chunks:
            if id(chunk) not in glued_chunk_ids:
                volume = self.audio_manager.get_volume(chunk)
                chunk.draw(self.screen, debug_mode=self.debug_mode, torus_world=torus_world, volume=volume)

        # Draw glued chunks and glue visuals
        self._draw_glued_chunks(glued_chunk_ids, torus_world)

        # Update worm + glues (delegated to WormManager)
        available_chunks = self.get_available_chunks(glued_chunk_ids)
        self.worm_manager.update_worm_and_glues(
            self.glues,
            available_chunks,
            self.remove_chunk,
            self.glue_visuals_enabled,
            self.screen,
            torus_world
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

    def _draw_glued_chunks(self, glued_chunk_ids: Set[int], torus_world: bool) -> None:
        """Draw glued chunks and glue visuals."""
        if self.glue_visuals_enabled:
            for glue in self.glues:
                for glued_chunk in glue.glued_chunks:
                    volume = self.audio_manager.get_volume(glued_chunk.chunk)
                    glued_chunk.draw(self.screen, debug_mode=self.debug_mode, torus_world=torus_world, volume=volume)
            for glue in self.glues:
                glue.draw(self.screen)
        else:
            # Draw glued chunks without tint
            for glue in self.glues:
                for glued_chunk in glue.glued_chunks:
                    volume = self.audio_manager.get_volume(glued_chunk.chunk)
                    glued_chunk.chunk.draw(self.screen, debug_mode=self.debug_mode, torus_world=torus_world, volume=volume)

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
            glues_list=self.glues,
            worm=self.worm_manager.current_worm,
            worms=self.worm_manager.worms,
            remove_chunk=self.remove_chunk,
            on_complete=on_export_complete
        )

    # ----------------------------------------------------------------
    # Clear methods
    # ----------------------------------------------------------------
    def remove_chunk(self, chunk) -> bool:
        """Remove a single chunk from the simulation (physics, tracking, audio)."""
        try:
            if chunk.shape in self.space.shapes or chunk.body in self.space.bodies:
                self.space.remove(chunk.shape, chunk.body)
        except Exception:
            pass
        try:
            self.chunks.remove(chunk)
        except ValueError:
            return False
        self.audio_manager.on_chunk_removed(chunk)
        return True

    def clear_chunks(self) -> None:
        """Remove all chunks from the simulation and reset worms and glues."""
        for chunk in self.chunks:
            try:
                self.space.remove(chunk.shape, chunk.body)
            except Exception:
                pass
        _logger.info("Removed %d chunks from the simulation", len(self.chunks))
        self.chunks.clear()
        self.audio_manager.stop_all()
        self.worm_manager.clear()
        self.glues.clear()
