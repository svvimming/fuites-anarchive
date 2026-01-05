"""Image processing and segmentation."""
import os
import math
import pygame
import pymunk
import numpy as np
from tkinter import filedialog
from typing import Dict, Any, List, Tuple
from skimage.segmentation import felzenszwalb
from skimage.color import rgba2rgb, rgb2gray
from skimage.util import img_as_ubyte
from skimage.transform import resize as sk_resize
from scipy.spatial import ConvexHull, QhullError

from entities.chunk import Chunk
from utils.color_utils import calculate_chunk_color
from utils.math_utils import calculate_entropy


class ImageProcessor:
    """
    Handles image loading, optional scaling, Felzenszwalb segmentation,
    and compression of low complexity, large segments by marking them for downsizing.
    """

    def __init__(self, config: Dict[str, Any]) -> None:
        """
        Args:
            config (Dict[str, Any]): The entire config dictionary
        """
        self.config = config

    def load_image_via_dialog(self) -> pygame.Surface:
        """
        Opens a file dialog to load an image via Tkinter.

        Returns:
            pygame.Surface: The loaded image (with alpha), or None if canceled.
        """
        file_path = filedialog.askopenfilename(
            title="Select an image",
            filetypes=[("Image files", ("*.png", "*.jpg", "*.jpeg", "*.bmp", "*.gif"))],
        )
        if file_path and os.path.exists(file_path):
            try:
                return pygame.image.load(file_path).convert_alpha()
            except pygame.error as e:
                print(f"Unable to load image: {e}")
        return None

def process_image_to_chunks(
    image_rgba: np.ndarray,
    image_size: Tuple[int, int],
    config: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Process an RGBA image into chunk data using Felzenszwalb segmentation.
    Returns serializable chunk data dictionaries for async worker processing.

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
    min_entropy_threshold = compress_cfg.get("min_entropy", 4.0)
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
        ent = calculate_entropy(grayscale, mask)
        if size > max_size and ent < min_entropy_threshold:
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
