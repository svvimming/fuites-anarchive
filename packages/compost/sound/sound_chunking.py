import numpy as np
import librosa
import soundfile as sf
import os
import matplotlib.pyplot as plt
from matplotlib.patches import Wedge
from skimage.segmentation import felzenszwalb, mark_boundaries
from skimage.util import img_as_ubyte
import time
import colorsys
import warnings
warnings.filterwarnings("ignore", message=r"n_fft=\d+ is too large for input signal")

# Scriabin-inspired fixed color palette (approximate), indexed by pitch class
# 0=C, 1=C♯/D♭, 2=D, 3=D♯/E♭, 4=E, 5=F, 6=F♯/G♭, 7=G, 8=G♯/A♭, 9=A, 10=A♯/B♭, 11=B
# Colors are hand-picked to resemble common reproductions of Scriabin's scheme.
# Uncomment and use where indicated to switch from equal HSV hues to this palette.
# import matplotlib.colors as mcolors

# SCRIABIN_HEX = {
#     0:  "#ff0000",  # C – red
#     7:  "#ff7f00",  # G – orange
#     2:  "#ffff00",  # D – yellow
#     9:  "#33cc33",  # A – green
#     4:  "#c3f2ff",  # E – light blue
#     11: "#8ec9ff",  # B – blue
#     6:  "#7f8bfd",  # F# – indigo/violet-blue
#     1:  "#9000ff",  # C# – violet
#     8:  "#bb75fc",  # G# – lilac
#     3:  "#b7468b",  # D# – magenta
#     10: "#a9677c",  # A# – rose
#     5:  "#ab0034",  # F – deep red
# }
# # Convert HEX → normalized RGB (0–1 floats)
# SCRIABIN_RGB = {pc: mcolors.to_rgb(hexcode) for pc, hexcode in SCRIABIN_HEX.items()}

def split_audio_felzenszwalb_2d(
    audio_path,
    output_dir="chunks_detailed_{song_path.split('/')[-1].split('.')[0]}",
    n_fft=2048,
    hop_length=512,
    scale=150,
    sigma=3,
    min_size=20,
    min_area_pixels=300,
    min_time_seconds=0.5,
    min_energy_ratio=1e-3,
    min_loudness_db=-70.0,   # NEW loudness threshold
    max_shapes=None,
    show_plots=True,  # NEW parameter to control visualizations
):
    """
    🎨 TRUE 2D FELZENSZWALB AUDIO SEGMENTATION (no connected-components)

    This function treats audio spectrograms like images and segments them into irregular 2D shapes.
    Unlike traditional time-based chunking, this extracts spectral "objects" from music.

    HOW IT WORKS:
    1) Compute STFT (frequency × time matrix)
    2) Treat magnitude spectrogram as a grayscale image
    3) Run Felzenszwalb segmentation to get label regions
    4) For EACH LABEL (as a whole), reconstruct its audio by masking the original STFT
    5) Save each label's audio as its own file

    PARAMETERS:
    - n_fft: Frequency resolution (higher = more freq detail, less time detail)
    - hop_length: Time resolution (lower = more time detail, less freq detail)
    - scale/sigma/min_size: Felzenszwalb controls
    - min_area_pixels / min_time_seconds / min_energy_ratio: filters to skip tiny/short/quiet labels
    """
    start_time = time.time()
    os.makedirs(output_dir, exist_ok=True)

    print(f"🎵 LOADING AUDIO: {audio_path}")

    # 1) Load audio
    y, sr = librosa.load(audio_path, sr=None)
    duration = len(y) / sr
    print(f"   ⏱️  Duration: {duration:.2f}s, Sample Rate: {sr}Hz")

    # 2) Complex STFT and magnitude
    print(f"📊 COMPUTING STFT...")
    print(f"   🔧 n_fft={n_fft}, hop_length={hop_length}")
    D = librosa.stft(y, n_fft=n_fft, hop_length=hop_length, window="hann", center=True)
    S = np.abs(D)  # (freq_bins, time_frames)
    freq_bins, time_frames = S.shape
    print(f"   📏 Spectrogram shape: {freq_bins} freq × {time_frames} time")

    # 3) Log scale + normalize to 0..255 for segmentation
    print(f"🎨 PREPARING IMAGE FOR SEGMENTATION...")
    S_db = librosa.amplitude_to_db(S + 1e-12, ref=np.max)
    S_db_norm = (S_db - S_db.min()) / max(1e-12, (S_db.max() - S_db.min()))
    img = img_as_ubyte(S_db_norm)  # 2D grayscale image
    print(f"   🖼️  Image range: {img.min()}-{img.max()} (8-bit grayscale)")

    # 4) Felzenszwalb segmentation on 2D spectrogram image
    print(f"🧩 RUNNING FELZENSZWALB SEGMENTATION...")
    print(f"   ⚙️  scale={scale}, sigma={sigma}, min_size={min_size}")
    segments = felzenszwalb(img, scale=scale, sigma=sigma, min_size=min_size, channel_axis=None)
    unique_labels = np.unique(segments)
    print(f"   🎯 Found {len(unique_labels)} initial segments (labels)")

    # 5) Process each label as a single region (no CC)
    print(f"🔍 EXTRACTING 2D SHAPES (one per label)...")
    total_energy = float(S.sum()) + 1e-12
    T = S.shape[1]
    times = librosa.frames_to_time(np.arange(T), sr=sr, hop_length=hop_length)

    saved_paths = []
    shape_index = 0
    filtered_shapes = 0
    filtered_by_area = 0
    filtered_by_energy = 0
    filtered_by_time = 0
    filtered_by_time_empty = 0
    filtered_by_loudness = 0  # NEW counter
    kept_segments = []

    for _, label in enumerate(unique_labels):
        chunk_mask = (segments == label)          # use the label mask directly

        # Filter 1: Time span too short
        time_mask = np.any(chunk_mask, axis=0)
        min_time_frames = int(min_time_seconds * sr / hop_length)
        if time_mask.sum() < min_time_frames:
            filtered_shapes += 1
            filtered_by_time += 1
            continue

        # Filter 2: Energy too low
        energy = float(S[chunk_mask].sum())
        energy_ratio = energy / total_energy
        if energy_ratio < min_energy_ratio:
            filtered_shapes += 1
            filtered_by_energy += 1
            continue

        # Filter 3: Area too small  
        area = int(chunk_mask.sum())
        
        if area < min_area_pixels:
            print(f"area: {area}")
            filtered_shapes += 1
            filtered_by_area += 1
            continue
        
        # Calculate shape boundaries
        t0 = int(np.argmax(time_mask))
        t1 = int(len(time_mask) - np.argmax(time_mask[::-1]) - 1)
        freq_mask = np.any(chunk_mask, axis=1)
        f0 = int(np.argmax(freq_mask))
        f1 = int(len(freq_mask) - np.argmax(freq_mask[::-1]) - 1)

        time_span = times[t1] - times[t0] if t1 > t0 else 0
        freq_span = f1 - f0 + 1

        # 🎵 RECONSTRUCT AUDIO: Mask the complex STFT with this label region
        D_masked = D * chunk_mask.astype(D.dtype)
        y_rec = librosa.istft(D_masked, hop_length=hop_length, length=len(y))

        # Slice to the time span of this shape for a concise chunk
        start_samp = int(times[t0] * sr)
        end_samp = min(len(y), int(times[min(t1 + 1, T - 1)] * sr))
        y_seg = y_rec[start_samp:end_samp]
        if y_seg.size == 0:
            filtered_shapes += 1
            filtered_by_time_empty += 1
            continue

        # Normalize to avoid clipping
        peak = np.max(np.abs(y_seg))      
        if peak > 1.0: 
            y_seg = 0.98 * y_seg / peak
        
        # Loudness filter
        rms_frames = librosa.feature.rms(y=y_seg)
        rms_scalar = float(np.median(rms_frames))
        rms_db = 20.0 * np.log10(rms_scalar + 1e-12)
        # if rms_db < min_loudness_db:
        #     filtered_shapes += 1
        #     filtered_by_loudness += 1
        #     print("filtered by loudness")
        #     continue
        
        filename = f"felzen_shape_{shape_index:03d}_t{(t1 - t0 + 1)}_f{freq_span}.wav"
        out_path = os.path.join(output_dir, filename)
        sf.write(out_path, y_seg, sr)
        saved_paths.append(out_path)

        kept_segments.append({
            "idx": int(shape_index),
            "label": int(label),
            "t0_frame": int(t0),
            "t1_frame": int(t1),
            "t0_sec": float(times[t0]),
            "t1_sec": float(times[min(t1 + 1, T - 1)]),
            "f0_bin": int(f0),
            "f1_bin": int(f1),
            "freq_span": int(freq_span),
            "time_span_sec": float(time_span),
            "energy_ratio": float(energy_ratio),
            "loudness_db": float(rms_db),  # NEW
            "path": out_path,
        })

        print(f"   🎵 Shape {shape_index:2d}: {time_span:.2f}s × {freq_span:3d}bins, "
              f"energy={energy_ratio:.1e}, loudness={rms_db:.1f} dBFS → {filename}")

        shape_index += 1

        if max_shapes is not None and shape_index >= max_shapes:
            break

    # 6) Create and display visualization (only if show_plots is True)
    if show_plots:
        print(f"📊 CREATING VISUALIZATIONS...")

        fig, axes = plt.subplots(2, 2, figsize=(16, 10))

        # Original spectrogram
        axes[0,0].imshow(S_db, aspect='auto', origin='lower', cmap='magma')
        axes[0,0].set_title('Original Spectrogram (dB)')
        axes[0,0].set_ylabel('Frequency Bins')

        # Normalized image for segmentation
        axes[0,1].imshow(img, aspect='auto', origin='lower', cmap='gray')
        axes[0,1].set_title('Normalized Image (0-255)')
        axes[0,1].set_ylabel('Frequency Bins')

        # Segmentation labels
        axes[1,0].imshow(segments, aspect='auto', origin='lower', cmap='tab20')
        axes[1,0].set_title(f'Felzenszwalb Segments ({len(unique_labels)} labels)')
        axes[1,0].set_xlabel('Time Frames')
        axes[1,0].set_ylabel('Frequency Bins')

        # Boundaries overlay
        boundary_img = mark_boundaries(np.dstack([S_db_norm]*3), segments)
        axes[1,1].imshow(boundary_img, aspect='auto', origin='lower')
        axes[1,1].set_title('Segmentation Boundaries')
        axes[1,1].set_xlabel('Time Frames')

        plt.tight_layout()
        viz_path = os.path.join(output_dir, "felzenszwalb_analysis.png")
        plt.savefig(viz_path, dpi=160, bbox_inches='tight')
        print(f"   💾 Saved visualization: {viz_path}")
        plt.show()

    # Summary statistics
    total_time = time.time() - start_time
    print(f"\n📊 SUMMARY:")
    print(f"   ⏱️  Processing time: {total_time:.2f}s")
    print(f"   🧩 Total labels found: {len(unique_labels)}")
    print(f"   🧩 Label regions processed (kept + filtered): {shape_index + filtered_shapes}")
    print(f"   ❌ Filtered out: {filtered_shapes}")
    print(f"      └─ By time (< {min_time_seconds}s duration): {filtered_by_time}")
    print(f"      └─ By time (empty): {filtered_by_time_empty}")
    print(f"      └─ By energy (< {min_energy_ratio:.1e} ratio): {filtered_by_energy}")
    print(f"      └─ By area (< {min_area_pixels} pixels): {filtered_by_area}")
    print(f"      └─ By loudness (< {min_loudness_db:.1f} dBFS): {filtered_by_loudness}")
    print(f"   ✅ Audio chunks saved: {shape_index}")
    print(f"   📁 Output directory: {output_dir}/")
    if saved_paths:
        print(f"   🎵 Average chunk duration: {np.mean([len(sf.read(p)[0])/sr for p in saved_paths[:5]]):.2f}s")
    else:
        print(f"   🎵 Average chunk duration: n/a")

    return saved_paths, kept_segments


def estimate_key_hue(y_sig, sr):
    # Circle of fifths order (C,G,D,A,E,B,F#,C#,G#,D#,A#,F)
    circle_order = [0,7,2,9,4,11,6,1,8,3,10,5]
    # n = y_sig.size
    # n_fft = int(min(2048, n))
    # hop_len = max(1, n_fft // 4)
    # C= librosa.feature.chroma_stft(y=y_sig, sr=sr, hop_length=hop_len, n_fft=n_fft)
    C = librosa.feature.chroma_cqt(y=y_sig, sr=sr)

    chroma = np.mean(C, axis=1)
    pitch_names = ["C", "C♯/D♭", "D", "D♯/E♭", "E", "F", "F♯/G♭", "G", "G♯/A♭", "A", "A♯/B♭", "B"]
    
    # Proper key detection using Krumhansl-Schmuckler profiles (commented out)
    major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
    best_key = 0
    best_mode = "major"
    best_score = -1
    for key in range(12):
        # Test major
        rotated_major = np.roll(major_profile, key)
        major_score = np.corrcoef(chroma, rotated_major)[0,1]
        # Test minor  
        rotated_minor = np.roll(minor_profile, key)
        minor_score = np.corrcoef(chroma, rotated_minor)[0,1]
        if major_score > best_score:
            best_score = major_score
            best_key = key
            best_mode = "major"
        if minor_score > best_score:
            best_score = minor_score
            best_key = key
            best_mode = "minor"
    print(f"key: {pitch_names[best_key]} {best_mode}")
    # Map key to circle of fifths position for hue
    circle_pos = circle_order.index(best_key)
    H = circle_pos / 12.0
    return H
    
    # # Simple dominant pitch class method (current)
    # rotated = chroma[circle_order]
    # idx = int(np.argmax(rotated))
    # pitch_idx = circle_order[idx]
    # print(f"key: {pitch_names[pitch_idx]}")
    # # To color by Scriabin's palette instead of equal HSV hue:
    # # col = SCRIABIN_RGB.get(pitch_idx, (1.0, 1.0, 1.0))
    # # r, g, b = col
    # # H = colorsys.rgb_to_hsv(r, g, b)[0]
    # H = idx / 12.0
    return H

def estimate_saturation(y_sig):
    flatness = librosa.feature.spectral_flatness(y=y_sig)
    flat_med = float(np.median(flatness))
    print(f"signal purity: {round(1.0 - flat_med, 2)}")
    return float(1.0 - flat_med)

def estimate_value(y_sig, sr, min_value=0.2, fmin=27.5, fmax=4186.0):
    frame_length_optimal = int(np.ceil(sr / fmin) * 2 + 1)
    frame_length = frame_length_optimal

    f0 = librosa.yin(y_sig, fmin=fmin, fmax=fmax, sr=sr, frame_length=frame_length)
    f0 = f0[np.isfinite(f0)]
    f = float(np.median(f0))

    print(f"f0: {round(f, 2)} Hz")

    # Clamp f into [fmin, fmax]
    f_clamped = np.clip(f, fmin, fmax)

    # Normalize to [0,1] in log-frequency space
    v = (np.log2(f_clamped) - np.log2(fmin)) / (np.log2(fmax) - np.log2(fmin))

    # Map into [min_value, 1.0]
    return float(min_value + (1.0 - min_value) * v)

# def estimate_alpha(y_sig, min_alpha=0.2, rms_max=0.2):
#     # Use librosa's frame-wise RMS and reduce to a robust scalar via median
#     rms_frames = librosa.feature.rms(y=y_sig)
#     rms_scalar = float(np.median(rms_frames))

#     # Normalize rms into [0,1] with clipping
#     v = np.clip(rms_scalar / rms_max, 0.0, 1.0)

#     # Map into [min_alpha, 1.0]
#     return float(min_alpha + (1.0 - min_alpha) * v)

def estimate_alpha(y_sig, min_alpha=0.1, min_db=-70.0, max_db=-14.0):
    """
    Map signal loudness (in dBFS) to alpha in [min_alpha, 1.0].

    - min_db: dBFS that maps to min_alpha (e.g., -60 dBFS ≈ near-silence)
    - max_db: dBFS that maps to 1.0 (e.g., -14 dBFS ≈ ~0.2 RMS)
    """
    # Frame-wise RMS (energy) → robust scalar via median
    rms_frames = librosa.feature.rms(y=y_sig)
    rms_scalar = float(np.median(rms_frames))

    # Convert RMS to dBFS
    rms_db = 20.0 * np.log10(rms_scalar)
    print(f"rms_db: {round(rms_db, 2)}")

    # Normalize dB into [0,1] using the chosen thresholds
    v = (rms_db - min_db) / (max_db - min_db)
    v = float(np.clip(v, 0.0, 1.0))

    # Map to [min_alpha, 1.0]
    return float(min_alpha + (1.0 - min_alpha) * v)

def create_2d_path_visualization(kept_segments, song_path, points_per_second=100, resampled_points_per_chunk=128, show_plots=True):
    """
    Create a random 2D path over the clip timeline and align chunks to Felzenszwalb windows
    """
    # Random 2D path over the clip timeline → chunks aligned to Felzenszwalb windows if available
    rng = np.random.default_rng(2)

    # Parameters
    clip_path = song_path
    clip_duration_sec = librosa.get_duration(path=clip_path)

    # Build smooth randomized 2D path (x(t), y(t)) over [0, clip_duration]
    T = np.linspace(0.0, clip_duration_sec, max(3, int(np.ceil(clip_duration_sec * points_per_second))), endpoint=True)
    num_points = T.size
    if num_points < 3:
        raise RuntimeError("Not enough points to build 2D path")

    dt = (clip_duration_sec / (num_points - 1))
    ang_noise = rng.normal(loc=0.0, scale=0.03, size=num_points)
    # Ensure odd kernel size and not bigger than signal length so output matches input length
    ang_kernel_size = min(401, num_points)
    if ang_kernel_size % 2 == 0:
        ang_kernel_size -= 1
    ang_kernel = np.ones(ang_kernel_size, dtype=float) / float(ang_kernel_size)
    ang_rate = np.convolve(ang_noise, ang_kernel, mode="same")
    heading = np.cumsum(ang_rate)

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

    # Normalize to [0, 1] for stable plotting
    if np.max(X) > np.min(X):
        X = (X - np.min(X)) / (np.max(X) - np.min(X))
    if np.max(Y) > np.min(Y):
        Y = (Y - np.min(Y)) / (np.max(Y) - np.min(Y))

    # Helper to build chunks either from Felzenszwalb windows or fallback to fixed window/hop
    curve_chunks_2d = []
    curve_profiles_2d = []

    # Load audio for feature-based coloring (kept for duration only)
    y_full, sr_full = librosa.load(clip_path, sr=None)

    for s in kept_segments:
        print(f"\nProcessing chunk {s['idx']}...")
        t0 = float(s["t0_sec"])
        t1 = float(s["t1_sec"])
        start = int(np.searchsorted(T, t0, side='left'))
        end = int(np.searchsorted(T, t1, side='right'))
        end = max(start + 2, end)
        start = max(0, min(start, num_points - 2))
        end = min(end, num_points)
        t_seg = T[start:end]
        x_seg = X[start:end]
        y_seg = Y[start:end]
        # Resample to fixed profile length
        t_norm = (t_seg - t_seg[0]) / (t_seg[-1] - t_seg[0])
        tau = np.linspace(0.0, 1.0, resampled_points_per_chunk)
        x_res = np.interp(tau, t_norm, x_seg)
        y_res = np.interp(tau, t_norm, y_seg)
        # Audio slice and HSVA-derived color (use EXACT masked chunk audio)
        y_masked, sr_masked = sf.read(s["path"])  # reconstructed with the 2D freq-time mask
        if y_masked.ndim == 2:  # convert stereo to mono if needed
            y_masked = y_masked.mean(axis=1)
        H = estimate_key_hue(y_masked, sr_masked)
        S = estimate_saturation(y_masked)
        V = estimate_value(y_masked, sr_masked)
        A = estimate_alpha(y_masked)
        print(f"H (key): {round(H, 2)}, S (purity): {round(S, 2)}, V (pitch height): {round(V, 2)}, A (loudness): {round(A, 2)}")
        # S = 1
        # V = 1
        # A = 1
        r, g, b = colorsys.hsv_to_rgb(H, S, V)
        rgba = (r, g, b, A)

        curve_chunks_2d.append({
            "idx": int(s["idx"]),
            "t_start": float(t0),
            "t_end": float(t1),
            "t": t_seg,
            "x": x_seg,
            "y": y_seg,
            "t_norm": tau,
            "x_resampled": x_res,
            "y_resampled": y_res,
            "color_rgba": rgba,
        })
        curve_profiles_2d.append(np.stack([x_res, y_res], axis=-1))

    curve_profiles_2d = np.asarray(curve_profiles_2d) if len(curve_profiles_2d) else np.empty((0, resampled_points_per_chunk, 2))

    # Only show visualizations if requested
    if show_plots:
        # Figure 1: full 2D path with overlaid subset of chunks (color-matched to grid)
        fig1, ax1 = plt.subplots(1, 1, figsize=(7, 6))
        ax1.plot(X, Y, color="#333", linewidth=1.5, label="full path")

        # Choose subset indices to overlay (deterministic: first up to 15)
        overlay_idxs = list(range(min(100, len(curve_chunks_2d))))
        cmap = plt.get_cmap('tab20')
        # Use per-chunk RGBA if available; fallback to colormap
        colors = {}
        for i in overlay_idxs:
            col = curve_chunks_2d[i].get("color_rgba", None)
            if col is None:
                col = cmap(i % cmap.N)
            colors[i] = col
            ax1.plot(curve_chunks_2d[i]["x"], curve_chunks_2d[i]["y"], linewidth=5.0, color=col)
        ax1.set_title("Random 2D path with aligned time chunks (Felzenszwalb)")
        ax1.set_xlabel("x")
        ax1.set_ylabel("y")
        ax1.axis('equal')
        ax1.grid(True, alpha=0.25)
        plt.tight_layout()
        plt.show()

        # Figure 2: separate subplots for each overlaid chunk, using the same color
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
                    ax.plot(curve_chunks_2d[k]["x_resampled"], curve_chunks_2d[k]["y_resampled"], color=colors[k], linewidth=5.0)
                    t0 = curve_chunks_2d[k]["t_start"]
                    t1 = curve_chunks_2d[k]["t_end"]
                    ax.set_title(f"chunk {k}\n[{t0:.2f}s, {t1:.2f}s]", fontsize=8)
                    ax.axis('equal')
                    ax.grid(True, alpha=0.25)
                else:
                    ax.axis('off')
            fig2.suptitle("Felzenszwalb-aligned " + f"{N} 2D chunk profiles (color-matched)")
            plt.tight_layout()
            plt.show()

        # Figure 3: Pitch-class color mapping arranged around a circle (circle of fifths order)
        circle_order = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]
        pitch_names = ["C", "C♯/D♭", "D", "D♯/E♭", "E", "F", "F♯/G♭", "G", "G♯/A♭", "A", "A♯/B♭", "B"]
        fig3, ax3 = plt.subplots(1, 1, figsize=(6, 6))
        R_outer = 1.0
        R_inner = 0.6
        for k in range(12):
            pitch = circle_order[k]
            H = k / 12.0
            # # To try Scriabin's palette instead of equal spacing, uncomment:
            # r_col, g_col, b_col = SCRIABIN_RGB.get(pitch, (1.0, 1.0, 1.0))
            # # set the S and V to 1 and convert back to rgb:
            # h, s, v = colorsys.rgb_to_hsv(r_col, g_col, b_col)
            # s = 1.0
            # v = 1.0
            # r_col, g_col, b_col = colorsys.hsv_to_rgb(h, s, v)

            r_col, g_col, b_col = colorsys.hsv_to_rgb(H, 1.0, 1.0)
            theta_center = 90.0 - k * (360.0 / 12.0)  # C at top (90°), increasing k clockwise
            theta1 = theta_center - (180.0 / 12.0)    # 15° before center
            theta2 = theta_center + (180.0 / 12.0)    # 15° after center
            wedge = Wedge((0.0, 0.0), R_outer, theta1, theta2, width=R_outer - R_inner, facecolor=(r_col, g_col, b_col), edgecolor='white')
            ax3.add_patch(wedge)
            theta_mid = np.deg2rad(theta_center)
            tx = (R_outer + 0.08) * np.cos(theta_mid)
            ty = (R_outer + 0.08) * np.sin(theta_mid)
            ax3.text(tx, ty, pitch_names[pitch], ha='center', va='center', fontsize=10)
        # Outer ring guide
        guide = Wedge((0.0, 0.0), R_outer, 0, 360, width=0.0, facecolor='none', edgecolor='#999999')
        ax3.add_patch(guide)
        ax3.set_xlim(-1.25, 1.25)
        ax3.set_ylim(-1.25, 1.25)
        ax3.set_aspect('equal')
        ax3.axis('off')
        ax3.set_title("Pitch-class color circle (circle of fifths order)")
        plt.tight_layout()
        plt.show()

    return X, Y, curve_chunks_2d, curve_profiles_2d


def main():
    # 🚀 RUN THE SEGMENTATION
    print("🎨 STARTING FELZENSZWALB 2D AUDIO SEGMENTATION")
    print("=" * 60)
    song_path = "clips/chop.mp3"
    shapes, kept_segments = split_audio_felzenszwalb_2d(
        song_path,
        output_dir=f"chunks_detailed_{song_path.split('/')[-1].split('.')[0]}",
        scale=150,      # Lower = more segments
        sigma=3,        # Lower = sharper boundaries
        min_size=20,    # Larger = fewer tiny segments
        max_shapes=100,  # Limit output for testing
        min_area_pixels=300,
        min_time_seconds=0.5,  # Minimum duration in seconds
        min_energy_ratio=0.001,
        min_loudness_db=-70.0,
    )
    
    # Create 2D path visualization
    X, Y, curve_chunks_2d, curve_profiles_2d = create_2d_path_visualization(kept_segments, song_path)
    
    print(f"\n✅ Processing complete!")
    print(f"📁 Saved {len(shapes)} audio chunks")
    print(f"🎨 Created {len(curve_chunks_2d)} 2D curve profiles")


if __name__ == "__main__":
    main()
