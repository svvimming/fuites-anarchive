"""Color manipulation and analysis utilities."""
import numpy as np
import pygame
from typing import List, Optional, Tuple, Dict, Any
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
    Calculate color difference between two HSV colors.

    Supports two methods (set via config appetite.method):
    - "cone": Conical HSV distance. Maps colors onto a cone
      (x=V*S*cos(H), y=V*S*sin(H), z=V). Hue differences vanish
      near grey/black. No weights needed.
    - "weighted": Weighted sum of circular hue, saturation, and value
      differences. Requires hue_weight, saturation_weight, value_weight.

    Args:
        hsv1: First color's (Hue: 0-360, Saturation: 0-1, Value: 0-1)
        hsv2: Second color's (Hue: 0-360, Saturation: 0-1, Value: 0-1)
        config: Configuration dictionary

    Returns:
        float: Color difference from 0.0 to 1.0
    """
    appetite_cfg = config["worm"]["appetite"]
    method = appetite_cfg.get("method", "cone")

    if method == "weighted":
        return _weighted_contrast(hsv1, hsv2, appetite_cfg)
    return _cone_contrast(hsv1, hsv2)


def _cone_contrast(hsv1: Tuple[float, float, float],
                   hsv2: Tuple[float, float, float]) -> float:
    """Conical HSV distance, normalized per-point to 0-1.

    Each point is normalized by its own maximum possible distance
    (to the opposite hue at S=1, V=1), then averaged. This means
    50% difference = 50% of the most different each color can be.
    """
    h1, s1, v1 = hsv1
    h2, s2, v2 = hsv2

    h1_rad = h1 * np.pi / 180
    h2_rad = h2 * np.pi / 180

    dx = v1 * s1 * np.cos(h1_rad) - v2 * s2 * np.cos(h2_rad)
    dy = v1 * s1 * np.sin(h1_rad) - v2 * s2 * np.sin(h2_rad)
    dz = v1 - v2

    raw = float(np.sqrt(dx * dx + dy * dy + dz * dz))

    # Normalize by the reference point's max possible distance
    # (to opposite hue at S=1, V=1 on the cone rim)
    dmax = float(np.sqrt((v1 * s1 + 1) ** 2 + (v1 - 1) ** 2))

    return raw / dmax


def _weighted_contrast(hsv1: Tuple[float, float, float],
                       hsv2: Tuple[float, float, float],
                       appetite_cfg: Dict[str, Any]) -> float:
    """Weighted sum of circular hue, saturation, and value differences."""
    h1, s1, v1 = hsv1
    h2, s2, v2 = hsv2

    h1_rad = h1 * np.pi / 180
    h2_rad = h2 * np.pi / 180

    hue_diff = float(np.arccos(np.clip(np.cos(h1_rad - h2_rad), -1, 1)) / np.pi)

    hue_weight = appetite_cfg.get("hue_weight", 0.8)
    sat_weight = appetite_cfg.get("saturation_weight", 0.1)
    val_weight = appetite_cfg.get("value_weight", 0.1)

    return (
        hue_weight * hue_diff +
        sat_weight * abs(s1 - s2) +
        val_weight * abs(v1 - v2)
    )


def compute_consecutive_extremes(
    hsv_colors: List[Tuple[float, float, float]],
    config: Dict[str, Any],
) -> Optional[Tuple[float, float]]:
    """
    Compute min and max consecutive cone distances in an ordered color sequence.

    Measures the contrast between each meal and the next (not all pairs),
    reflecting the worm's actual sequential eating pattern.

    Args:
        hsv_colors: Ordered list of (Hue: 0-360, Saturation: 0-1, Value: 0-1).
        config: Configuration dictionary (passed to calculate_color_contrast).

    Returns:
        (min_distance, max_distance) or None if fewer than 2 colors.
    """
    if len(hsv_colors) < 2:
        return None
    distances = [
        calculate_color_contrast(hsv_colors[i], hsv_colors[i + 1], config)
        for i in range(len(hsv_colors) - 1)
    ]
    return (min(distances), max(distances))


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

