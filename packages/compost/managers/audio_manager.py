"""Audio playback system with proximity-based volume."""
import pygame
import math
import os
from dataclasses import dataclass
from typing import Dict, Tuple, Any, List
from utils.logging_utils import get_logger
from utils.sound_utils import inverse_square_volume

_logger = get_logger(__name__)


class VolumeSmoother:
    """Pluggable volume smoothing with attack/release."""

    def __init__(self, attack: float = 0.4, release: float = 0.4):
        self.attack = attack
        self.release = release

    def smooth(self, current: float, target: float) -> float:
        factor = self.attack if target > current else self.release
        return current + (target - current) * factor


@dataclass
class ChunkAudioState:
    """Bundles playback state for a single chunk."""
    channel: pygame.mixer.Channel
    current_volume: float = 0.0
    target_volume: float = 0.0

    def update_volume(self, target: float, smoother: VolumeSmoother = None) -> None:
        self.target_volume = target
        self.current_volume = smoother.smooth(self.current_volume, target) if smoother else target
        if self.channel:
            self.channel.set_volume(self.current_volume)

    def stop(self) -> None:
        if self.channel:
            self.channel.stop()


class AudioManager:
    """Manages proximity-based audio playback for sound chunks."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the audio manager.

        Args:
            config: Global configuration dict
        """
        self.config = config
        self.active_chunks: Dict[Any, ChunkAudioState] = {}
        self.sound_cache: Dict[str, pygame.mixer.Sound] = {}
        self.smoother = self._init_smoother(config)

        self._init_mixer(config)

    def _init_smoother(self, config: Dict[str, Any]) -> VolumeSmoother:
        """Create smoother from config, or None if disabled."""
        cfg = config.get("sound", {}).get("hover", {}).get("volume_smoother", {})
        if not cfg.get("enabled", False):
            return None
        return VolumeSmoother(cfg.get("attack", 0.4), cfg.get("release", 0.4))

    def _init_mixer(self, config: Dict[str, Any]) -> None:
        """Initialize pygame mixer."""
        mixer_cfg = config.get("sound", {}).get("hover", {}).get("mixer", {})
        try:
            pygame.mixer.init(
                frequency=mixer_cfg.get("frequency", 22050),
                size=mixer_cfg.get("size", -16),
                channels=mixer_cfg.get("channels", 2),
                buffer=mixer_cfg.get("buffer", 2048)
            )
            max_channels = mixer_cfg.get("max_channels", 256)
            pygame.mixer.set_num_channels(max_channels)
            _logger.info("Audio mixer initialized (%d channels)", max_channels)
        except pygame.error as e:
            _logger.warning("Failed to initialize audio mixer: %s", e)

    def _get_sound(self, path: str) -> pygame.mixer.Sound:
        """Get or create cached Sound object."""
        if path not in self.sound_cache:
            self.sound_cache[path] = pygame.mixer.Sound(path)
        return self.sound_cache[path]

    def _start_chunk(self, chunk, target_volume: float) -> bool:
        """Start playing a chunk. Returns True on success."""
        try:
            sound = self._get_sound(chunk.audio_path)
            channel = sound.play(loops=-1)
            if channel:
                channel.set_volume(0.0)
                self.active_chunks[chunk] = ChunkAudioState(channel, 0.0, target_volume)
                _logger.debug("Playing: %s", os.path.basename(chunk.audio_path))
                return True
        except pygame.error as e:
            _logger.warning("Failed to play audio %s: %s", chunk.audio_path, e)
        except Exception as e:
            _logger.warning("Unexpected error playing audio %s: %s", chunk.audio_path, e)
        return False

    def _stop_chunk(self, chunk) -> None:
        """Stop a playing chunk."""
        if chunk in self.active_chunks:
            self.active_chunks[chunk].stop()
            del self.active_chunks[chunk]
            _logger.debug("Stopped: %s", os.path.basename(chunk.audio_path))

    def _distance_to_cursor(self, chunk, cursor_x: float, cursor_y: float) -> float:
        """Calculate distance from chunk center to cursor."""
        pos = chunk.body.position
        dx = cursor_x - pos.x
        dy = cursor_y - pos.y
        return math.sqrt(dx * dx + dy * dy)

    def handle_audio_hover(self, mouse_pos: Tuple[int, int], chunks: List) -> None:
        """Handle proximity-based audio playback for chunks near the cursor."""
        vol_cfg = self.config["sound"]["hover"]["volume_scaling"]
        max_distance = vol_cfg["max_distance"]
        reference = vol_cfg["reference_distance"]
        threshold = vol_cfg["min_volume_threshold"]

        cursor_x, cursor_y = mouse_pos
        should_play = set()

        for chunk in chunks:
            if not chunk.audio_path:
                continue

            distance = self._distance_to_cursor(chunk, cursor_x, cursor_y)
            if distance > max_distance:
                continue

            volume = inverse_square_volume(distance, reference)
            if volume < threshold:
                continue

            should_play.add(chunk)

            if chunk in self.active_chunks:
                self.active_chunks[chunk].update_volume(volume, self.smoother)
            else:
                self._start_chunk(chunk, volume)

        # Stop chunks no longer in range
        for chunk in list(self.active_chunks.keys()):
            if chunk not in should_play:
                self._stop_chunk(chunk)

    def cleanup_finished_audio(self) -> None:
        """Remove chunks whose channels have stopped playing."""
        finished = [c for c, state in self.active_chunks.items() if not state.channel.get_busy()]
        for chunk in finished:
            del self.active_chunks[chunk]

    def stop_all(self) -> None:
        """Stop all playing audio."""
        for state in self.active_chunks.values():
            state.stop()
        self.active_chunks.clear()

    def get_volume(self, chunk) -> float:
        """Get the current volume for a chunk."""
        state = self.active_chunks.get(chunk)
        return state.current_volume if state else 0.0
