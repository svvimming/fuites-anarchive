"""Image manipulation utilities."""
import pygame


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
