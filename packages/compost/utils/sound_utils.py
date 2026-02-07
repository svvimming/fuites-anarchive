"""Audio feature extraction and segmentation utilities."""
import os
import time
import colorsys
import warnings
from typing import List, Dict, Any, Tuple, Optional

import numpy as np
import librosa
import soundfile as sf
import matplotlib.pyplot as plt
from matplotlib.patches import Wedge
from skimage.segmentation import felzenszwalb, mark_boundaries
from skimage.util import img_as_ubyte

from utils.logging_utils import get_logger

warnings.filterwarnings("ignore", message=r"n_fft=\d+ is too large for input signal")

_logger = get_logger(__name__)

# -----------------------------------------------------------------------------
# Volume Calculation Functions
# -----------------------------------------------------------------------------

def inverse_square_volume(distance: float, reference: float, epsilon: float = 1.0) -> float:
    """Calculate volume using inverse square law."""
    return min(1.0, (reference ** 2) / (distance ** 2 + epsilon))


# -----------------------------------------------------------------------------
# Feature Estimation Functions
# -----------------------------------------------------------------------------

def estimate_key_hue(y_sig: np.ndarray, sr: int) -> float:
    """
    Estimate musical key and map to hue (0-1) using circle of fifths.

    Args:
        y_sig: Audio signal as numpy array
        sr: Sample rate

    Returns:
        Hue value in range [0, 1]
    """
    circle_order = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]
    C = librosa.feature.chroma_cqt(y=y_sig, sr=sr)
    chroma = np.mean(C, axis=1)
    pitch_names = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"]

    # Krumhansl-Schmuckler key profiles
    major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

    best_key = 0
    best_mode = "major"
    best_score = -1

    for key in range(12):
        for profile, mode in [(major_profile, "major"), (minor_profile, "minor")]:
            rotated = np.roll(profile, key)
            score = np.corrcoef(chroma, rotated)[0, 1]
            if score > best_score:
                best_score = score
                best_key = key
                best_mode = mode

    _logger.debug("Key: %s %s", pitch_names[best_key], best_mode)

    circle_pos = circle_order.index(best_key)
    return circle_pos / 12.0


def estimate_saturation(y_sig: np.ndarray, flatness_floor: float = 1e-9) -> float:
    """
    Estimate saturation from spectral flatness.
    Pure tones = high saturation, noise = low saturation.
    Uses log scale to penalize small deviations from purity.

    Args:
        y_sig: Audio signal as numpy array
        flatness_floor: Normalization reference for log scale
            (smaller = wider dynamic range for saturation)

    Returns:
        Saturation value (log-scaled, ~0-1)
    """
    flatness = librosa.feature.spectral_flatness(y=y_sig)
    flat_med = float(np.median(flatness))
    saturation = -np.log(flat_med + 1e-15) / -np.log(float(flatness_floor))
    _logger.debug("Signal purity: %.2f", saturation)
    return float(saturation)


def estimate_value(
    y_sig: np.ndarray,
    sr: int,
    min_value: float = 0.0,
    fmin: float = 27.5,
    fmax: float = 4186.0
) -> float:
    """
    Estimate value (brightness) from spectral centroid.
    Brighter timbre = higher value.

    Args:
        y_sig: Audio signal as numpy array
        sr: Sample rate
        min_value: Minimum value to return
        fmin: Minimum frequency in Hz
        fmax: Maximum frequency in Hz

    Returns:
        Value in range [min_value, 1.0]
    """
    centroid = librosa.feature.spectral_centroid(y=y_sig, sr=sr)
    centroid_med = float(np.median(centroid))

    _logger.debug("Centroid: %.2f Hz", centroid_med)

    centroid_clamped = np.clip(centroid_med, fmin, fmax)
    v = (np.log2(centroid_clamped) - np.log2(fmin)) / (np.log2(fmax) - np.log2(fmin))
    return float(min_value + (1.0 - min_value) * v)

def chroma_to_hue_key_blend_with_magnitude(y_sig: np.ndarray, sr: int) -> Tuple[float, float]:
    """
    Weighted circular mean of all 24 keys → hue and magnitude.

    Uses Krumhansl-Schmuckler key profiles with Euclidean distance
    and softmax weighting with dynamic temperature.

    All 24 keys (12 major + 12 minor) are weighted individually, but
    relative major/minor pairs share the same hue (e.g., C Major and
    A minor both map to the C position on circle of fifths).

    Magnitude indicates key confidence/certainty:
    - 1.0 = single key dominates (high certainty)
    - 0.0 = keys cancel out (low certainty, ambiguous)

    Args:
        y_sig: Audio signal
        sr: Sample rate

    Returns:
        (hue, magnitude) tuple, both in [0, 1]
    """
    circle_order = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]

    C = librosa.feature.chroma_cqt(y=y_sig, sr=sr)
    chroma = np.mean(C, axis=1)

    # Normalize chroma to sum to 1 (L1 norm)
    chroma_norm = chroma / (chroma.sum() + 1e-12)

    # Krumhansl-Schmuckler key profiles (normalize to sum to 1)
    major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
    major_profile = major_profile / major_profile.sum()
    minor_profile = minor_profile / minor_profile.sum()

    # Compute Euclidean distance to all 24 keys (12 major + 12 minor)
    # Each key gets its own weight, but relative major/minor pairs share the same hue
    # Minor key tonic + 3 semitones = relative major tonic (e.g., Am → C, Em → G)
    key_distances_24 = np.zeros(24)  # [0-11]: major keys, [12-23]: minor keys
    key_angles_24 = np.zeros(24)

    for tonic in range(12):
        major_rotated = np.roll(major_profile, tonic)
        minor_rotated = np.roll(minor_profile, tonic)

        # Distance for major key with this tonic
        key_distances_24[tonic] = np.linalg.norm(chroma_norm - major_rotated, 2)
        # Major key hue: based on tonic position in circle of fifths
        key_angles_24[tonic] = circle_order.index(tonic) * 2 * np.pi / 12

        # Distance for minor key with this tonic
        key_distances_24[12 + tonic] = np.linalg.norm(chroma_norm - minor_rotated, 2)
        # Minor key hue: same as its relative major (tonic + 3 semitones)
        relative_major_tonic = (tonic + 3) % 12
        key_angles_24[12 + tonic] = circle_order.index(relative_major_tonic) * 2 * np.pi / 12

    # Softmax with dynamic temperature over all 24 keys
    spread_dist = np.std(key_distances_24)
    temperature = np.clip(0.0004 / (spread_dist + 0.000001), 0.01, 0.5)
    exp_neg_dist = np.exp(-key_distances_24 / temperature)
    key_weights_24 = exp_neg_dist / exp_neg_dist.sum()

    # Weighted circular mean over all 24 keys
    x = np.sum(key_weights_24 * np.cos(key_angles_24))
    y = np.sum(key_weights_24 * np.sin(key_angles_24))
    hue = (np.arctan2(y, x) / (2 * np.pi)) % 1.0
    magnitude = float(np.sqrt(x**2 + y**2))

    return float(hue), magnitude


def estimate_alpha(
    y_sig: np.ndarray,
    min_alpha: float = 0.1,
    min_db: float = -70.0,
    max_db: float = -14.0
) -> float:
    """
    Map signal loudness (in dBFS) to alpha in [min_alpha, 1.0].

    Args:
        y_sig: Audio signal as numpy array
        min_alpha: Minimum alpha value
        min_db: dBFS that maps to min_alpha
        max_db: dBFS that maps to 1.0

    Returns:
        Alpha value in range [min_alpha, 1.0]
    """
    rms_frames = librosa.feature.rms(y=y_sig)
    rms_scalar = float(np.median(rms_frames))
    rms_db = 20.0 * np.log10(rms_scalar + 1e-12)

    _logger.debug("RMS dB: %.2f", rms_db)

    v = (rms_db - min_db) / (max_db - min_db)
    v = float(np.clip(v, 0.0, 1.0))
    return float(min_alpha + (1.0 - min_alpha) * v)


# -----------------------------------------------------------------------------
# Internal Helpers for Audio Segmentation
# -----------------------------------------------------------------------------

def _normalize_db(db_array: np.ndarray) -> np.ndarray:
    """Normalize dB array to [0, 1] range."""
    return (db_array - db_array.min()) / max(1e-12, (db_array.max() - db_array.min()))


def _prepare_spectrogram(
    audio_path: str,
    n_fft: int,
    hop_length: int,
    offset: Optional[float] = None,
    duration: Optional[float] = None,
    use_mel: bool = False,
    n_mels: int = 128
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, int, float, Optional[np.ndarray], Optional[np.ndarray]]:
    """
    Load audio and prepare spectrogram for segmentation.

    Args:
        audio_path: Path to audio file
        n_fft: FFT window size
        hop_length: Hop length for STFT
        offset: Start offset in seconds (None for beginning)
        duration: Duration in seconds to load (None for full file)
        use_mel: Whether to use mel spectrogram for segmentation
        n_mels: Number of mel frequency bins

    Returns:
        (y, D, S, img, sr, duration, mel_basis, M) tuple
        mel_basis and M are None when use_mel=False
    """
    if offset is not None or duration is not None:
        _logger.info("Loading audio: %s (offset=%.1fs, duration=%.1fs)",
                     audio_path, offset or 0.0, duration or -1.0)
    else:
        _logger.info("Loading audio: %s", audio_path)
    y, sr = librosa.load(audio_path, sr=None, offset=offset or 0.0, duration=duration)
    actual_duration = len(y) / sr
    _logger.info("Duration: %.2fs, Sample Rate: %dHz", actual_duration, sr)

    _logger.info("Computing STFT (n_fft=%d, hop_length=%d)", n_fft, hop_length)
    D = librosa.stft(y, n_fft=n_fft, hop_length=hop_length, window="hann", center=True)
    S = np.abs(D)
    freq_bins, time_frames = S.shape
    _logger.info("Spectrogram shape: %d freq x %d time", freq_bins, time_frames)

    mel_basis = None
    M = None

    if use_mel:
        # Compute mel spectrogram for segmentation
        _logger.info("Computing mel spectrogram (n_mels=%d)", n_mels)
        M = librosa.feature.melspectrogram(S=S, sr=sr, n_mels=n_mels)
        mel_basis = librosa.filters.mel(sr=sr, n_fft=n_fft, n_mels=n_mels)
        _logger.info("Mel spectrogram shape: %d mel x %d time", M.shape[0], M.shape[1])

        # Normalize mel spectrogram to 0-255
        M_db = librosa.power_to_db(M, ref=np.max)
        img = img_as_ubyte(_normalize_db(M_db))
    else:
        # Normalize STFT spectrogram to 0-255
        S_db = librosa.amplitude_to_db(S + 1e-12, ref=np.max)
        img = img_as_ubyte(_normalize_db(S_db))

    return y, D, S, img, sr, actual_duration, mel_basis, M


def _apply_fade(y: np.ndarray, sr: int, fade_ms: float = 100.0) -> np.ndarray:
    """Apply cosine fade in/out to avoid clicks at segment boundaries."""
    fade_samples = int(sr * fade_ms / 1000)
    fade_samples = min(fade_samples, len(y) // 4)
    if fade_samples < 2:
        return y
    fade_in = np.linspace(0, np.pi / 2, fade_samples)
    fade_out = np.linspace(np.pi / 2, 0, fade_samples)
    y[:fade_samples] *= np.sin(fade_in) ** 2
    y[-fade_samples:] *= np.sin(fade_out) ** 2
    return y


def _check_time_filter(
    chunk_mask: np.ndarray,
    min_time_seconds: float,
    sr: int,
    hop_length: int
) -> bool:
    """Check if segment passes time duration filter."""
    time_mask = np.any(chunk_mask, axis=0)
    min_time_frames = int(min_time_seconds * sr / hop_length)
    return time_mask.sum() >= min_time_frames


def _check_energy_filter(
    S: np.ndarray,
    chunk_mask: np.ndarray,
    total_energy: float,
    min_energy_ratio: float
) -> Tuple[bool, float]:
    """Check if segment passes energy filter. Returns (passed, energy_ratio)."""
    energy = float(S[chunk_mask].sum())
    energy_ratio = energy / total_energy
    return energy_ratio >= min_energy_ratio, energy_ratio


def _check_loudness_filter(y_seg: np.ndarray, min_loudness_db: float) -> Tuple[bool, float]:
    """Check if segment passes loudness filter. Returns (passed, rms_db)."""
    rms_frames = librosa.feature.rms(y=y_seg)
    rms_scalar = float(np.median(rms_frames))
    rms_db = 20.0 * np.log10(rms_scalar + 1e-12)
    return rms_db >= min_loudness_db, rms_db


def _check_tuning_filter(y_seg: np.ndarray, sr: int) -> bool:
    """Check if segment has valid pitch content for tuning estimation."""
    pitch, mag = librosa.piptrack(y=y_seg, sr=sr, threshold=0.1)
    pitch_mask = pitch > 0

    if not pitch_mask.any():
        _logger.debug("No pitch detected")
        return False

    threshold = np.median(mag[pitch_mask])
    filtered_frequencies = pitch[(mag >= threshold) & pitch_mask]
    filtered_frequencies = filtered_frequencies[filtered_frequencies > 0]

    if not np.any(filtered_frequencies):
        _logger.debug("Filtered by empty frequency set")
        return False

    return True


def _mel_mask_to_stft_mask(
    mel_mask: np.ndarray,
    mel_basis: np.ndarray,
    freq_bins: int,
    time_frames: int
) -> np.ndarray:
    """
    Map a mel-space mask back to STFT-space for audio reconstruction.

    Args:
        mel_mask: Boolean mask in mel space (n_mels, time_frames)
        mel_basis: Mel filterbank matrix (n_mels, freq_bins)
        freq_bins: Number of STFT frequency bins
        time_frames: Number of time frames

    Returns:
        Boolean mask in STFT space (freq_bins, time_frames)
    """
    n_mels = mel_mask.shape[0]
    stft_mask = np.zeros((freq_bins, time_frames), dtype=bool)

    for mel_bin in range(n_mels):
        if np.any(mel_mask[mel_bin, :]):
            # Get STFT bins that contribute to this mel bin
            stft_bins_active = mel_basis[mel_bin, :] > 0
            # Activate those STFT bins for time frames where mel bin is active
            stft_mask[stft_bins_active, :] |= mel_mask[mel_bin, :][np.newaxis, :]

    return stft_mask


def _reconstruct_segment_audio(
    D: np.ndarray,
    chunk_mask: np.ndarray,
    times: np.ndarray,
    t0: int,
    t1: int,
    sr: int,
    hop_length: int,
    original_length: int,
    mel_basis: Optional[np.ndarray] = None
) -> Optional[np.ndarray]:
    """
    Reconstruct audio for a masked segment.

    Args:
        D: Complex STFT matrix
        chunk_mask: Boolean mask (in mel or STFT space)
        times: Time array for frames
        t0, t1: Start and end frame indices
        sr: Sample rate
        hop_length: Hop length
        original_length: Original audio length in samples
        mel_basis: Mel filterbank matrix (if mask is in mel space)

    Returns:
        Normalized audio segment or None if empty
    """
    T = D.shape[1]

    # Convert mel mask to STFT mask if needed
    if mel_basis is not None:
        stft_mask = _mel_mask_to_stft_mask(chunk_mask, mel_basis, D.shape[0], D.shape[1])
    else:
        stft_mask = chunk_mask

    D_masked = D * stft_mask.astype(D.dtype)
    y_rec = librosa.istft(D_masked, hop_length=hop_length, length=original_length)

    start_samp = int(times[t0] * sr)
    end_samp = min(original_length, int(times[min(t1 + 1, T - 1)] * sr))
    y_seg = y_rec[start_samp:end_samp]

    if y_seg.size == 0:
        return None

    # Normalize only if clipping
    peak = np.max(np.abs(y_seg))
    if peak > 1.0:
        y_seg = 0.98 * y_seg / peak

    return y_seg


def _create_segmentation_visualization(
    spec_db: np.ndarray,
    img: np.ndarray,
    segments: np.ndarray,
    spec_db_norm: np.ndarray,
    output_dir: str,
    num_labels: int,
    use_mel: bool = False
) -> None:
    """Create and save segmentation visualization plots."""
    _logger.info("Creating visualizations...")

    freq_label = 'Mel Bins' if use_mel else 'Frequency Bins'
    spec_title = 'Mel Spectrogram (dB)' if use_mel else 'Spectrogram (dB)'

    _, axes = plt.subplots(2, 2, figsize=(16, 10))

    axes[0, 0].imshow(spec_db, aspect='auto', origin='lower', cmap='magma')
    axes[0, 0].set_title(f'Original {spec_title}')
    axes[0, 0].set_ylabel(freq_label)

    axes[0, 1].imshow(img, aspect='auto', origin='lower', cmap='gray')
    axes[0, 1].set_title('Normalized Image (0-255)')
    axes[0, 1].set_ylabel(freq_label)

    axes[1, 0].imshow(segments, aspect='auto', origin='lower', cmap='tab20')
    axes[1, 0].set_title(f'Felzenszwalb Segments ({num_labels} labels)')
    axes[1, 0].set_xlabel('Time Frames')
    axes[1, 0].set_ylabel(freq_label)

    boundary_img = mark_boundaries(np.dstack([spec_db_norm] * 3), segments)
    axes[1, 1].imshow(boundary_img, aspect='auto', origin='lower')
    axes[1, 1].set_title('Segmentation Boundaries')
    axes[1, 1].set_xlabel('Time Frames')

    plt.tight_layout()
    suffix = "_mel" if use_mel else ""
    viz_path = os.path.join(output_dir, f"felzenszwalb{suffix}_analysis.png")
    plt.savefig(viz_path, dpi=160, bbox_inches='tight')
    _logger.info("Saved visualization: %s", viz_path)
    plt.show()


# -----------------------------------------------------------------------------
# Main Audio Segmentation Function
# -----------------------------------------------------------------------------

def segment_spectrogram_felzenszwalb_2d(
    audio_path: str,
    output_dir: str = "chunks_detailed",
    offset: Optional[float] = None,
    duration: Optional[float] = None,
    n_fft: int = 2048,
    hop_length: int = 512,
    use_mel: bool = False,
    n_mels: int = 128,
    scale: int = 150,
    sigma: float = 3,
    min_size: int = 20,
    min_area_pixels: int = 300,
    min_time_seconds: float = 0.5,
    min_energy_ratio: float = 1e-3,
    min_loudness_db: float = -70.0,
    max_shapes: Optional[int] = None,
    file_fade_ms: float = 100.0,
    show_plots: bool = True,
) -> Tuple[List[str], List[Dict[str, Any]]]:
    """
    Segment audio using 2D Felzenszwalb algorithm on spectrogram.

    Treats audio spectrograms like images and extracts spectral "objects".

    Args:
        audio_path: Path to audio file
        output_dir: Directory for output files
        offset: Start offset in seconds (None for beginning)
        duration: Duration in seconds to process (None for full file)
        n_fft: FFT size (frequency resolution)
        hop_length: Hop size (time resolution)
        use_mel: Use mel spectrogram for segmentation (perceptual frequency scale)
        n_mels: Number of mel frequency bins (only used when use_mel=True)
        scale: Felzenszwalb scale parameter
        sigma: Felzenszwalb sigma parameter
        min_size: Felzenszwalb minimum segment size
        min_area_pixels: Minimum area in pixels
        min_time_seconds: Minimum duration in seconds
        min_energy_ratio: Minimum energy ratio
        min_loudness_db: Minimum loudness in dBFS
        max_shapes: Maximum number of shapes to extract
        file_fade_ms: Fade duration in ms baked into WAV files (for loop boundaries)
        show_plots: Whether to show visualization plots

    Returns:
        (saved_paths, kept_segments) tuple
    """
    start_time = time.time()
    os.makedirs(output_dir, exist_ok=True)

    # Prepare spectrogram
    y, D, S, img, sr, _, mel_basis, M = _prepare_spectrogram(
        audio_path, n_fft, hop_length, offset, duration,
        use_mel=use_mel, n_mels=n_mels
    )

    # Use mel or STFT spectrogram for energy calculations
    spec_for_energy = M if use_mel else S

    # Run segmentation
    _logger.info("Running Felzenszwalb (scale=%d, sigma=%d, min_size=%d)", scale, sigma, min_size)
    segments = felzenszwalb(img, scale=scale, sigma=sigma, min_size=min_size, channel_axis=None)
    unique_labels = np.unique(segments)
    _logger.info("Found %d initial segments", len(unique_labels))

    # Prepare for filtering
    total_energy = float(spec_for_energy.sum()) + 1e-12
    T = spec_for_energy.shape[1]
    times = librosa.frames_to_time(np.arange(T), sr=sr, hop_length=hop_length)

    # Filter counters
    filter_stats = {
        'time': 0, 'time_empty': 0, 'energy': 0,
        'area': 0, 'loudness': 0, 'tuning': 0
    }

    saved_paths = []
    kept_segments = []
    shape_index = 0

    for label in unique_labels:
        chunk_mask = (segments == label)

        # Filter 1: Time span
        if not _check_time_filter(chunk_mask, min_time_seconds, sr, hop_length):
            filter_stats['time'] += 1
            continue

        # Filter 2: Energy
        passed, energy_ratio = _check_energy_filter(spec_for_energy, chunk_mask, total_energy, min_energy_ratio)
        if not passed:
            filter_stats['energy'] += 1
            continue

        # Filter 3: Area
        area = int(chunk_mask.sum())
        if area < min_area_pixels:
            filter_stats['area'] += 1
            continue

        # Calculate boundaries (in segmentation space: mel or STFT)
        time_mask = np.any(chunk_mask, axis=0)
        t0 = int(np.argmax(time_mask))
        t1 = int(len(time_mask) - np.argmax(time_mask[::-1]) - 1)
        freq_mask = np.any(chunk_mask, axis=1)
        f0 = int(np.argmax(freq_mask))
        f1 = int(len(freq_mask) - np.argmax(freq_mask[::-1]) - 1)
        time_span = times[t1] - times[t0] if t1 > t0 else 0
        freq_span = f1 - f0 + 1

        # Reconstruct audio (pass mel_basis for mel-to-STFT conversion)
        y_seg = _reconstruct_segment_audio(
            D, chunk_mask, times, t0, t1, sr, hop_length, len(y),
            mel_basis=mel_basis
        )
        if y_seg is None:
            filter_stats['time_empty'] += 1
            continue

        # Filter 4: Loudness
        passed, rms_db = _check_loudness_filter(y_seg, min_loudness_db)
        if not passed:
            filter_stats['loudness'] += 1
            continue

        # Filter 5: Tuning (pitch content)
        if not _check_tuning_filter(y_seg, sr):
            filter_stats['tuning'] += 1
            continue

        # Apply fade and save segment
        y_seg = _apply_fade(y_seg, sr, file_fade_ms)
        prefix = "felzen_mel" if use_mel else "felzen"
        freq_label = "mel" if use_mel else "f"
        filename = f"{prefix}_shape_{shape_index:03d}_t{(t1 - t0 + 1)}_{freq_label}{freq_span}.wav"
        out_path = os.path.join(output_dir, filename)
        sf.write(out_path, y_seg, sr, subtype='FLOAT')
        saved_paths.append(out_path)

        # Build segment metadata
        segment_info = {
            "idx": int(shape_index),
            "label": int(label),
            "t0_frame": int(t0),
            "t1_frame": int(t1),
            "t0_sec": float(times[t0]),
            "t1_sec": float(times[min(t1 + 1, T - 1)]),
            "time_span_sec": float(time_span),
            "energy_ratio": float(energy_ratio),
            "loudness_db": float(rms_db),
            "path": out_path,
            "use_mel": use_mel,
        }

        if use_mel:
            segment_info["mel_f0_bin"] = int(f0)
            segment_info["mel_f1_bin"] = int(f1)
            segment_info["mel_freq_span"] = int(freq_span)
        else:
            segment_info["f0_bin"] = int(f0)
            segment_info["f1_bin"] = int(f1)
            segment_info["freq_span"] = int(freq_span)

        kept_segments.append(segment_info)

        bin_label = "mel_bins" if use_mel else "bins"
        _logger.info(
            "Shape %2d: %.2fs x %3d %s, energy=%.1e, loudness=%.1f dBFS",
            shape_index, time_span, freq_span, bin_label, energy_ratio, rms_db
        )

        shape_index += 1
        if max_shapes is not None and shape_index >= max_shapes:
            break

    # Visualization
    if show_plots:
        spec_db = librosa.power_to_db(M, ref=np.max) if use_mel else librosa.amplitude_to_db(S + 1e-12, ref=np.max)
        _create_segmentation_visualization(
            spec_db, img, segments, _normalize_db(spec_db),
            output_dir, len(unique_labels), use_mel=use_mel
        )

    # Summary
    total_time = time.time() - start_time
    total_filtered = sum(filter_stats.values())

    mode_str = f"mel ({n_mels} bins)" if use_mel else "STFT"
    _logger.info("Processing time: %.2fs [%s mode]", total_time, mode_str)
    _logger.info("Total labels: %d, Kept: %d, Filtered: %d", len(unique_labels), shape_index, total_filtered)
    _logger.debug("  By time (<%ss): %d", min_time_seconds, filter_stats['time'])
    _logger.debug("  By time (empty): %d", filter_stats['time_empty'])
    _logger.debug("  By energy (<%.1e): %d", min_energy_ratio, filter_stats['energy'])
    _logger.debug("  By area (<%d px): %d", min_area_pixels, filter_stats['area'])
    _logger.debug("  By loudness (<%.1f dB): %d", min_loudness_db, filter_stats['loudness'])
    _logger.debug("  By tuning: %d", filter_stats['tuning'])

    return saved_paths, kept_segments


# -----------------------------------------------------------------------------
# Internal Helpers for 2D Path Visualization
# -----------------------------------------------------------------------------

def _build_random_2d_path(
    clip_duration_sec: float,
    points_per_second: int,
    seed: Optional[int] = None
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Build a smooth randomized 2D path over the clip timeline.

    Returns:
        (T, X, Y) arrays for time, x-coordinates, y-coordinates
    """
    rng = np.random.default_rng(seed)

    T = np.linspace(0.0, clip_duration_sec, max(3, int(np.ceil(clip_duration_sec * points_per_second))), endpoint=True)
    num_points = T.size

    if num_points < 3:
        raise RuntimeError("Not enough points to build 2D path")

    dt = clip_duration_sec / (num_points - 1)

    # Angle noise with smoothing
    ang_noise = rng.normal(loc=0.0, scale=0.03, size=num_points)
    ang_kernel_size = min(401, num_points)
    if ang_kernel_size % 2 == 0:
        ang_kernel_size -= 1
    ang_kernel = np.ones(ang_kernel_size, dtype=float) / float(ang_kernel_size)
    ang_rate = np.convolve(ang_noise, ang_kernel, mode="same")
    heading = np.cumsum(ang_rate)

    # Speed noise with smoothing
    spd_noise = rng.normal(loc=0.0, scale=0.03, size=num_points)
    spd_kernel_size = min(201, num_points)
    if spd_kernel_size % 2 == 0:
        spd_kernel_size -= 1
    spd_kernel = np.ones(spd_kernel_size, dtype=float) / float(spd_kernel_size)
    speed = 1.0 + np.convolve(spd_noise, spd_kernel, mode="same")

    vx = speed * np.cos(heading)
    vy = speed * np.sin(heading)
    X = np.cumsum(vx) * dt
    Y = np.cumsum(vy) * dt

    # Normalize to [0, 1]
    if np.max(X) > np.min(X):
        X = (X - np.min(X)) / (np.max(X) - np.min(X))
    if np.max(Y) > np.min(Y):
        Y = (Y - np.min(Y)) / (np.max(Y) - np.min(Y))

    return T, X, Y


def _extract_segment_curve(
    segment: Dict[str, Any],
    T: np.ndarray,
    X: np.ndarray,
    Y: np.ndarray,
    resampled_points: int
) -> Dict[str, Any]:
    """Extract curve data for a single segment."""
    num_points = len(T)
    t0 = float(segment["t0_sec"])
    t1 = float(segment["t1_sec"])

    start = int(np.searchsorted(T, t0, side='left'))
    end = int(np.searchsorted(T, t1, side='right'))
    end = max(start + 2, end)
    start = max(0, min(start, num_points - 2))
    end = min(end, num_points)

    t_seg = T[start:end]
    x_seg = X[start:end]
    y_seg = Y[start:end]

    # Resample to fixed length
    t_norm = (t_seg - t_seg[0]) / (t_seg[-1] - t_seg[0])
    tau = np.linspace(0.0, 1.0, resampled_points)
    x_res = np.interp(tau, t_norm, x_seg)
    y_res = np.interp(tau, t_norm, y_seg)

    return {
        "t": t_seg,
        "x": x_seg,
        "y": y_seg,
        "t_norm": tau,
        "x_resampled": x_res,
        "y_resampled": y_res,
    }


def _compute_segment_color(
    segment: Dict[str, Any],
    sound_color_cfg: Optional[Dict[str, Any]] = None
) -> Tuple[float, float, float, float]:
    """
    Compute RGBA color for a segment based on its audio features.

    Saturation is blended from two sources:
    - Spectral flatness (tonal purity): pure tones = high S
    - Key magnitude (harmonic certainty): clear key = high S

    This blend produces richer saturation that responds to both
    timbral and harmonic properties of the sound.

    Args:
        segment: Segment dictionary with "path" key
        sound_color_cfg: Optional config dict with keys:
            - saturation_flatness: {flatness_floor: float}
            - value: {min_value, fmin, fmax}
            - alpha: {min_alpha, min_db, max_db}
    """
    cfg = sound_color_cfg or {}
    sat_cfg = cfg.get("saturation_flatness", {})
    val_cfg = cfg.get("value", {})
    alpha_cfg = cfg.get("alpha", {})

    y_masked, sr_masked = sf.read(segment["path"])
    if y_masked.ndim == 2:
        y_masked = y_masked.mean(axis=1)

    # Get hue and key magnitude together
    H, key_mag = chroma_to_hue_key_blend_with_magnitude(y_masked, sr_masked)

    # Get saturation from spectral flatness
    S_flatness = estimate_saturation(y_masked, flatness_floor=sat_cfg.get("flatness_floor", 1e-9))

    # Blend saturation using harmonic mean (responds to both timbral and harmonic properties)
    S = 2 * S_flatness * key_mag / (S_flatness + key_mag + 1e-12)

    V = estimate_value(
        y_masked, sr_masked,
        min_value=val_cfg.get("min_value", 0.0),
        fmin=val_cfg.get("fmin", 27.5),
        fmax=val_cfg.get("fmax", 4186.0)
    )
    A = estimate_alpha(
        y_masked,
        min_alpha=alpha_cfg.get("min_alpha", 0.1),
        min_db=alpha_cfg.get("min_db", -70.0),
        max_db=alpha_cfg.get("max_db", -14.0)
    )

    _logger.debug("H=%.2f, S=%.2f (flat=%.2f, keymag=%.2f), V=%.2f, A=%.2f",
                  H, S, S_flatness, key_mag, V, A)

    r, g, b = colorsys.hsv_to_rgb(H, S, V)
    return (r, g, b, A)


def _draw_path_visualizations(
    X: np.ndarray,
    Y: np.ndarray,
    curve_chunks: List[Dict[str, Any]]
) -> None:
    """Draw visualization plots for the 2D path and chunks."""
    overlay_idxs = list(range(min(100, len(curve_chunks))))
    cmap = plt.get_cmap('tab20')

    colors = {}
    for i in overlay_idxs:
        col = curve_chunks[i].get("color_rgba", cmap(i % cmap.N))
        colors[i] = col

    # Figure 1: Full path with chunks
    _, ax1 = plt.subplots(1, 1, figsize=(7, 6))
    ax1.plot(X, Y, color="#333", linewidth=1.5, label="full path")
    for i in overlay_idxs:
        ax1.plot(curve_chunks[i]["x"], curve_chunks[i]["y"], linewidth=5.0, color=colors[i])
    ax1.set_title("Random 2D path with aligned time chunks (Felzenszwalb)")
    ax1.set_xlabel("x")
    ax1.set_ylabel("y")
    ax1.axis('equal')
    ax1.grid(True, alpha=0.25)
    plt.tight_layout()
    plt.show()

    # Figure 2: Individual chunks
    N = len(overlay_idxs)
    if N > 0:
        cols = 4
        rows = int(np.ceil(N / cols))
        fig2, axes2 = plt.subplots(rows, cols, figsize=(cols * 3.0, rows * 3.0))
        axes2 = np.atleast_2d(axes2).reshape(rows, cols)
        for idx in range(rows * cols):
            r = idx // cols
            c = idx % cols
            ax = axes2[r, c]
            if idx < N:
                k = overlay_idxs[idx]
                ax.plot(curve_chunks[k]["x_resampled"], curve_chunks[k]["y_resampled"],
                        color=colors[k], linewidth=5.0)
                t0 = curve_chunks[k]["t_start"]
                t1 = curve_chunks[k]["t_end"]
                ax.set_title(f"chunk {k}\n[{t0:.2f}s, {t1:.2f}s]", fontsize=8)
                ax.axis('equal')
                ax.grid(True, alpha=0.25)
            else:
                ax.axis('off')
        fig2.suptitle(f"Felzenszwalb-aligned {N} 2D chunk profiles")
        plt.tight_layout()
        plt.show()

    # Figure 3: Color wheel
    _draw_color_wheel()


def _draw_color_wheel() -> None:
    """Draw pitch-class color circle (circle of fifths)."""
    circle_order = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]
    pitch_names = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"]

    _, ax = plt.subplots(1, 1, figsize=(6, 6))
    R_outer = 1.0
    R_inner = 0.6

    for k in range(12):
        pitch = circle_order[k]
        H = k / 12.0
        r_col, g_col, b_col = colorsys.hsv_to_rgb(H, 1.0, 1.0)
        theta_center = 90.0 - k * (360.0 / 12.0)
        theta1 = theta_center - (180.0 / 12.0)
        theta2 = theta_center + (180.0 / 12.0)
        wedge = Wedge((0.0, 0.0), R_outer, theta1, theta2, width=R_outer - R_inner,
                      facecolor=(r_col, g_col, b_col), edgecolor='white')
        ax.add_patch(wedge)
        theta_mid = np.deg2rad(theta_center)
        tx = (R_outer + 0.08) * np.cos(theta_mid)
        ty = (R_outer + 0.08) * np.sin(theta_mid)
        ax.text(tx, ty, pitch_names[pitch], ha='center', va='center', fontsize=10)

    guide = Wedge((0.0, 0.0), R_outer, 0, 360, width=0.0, facecolor='none', edgecolor='#999999')
    ax.add_patch(guide)
    ax.set_xlim(-1.25, 1.25)
    ax.set_ylim(-1.25, 1.25)
    ax.set_aspect('equal')
    ax.axis('off')
    ax.set_title("Pitch-class color circle (circle of fifths order)")
    plt.tight_layout()
    plt.show()


# -----------------------------------------------------------------------------
# Main 2D Path Visualization Function
# -----------------------------------------------------------------------------

def create_2d_path_visualization(
    kept_segments: List[Dict[str, Any]],
    song_path: str,
    points_per_second: int = 100,
    resampled_points_per_chunk: int = 128,
    show_plots: bool = True,
    sound_color_cfg: Optional[Dict[str, Any]] = None
) -> Tuple[np.ndarray, np.ndarray, List[Dict[str, Any]], np.ndarray]:
    """
    Create a random 2D path over the clip timeline and align chunks.

    Args:
        kept_segments: List of segment dictionaries from segment_spectrogram_felzenszwalb_2d
        song_path: Path to the audio file
        points_per_second: Resolution of the path
        resampled_points_per_chunk: Number of points per chunk after resampling
        show_plots: Whether to display visualization plots
        sound_color_cfg: Optional config dict for color computation (passed to _compute_segment_color)

    Returns:
        (X, Y, curve_chunks_2d, curve_profiles_2d) tuple
    """
    clip_duration_sec = librosa.get_duration(path=song_path)
    T, X, Y = _build_random_2d_path(clip_duration_sec, points_per_second)

    curve_chunks_2d = []
    curve_profiles_2d = []

    for seg in kept_segments:
        _logger.debug("Processing chunk %d...", seg['idx'])

        # Extract curve
        curve_data = _extract_segment_curve(seg, T, X, Y, resampled_points_per_chunk)

        # Compute color
        rgba = _compute_segment_color(seg, sound_color_cfg)

        curve_chunks_2d.append({
            "idx": int(seg["idx"]),
            "t_start": float(seg["t0_sec"]),
            "t_end": float(seg["t1_sec"]),
            "t": curve_data["t"],
            "x": curve_data["x"],
            "y": curve_data["y"],
            "t_norm": curve_data["t_norm"],
            "x_resampled": curve_data["x_resampled"],
            "y_resampled": curve_data["y_resampled"],
            "color_rgba": rgba,
        })
        curve_profiles_2d.append(np.stack([curve_data["x_resampled"], curve_data["y_resampled"]], axis=-1))

    curve_profiles_2d = np.asarray(curve_profiles_2d) if curve_profiles_2d else np.empty((0, resampled_points_per_chunk, 2))

    if show_plots:
        _draw_path_visualizations(X, Y, curve_chunks_2d)

    return X, Y, curve_chunks_2d, curve_profiles_2d
