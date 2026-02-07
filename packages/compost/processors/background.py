"""Background process for heavy segmentation tasks."""
import multiprocessing
import traceback
from dataclasses import dataclass
from typing import Dict, Any, List, Tuple, Optional
import numpy as np

# Import segmentation functions
from processors.image_processor import segment_image
from processors.sound_processor import segment_audio
from utils.logging_utils import get_logger

_logger = get_logger(__name__)

# Global state for pool workers (set by init_worker)
_results_queue: Optional[multiprocessing.Queue] = None
_config: Optional[Dict[str, Any]] = None
_pygame_initialized: bool = False


@dataclass
class ChunkData:
    """Serializable chunk data passed from background to main thread."""
    surface_bytes: bytes
    surface_size: Tuple[int, int]
    vertices: List[Tuple[float, float]]
    downsized: bool
    batch_id: str
    cached_hsv_color: Optional[Tuple[float, float, float]] = None
    audio_path: Optional[str] = None
    curve_data: Optional[Tuple] = None
    original_line_width: Optional[int] = None
    source_offset: Optional[Tuple[float, float]] = None


@dataclass
class BatchComplete:
    """Marker sent when all chunks from a batch have been processed."""
    batch_id: str
    upload_type: str  # "image" or "sound"


def init_worker(results_queue: multiprocessing.Queue, config: Dict[str, Any]) -> None:
    """Initialize worker process with shared queue and config."""
    global _results_queue, _config, _pygame_initialized
    _results_queue = results_queue
    _config = config

    # Initialize pygame once per worker (headless - no dock icon)
    if not _pygame_initialized:
        import os
        os.environ['SDL_VIDEODRIVER'] = 'dummy'
        import pygame
        pygame.init()
        _pygame_initialized = True
        _logger.info("[Worker %s] Initialized", multiprocessing.current_process().name)


def process_task(task: Tuple) -> None:
    """Process a single task (called by Pool)."""
    global _results_queue, _config

    try:
        task_type = task[0]

        if task_type == "image":
            _, image_rgba, image_size, batch_id = task
            _process_image(image_rgba, image_size, _config, batch_id, _results_queue)

        elif task_type == "sound":
            _, audio_path, batch_id, part_index, offset, duration = task
            _process_audio(
                audio_path, _config, batch_id, _results_queue,
                part_index, offset, duration
            )

        else:
            _logger.warning("[Worker] Unknown task type: %s", task_type)

    except Exception as e:
        _logger.error("[Worker] Error processing task: %s", e)
        traceback.print_exc()


def _process_image(
    image_rgba: np.ndarray,
    image_size: Tuple[int, int],
    config: Dict[str, Any],
    batch_id: str,
    results_queue: multiprocessing.Queue
) -> None:
    """Process an image into chunks and send results to queue."""
    try:
        chunks_data = segment_image(image_rgba, image_size, config)

        # Send each chunk to the results queue
        for chunk_dict in chunks_data:
            chunk_data = ChunkData(
                surface_bytes=chunk_dict['surface_bytes'],
                surface_size=chunk_dict['surface_size'],
                vertices=chunk_dict['vertices'],
                downsized=chunk_dict['downsized'],
                batch_id=batch_id,
                cached_hsv_color=chunk_dict['cached_hsv_color'],
                source_offset=chunk_dict.get('source_offset'),
            )
            results_queue.put(chunk_data)

        # Signal batch completion
        results_queue.put(BatchComplete(batch_id=batch_id, upload_type="image"))

    except Exception as e:
        _logger.error("[Background] Error processing image: %s", e)
        traceback.print_exc()
        # Still send completion marker to avoid deadlock
        results_queue.put(BatchComplete(batch_id=batch_id, upload_type="image"))


def _process_audio(
    audio_path: str,
    config: Dict[str, Any],
    batch_id: str,
    results_queue: multiprocessing.Queue,
    part_index: Optional[int] = None,
    offset: Optional[float] = None,
    duration: Optional[float] = None
) -> None:
    """Process an audio file (or part of it) into chunks and send results to queue."""
    try:
        chunks_data = segment_audio(audio_path, config, part_index, offset, duration)

        # Send each chunk to the results queue
        for chunk_dict in chunks_data:
            chunk_data = ChunkData(
                surface_bytes=chunk_dict['surface_bytes'],
                surface_size=chunk_dict['surface_size'],
                vertices=chunk_dict['vertices'],
                downsized=chunk_dict['downsized'],
                batch_id=batch_id,
                audio_path=chunk_dict.get('audio_path'),
                curve_data=chunk_dict.get('curve_data'),
                original_line_width=chunk_dict.get('original_line_width'),
                source_offset=chunk_dict.get('source_offset'),
            )
            results_queue.put(chunk_data)

        # Signal batch completion
        results_queue.put(BatchComplete(batch_id=batch_id, upload_type="sound"))

    except Exception as e:
        _logger.error("[Background] Error processing audio: %s", e)
        traceback.print_exc()
        results_queue.put(BatchComplete(batch_id=batch_id, upload_type="sound"))
