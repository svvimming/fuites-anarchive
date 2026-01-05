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
from processors import ImageProcessor
from ui import UIManager
from utils.system_utils import quit_program


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

        # Image processor for dialog-based loading
        self.image_processor = ImageProcessor(config)

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

    def enqueue_image_bytes(self, image_bytes: bytes, target_width: int = None, target_height: int = None) -> None:
        """Enqueue raw image bytes for processing."""
        self.queue_manager.enqueue_image_bytes(image_bytes, target_width, target_height)

    def drain_upload_queue(self, max_items: int = 4) -> None:
        """Drain upload queue."""
        self.queue_manager.drain_upload_queue(max_items)

    def drain_processed_chunks(self, max_items: int = 15) -> None:
        """Drain processed chunks from worker."""
        self.queue_manager.drain_processed_chunks(max_items)

    def cleanup(self) -> None:
        """Clean up resources before shutdown."""
        self.queue_manager.cleanup()
        self.audio_manager.stop_all()

    # ----------------------------------------------------------------
    # Callback for batch completion
    # ----------------------------------------------------------------
    def _on_batch_complete(self, upload_type: str) -> None:
        """Called when a processing batch completes."""
        print(f"Spawning worms for {upload_type} upload.")
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
        """Let the user pick an image and create chunks from its segments."""
        image = self.image_processor.load_image_via_dialog()
        if image:
            self.queue_manager.process_image_surface(image, None, None)

    def upload_sound(self) -> None:
        """Let the user pick a sound file and create curve-based chunks."""
        file_path = filedialog.askopenfilename(
            title="Select an audio file",
            filetypes=[
                ("Audio files", ("*.wav", "*.mp3", "*.flac", "*.ogg", "*.m4a")),
                ("All files", ("*.*",)),
            ],
        )
        if file_path and os.path.exists(file_path):
            try:
                self.queue_manager.process_sound_file(file_path)
            except Exception as e:
                print(f"Failed to process sound: {e}")

    def process_image_surface(self, image: pygame.Surface, target_width: int = None, target_height: int = None) -> None:
        """Process a provided pygame Surface."""
        self.queue_manager.process_image_surface(image, target_width, target_height)

    def process_sound_file(self, song_path: str) -> None:
        """Process a sound file."""
        self.queue_manager.process_sound_file(song_path)

    def process_image_bytes(self, image_bytes: bytes, target_width: int = None, target_height: int = None) -> bool:
        """Load an image from raw bytes and process it."""
        return self.queue_manager.process_image_bytes(image_bytes, target_width, target_height)

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
        print(f"Removed {len(self.chunks)} chunks from the simulation.")
        self.chunks.clear()
        self.worm_manager.clear()
        self.glues.clear()
