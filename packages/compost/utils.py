import pygame
import sys
import numpy as np
import math
from skimage.color import rgb2hsv, rgba2rgb, hsv2rgb, rgb2gray
from skimage.segmentation import felzenszwalb
from skimage.util import img_as_ubyte
from scipy.spatial import ConvexHull, QhullError
from typing import List, Tuple, Dict, Any, Optional


def resize_image_to_dimensions(image: pygame.Surface, target_width: int, target_height: int, max_width: int, max_height: int) -> pygame.Surface:
    """
    Resize an image to target dimensions, but scale down if target exceeds maximum bounds.
    
    Args:
        image (pygame.Surface): The image to resize.
        target_width (int): Desired width.
        target_height (int): Desired height.
        max_width (int): Maximum allowed width.
        max_height (int): Maximum allowed height.
    
    Returns:
        pygame.Surface: The resized image.
    """
    # If target dimensions exceed max bounds, scale down proportionally
    if target_width > max_width or target_height > max_height:
        return scale_image_to_fit(image, max_width, max_height)
    else:
        # Resize to exact target dimensions
        return pygame.transform.smoothscale(image, (target_width, target_height))


def scale_image_to_fit(image: pygame.Surface, max_width: int, max_height: int) -> pygame.Surface:
    """
    Scales the image to fit within the specified maximum width and height while maintaining aspect ratio.
    
    Args:
        image (pygame.Surface): The image to scale.
        max_width (int): Maximum allowed width.
        max_height (int): Maximum allowed height.
    
    Returns:
        pygame.Surface: The scaled image.
    """
    original_width, original_height = image.get_size()
    scale_ratio = min(max_width / original_width, max_height / original_height, 1)
    new_size = (int(original_width * scale_ratio), int(original_height * scale_ratio))
    return pygame.transform.smoothscale(image, new_size)


def calculate_chunk_color(surface: pygame.Surface) -> Tuple[float, float, float]:
    """
    Calculate average HSV values for visible pixels in a chunk.
    
    Args:
        surface (pygame.Surface): The chunk's surface.
        
    Returns:
        Tuple[float, float, float]: (Hue: 0-360, Saturation: 0-1, Value: 0-1)
    """
    try:
        # Get RGB and alpha arrays
        rgb = pygame.surfarray.array3d(surface).astype(np.float32) / 255.0
        alpha = pygame.surfarray.pixels_alpha(surface)
        
        # Only consider visible pixels
        visible_mask = alpha > 0
        if not np.any(visible_mask):
            return (0.0, 0.0, 0.0)
        
        # Convert visible RGB pixels to HSV using skimage
        visible_rgb = rgb[visible_mask]
        hsv_values = rgb2hsv(visible_rgb.reshape(-1, 1, 3))[:, 0, :]  # Reshape for skimage and back
        
        # Calculate mean HSV (handling hue's cyclic nature)
        mean_h = np.arctan2(
            np.mean(np.sin(hsv_values[:, 0] * 2 * np.pi)),
            np.mean(np.cos(hsv_values[:, 0] * 2 * np.pi))
        ) / (2 * np.pi)  # Convert back to 0-1 range
        mean_h = (mean_h * 360) % 360  # Convert to 0-360 degrees
        mean_s = np.mean(hsv_values[:, 1])
        mean_v = np.mean(hsv_values[:, 2])
        
        return (mean_h, mean_s, mean_v)
        
    except (ValueError, pygame.error) as e:
        print(f"Warning: Error calculating HSV values: {e}")
        return (0.0, 0.0, 0.0)


def calculate_color_contrast(hsv1: Tuple[float, float, float], 
                           hsv2: Tuple[float, float, float],
                           config: Dict[str, Any]) -> float:
    """
    Calculate color difference between two HSV colors, considering hue's cyclic nature.
    
    Args:
        hsv1: First color's (Hue: 0-360, Saturation: 0-1, Value: 0-1)
        hsv2: Second color's (Hue: 0-360, Saturation: 0-1, Value: 0-1)
        config: Configuration dictionary containing appetite weights
        
    Returns:
        float: Color difference from 0.0 to 1.0, where:
               0.0 = identical colors
               1.0 = maximally different colors
    """
    h1, s1, v1 = hsv1
    h2, s2, v2 = hsv2
    
    # Convert hues to radians for cyclic calculation
    h1_rad = h1 * np.pi / 180
    h2_rad = h2 * np.pi / 180
    
    # Calculate hue difference using circular mean
    hue_diff = np.arccos(np.cos(h1_rad - h2_rad)) / np.pi  # Normalize to 0-1
    
    # Get weights from config
    appetite_cfg = config["worm"]["appetite"]
    hue_weight = appetite_cfg["hue_weight"]
    saturation_weight = appetite_cfg["saturation_weight"]
    value_weight = appetite_cfg["value_weight"]
    
    # Calculate weighted differences
    return (
        hue_weight * hue_diff +  # Hue difference
        saturation_weight * abs(s1 - s2) +  # Saturation difference
        value_weight * abs(v1 - v2)    # Value difference
    )


def hsv_to_rgb_int(hsv: Tuple[float, float, float]) -> Tuple[int, int, int]:
    """
    Convert HSV color to RGB integers (0-255).
    
    Args:
        hsv: (Hue: 0-360, Saturation: 0-1, Value: 0-1)
        
    Returns:
        Tuple[int, int, int]: RGB values in 0-255 range
    """
    h, s, v = hsv
    # Convert to skimage format (all values 0-1)
    h = h / 360.0
    # Reshape for skimage
    hsv_array = np.array([[[h, s, v]]])
    # Convert to RGB
    rgb_array = hsv2rgb(hsv_array)
    # Convert to 0-255 range and return as tuple
    return tuple(int(x * 255) for x in rgb_array[0, 0])


def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    """
    Convert RGB tuple to hex color code.
    
    Args:
        rgb (Tuple[int, int, int]): RGB color tuple.
        
    Returns:
        str: Hex color code.
    """
    return '#{:02x}{:02x}{:02x}'.format(*rgb)


def calculate_entropy(grayscale: np.ndarray, mask: np.ndarray) -> float:
    """
    Calculate the entropy of a masked region in a grayscale image.

    Args:
        grayscale: Grayscale image as numpy array (0-255 range)
        mask: Boolean mask where True represents the region to analyze

    Returns:
        float: Entropy value (0.0 if no pixels or invalid input)
    """
    pixel_values = grayscale[mask]
    if pixel_values.size == 0:
        return 0.0

    histogram, _ = np.histogram(pixel_values, bins=256, range=(0, 256), density=True)
    histogram = histogram[histogram > 0]

    if histogram.size == 0:
        return 0.0

    entropy = -np.sum(histogram * np.log2(histogram))
    return entropy


def process_image_to_chunks(
    image_rgba: np.ndarray,
    image_size: Tuple[int, int],
    config: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Process an RGBA image into chunk data using Felzenszwalb segmentation.
    Returns serializable chunk data dictionaries.

    Args:
        image_rgba: RGBA image as numpy array (height, width, 4)
        image_size: (width, height)
        config: Configuration dictionary

    Returns:
        List of chunk data dictionaries with keys:
        - surface_bytes: RGBA pixel data as bytes
        - surface_size: (width, height)
        - vertices: List of (x, y) tuples for convex hull
        - downsized: bool
        - cached_hsv_color: (h, s, v) tuple
    """
    width, height = image_size
    chunks_data = []

    # Convert RGBA to RGB for segmentation
    numpy_image = image_rgba[:, :, :3]  # Drop alpha
    if numpy_image.dtype != np.uint8:
        numpy_image = img_as_ubyte(numpy_image)

    # Felzenszwalb segmentation
    felz_cfg = config.get("segmentation", {}).get("felzenszwalb", {})
    segments = felzenszwalb(
        numpy_image,
        scale=felz_cfg.get("scale", 150),
        sigma=felz_cfg.get("sigma", 3),
        min_size=felz_cfg.get("min_size", 20),
    )

    # Compression config - identify segments to downsize
    compress_cfg = config.get("compression", {})
    max_size = compress_cfg.get("max_size", 5000)
    min_entropy = compress_cfg.get("min_entropy", 4.0)
    downsample_factor = compress_cfg.get("downsample_factor", 0.5)

    # Calculate entropy for each segment
    grayscale = rgb2gray(numpy_image)
    grayscale = img_as_ubyte(grayscale)

    unique_labels = np.unique(segments)
    labels_to_downsize = []

    for label in unique_labels:
        mask = segments == label
        size = np.sum(mask)
        if size < 3:
            continue
        entropy = calculate_entropy(grayscale, mask)
        if size > max_size and entropy < min_entropy:
            labels_to_downsize.append(label)

    # Filter config
    filt_cfg = config.get("segmentation", {}).get("image_filter", {})
    min_visible = int(filt_cfg.get("min_visible_pixels", 1))
    min_alpha = int(filt_cfg.get("min_alpha_threshold", 1))

    # Create chunks from segments
    for segment_label in unique_labels:
        mask = (segments == segment_label)
        coords = np.argwhere(mask)
        if len(coords) < 3:
            continue

        # Calculate centroid and bounds
        centroid = coords.mean(axis=0)
        cy, cx = centroid
        min_y, min_x = coords.min(axis=0)
        max_y, max_x = coords.max(axis=0)

        seg_width = max_x - min_x + 1
        seg_height = max_y - min_y + 1

        # Extract segment surface as RGBA array
        segment_rgba = np.zeros((seg_height, seg_width, 4), dtype=np.uint8)
        for y, x in coords:
            segment_rgba[y - min_y, x - min_x] = image_rgba[y, x]

        # Calculate vertices (shifted to centroid at origin)
        vertices = [(x - cx, y - cy) for (y, x) in coords]
        vertices_array = np.array(vertices)

        try:
            hull = ConvexHull(vertices_array)
        except QhullError:
            continue
        hull_vertices = [tuple(vertices_array[i]) for i in hull.vertices]

        # Calculate hull bounding box
        hull_xs = [v[0] for v in hull_vertices]
        hull_ys = [v[1] for v in hull_vertices]
        hull_width = max(hull_xs) - min(hull_xs)
        hull_height = max(hull_ys) - min(hull_ys)

        surface_width = max(1, int(math.ceil(hull_width)))
        surface_height = max(1, int(math.ceil(hull_height)))

        # Create centered surface
        centered_rgba = np.zeros((surface_height, surface_width, 4), dtype=np.uint8)
        offset_x = surface_width / 2
        offset_y = surface_height / 2

        for y in range(seg_height):
            for x in range(seg_width):
                if segment_rgba[y, x, 3] > 0:  # Has alpha
                    blit_x = int(x - (cx - min_x) + offset_x)
                    blit_y = int(y - (cy - min_y) + offset_y)
                    if 0 <= blit_x < surface_width and 0 <= blit_y < surface_height:
                        centered_rgba[blit_y, blit_x] = segment_rgba[y, x]

        # Check minimum visibility
        visible_count = (centered_rgba[:, :, 3] >= min_alpha).sum()
        if visible_count < min_visible:
            continue

        downsized = segment_label in labels_to_downsize

        # Apply downsampling if needed
        if downsized:
            new_w = max(1, int(surface_width * downsample_factor))
            new_h = max(1, int(surface_height * downsample_factor))
            from skimage.transform import resize as sk_resize
            centered_rgba = sk_resize(centered_rgba, (new_h, new_w), preserve_range=True, anti_aliasing=False).astype(np.uint8)
            surface_width, surface_height = new_w, new_h
            hull_vertices = [(x * downsample_factor, y * downsample_factor) for (x, y) in hull_vertices]

        # Create pygame surface from numpy array
        surface = pygame.Surface((surface_width, surface_height), pygame.SRCALPHA)
        pygame.surfarray.blit_array(surface, centered_rgba[:, :, :3].swapaxes(0, 1))
        alpha_surface = pygame.surfarray.pixels_alpha(surface)
        alpha_surface[:] = centered_rgba[:, :, 3].swapaxes(0, 1)
        del alpha_surface

        # Calculate HSV color
        hsv_color = calculate_chunk_color(surface)

        # Convert surface to bytes for serialization
        surface_bytes = pygame.image.tostring(surface, 'RGBA')

        chunk_data = {
            'surface_bytes': surface_bytes,
            'surface_size': (surface_width, surface_height),
            'vertices': hull_vertices,
            'downsized': downsized,
            'cached_hsv_color': hsv_color,
        }
        chunks_data.append(chunk_data)

    return chunks_data


def process_sound_to_chunks(
    song_path: str,
    config: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Process a sound file into curve-based chunk data using Felzenszwalb segmentation.
    Returns serializable chunk data dictionaries.

    Args:
        song_path: Path to the audio file
        config: Configuration dictionary

    Returns:
        List of chunk data dictionaries with keys:
        - surface_bytes: RGBA pixel data as bytes
        - surface_size: (width, height)
        - vertices: List of (x, y) tuples for convex hull
        - downsized: bool (always False for sound)
        - audio_path: Path to the audio segment file
        - curve_data: Tuple of (points_list, rgba, width, height, padding)
        - original_line_width: int
    """
    import sys
    import os

    # Import sound_chunking (heavy dependencies)
    base_dir = os.path.dirname(__file__)
    sound_dir = os.path.join(base_dir, "sound")
    if sound_dir not in sys.path:
        sys.path.append(sound_dir)

    import sound_chunking as sc

    chunks_data = []
    snd_cfg = config.get("sound", {})
    felz = snd_cfg.get("felzenszwalb", {})
    output_dir = os.path.join("sound_chunks", f"chunks_detailed_{os.path.basename(song_path).split('.')[0]}")

    # Run segmentation
    saved_paths, kept_segments = sc.split_audio_felzenszwalb_2d(
        song_path,
        output_dir=output_dir,
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
    _X, _Y, curve_chunks_2d, _profiles = sc.create_2d_path_visualization(
        kept_segments,
        song_path,
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

    def lerp(a: float, b: float, t: float) -> float:
        return a + (b - a) * t

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

        # Find audio path
        audio_path = None
        chunk_idx = item.get("idx", -1)
        for seg in kept_segments:
            if seg.get("idx") == chunk_idx:
                audio_path = seg.get("path")
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
            'audio_path': audio_path,
            'curve_data': curve_data,
            'original_line_width': line_w,
        }
        chunks_data.append(chunk_data)

    return chunks_data


def quit_program() -> None:
    """
    Quits the pygame program gracefully.
    """
    pygame.quit()
    sys.exit()


# --- Helpers for sound curve → drawable surface and physics vertices ---
def build_curve_surface(points_xy01: np.ndarray, rgba: Tuple[float, float, float, float], width: int, height: int, line_width: int = 4, padding: int = 4) -> pygame.Surface:
    """
    Build a transparent surface and draw a polyline representing the curve.

    Args:
        points_xy01 (np.ndarray): Nx2 points in [0,1] range.
        rgba (Tuple[float,float,float,float]): color in 0..1 for r,g,b,a.
        width (int): surface width.
        height (int): surface height.
        line_width (int): line thickness in pixels.
        padding (int): pixels padding inside the surface border.

    Returns:
        pygame.Surface: surface with the curve drawn.
    """
    surf = pygame.Surface((width, height), pygame.SRCALPHA)
    if points_xy01 is None or len(points_xy01) < 2:
        return surf
    # Calculate effective drawing area (accounting for padding)
    draw_width = width - 2 * padding
    draw_height = height - 2 * padding

    # Normalize curve extents per-chunk and scale uniformly to fit drawing area
    x = points_xy01[:, 0].astype(float)
    y = points_xy01[:, 1].astype(float)
    x_min, x_max = float(np.min(x)), float(np.max(x))
    y_min, y_max = float(np.min(y)), float(np.max(y))
    extent_x = max(x_max - x_min, 1e-6)
    extent_y = max(y_max - y_min, 1e-6)
    center_x01 = 0.5 * (x_min + x_max)
    center_y01 = 0.5 * (y_min + y_max)

    # Uniform scale to preserve aspect ratio
    scale_uniform = min(draw_width / extent_x, draw_height / extent_y)
    drawing_center_x = padding + draw_width / 2.0
    drawing_center_y = padding + draw_height / 2.0

    # Map to pixel coords, centered in drawing area; flip Y for screen coords
    px = drawing_center_x + scale_uniform * (x - center_x01)
    py = drawing_center_y - scale_uniform * (y - center_y01)
    
    pts = [(int(x), int(y)) for x, y in zip(px, py)]
    # Clamp color to 0..255
    r = max(0, min(255, int(rgba[0] * 255)))
    g = max(0, min(255, int(rgba[1] * 255)))
    b = max(0, min(255, int(rgba[2] * 255)))
    a = max(0, min(255, int(rgba[3] * 255)))
    color = (r, g, b, a)
    try:
        pygame.draw.lines(surf, color, False, pts, line_width)
    except Exception:
        pass
    return surf


def convex_hull_vertices_from_curve(points_xy01: np.ndarray, width: int, height: int, padding: int = 4, line_width: int = 4) -> List[Tuple[float, float]]:
    """
    Compute convex hull vertices around curve points, scaled to surface coordinates and centered at (0,0).
    Accounts for line width to ensure physics body covers the full visual extent.
    
    Args:
        points_xy01: Nx2 points in [0,1] range
        width: surface width
        height: surface height  
        padding: padding inside surface border
        line_width: thickness of the drawn line
        
    Returns:
        List of (x,y) vertices for physics body, centered at origin
    """
    if points_xy01 is None or len(points_xy01) < 3:
        # Fallback to small rectangle if insufficient points
        return [(-10, -10), (10, -10), (10, 10), (-10, 10)]
    
    # Calculate effective drawing area (same as in build_curve_surface)
    draw_width = width - 2 * padding
    draw_height = height - 2 * padding

    # Normalize curve extents per-chunk and scale uniformly to fit drawing area
    x = points_xy01[:, 0].astype(float)
    y = points_xy01[:, 1].astype(float)
    x_min, x_max = float(np.min(x)), float(np.max(x))
    y_min, y_max = float(np.min(y)), float(np.max(y))
    extent_x = max(x_max - x_min, 1e-6)
    extent_y = max(y_max - y_min, 1e-6)
    center_x01 = 0.5 * (x_min + x_max)
    center_y01 = 0.5 * (y_min + y_max)

    scale_uniform = min(draw_width / extent_x, draw_height / extent_y)
    drawing_center_x = padding + draw_width / 2.0
    drawing_center_y = padding + draw_height / 2.0

    # Map to pixel coords, centered in drawing area; flip Y for screen coords
    px = drawing_center_x + scale_uniform * (x - center_x01)
    py = drawing_center_y - scale_uniform * (y - center_y01)
    
    # Stack into Nx2 array for ConvexHull
    points_px = np.column_stack([px, py])
    
    # Expand points by line width radius to account for visual thickness
    line_radius = line_width / 2.0
    expanded_points = []
    
    # Add the original points
    expanded_points.extend(points_px)
    
    # Add points offset by line radius in multiple directions to create thickness
    offsets = [
        (-line_radius, -line_radius), (line_radius, -line_radius),
        (-line_radius, line_radius), (line_radius, line_radius),
        (-line_radius, 0), (line_radius, 0),
        (0, -line_radius), (0, line_radius)
    ]
    
    for offset_x, offset_y in offsets:
        offset_points = points_px + np.array([offset_x, offset_y])
        expanded_points.extend(offset_points)
    
    expanded_points = np.array(expanded_points)
    
    try:
        from scipy.spatial import ConvexHull
        hull = ConvexHull(expanded_points)
        hull_points = expanded_points[hull.vertices]
    except Exception:
        # Fallback to bounding box of expanded points if ConvexHull fails
        min_x, min_y = expanded_points.min(axis=0)
        max_x, max_y = expanded_points.max(axis=0)
        hull_points = np.array([
            [min_x, min_y], [max_x, min_y], 
            [max_x, max_y], [min_x, max_y]
        ])
    
    # Center the hull vertices around drawing center (since visual curve is also centered there)
    drawing_center = np.array([drawing_center_x, drawing_center_y])
    centered_hull = hull_points - drawing_center
    
    # Convert to list of tuples
    return [(float(x), float(y)) for x, y in centered_hull]