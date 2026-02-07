"""Audio playback system with proximity-based volume using sounddevice.

Uses sounddevice (PortAudio) for output instead of pygame.mixer (SDL),
so input and output can share the same Core Audio device without conflict.
"""
import math
import os
import threading
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import sounddevice as sd
import soundfile as sf

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
    """Playback state for a single chunk."""
    audio_data: np.ndarray
    position: int = 0
    current_volume: float = 0.0
    previous_volume: float = 0.0
    target_volume: float = 0.0
    looping: bool = True
    fading_out: bool = False

    def update_volume(self, target: float, smoother: Optional[VolumeSmoother] = None) -> None:
        self.target_volume = target
        self.previous_volume = self.current_volume
        self.current_volume = smoother.smooth(self.current_volume, target) if smoother else target


class AudioManager:
    """Manages proximity-based audio playback for sound chunks via sounddevice."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.active_chunks: Dict[Any, ChunkAudioState] = {}
        self.sound_cache: Dict[str, np.ndarray] = {}
        self._lock = threading.Lock()

        hover_cfg = config.get("sound", {}).get("hover", {})
        mixer_cfg = hover_cfg.get("mixer", {})
        self.sample_rate: int = mixer_cfg.get("frequency", 48000)
        self.out_channels: int = mixer_cfg.get("channels", 2)
        self.blocksize: int = mixer_cfg.get("buffer", 512)
        self.output_device = mixer_cfg.get("device", None)
        self.loops: int = hover_cfg.get("loops", -1)
        self.smoother = self._build_smoother(hover_cfg)

        self._stream: Optional[sd.OutputStream] = None
        self._start_output_stream()

    def _build_smoother(self, hover_cfg: Dict[str, Any]) -> Optional[VolumeSmoother]:
        """Create a VolumeSmoother from hover config, or None if disabled."""
        cfg = hover_cfg.get("volume_smoother", {})
        if not cfg.get("enabled", False):
            return None
        return VolumeSmoother(cfg.get("attack", 0.4), cfg.get("release", 0.4))

    def _start_output_stream(self) -> None:
        """Open a sounddevice OutputStream for playback."""
        try:
            self._stream = sd.OutputStream(
                samplerate=self.sample_rate,
                channels=self.out_channels,
                device=self.output_device,
                callback=self._audio_callback,
                blocksize=self.blocksize,
                dtype="float32",
            )
            self._stream.start()
            _logger.info(
                "Audio output stream started (device=%s, rate=%d, ch=%d, block=%d)",
                self.output_device, self.sample_rate, self.out_channels, self.blocksize,
            )
        except Exception as e:
            _logger.warning("Failed to start audio output stream: %s", e)

    def _audio_callback(self, outdata: np.ndarray, frames: int, time_info, status) -> None:
        """Mix all active sounds into the output buffer (runs on audio thread)."""
        if status:
            _logger.debug("Output status: %s", status)
        outdata[:] = 0.0
        with self._lock:
            finished = []
            for chunk, state in self.active_chunks.items():
                vol = state.current_volume
                prev_vol = state.previous_volume
                if vol <= 0 and prev_vol <= 0:
                    if state.fading_out:
                        finished.append(chunk)
                    continue
                data = state.audio_data
                data_len = len(data)
                if data_len == 0:
                    finished.append(chunk)
                    continue
                # Build per-sample volume ramp to avoid clicks
                ramp = np.linspace(prev_vol, vol, frames, dtype=np.float32)
                if data.ndim == 2:
                    ramp_shaped = ramp[:, np.newaxis]
                else:
                    ramp_shaped = ramp
                pos = state.position
                written = 0
                while written < frames:
                    to_copy = min(frames - written, data_len - pos)
                    outdata[written:written + to_copy] += data[pos:pos + to_copy] * ramp_shaped[written:written + to_copy]
                    pos += to_copy
                    written += to_copy
                    if pos >= data_len:
                        if state.looping:
                            pos = 0
                        else:
                            finished.append(chunk)
                            break
                state.position = pos
                state.previous_volume = vol
            for chunk in finished:
                del self.active_chunks[chunk]

    def _load_sound(self, path: str) -> np.ndarray:
        """Load and cache audio as float32 array matching the output format."""
        if path in self.sound_cache:
            return self.sound_cache[path]

        data, file_sr = sf.read(path, dtype="float32")

        if file_sr != self.sample_rate:
            import librosa
            if data.ndim == 1:
                data = librosa.resample(data, orig_sr=file_sr, target_sr=self.sample_rate)
            else:
                data = librosa.resample(data.T, orig_sr=file_sr, target_sr=self.sample_rate).T

        # Ensure 2D shape (samples, channels) before adjusting channel count
        if data.ndim == 1:
            data = np.stack([data] * self.out_channels, axis=-1)
        elif data.shape[1] < self.out_channels:
            pad = self.out_channels - data.shape[1]
            data = np.concatenate([data] + [data[:, -1:]] * pad, axis=1)
        elif data.shape[1] > self.out_channels:
            data = data[:, :self.out_channels]

        self.sound_cache[path] = np.ascontiguousarray(data, dtype=np.float32)
        return self.sound_cache[path]

    def _start_chunk(self, chunk, target_volume: float) -> bool:
        """Start playing a chunk. Returns True on success."""
        try:
            audio_data = self._load_sound(chunk.audio_path)
            with self._lock:
                self.active_chunks[chunk] = ChunkAudioState(
                    audio_data=audio_data,
                    position=0,
                    current_volume=0.0,
                    target_volume=target_volume,
                    looping=self.loops != 0,
                )
            _logger.debug("Playing: %s", os.path.basename(chunk.audio_path))
            return True
        except Exception as e:
            _logger.warning("Failed to play audio %s: %s", chunk.audio_path, e)
            return False

    def _stop_chunk(self, chunk) -> None:
        """Mark a chunk for fade-out (removed by callback after ramp to zero)."""
        with self._lock:
            state = self.active_chunks.get(chunk)
            if state and not state.fading_out:
                state.fading_out = True
                state.previous_volume = state.current_volume
                state.current_volume = 0.0
                _logger.debug("Fading out: %s", os.path.basename(chunk.audio_path))

    def handle_audio_hover(self, mouse_pos: Tuple[int, int], chunks: List) -> None:
        """Handle proximity-based audio playback for chunks near the cursor."""
        vol_cfg = self.config["sound"]["hover"]["volume_scaling"]
        max_distance = vol_cfg["max_distance"]
        reference = vol_cfg["reference_distance"]
        threshold = vol_cfg["min_volume_threshold"]

        cursor_x, cursor_y = mouse_pos
        should_play: set = set()

        for chunk in chunks:
            if not chunk.audio_path:
                continue

            pos = chunk.body.position
            dx = cursor_x - pos.x
            dy = cursor_y - pos.y
            distance = math.sqrt(dx * dx + dy * dy)
            if distance > max_distance:
                continue

            volume = inverse_square_volume(distance, reference)
            if volume < threshold:
                continue

            should_play.add(chunk)

            # Update volume or start playback under a single lock acquisition
            # to avoid a race between the check and the start.
            with self._lock:
                if chunk in self.active_chunks:
                    self.active_chunks[chunk].update_volume(volume, self.smoother)
                    continue
            self._start_chunk(chunk, volume)

        # Stop chunks no longer in range
        with self._lock:
            out_of_range = [c for c in self.active_chunks if c not in should_play]
        for chunk in out_of_range:
            self._stop_chunk(chunk)

    def cleanup_finished_audio(self) -> None:
        """Remove non-looping chunks that have finished playing.

        The audio callback already cleans up finished chunks during mixing,
        so this method is only needed for explicit housekeeping between frames.
        """
        with self._lock:
            finished = [
                c for c, state in self.active_chunks.items()
                if state.position >= len(state.audio_data) and not state.looping
            ]
            for chunk in finished:
                del self.active_chunks[chunk]

    def evict_cache(self, active_paths: set) -> None:
        """Remove cached audio for files no longer in the simulation."""
        stale = [p for p in self.sound_cache if p not in active_paths]
        for p in stale:
            del self.sound_cache[p]
        if stale:
            _logger.info("Evicted %d cached audio files", len(stale))

    def stop_all(self) -> None:
        """Stop all playing audio."""
        with self._lock:
            self.active_chunks.clear()
            self.sound_cache.clear()

    def get_volume(self, chunk) -> float:
        """Get the current volume for a chunk."""
        with self._lock:
            state = self.active_chunks.get(chunk)
        return state.current_volume if state else 0.0

    def cleanup(self) -> None:
        """Stop the output stream and release resources."""
        self.stop_all()
        if self._stream:
            try:
                self._stream.stop()
                self._stream.close()
            except Exception as e:
                _logger.warning("Error closing output stream: %s", e)
            self._stream = None
