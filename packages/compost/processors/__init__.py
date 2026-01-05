"""Processing modules for image and sound segmentation."""

from processors.worker import (
    ChunkData,
    BatchComplete,
    process_image_task,
    process_sound_task,
    worker_loop,
)

from processors.image_processor import (
    ImageProcessor,
    process_image_to_chunks,
)

from processors.sound_processor import (
    process_sound_to_chunks,
)

__all__ = [
    # Worker
    'ChunkData',
    'BatchComplete',
    'process_image_task',
    'process_sound_task',
    'worker_loop',
    # Image processing
    'ImageProcessor',
    'process_image_to_chunks',
    # Sound processing
    'process_sound_to_chunks',
]
