"""Mathematical utility functions."""
import math
from typing import Tuple

import numpy as np


# -----------------------------------------------------------------------------
# Vector Math Utilities
# -----------------------------------------------------------------------------

def vector_magnitude(dx: float, dy: float) -> float:
    """Calculate magnitude of a 2D vector."""
    return math.sqrt(dx * dx + dy * dy)


def normalize_vector(dx: float, dy: float) -> Tuple[float, float]:
    """
    Normalize a 2D vector to unit length.

    Returns (0, 0) if the vector has zero magnitude.
    """
    mag = vector_magnitude(dx, dy)
    if mag > 0:
        return (dx / mag, dy / mag)
    return (0.0, 0.0)


def scale_vector(dx: float, dy: float, scale: float) -> Tuple[float, float]:
    """Scale a vector by a scalar value."""
    return (dx * scale, dy * scale)


def lerp(a: float, b: float, t: float) -> float:
    """Linear interpolation between a and b by factor t."""
    return a + (b - a) * t


def limit_vector(dx: float, dy: float, max_magnitude: float) -> Tuple[float, float]:
    """
    Limit a vector's magnitude to a maximum value.

    If the vector's magnitude exceeds max_magnitude, it is scaled down.
    """
    mag = vector_magnitude(dx, dy)
    if mag > max_magnitude and mag > 0:
        return (dx / mag * max_magnitude, dy / mag * max_magnitude)
    return (dx, dy)


def calculate_steering(
    desired_x: float,
    desired_y: float,
    velocity_x: float,
    velocity_y: float,
    max_force: float
) -> Tuple[float, float]:
    """
    Calculate steering force (desired - velocity), limited to max_force.

    Used in flocking behaviors to compute force needed to change direction.
    """
    steer_x = desired_x - velocity_x
    steer_y = desired_y - velocity_y
    return limit_vector(steer_x, steer_y, max_force)


def torus_delta(
    dx: float,
    dy: float,
    width: float,
    height: float
) -> Tuple[float, float]:
    """
    Calculate the shortest delta vector accounting for torus wrapping.

    In a torus world, the shortest distance between two points may wrap
    around the edges. This function returns the delta that represents
    the shortest path.

    Args:
        dx: Delta x (target.x - current.x)
        dy: Delta y (target.y - current.y)
        width: World width
        height: World height

    Returns:
        Tuple of (wrapped_dx, wrapped_dy) representing shortest distance

    Example:
        In an 800-wide world:
        - dx = 780 (naive distance)
        - Returns dx = -20 (shorter wrapped distance)
    """
    # Wrap x-axis: if distance > half width, use wrapped distance
    if abs(dx) > width / 2:
        dx = dx - width if dx > 0 else dx + width

    # Wrap y-axis: if distance > half height, use wrapped distance
    if abs(dy) > height / 2:
        dy = dy - height if dy > 0 else dy + height

    return (dx, dy)


# -----------------------------------------------------------------------------
# Image Analysis Utilities
# -----------------------------------------------------------------------------

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
