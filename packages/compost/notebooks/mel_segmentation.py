#!/usr/bin/env python3
"""
MEL Spectrogram Audio Segmentation Pipeline

Segments audio using Felzenszwalb 2D segmentation on mel spectrograms,
extracts audio chunks, and generates visualizations.
"""

import numpy as np
import librosa
import soundfile as sf
import os
import sys
import time
import colorsys
import matplotlib.pyplot as plt
from skimage.segmentation import felzenszwalb, mark_boundaries
from skimage.util import img_as_ubyte
from matplotlib.colors import ListedColormap, hsv_to_rgb
from matplotlib.patches import Wedge

# Add parent directory for utils import
sys.path.insert(0, '..')
from utils.sound_utils import create_2d_path_visualization

# =============================================================================
# CONFIGURATION
# =============================================================================

# Input
INPUT_AUDIO_PATH = "../thingies/clips/plainte2.mp3"

# Output directory (auto-generated from input filename if None)
OUTPUT_DIR = None  # Will be set to "chunks_mel_{input_filename}"

# STFT parameters
N_FFT = 2048
HOP_LENGTH = 512

# Mel spectrogram parameters
N_MELS = 256        # Number of mel frequency bins (try 64, 128, 256)
FMIN = 0            # Minimum frequency (Hz)
FMAX = None         # Maximum frequency (Hz), None = sr/2

# Felzenszwalb segmentation parameters
SCALE = 150         # Lower = more segments
SIGMA = 1           # Lower = sharper boundaries
MIN_SIZE = 20       # Larger = fewer tiny segments

# Filtering parameters
MAX_SHAPES = 100            # Maximum number of chunks to extract (None = no limit)
MIN_AREA_PIXELS = 200       # Minimum area in pixels
MIN_TIME_SECONDS = 0.5      # Minimum duration in seconds
MIN_ENERGY_RATIO = 1e-3     # Minimum energy ratio

# Visualization parameters
POINTS_PER_SECOND = 100
RESAMPLED_POINTS_PER_CHUNK = 128

# =============================================================================
# CONSTANTS
# =============================================================================

CIRCLE_ORDER = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]
PITCH_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def hue_to_key_name(h):
    """Convert hue value to musical key name using circle of fifths."""
    idx = int(h * 12) % 12
    pitch_idx = CIRCLE_ORDER[idx]
    return PITCH_NAMES[pitch_idx]


def split_audio_felzenszwalb_2d_mel(
    audio_path,
    output_dir,
    n_fft=2048,
    hop_length=512,
    n_mels=128,
    fmin=0,
    fmax=None,
    scale=150,
    sigma=3,
    min_size=20,
    min_area_pixels=200,
    min_time_seconds=0.1,
    min_energy_ratio=1e-4,
    max_shapes=None,
):
    """
    2D Felzenszwalb audio segmentation using MEL spectrogram.

    Uses a perceptually-motivated Mel spectrogram for segmentation,
    which gives logarithmic frequency spacing (more like human hearing).

    Returns:
        saved_paths: List of paths to saved audio chunks
        kept_segments: List of segment metadata dictionaries
    """
    start_time = time.time()
    os.makedirs(output_dir, exist_ok=True)

    print(f"Loading audio: {audio_path}")
    y, sr = librosa.load(audio_path, sr=None)
    duration = len(y) / sr
    print(f"   Duration: {duration:.2f}s, Sample Rate: {sr}Hz")

    print(f"Computing STFT (n_fft={n_fft}, hop_length={hop_length})...")
    D = librosa.stft(y, n_fft=n_fft, hop_length=hop_length, window="hann", center=True)
    S = np.abs(D)
    freq_bins, time_frames = S.shape
    print(f"   STFT shape: {freq_bins} freq x {time_frames} time")

    print(f"Computing MEL spectrogram (n_mels={n_mels}, fmin={fmin}, fmax={fmax or sr/2})...")
    M = librosa.feature.melspectrogram(S=S, sr=sr, n_mels=n_mels, fmin=fmin, fmax=fmax)
    print(f"   Mel shape: {M.shape[0]} mel_bins x {M.shape[1]} time")

    mel_basis = librosa.filters.mel(sr=sr, n_fft=n_fft, n_mels=n_mels, fmin=fmin, fmax=fmax)

    # Compute mel frequencies for axis labels (Hz values for each mel bin)
    mel_freqs = librosa.mel_frequencies(n_mels=n_mels, fmin=fmin, fmax=fmax or sr / 2)

    print("Preparing image for segmentation...")
    M_db = librosa.power_to_db(M, ref=np.max)
    M_db_norm = (M_db - M_db.min()) / max(1e-12, (M_db.max() - M_db.min()))
    img = img_as_ubyte(M_db_norm)

    print(f"Running Felzenszwalb segmentation (scale={scale}, sigma={sigma}, min_size={min_size})...")
    segments = felzenszwalb(img, scale=scale, sigma=sigma, min_size=min_size)
    unique_labels = np.unique(segments)
    print(f"   Found {len(unique_labels)} initial segments")

    print("Extracting 2D shapes...")
    total_energy = float(M.sum()) + 1e-12
    T = M.shape[1]
    times = librosa.frames_to_time(np.arange(T), sr=sr, hop_length=hop_length)

    saved_paths = []
    shape_index = 0
    filtered_shapes = 0
    filtered_by_area = 0
    filtered_by_energy = 0
    filtered_by_time = 0
    filtered_by_time_empty = 0
    kept_segments = []

    for label in unique_labels:
        mel_mask = (segments == label)

        # Filter by time span
        time_mask = np.any(mel_mask, axis=0)
        min_time_frames = int(min_time_seconds * sr / hop_length)
        if time_mask.sum() < min_time_frames:
            filtered_shapes += 1
            filtered_by_time += 1
            continue

        # Filter by energy
        energy = float(M[mel_mask].sum())
        energy_ratio = energy / total_energy
        if energy_ratio < min_energy_ratio:
            filtered_shapes += 1
            filtered_by_energy += 1
            continue

        # Filter by area
        area = int(mel_mask.sum())
        if area < min_area_pixels:
            filtered_shapes += 1
            filtered_by_area += 1
            continue

        # Calculate boundaries
        t0 = int(np.argmax(time_mask))
        t1 = int(len(time_mask) - np.argmax(time_mask[::-1]) - 1)
        mel_freq_mask = np.any(mel_mask, axis=1)
        mel_f0 = int(np.argmax(mel_freq_mask))
        mel_f1 = int(len(mel_freq_mask) - np.argmax(mel_freq_mask[::-1]) - 1)

        time_span = times[t1] - times[t0] if t1 > t0 else 0
        mel_freq_span = mel_f1 - mel_f0 + 1

        # Map mel mask to STFT space
        stft_mask = np.zeros((freq_bins, time_frames), dtype=bool)
        for mel_bin in range(n_mels):
            if np.any(mel_mask[mel_bin, :]):
                stft_bins_active = mel_basis[mel_bin, :] > 0
                stft_mask[stft_bins_active, :] |= mel_mask[mel_bin, :][np.newaxis, :]

        # Reconstruct audio
        D_masked = D * stft_mask.astype(D.dtype)
        y_rec = librosa.istft(D_masked, hop_length=hop_length, length=len(y))

        start_samp = int(times[t0] * sr)
        end_samp = min(len(y), int(times[min(t1 + 1, T - 1)] * sr))
        y_seg = y_rec[start_samp:end_samp]
        if y_seg.size == 0:
            filtered_shapes += 1
            filtered_by_time_empty += 1
            continue

        # Normalize
        peak = np.max(np.abs(y_seg))
        if peak > 1.0:
            y_seg = 0.98 * y_seg / peak

        shape_index += 1
        particles_dir = os.path.join(output_dir, "particles")
        os.makedirs(particles_dir, exist_ok=True)
        filename = f"felzen_mel_particle_{shape_index:03d}_t{(t1 - t0 + 1)}_mel{mel_freq_span}.wav"
        out_path = os.path.join(particles_dir, filename)
        sf.write(out_path, y_seg, sr)
        saved_paths.append(out_path)

        kept_segments.append({
            "idx": int(shape_index - 1),
            "label": int(label),
            "t0_frame": int(t0),
            "t1_frame": int(t1),
            "t0_sec": float(times[t0]),
            "t1_sec": float(times[min(t1 + 1, T - 1)]),
            "mel_f0_bin": int(mel_f0),
            "mel_f1_bin": int(mel_f1),
            "mel_f0_hz": float(mel_freqs[mel_f0]),
            "mel_f1_hz": float(mel_freqs[mel_f1]),
            "mel_freq_span": int(mel_freq_span),
            "time_span_sec": float(time_span),
            "energy_ratio": float(energy_ratio),
            "path": out_path,
        })

        print(f"   Shape {shape_index:2d}: {time_span:.2f}s x {mel_freq_span:3d} mel_bins -> {filename}")

        if max_shapes is not None and shape_index >= max_shapes:
            break

    # Visualization
    print("Creating visualizations...")
    fig, axes = plt.subplots(2, 2, figsize=(16, 10))

    # Helper to set up proper axis labels
    def setup_spectrogram_axes(ax, show_xlabel=False):
        # X-axis: time in seconds
        n_time_ticks = 6
        time_tick_positions = np.linspace(0, time_frames - 1, n_time_ticks)
        time_tick_labels = [f"{times[int(p)]:.1f}" for p in time_tick_positions]
        ax.set_xticks(time_tick_positions)
        ax.set_xticklabels(time_tick_labels)
        if show_xlabel:
            ax.set_xlabel('Time (s)')

        # Y-axis: frequency in Hz (mel scale)
        n_freq_ticks = 6
        freq_tick_positions = np.linspace(0, n_mels - 1, n_freq_ticks)
        freq_tick_labels = [f"{mel_freqs[int(p)]:.0f}" for p in freq_tick_positions]
        ax.set_yticks(freq_tick_positions)
        ax.set_yticklabels(freq_tick_labels)
        ax.set_ylabel('Frequency (Hz)')

    axes[0, 0].imshow(M_db, aspect='auto', origin='lower', cmap='magma')
    axes[0, 0].set_title(f'Original MEL Spectrogram (dB) - {n_mels} bins')
    setup_spectrogram_axes(axes[0, 0], show_xlabel=False)

    axes[0, 1].imshow(img, aspect='auto', origin='lower', cmap='gray')
    axes[0, 1].set_title('Normalized Image (0-255)')
    setup_spectrogram_axes(axes[0, 1], show_xlabel=False)

    n_labels = len(unique_labels)
    hsv_colors = [(i / n_labels, 0.8, 0.9) for i in range(n_labels)]
    rgb_colors = [hsv_to_rgb(c) for c in hsv_colors]
    np.random.seed(11)
    np.random.shuffle(rgb_colors)
    unique_cmap = ListedColormap(rgb_colors)
    axes[1, 0].imshow(segments, aspect='auto', origin='lower', cmap=unique_cmap)
    axes[1, 0].set_title(f'Felzenszwalb Particles ({len(unique_labels)} labels)')
    setup_spectrogram_axes(axes[1, 0], show_xlabel=True)

    boundary_img = mark_boundaries(np.dstack([M_db_norm] * 3), segments)
    axes[1, 1].imshow(boundary_img, aspect='auto', origin='lower')
    axes[1, 1].set_title('Particle Boundaries')
    setup_spectrogram_axes(axes[1, 1], show_xlabel=True)

    plt.tight_layout()

    pdf_viz_path = os.path.join(output_dir, "00_felzenszwalb_mel_analysis.pdf")
    plt.savefig(pdf_viz_path, format='pdf', dpi=300, bbox_inches='tight')
    plt.close()

    # Summary
    total_time = time.time() - start_time
    print(f"\nSummary:")
    print(f"   Processing time: {total_time:.2f}s")
    print(f"   Mel bins: {n_mels} (vs {freq_bins} STFT bins)")
    print(f"   Total labels found: {len(unique_labels)}")
    print(f"   Filtered out: {filtered_shapes}")
    print(f"      - By time: {filtered_by_time}")
    print(f"      - By energy: {filtered_by_energy}")
    print(f"      - By area: {filtered_by_area}")
    print(f"   Audio chunks saved: {shape_index}")
    print(f"   Output directory: {output_dir}/")

    return saved_paths, kept_segments, segments, M_db, unique_labels, rgb_colors, mel_freqs, times


def create_colored_chunks_grid(kept_segments, segments, M_db, unique_labels, rgb_colors, output_dir):
    """Create grid visualization of chunks with segment colors."""
    label_to_color = {label: rgb_colors[i % len(rgb_colors)] for i, label in enumerate(unique_labels)}

    N = len(kept_segments)
    cols = 4
    rows = int(np.ceil(N / cols))
    fig_grid, axes_grid = plt.subplots(rows, cols, figsize=(cols * 4, rows * 4.5),
                                        subplot_kw={'aspect': 'auto'})
    axes_grid = np.atleast_2d(axes_grid).reshape(rows, cols)

    for idx in range(rows * cols):
        r, c = idx // cols, idx % cols
        ax = axes_grid[r, c]

        if idx < N:
            seg = kept_segments[idx]
            label = seg["label"]
            color = label_to_color.get(label, (1, 1, 1))

            t0, t1 = seg["t0_frame"], seg["t1_frame"]
            mel_f0, mel_f1 = seg["mel_f0_bin"], seg["mel_f1_bin"]

            chunk_mask = (segments == label)
            chunk_region = chunk_mask[mel_f0:mel_f1 + 1, t0:t1 + 1]
            chunk_height, chunk_width = chunk_region.shape

            colored_chunk = np.ones((chunk_height, chunk_width, 3))
            colored_chunk[chunk_region] = color

            ax.imshow(colored_chunk, origin='lower', interpolation='bilinear')
            ax.set_facecolor('white')

            margin = 0.05
            ax.set_xlim(-margin * chunk_width, chunk_width * (1 + margin))
            ax.set_ylim(-margin * chunk_height, chunk_height * (1 + margin))

            title = (f"#{idx} [{seg['t0_sec']:.1f}s-{seg['t1_sec']:.1f}s]\n"
                     f"Label {label}\n"
                     f"Freq: {seg['mel_f0_hz']:.0f}-{seg['mel_f1_hz']:.0f} Hz\n"
                     f"Duration={seg['time_span_sec']:.2f}s")
            ax.set_title(title, fontsize=8, linespacing=1.2)
            ax.set_xticks([])
            ax.set_yticks([])
        else:
            ax.axis('off')

    plt.tight_layout()
    fig_grid.suptitle("Sound Particles: Colored by Label", fontsize=14, y=1.002)

    pdf_path = os.path.join(output_dir, "06_felzen_mel_chunks_grid_colored.pdf")
    plt.savefig(pdf_path, format='pdf', dpi=300, bbox_inches='tight')
    print(f"Saved: {pdf_path}")
    plt.close()


def create_spectrogram_chunks_grid(kept_segments, segments, M_db, output_dir):
    """Create grid visualization of chunks with spectrogram data."""
    N = len(kept_segments)
    cols = 4
    rows = int(np.ceil(N / cols))
    fig_spec, axes_spec = plt.subplots(rows, cols, figsize=(cols * 4, rows * 4.5),
                                        subplot_kw={'aspect': 'auto'})
    axes_spec = np.atleast_2d(axes_spec).reshape(rows, cols)

    for idx in range(rows * cols):
        r, c = idx // cols, idx % cols
        ax = axes_spec[r, c]

        if idx < N:
            seg = kept_segments[idx]
            label = seg["label"]

            t0, t1 = seg["t0_frame"], seg["t1_frame"]
            mel_f0, mel_f1 = seg["mel_f0_bin"], seg["mel_f1_bin"]

            chunk_mask = (segments == label)
            chunk_region = chunk_mask[mel_f0:mel_f1 + 1, t0:t1 + 1]
            chunk_height, chunk_width = chunk_region.shape

            chunk_spec = M_db[mel_f0:mel_f1 + 1, t0:t1 + 1].copy()
            chunk_spec[~chunk_region] = M_db.min()

            ax.imshow(chunk_spec, origin='lower', cmap='magma', interpolation='bilinear')
            ax.set_facecolor('white')

            margin = 0.05
            ax.set_xlim(-margin * chunk_width, chunk_width * (1 + margin))
            ax.set_ylim(-margin * chunk_height, chunk_height * (1 + margin))

            title = (f"#{idx} [{seg['t0_sec']:.1f}s-{seg['t1_sec']:.1f}s]\n"
                     f"Label {label}\n"
                     f"Freq: {seg['mel_f0_hz']:.0f}-{seg['mel_f1_hz']:.0f} Hz\n"
                     f"Duration={seg['time_span_sec']:.2f}s")
            ax.set_title(title, fontsize=8, linespacing=1.2)
            ax.set_xticks([])
            ax.set_yticks([])
        else:
            ax.axis('off')

    plt.tight_layout()
    fig_spec.suptitle("Sound Particles: Felzenszwalb Segmentation on Spectrogram", fontsize=14, y=1.002)

    pdf_path = os.path.join(output_dir, "07_felzen_mel_chunks_grid_spectrogram.pdf")
    plt.savefig(pdf_path, format='pdf', dpi=300, bbox_inches='tight')
    print(f"Saved: {pdf_path}")
    plt.close()


def create_hsva_visualizations(kept_segments, song_path, output_dir, points_per_second, resampled_points_per_chunk):
    """Create HSVA-based path and analysis visualizations."""
    X, Y, curve_chunks_2d, curve_profiles_2d = create_2d_path_visualization(
        kept_segments,
        song_path,
        points_per_second=points_per_second,
        resampled_points_per_chunk=resampled_points_per_chunk,
        show_plots=False
    )

    for i, chunk in enumerate(curve_chunks_2d):
        seg = kept_segments[i]
        chunk["duration"] = seg["t1_sec"] - seg["t0_sec"]

    overlay_idxs = list(range(min(100, len(curve_chunks_2d))))

    # Figure 1: Full path
    fig1, ax1 = plt.subplots(1, 1, figsize=(10, 8))
    ax1.plot(X, Y, color="#333", linewidth=1.5, alpha=0.3)
    for i in overlay_idxs:
        chunk = curve_chunks_2d[i]
        ax1.plot(chunk["x"], chunk["y"], linewidth=4.0, color=chunk["color_rgba"])
    ax1.set_title("Full Sound Path Representation with HSVA-Coloured Particles")
    ax1.axis('equal')
    ax1.grid(True, alpha=0.25)
    plt.tight_layout()
    pdf_path_1 = os.path.join(output_dir, "08_mel_path_hsva_colored.pdf")
    plt.savefig(pdf_path_1, format='pdf', bbox_inches='tight', dpi=300)
    print(f"Saved: {pdf_path_1}")
    plt.close()

    # Figure 2: Circle of fifths
    fig_cof, ax_cof = plt.subplots(1, 1, figsize=(8, 8), facecolor='#FFFFFF')
    ax_cof.set_facecolor('#FFFFFF')

    R_outer, R_inner = 1.0, 0.55
    for k in range(12):
        pitch = CIRCLE_ORDER[k]
        H = k / 12.0
        r_col, g_col, b_col = colorsys.hsv_to_rgb(H, 0.85, 0.95)

        theta_center = 90.0 - k * 30.0
        theta1, theta2 = theta_center - 14.5, theta_center + 14.5

        wedge = Wedge((0, 0), R_outer, theta1, theta2, width=R_outer - R_inner,
                      facecolor=(r_col, g_col, b_col), edgecolor='#FFFFFF', linewidth=3)
        ax_cof.add_patch(wedge)

        theta_mid = np.deg2rad(theta_center)
        r_text = (R_outer + R_inner) / 2
        tx, ty = r_text * np.cos(theta_mid), r_text * np.sin(theta_mid)

        brightness = 0.299 * r_col + 0.587 * g_col + 0.114 * b_col
        text_color = '#1a1a2e' if brightness > 0.6 else 'white'

        ax_cof.text(tx, ty, PITCH_NAMES[pitch], ha='center', va='center',
                    fontsize=16, fontweight='bold', color=text_color)

    ax_cof.set_xlim(-1.15, 1.15)
    ax_cof.set_ylim(-1.15, 1.15)
    ax_cof.set_aspect('equal')
    ax_cof.axis('off')
    plt.tight_layout()
    pdf_path_2 = os.path.join(output_dir, "09_mel_circle_of_fifths.pdf")
    plt.savefig(pdf_path_2, format='pdf', bbox_inches='tight', dpi=300)
    print(f"Saved: {pdf_path_2}")
    plt.close()

    # Figure 3: Grid with HSVA labels
    N = len(overlay_idxs)
    if N > 0:
        cols = 4
        rows = int(np.ceil(N / cols))
        fig2, axes2 = plt.subplots(rows, cols, figsize=(cols * 4, rows * 4.5))
        axes2 = np.atleast_2d(axes2).reshape(rows, cols)

        for idx in range(rows * cols):
            r, c = idx // cols, idx % cols
            ax = axes2[r, c]

            if idx < N:
                k = overlay_idxs[idx]
                chunk = curve_chunks_2d[k]
                rgba = chunk["color_rgba"]
                r_val, g_val, b_val, a_val = rgba
                h, s, v = colorsys.rgb_to_hsv(r_val, g_val, b_val)
                key_name = hue_to_key_name(h)

                ax.plot(chunk["x_resampled"], chunk["y_resampled"], color=rgba, linewidth=5.0)

                title = (
                    f"#{k} [{chunk['t_start']:.1f}s-{chunk['t_end']:.1f}s]\n"
                    f"H (Key)={key_name} ({h:.2f})\n"
                    f"S (Purity)={s:.2f}\n"
                    f"V (Pitch)={v:.2f}\n"
                    f"A (Loudness)={a_val:.2f}\n"
                    f"Duration={chunk['duration']:.2f}s"
                )
                ax.set_title(title, fontsize=8, linespacing=1.2)
                ax.axis('equal')
                ax.grid(True, alpha=0.25)
                ax.set_xticks([])
                ax.set_yticks([])
            else:
                ax.axis('off')

        plt.tight_layout()
        fig2.suptitle("Sound Particles: HSVA-Coloured Particle Path Representation", fontsize=14, y=1.002)
        pdf_path_3 = os.path.join(output_dir, "10_mel_chunks_grid_hsva_labeled.pdf")
        plt.savefig(pdf_path_3, format='pdf', dpi=300, bbox_inches='tight')
        print(f"Saved: {pdf_path_3}")
        plt.close()

    # Collect HSVA data
    chunk_ids = list(range(len(curve_chunks_2d)))
    hsva_data = []
    key_names_list = []
    for chunk in curve_chunks_2d:
        r_val, g_val, b_val, a_val = chunk["color_rgba"]
        h, s, v = colorsys.rgb_to_hsv(r_val, g_val, b_val)
        hsva_data.append((h, s, v, a_val))
        key_names_list.append(hue_to_key_name(h))
    hsva_data = np.array(hsva_data)

    # Figure 4: HSVA per chunk
    fig3, axes3 = plt.subplots(4, 1, figsize=(14, 12), sharex=True)

    ax_h = axes3[0]
    for j, (h_val, key) in enumerate(zip(hsva_data[:, 0], key_names_list)):
        color = colorsys.hsv_to_rgb(h_val, 0.9, 0.9)
        ax_h.text(j, h_val, key, ha='center', va='bottom', fontsize=10, fontweight='bold', color=color)
    ax_h.set_xlim(-0.5, len(chunk_ids) - 0.5)
    ax_h.set_ylim(0, 1.1)
    ax_h.set_ylabel('H (Key)')
    ax_h.grid(True, alpha=0.25, axis='y')

    sat_colors = [colorsys.hsv_to_rgb(0.33, s, 0.8) for s in hsva_data[:, 1]]
    axes3[1].bar(chunk_ids, hsva_data[:, 1], color=sat_colors, edgecolor='white', alpha=0.9)
    axes3[1].set_ylabel('S (Purity)')
    axes3[1].set_ylim(0, 1.05)
    axes3[1].grid(True, alpha=0.25, axis='y')

    val_colors = [colorsys.hsv_to_rgb(0.6, 0.8, v) for v in hsva_data[:, 2]]
    axes3[2].bar(chunk_ids, hsva_data[:, 2], color=val_colors, edgecolor='white', alpha=0.9)
    axes3[2].set_ylabel('V (Pitch)')
    axes3[2].set_ylim(0, 1.05)
    axes3[2].grid(True, alpha=0.25, axis='y')

    alpha_colors = [(0.6, 0.3, 0.8, a) for a in hsva_data[:, 3]]
    axes3[3].bar(chunk_ids, hsva_data[:, 3], color=alpha_colors, edgecolor='white')
    axes3[3].set_ylabel('A (Loudness)')
    axes3[3].set_ylim(0, 1.05)
    axes3[3].set_xlabel('Particle Index')
    axes3[3].grid(True, alpha=0.25, axis='y')

    plt.tight_layout()
    fig3.suptitle("HSVA Qualities Per Sound Particle", fontsize=14, y=1.002)
    pdf_path_4 = os.path.join(output_dir, "11_mel_hsva_per_chunk.pdf")
    plt.savefig(pdf_path_4, format='pdf', dpi=300, bbox_inches='tight')
    print(f"Saved: {pdf_path_4}")
    plt.close()

    # Figure 5: Duration per chunk
    fig4, ax4 = plt.subplots(figsize=(14, 3))
    durations = [chunk["duration"] for chunk in curve_chunks_2d]
    max_dur = max(durations)
    dur_colors = [colorsys.hsv_to_rgb(0.47, 0.7, 0.9 - 0.6 * (d / max_dur)) for d in durations]
    ax4.bar(chunk_ids, durations, color=dur_colors, edgecolor='white', alpha=0.9)
    ax4.set_ylabel('Duration (s)')
    ax4.set_xlabel('Particle Index')
    ax4.grid(True, alpha=0.25, axis='y')
    ax4.set_title("Duration Per Sound Particle")
    plt.tight_layout()
    pdf_path_5 = os.path.join(output_dir, "12_mel_duration_per_chunk.pdf")
    plt.savefig(pdf_path_5, format='pdf', bbox_inches='tight', dpi=300)
    print(f"Saved: {pdf_path_5}")
    plt.close()

    print(f"\nMEL Summary ({len(curve_chunks_2d)} chunks):")
    print(f"   H (Key):      {np.mean(hsva_data[:, 0]):.2f}")
    print(f"   S (Purity):   {np.mean(hsva_data[:, 1]):.2f}")
    print(f"   V (Pitch):    {np.mean(hsva_data[:, 2]):.2f}")
    print(f"   A (Loudness): {np.mean(hsva_data[:, 3]):.2f}")
    print(f"   Duration:     {np.mean(durations):.2f}s total={sum(durations):.2f}s")


def main():
    """Main entry point."""
    # Determine output directory
    output_dir = OUTPUT_DIR
    if output_dir is None:
        input_name = os.path.splitext(os.path.basename(INPUT_AUDIO_PATH))[0]
        output_dir = f"chunks_mel_{input_name}"

    print("=" * 60)
    print("MEL SPECTROGRAM AUDIO SEGMENTATION")
    print("=" * 60)
    print(f"Input:  {INPUT_AUDIO_PATH}")
    print(f"Output: {output_dir}/")
    print("=" * 60)

    # Run segmentation
    _, kept_segments, segments, M_db, unique_labels, rgb_colors, _, _ = split_audio_felzenszwalb_2d_mel(
        INPUT_AUDIO_PATH,
        output_dir=output_dir,
        n_fft=N_FFT,
        hop_length=HOP_LENGTH,
        n_mels=N_MELS,
        fmin=FMIN,
        fmax=FMAX,
        scale=SCALE,
        sigma=SIGMA,
        min_size=MIN_SIZE,
        max_shapes=MAX_SHAPES,
        min_area_pixels=MIN_AREA_PIXELS,
        min_time_seconds=MIN_TIME_SECONDS,
        min_energy_ratio=MIN_ENERGY_RATIO,
    )

    if not kept_segments:
        print("No segments extracted. Exiting.")
        return

    # Create visualizations
    print("\nGenerating chunk grid visualizations...")
    create_colored_chunks_grid(kept_segments, segments, M_db, unique_labels, rgb_colors, output_dir)
    create_spectrogram_chunks_grid(kept_segments, segments, M_db, output_dir)

    print("\nGenerating HSVA visualizations...")
    create_hsva_visualizations(
        kept_segments,
        INPUT_AUDIO_PATH,
        output_dir,
        points_per_second=POINTS_PER_SECOND,
        resampled_points_per_chunk=RESAMPLED_POINTS_PER_CHUNK
    )

    print("\n" + "=" * 60)
    print("DONE")
    print(f"Output saved to: {output_dir}/")
    print("=" * 60)


if __name__ == "__main__":
    main()
