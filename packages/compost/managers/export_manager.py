"""Export system for glues (images and audio)."""
import os
import pygame
import random
import math
from typing import Dict, Any, List, Optional, Callable
from utils.logging_utils import get_logger

_logger = get_logger(__name__)


class ExportManager:
    """Handles exporting glues to PNG and WAV files."""

    def __init__(self, config: Dict[str, Any], width: int, height: int):
        """
        Initialize the export manager.

        Args:
            config: Global configuration dict
            width: Screen width
            height: Screen height
        """
        self.config = config
        self.width = width
        self.height = height

        # Ensure export directory exists
        base_dir = os.path.dirname(os.path.dirname(__file__))
        self.export_dir = os.path.join(base_dir, "exports")
        os.makedirs(self.export_dir, exist_ok=True)

    def export_glues(
        self,
        glues: List,
        glues_list: List,  # Reference to simulation's main glues list
        worm: Optional[Any] = None,
        worms: Optional[List] = None,
        space: Optional[Any] = None,
        chunks: Optional[List] = None,
        on_complete: Optional[Callable[[int], None]] = None
    ) -> int:
        """
        Export each glue's glued chunks to a PNG (without glue visuals) and
        remove those glued chunks and their glue from the simulation.

        Args:
            glues: List of glues to export (will be modified)
            worm: Current worm (optional, for checking dead worm's glue)
            worms: List of all worms (for cleanup)
            space: Pymunk space for removing physics bodies
            chunks: Main chunks list for removal
            on_complete: Callback with count of exported glues

        Returns:
            Number of glues exported
        """
        # Collect glues to export
        glues_to_export: List = list(glues) if glues else []

        # Include a dead worm's glue not yet appended
        if worm and worm.is_dead and worm.glue and worm.glue not in glues_to_export:
            glues_to_export.append(worm.glue)

        if not glues_to_export:
            _logger.debug("No glues to export")
            return 0

        exported_count = 0

        for glue in glues_to_export:
            glued_chunks = glue.glued_chunks
            if not glued_chunks:
                continue

            # Build list of rotated surfaces and their destination rects (screen coords)
            rotated_surfaces = []
            for glued in glued_chunks:
                chunk = glued.chunk
                angle_degrees = math.degrees(-chunk.body.angle)
                rotated_surface = pygame.transform.rotate(chunk.segment_surface, angle_degrees)
                pos = chunk.body.position
                rect = rotated_surface.get_rect(center=(int(pos.x), int(pos.y)))
                rotated_surfaces.append((rotated_surface, rect))

            # Create a full-screen transparent surface; blitting will clip to simulation bounds
            offscreen_full = pygame.Surface((self.width, self.height), pygame.SRCALPHA)
            for rotated_surface, rect in rotated_surfaces:
                offscreen_full.blit(rotated_surface, rect)

            # Compute the tightest bounding box of visible pixels and crop
            crop_rect = offscreen_full.get_bounding_rect(min_alpha=1)
            if crop_rect.width <= 0 or crop_rect.height <= 0:
                continue
            image_to_save = offscreen_full.subsurface(crop_rect).copy()

            # Save PNG to file
            timestamp = pygame.time.get_ticks()
            rand_suffix = random.randint(0, 999999)
            filename = f"glue_{timestamp:010d}_{rand_suffix:06d}_{exported_count}.png"
            filepath = os.path.join(self.export_dir, filename)
            try:
                pygame.image.save(image_to_save, filepath)
                _logger.info("Exported glue PNG: %s", filepath)
            except Exception as exc:
                _logger.warning("Failed to export glue PNG: %s", exc)

            # Export mixed audio if there are sound chunks in this glue
            self._export_glue_audio(glued_chunks, timestamp, rand_suffix, exported_count)
            exported_count += 1

            # Remove glued chunks' bodies and shapes from space and simulation
            if space and chunks is not None:
                for glued in list(glued_chunks):
                    chunk = glued.chunk
                    self._safe_remove_from_space(space, chunk)
                    if chunk in chunks:
                        chunks.remove(chunk)

            # Clear glue contents
            glue.glued_chunks.clear()

        # Remove exported glues from simulation tracking
        for glue in glues_to_export:
            if glue in glues_list:
                glues_list.remove(glue)

        # Clear history panels only for worms whose glue was exported
        exported_histories = {
            id(glue.worm_history) for glue in glues_to_export
            if hasattr(glue, 'worm_history')
        }

        # Unlink and clear only impacted worms
        if worms:
            for w in worms:
                if not w:
                    continue
                # If this worm's glue was exported, unlink it
                if getattr(w, 'glue', None) in glues_to_export:
                    w.glue = None
                # If this worm's history fed an exported glue, clear just this worm's panel/history
                if id(getattr(w, 'history', [])) in exported_histories:
                    w.history.clear()
                    w.last_color = None

        _logger.info("Export complete: %d glue images saved", exported_count)

        if on_complete:
            on_complete(exported_count)

        return exported_count

    def _export_glue_audio(
        self,
        glued_chunks: List,
        timestamp: int,
        rand_suffix: int,
        exported_count: int
    ) -> None:
        """
        Export a mixed audio file from all sound chunks in a glue.
        Positions each audio randomly within the duration of the longest audio.

        Args:
            glued_chunks: List of GluedChunk objects
            timestamp: Timestamp for filename
            rand_suffix: Random suffix for filename
            exported_count: Export counter for filename
        """
        # Collect all audio files from chunks that have them
        audio_files = []
        for glued in glued_chunks:
            chunk = glued.chunk
            if chunk.audio_path and os.path.exists(chunk.audio_path):
                audio_files.append(chunk.audio_path)

        if not audio_files:
            return  # No audio to mix

        try:
            import librosa
            import soundfile as sf
            import numpy as np
        except ImportError:
            _logger.warning("librosa and soundfile required for audio mixing")
            return

        try:
            # Load all audio files and find the longest duration
            audio_data = []
            sample_rates = []
            max_duration = 0.0

            for audio_file in audio_files:
                y, sr = librosa.load(audio_file, sr=None)
                duration = len(y) / sr
                audio_data.append((y, sr))
                sample_rates.append(sr)
                max_duration = max(max_duration, duration)

            if max_duration == 0:
                return

            # Use the most common sample rate (or first one if tie)
            target_sr = max(set(sample_rates), key=sample_rates.count)

            # Create output buffer
            output_samples = int(max_duration * target_sr)
            mixed_audio = np.zeros(output_samples, dtype=np.float32)

            # Mix each audio at a random position within the max duration
            for i, (y, sr) in enumerate(audio_data):
                # Resample to target sample rate if needed
                if sr != target_sr:
                    y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)

                # Random start position within the available time
                audio_length = len(y)
                max_start_samples = max(0, output_samples - audio_length)
                start_sample = random.randint(0, max_start_samples) if max_start_samples > 0 else 0
                end_sample = min(start_sample + audio_length, output_samples)

                # Add to mix with overlap handling
                mix_length = end_sample - start_sample
                mixed_audio[start_sample:end_sample] += y[:mix_length]

                _logger.debug("Mixed audio %d/%d: %s at %.2fs", i+1, len(audio_data), os.path.basename(audio_files[i]), start_sample/target_sr)

            # Normalize to prevent clipping
            if np.max(np.abs(mixed_audio)) > 0:
                mixed_audio = mixed_audio / np.max(np.abs(mixed_audio)) * 0.95

            # Save mixed audio
            audio_filename = f"glue_{timestamp:010d}_{rand_suffix:06d}_{exported_count}_mixed.wav"
            audio_filepath = os.path.join(self.export_dir, audio_filename)
            sf.write(audio_filepath, mixed_audio, target_sr)
            _logger.info("Exported mixed audio: %s", audio_filepath)

        except Exception as exc:
            _logger.warning("Failed to export mixed audio: %s", exc)

    def _safe_remove_from_space(self, space: Any, chunk: Any) -> None:
        """
        Safely remove a chunk's body and shape from the physics space.

        Args:
            space: Pymunk space
            chunk: Chunk object with body and shape attributes
        """
        if chunk.shape in space.shapes or chunk.body in space.bodies:
            try:
                space.remove(chunk.shape, chunk.body)
            except Exception:
                pass
