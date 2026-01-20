"""Image segmentation using Felzenszwalb algorithm."""
import math
import pygame
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from skimage.segmentation import felzenszwalb
from skimage.color import rgb2gray
from skimage.util import img_as_ubyte
from skimage.transform import resize as sk_resize
from scipy.spatial import ConvexHull, QhullError

from utils.color_utils import calculate_chunk_color
from utils.math_utils import calculate_entropy
from utils.logging_utils import get_logger

_logger = get_logger(__name__)


def _identify_downsize_labels(
    segments: np.ndarray,
    grayscale: np.ndarray,
    max_size: int,
    min_entropy: float
) -> List[int]:
    """Identify segment labels that should be downsampled (large + low entropy)."""
    labels_to_downsize = []
    for label in np.unique(segments):
        mask = segments == label
        size = np.sum(mask)
        if size < 3:
            continue
        ent = calculate_entropy(grayscale, mask)
        if size > max_size and ent < min_entropy:
            labels_to_downsize.append(label)
    return labels_to_downsize


def _compute_hull_vertices(
    coords: np.ndarray,
    centroid: Tuple[float, float]
) -> Optional[List[Tuple[float, float]]]:
    """
    Compute convex hull vertices centered at origin.

    Returns:
        List of (x, y) vertices, or None if hull computation fails
    """
    cy, cx = centroid
    vertices = [(x - cx, y - cy) for (y, x) in coords]
    vertices_array = np.array(vertices)

    try:
        hull = ConvexHull(vertices_array)
    except QhullError:
        return None

    return [tuple(vertices_array[i]) for i in hull.vertices]


def segment_image(
    image_rgba: np.ndarray,
    image_size: Tuple[int, int],
    config: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Segment an RGBA image into chunk data using Felzenszwalb algorithm.

    Args:
        image_rgba: RGBA image as numpy array (height, width, 4)
        image_size: (width, height)
        config: Configuration dictionary

    Returns:
        List of chunk data dictionaries
    """
    chunks_data = []

    # Convert RGBA to RGB for segmentation
    numpy_image = image_rgba[:, :, :3]
    if numpy_image.dtype != np.uint8:
        numpy_image = img_as_ubyte(numpy_image)

    # Felzenszwalb segmentation
    felz_cfg = config.get("image", {}).get("segmentation", {}).get("felzenszwalb", {})
    segments = felzenszwalb(
        numpy_image,
        scale=felz_cfg.get("scale", 150),
        sigma=felz_cfg.get("sigma", 3),
        min_size=felz_cfg.get("min_size", 20),
    )

    unique_labels = np.unique(segments)
    _logger.debug("Felzenszwalb found %d segments", len(unique_labels))

    # Identify segments to downsize
    compress_cfg = config.get("image", {}).get("compression", {})
    grayscale = img_as_ubyte(rgb2gray(numpy_image))
    labels_to_downsize = _identify_downsize_labels(
        segments, grayscale,
        max_size=compress_cfg.get("max_size", 5000),
        min_entropy=compress_cfg.get("min_entropy", 4.0)
    )
    downsample_factor = compress_cfg.get("downsample_factor", 0.5)

    # Filter config
    filt_cfg = config.get("image", {}).get("segmentation", {}).get("chunk_filter", {})
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

        # Compute convex hull vertices
        hull_vertices = _compute_hull_vertices(coords, centroid)
        if hull_vertices is None:
            continue

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

    _logger.info("Created %d chunks from image", len(chunks_data))
    return chunks_data
