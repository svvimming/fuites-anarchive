"""Geometry and curve utilities."""
import numpy as np
import pygame
from typing import List, Tuple
from scipy.spatial import ConvexHull


def _transform_curve_to_pixels(
    points_xy01: np.ndarray,
    width: int,
    height: int,
    padding: int
) -> Tuple[np.ndarray, np.ndarray, float, float]:
    """
    Transform normalized curve points to pixel coordinates.

    Args:
        points_xy01: Nx2 points in [0,1] range
        width: surface width
        height: surface height
        padding: padding inside surface border

    Returns:
        (px, py, drawing_center_x, drawing_center_y) where px/py are pixel coordinate arrays
    """
    draw_width = width - 2 * padding
    draw_height = height - 2 * padding

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

    px = drawing_center_x + scale_uniform * (x - center_x01)
    py = drawing_center_y - scale_uniform * (y - center_y01)

    return px, py, drawing_center_x, drawing_center_y


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
    # if points_xy01 is None or len(points_xy01) < 2:
    #     return surf

    px, py, _, _ = _transform_curve_to_pixels(points_xy01, width, height, padding)

    pts = [(int(x), int(y)) for x, y in zip(px, py)]
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
    # if points_xy01 is None or len(points_xy01) < 3:
    #     return [(-10, -10), (10, -10), (10, 10), (-10, 10)]

    px, py, drawing_center_x, drawing_center_y = _transform_curve_to_pixels(points_xy01, width, height, padding)

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
