"""Audio segmentation and curve generation."""
import os
import pygame
import numpy as np
from typing import List, Dict, Any, Optional

from utils.geometry_utils import build_curve_surface, convex_hull_vertices_from_curve
from utils.math_utils import lerp
from utils.sound_utils import segment_spectrogram_felzenszwalb_2d, create_2d_path_visualization


def segment_audio(
    audio_path: str,
    config: Dict[str, Any],
    part_index: Optional[int] = None,
    offset: Optional[float] = None,
    duration: Optional[float] = None
) -> List[Dict[str, Any]]:
    """
    Segment an audio file (or part of it) into curve-based chunk data.

    Args:
        audio_path: Path to the audio file
        config: Configuration dictionary
        part_index: Part index if splitting large files (None for whole file)
        offset: Start offset in seconds for this part (None for whole file)
        duration: Duration in seconds for this part (None for whole file)

    Returns:
        List of chunk data dictionaries with keys:
        - surface_bytes: RGBA pixel data as bytes
        - surface_size: (width, height)
        - vertices: List of (x, y) tuples for convex hull
        - downsized: bool (always False for audio)
        - audio_path: Path to the audio segment file
        - curve_data: Tuple of (points_list, rgba, width, height, padding)
        - original_line_width: int
    """
    chunks_data = []
    snd_cfg = config.get("sound", {})
    felz = snd_cfg.get("felzenszwalb", {})

    # Build output directory name (include part index if splitting)
    basename = os.path.basename(audio_path).split('.')[0]
    if part_index is not None:
        dir_name = f"chunks_detailed_{basename}_part_{part_index:03d}"
    else:
        dir_name = f"chunks_detailed_{basename}"
    output_dir = os.path.join("sound_chunks", dir_name)

    # Run segmentation
    saved_paths, kept_segments = segment_spectrogram_felzenszwalb_2d(
        audio_path,
        output_dir=output_dir,
        offset=offset,
        duration=duration,
        use_mel=bool(snd_cfg.get("use_mel", False)),
        n_mels=int(snd_cfg.get("n_mels", 128)),
        scale=int(felz.get("scale", 150)),
        sigma=float(felz.get("sigma", 3)),
        min_size=int(felz.get("min_size", 20)),
        max_shapes=int(snd_cfg.get("max_shapes", 50)),
        min_area_pixels=int(snd_cfg.get("min_area_pixels", 300)),
        min_time_seconds=float(snd_cfg.get("min_time_seconds", 0.5)),
        min_energy_ratio=float(snd_cfg.get("min_energy_ratio", 0.001)),
        min_loudness_db=float(snd_cfg.get("min_loudness_db", -70.0)),
        show_plots=False,
    )

    # Create 2D path visualization
    _X, _Y, curve_chunks_2d, _profiles = create_2d_path_visualization(
        kept_segments,
        audio_path,
        points_per_second=int(snd_cfg.get("points_per_second", 100)),
        resampled_points_per_chunk=int(snd_cfg.get("resampled_points_per_chunk", 128)),
        show_plots=False,
    )

    # Build chunk data from curves
    surf_cfg = snd_cfg.get("chunk_surface", {})
    line_w = int(surf_cfg.get("line_width", 6))
    padding = int(surf_cfg.get("padding", 6))

    # Dynamic sizing by duration
    size_cfg = snd_cfg.get("duration_size", {})
    min_sec = float(size_cfg.get("min_seconds", 0.5))
    max_sec = float(size_cfg.get("max_seconds", 60.0))
    min_w = int(size_cfg.get("min_width", 200))
    min_h = int(size_cfg.get("min_height", 200))
    max_w = int(size_cfg.get("max_width", 500))
    max_h = int(size_cfg.get("max_height", 500))

    for item in curve_chunks_2d:
        x_res = np.asarray(item.get("x_resampled", []), dtype=float)
        y_res = np.asarray(item.get("y_resampled", []), dtype=float)
        if x_res.size < 2 or y_res.size < 2:
            continue

        pts = np.stack([x_res, y_res], axis=-1)
        rgba = item.get("color_rgba", (1.0, 1.0, 1.0, 1.0))

        # Compute per-chunk dimensions based on duration
        t0 = float(item.get("t_start", 0.0))
        t1 = float(item.get("t_end", 0.0))
        duration = max(0.0, t1 - t0)
        if max_sec > min_sec:
            u = (duration - min_sec) / (max_sec - min_sec)
        else:
            u = 0.0
        u = float(np.clip(u, 0.0, 1.0))
        surf_w = int(round(lerp(min_w, max_w, u)))
        surf_h = int(round(lerp(min_h, max_h, u)))

        # Build surface and vertices using shared functions
        surface = build_curve_surface(pts, rgba, surf_w, surf_h, line_width=line_w, padding=padding)
        vertices = convex_hull_vertices_from_curve(pts, surf_w, surf_h, padding=padding, line_width=line_w)

        # Find audio path for this chunk
        chunk_audio_path = None
        chunk_idx = item.get("idx", -1)
        for seg in kept_segments:
            if seg.get("idx") == chunk_idx:
                chunk_audio_path = seg.get("path")
                break

        # Store curve data for redrawing (convert numpy to list for serialization)
        curve_data = (pts.tolist(), rgba, surf_w, surf_h, padding)

        # Convert surface to bytes for serialization
        surface_bytes = pygame.image.tostring(surface, 'RGBA')

        chunk_data = {
            'surface_bytes': surface_bytes,
            'surface_size': (surf_w, surf_h),
            'vertices': vertices,
            'downsized': False,
            'audio_path': chunk_audio_path,
            'curve_data': curve_data,
            'original_line_width': line_w,
        }
        chunks_data.append(chunk_data)

    return chunks_data
