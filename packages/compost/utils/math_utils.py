"""Mathematical utility functions."""
import numpy as np


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
