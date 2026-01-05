"""Processing modules for image and audio segmentation."""

from processors.background import (
    ChunkData,
    BatchComplete,
    background_loop,
)

from processors.image_processor import (
    pick_image_file,
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
    'pick_image_file',
    'segment_image',
    # Audio segmentation
    'segment_audio',
]
