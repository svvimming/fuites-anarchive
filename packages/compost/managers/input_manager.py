"""Input recording system for audio input."""
import os
import time
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from utils.logging_utils import get_logger
from utils.system_utils import resolve_path

_logger = get_logger(__name__)


class InputManager:
    """Manages audio input recording."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the input manager.

        Args:
            config: Global configuration dict
        """
        rec_cfg = config.get("sound", {}).get("recording", {}).get("input", {})
        self.sample_rate = rec_cfg.get("sample_rate", 48000)
        self.channels = rec_cfg.get("channels", 1)
        self.input_dir = resolve_path(rec_cfg.get("input_dir", "audio_in_recs"))
        self.device = rec_cfg.get("device", None)

        self.recording = False
        self._stream = None
        self._buffer: List[np.ndarray] = []

    def toggle_recording(self) -> Tuple[bool, Optional[str]]:
        """
        Toggle audio input recording.

        Returns:
            Tuple of (is_recording, saved_path_or_none)
        """
        if not self.recording:
            return self._start_recording(), None
        else:
            return False, self._stop_recording()

    def _start_recording(self) -> bool:
        """Start recording from configured input device."""
        try:
            import sounddevice as sd
        except ImportError:
            _logger.error("sounddevice not installed - run: uv add sounddevice")
            return False

        self._buffer = []

        def callback(indata, frames, time_info, status):
            if status:
                _logger.warning("Recording status: %s", status)
            self._buffer.append(indata.copy())

        try:
            self._stream = sd.InputStream(
                samplerate=self.sample_rate,
                channels=self.channels,
                device=self.device,
                callback=callback
            )
            self._stream.start()
            self.recording = True
            _logger.info("Audio input recording started (device=%s, rate=%d)", self.device, self.sample_rate)
            return True
        except Exception as e:
            _logger.error("Failed to start audio input recording: %s", e)
            return False

    def _stop_recording(self) -> Optional[str]:
        """Stop recording and save to temp file."""
        if self._stream:
            try:
                self._stream.stop()
                self._stream.close()
            except Exception as e:
                _logger.warning("Error stopping stream: %s", e)
            self._stream = None
        self.recording = False

        if not self._buffer:
            _logger.warning("No audio input recorded")
            return None

        try:
            import soundfile as sf
        except ImportError:
            _logger.error("soundfile not installed - run: uv add soundfile")
            return None

        audio_data = np.concatenate(self._buffer, axis=0)

        timestamp = int(time.time() * 1000)
        os.makedirs(self.input_dir, exist_ok=True)
        input_path = os.path.join(self.input_dir, f"audio_in_{timestamp}.wav")

        try:
            sf.write(input_path, audio_data, self.sample_rate, subtype='FLOAT')
            _logger.info("Audio input recording saved: %s (%.1f sec)", input_path, len(audio_data) / self.sample_rate)
        except Exception as e:
            _logger.error("Failed to save audio input recording: %s", e)
            return None

        self._buffer = []
        return input_path
