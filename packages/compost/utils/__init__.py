"""Utility functions package."""

from utils.color_utils import (
    calculate_chunk_color,
    calculate_color_contrast,
    hsv_to_rgb_int,
)

from utils.math_utils import calculate_entropy, lerp

from utils.image_utils import (
    scale_image_to_fit,
    resize_image_to_dimensions,
)

from utils.geometry_utils import (
    build_curve_surface,
    convex_hull_vertices_from_curve,
)

from utils.system_utils import quit_program

from utils.sound_utils import (
    estimate_key_hue,
    estimate_saturation,
    estimate_value,
    estimate_value,
    estimate_alpha,
    segment_spectrogram_felzenszwalb_2d,
    create_2d_path_visualization,
)

from utils.logging_utils import get_logger

__all__ = [
    # Color
    'calculate_chunk_color',
    'calculate_color_contrast',
    'hsv_to_rgb_int',
    # Math
    'calculate_entropy',
    'lerp',
    # Image
    'scale_image_to_fit',
    'resize_image_to_dimensions',
    # Geometry
    'build_curve_surface',
    'convex_hull_vertices_from_curve',
    # System
    'quit_program',
    # Sound
    'estimate_key_hue',
    'estimate_saturation',
    'estimate_value',
    'estimate_value',
    'estimate_alpha',
    'segment_spectrogram_felzenszwalb_2d',
    'create_2d_path_visualization',
    # Logging
    'get_logger',
]
