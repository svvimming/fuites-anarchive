"""Processing modules for image and audio segmentation."""

from processors.background import (
    ChunkData,
    BatchComplete,
    background_loop,
)

from processors.image_processor import (
    segment_image,
)

from processors.sound_processor import (
    segment_audio,
)

__all__ = [
    # Background process
    'ChunkData',
    'BatchComplete',
    'background_loop',
    # Image segmentation
    'segment_image',
    # Audio segmentation
    'segment_audio',
]
