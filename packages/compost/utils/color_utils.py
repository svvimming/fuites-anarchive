"""Color manipulation and analysis utilities."""
import numpy as np
import pygame
from typing import Tuple, Dict, Any
from skimage.color import rgb2hsv, hsv2rgb
from utils.logging_utils import get_logger

_logger = get_logger(__name__)


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
        _logger.warning("Error calculating HSV values: %s", e)
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

