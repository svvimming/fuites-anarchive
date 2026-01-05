"""Background worker process for heavy processing tasks."""
import multiprocessing
import traceback
from dataclasses import dataclass
from typing import Dict, Any, List, Tuple, Optional
import numpy as np

# Import processor functions
from processors.image_processor import process_image_to_chunks
from processors.sound_processor import process_sound_to_chunks


@dataclass
class ChunkData:
    """Serializable chunk data passed from worker to main thread."""
    surface_bytes: bytes
    surface_size: Tuple[int, int]
    vertices: List[Tuple[float, float]]
    downsized: bool
    batch_id: str
    cached_hsv_color: Optional[Tuple[float, float, float]] = None
    audio_path: Optional[str] = None
    curve_data: Optional[Tuple] = None
    original_line_width: Optional[int] = None


@dataclass
class BatchComplete:
    """Marker sent when all chunks from a batch have been processed."""
    batch_id: str
    upload_type: str  # "image" or "sound"


def process_image_task(
    image_rgba: np.ndarray,
    image_size: Tuple[int, int],
    config: Dict[str, Any],
    batch_id: str,
    output_queue: multiprocessing.Queue
) -> None:
    """
    Process an image into chunks in the worker process.

    Args:
        image_rgba: RGBA image as numpy array (height, width, 4)
        image_size: (width, height)
        config: Configuration dictionary
        batch_id: Unique ID for this upload batch
        output_queue: Queue to send ChunkData objects to main thread
    """
    try:
        chunks_data = process_image_to_chunks(image_rgba, image_size, config)

        # Send each chunk to the output queue
        for chunk_dict in chunks_data:
            chunk_data = ChunkData(
                surface_bytes=chunk_dict['surface_bytes'],
                surface_size=chunk_dict['surface_size'],
                vertices=chunk_dict['vertices'],
                downsized=chunk_dict['downsized'],
                batch_id=batch_id,
                cached_hsv_color=chunk_dict['cached_hsv_color'],
            )
            output_queue.put(chunk_data)

        # Signal batch completion
        output_queue.put(BatchComplete(batch_id=batch_id, upload_type="image"))

    except Exception as e:
        print(f"Worker error processing image: {e}")
        traceback.print_exc()
        # Still send completion marker to avoid deadlock
        output_queue.put(BatchComplete(batch_id=batch_id, upload_type="image"))


def process_sound_task(
    song_path: str,
    config: Dict[str, Any],
    batch_id: str,
    output_queue: multiprocessing.Queue
) -> None:
    """
    Process a sound file into curve-based chunks in the worker process.

    Args:
        song_path: Path to the audio file
        config: Configuration dictionary
        batch_id: Unique ID for this upload batch
        output_queue: Queue to send ChunkData objects to main thread
    """
    try:
        chunks_data = process_sound_to_chunks(song_path, config)

        # Send each chunk to the output queue
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
            )
            output_queue.put(chunk_data)

        # Signal batch completion
        output_queue.put(BatchComplete(batch_id=batch_id, upload_type="sound"))

    except Exception as e:
        print(f"Worker error processing sound: {e}")
        traceback.print_exc()
        output_queue.put(BatchComplete(batch_id=batch_id, upload_type="sound"))


def worker_loop(
    input_queue: multiprocessing.Queue,
    output_queue: multiprocessing.Queue,
    config: Dict[str, Any]
) -> None:
    """
    Main worker loop - processes tasks from input queue.
    Runs in a separate process to keep main thread responsive.
    """
    # Initialize pygame in worker (works without display)
    import pygame
    pygame.init()

    print("[Worker] Started background processing worker with pygame initialized")

    while True:
        try:
            task = input_queue.get()

            if task is None:
                print("[Worker] Received shutdown signal")
                break

            task_type = task[0]

            if task_type == "image":
                _, image_rgba, image_size, batch_id = task
                process_image_task(image_rgba, image_size, config, batch_id, output_queue)

            elif task_type == "sound":
                _, song_path, batch_id = task
                process_sound_task(song_path, config, batch_id, output_queue)

            else:
                print(f"[Worker] Unknown task type: {task_type}")

        except Exception as e:
            print(f"[Worker] Error in main loop: {e}")
            traceback.print_exc()

    print("[Worker] Shutting down")
