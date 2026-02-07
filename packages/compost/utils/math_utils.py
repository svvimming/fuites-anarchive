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
# Batch Flocking Utilities (vectorized)
# -----------------------------------------------------------------------------

def _steer_towards(
    dx: np.ndarray,
    dy: np.ndarray,
    vel_x: np.ndarray,
    vel_y: np.ndarray,
    maxspeed: float,
    maxforce: float,
) -> Tuple[np.ndarray, np.ndarray]:
    """Normalize (dx,dy), scale to maxspeed, subtract velocity, clamp to maxforce."""
    mag = np.sqrt(dx * dx + dy * dy)
    safe = np.where(mag > 0, mag, 1.0)
    desired_x = (dx / safe) * maxspeed
    desired_y = (dy / safe) * maxspeed
    steer_x = desired_x - vel_x
    steer_y = desired_y - vel_y
    steer_mag = np.sqrt(steer_x * steer_x + steer_y * steer_y)
    clamp = np.where(steer_mag > maxforce, maxforce / np.maximum(steer_mag, 1e-10), 1.0)
    return steer_x * clamp, steer_y * clamp


def compute_flocking_forces(
    positions: np.ndarray,
    velocities: np.ndarray,
    glue_center: Tuple[float, float],
    desired_separation: float,
    maxspeed: float,
    maxforce: float,
    separate_mult: float,
    seek_mult: float,
    world_size: Tuple[float, float] = None,
) -> np.ndarray:
    """
    Compute combined separation + seek forces for all bodies in one batch.

    Args:
        positions: (N, 2) array of body positions
        velocities: (N, 2) array of body velocities
        glue_center: (x, y) target all bodies seek toward
        desired_separation: Distance threshold for repulsion
        maxspeed: Maximum desired velocity magnitude
        maxforce: Maximum steering force magnitude
        separate_mult: Multiplier for separation force
        seek_mult: Multiplier for seek force
        world_size: (width, height) for torus wrapping, or None

    Returns:
        (N, 2) array of final combined forces
    """
    n = len(positions)
    if n == 0:
        return np.zeros((n, 2), dtype=np.float64)

    vel_x = velocities[:, 0]
    vel_y = velocities[:, 1]

    # --- Separation (pairwise O(N^2)) ---
    sep_x = np.zeros(n, dtype=np.float64)
    sep_y = np.zeros(n, dtype=np.float64)

    if n >= 2:
        dx = positions[:, 0:1] - positions[:, 0]
        dy = positions[:, 1:2] - positions[:, 1]

        if world_size is not None:
            w, h = world_size
            hw, hh = w / 2, h / 2
            dx = np.where(np.abs(dx) > hw, dx - np.sign(dx) * w, dx)
            dy = np.where(np.abs(dy) > hh, dy - np.sign(dy) * h, dy)

        dist = np.sqrt(dx * dx + dy * dy)
        mask = (dist > 0) & (dist < desired_separation)
        strength = np.where(mask, np.minimum(1.0, (desired_separation - dist) / desired_separation), 0.0)

        safe_dist = np.where(dist > 0, dist, 1.0)
        weighted_dx = (dx / safe_dist) * strength
        weighted_dy = (dy / safe_dist) * strength

        counts = mask.sum(axis=1).astype(np.float64)
        has_neighbours = counts > 0
        avg_x = np.where(has_neighbours, weighted_dx.sum(axis=1) / np.maximum(counts, 1.0), 0.0)
        avg_y = np.where(has_neighbours, weighted_dy.sum(axis=1) / np.maximum(counts, 1.0), 0.0)

        sx, sy = _steer_towards(avg_x, avg_y, vel_x, vel_y, maxspeed, maxforce)
        sep_x = np.where(has_neighbours, sx, 0.0)
        sep_y = np.where(has_neighbours, sy, 0.0)

    # --- Seek (all bodies toward same target) ---
    seek_dx = glue_center[0] - positions[:, 0]
    seek_dy = glue_center[1] - positions[:, 1]

    if world_size is not None:
        w, h = world_size
        hw, hh = w / 2, h / 2
        seek_dx = np.where(np.abs(seek_dx) > hw, seek_dx - np.sign(seek_dx) * w, seek_dx)
        seek_dy = np.where(np.abs(seek_dy) > hh, seek_dy - np.sign(seek_dy) * h, seek_dy)

    sk_x, sk_y = _steer_towards(seek_dx, seek_dy, vel_x, vel_y, maxspeed, maxforce)

    # --- Combine with multipliers ---
    forces = np.empty((n, 2), dtype=np.float64)
    forces[:, 0] = sep_x * separate_mult + sk_x * seek_mult
    forces[:, 1] = sep_y * separate_mult + sk_y * seek_mult
    return forces


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
