"""Upload and worker queue management."""
import multiprocessing
import uuid
import io
import numpy as np
import pygame
import pymunk
from queue import Queue, Empty
from typing import Dict, Any, List, Tuple, Callable, Optional

from processors import ChunkData, BatchComplete, worker_loop
from utils.image_utils import scale_image_to_fit, resize_image_to_dimensions
from entities import Chunk


class QueueManager:
    """Manages queues for async upload and worker processing."""

    def __init__(
        self,
        config: Dict[str, Any],
        space: pymunk.Space,
        width: int,
        height: int
    ):
        """
        Initialize the queue manager.

        Args:
            config: Global configuration dict
            space: Pymunk physics space
            width: Screen width
            height: Screen height
        """
        self.config = config
        self.space = space
        self.width = width
        self.height = height

        # Upload queue (HTTP -> Main thread)
        self._upload_queue: Queue[Tuple[bytes, Optional[int], Optional[int]]] = Queue()

        # Worker queues (Main <-> Worker process)
        self._worker_input_queue: multiprocessing.Queue = multiprocessing.Queue()
        self._worker_output_queue: multiprocessing.Queue = multiprocessing.Queue()

        # Batch tracking
        self._pending_batches: Dict[str, int] = {}  # batch_id -> chunks remaining
        self._batch_upload_types: Dict[str, str] = {}  # batch_id -> upload_type

        # Chunks list reference (will be set by simulation)
        self.chunks: List[Chunk] = []

        # Callback for batch completion
        self._on_batch_complete: Optional[Callable[[str], None]] = None

        # Start worker process
        self._worker_process = multiprocessing.Process(
            target=worker_loop,
            args=(self._worker_input_queue, self._worker_output_queue, config),
            daemon=True
        )
        self._worker_process.start()

    def set_chunks_list(self, chunks: List[Chunk]) -> None:
        """Set reference to the main chunks list."""
        self.chunks = chunks

    def set_batch_complete_callback(self, callback: Callable[[str], None]) -> None:
        """Set callback for when a batch completes processing."""
        self._on_batch_complete = callback

    def enqueue_image_bytes(
        self,
        image_bytes: bytes,
        target_width: Optional[int] = None,
        target_height: Optional[int] = None
    ) -> None:
        """
        Enqueue raw image bytes and target dimensions to be processed on the main thread.

        Args:
            image_bytes: Raw image data
            target_width: Optional target width
            target_height: Optional target height
        """
        if image_bytes:
            self._upload_queue.put((image_bytes, target_width, target_height))

    def process_image_bytes(
        self,
        image_bytes: bytes,
        target_width: Optional[int] = None,
        target_height: Optional[int] = None
    ) -> bool:
        """
        Load an image from raw bytes and process it into chunks.

        Args:
            image_bytes: Raw image data
            target_width: Optional target width
            target_height: Optional target height

        Returns:
            True if processing succeeded, False otherwise
        """
        try:
            bytes_io = io.BytesIO(image_bytes)
            image = pygame.image.load(bytes_io).convert_alpha()
        except Exception as exc:
            print(f"Failed to load image from bytes: {exc}")
            return False

        self.process_image_surface(image, target_width, target_height)
        return True

    def process_image_surface(
        self,
        image: pygame.Surface,
        target_width: Optional[int] = None,
        target_height: Optional[int] = None
    ) -> None:
        """
        Process a provided pygame Surface.
        Sends heavy processing to background worker for non-blocking operation.

        Args:
            image: Loaded image surface to process
            target_width: Optional target width
            target_height: Optional target height
        """
        # Scale the image to fit the screen (fast, keep on main thread)
        max_width = self.width
        max_height = self.height

        if target_width is not None and target_height is not None:
            print(f"Using target dimensions: {target_width}x{target_height}")
            image = resize_image_to_dimensions(image, target_width, target_height, max_width, max_height)
        else:
            print(f"Scaling to fit screen: {max_width}x{max_height}")
            image = scale_image_to_fit(image, max_width, max_height)

        print(f"Image scaled to {image.get_size()}. Sending to background worker...")

        # Convert pygame surface to numpy RGBA array
        try:
            rgb_array = pygame.surfarray.array3d(image).swapaxes(0, 1)  # (H, W, 3)
            alpha_array = pygame.surfarray.array_alpha(image).swapaxes(0, 1)  # (H, W)
            # Combine into RGBA
            image_rgba = np.dstack((rgb_array, alpha_array))  # (H, W, 4)
        except Exception as e:
            print(f"Failed to convert image to array: {e}")
            return

        # Generate unique batch ID
        batch_id = str(uuid.uuid4())[:8]
        self._batch_upload_types[batch_id] = "image"

        # Send to worker (non-blocking)
        self._worker_input_queue.put(("image", image_rgba, image.get_size(), batch_id))
        print(f"Image batch {batch_id} queued for processing")

    def process_sound_file(self, song_path: str) -> None:
        """
        Process a sound file.
        Sends heavy processing to background worker for non-blocking operation.

        Args:
            song_path: Path to the audio file
        """
        import os
        # Generate unique batch ID
        batch_id = str(uuid.uuid4())[:8]
        self._batch_upload_types[batch_id] = "sound"

        # Send to worker (non-blocking)
        self._worker_input_queue.put(("sound", song_path, batch_id))
        print(f"Sound batch {batch_id} queued for processing: {os.path.basename(song_path)}")

    def drain_upload_queue(self, max_items: int = 4) -> None:
        """
        Drain up to max_items from the upload queue and process them.

        Args:
            max_items: Maximum items to process
        """
        processed = 0
        while processed < max_items:
            try:
                data_tuple = self._upload_queue.get_nowait()
            except Empty:
                break
            try:
                image_bytes, target_width, target_height = data_tuple
                self.process_image_bytes(image_bytes, target_width, target_height)
            finally:
                processed += 1

    def drain_processed_chunks(self, max_items: int = 15) -> None:
        """
        Drain processed chunk data from background worker and create physics bodies.
        This is the main thread's way of integrating chunks without blocking.

        Args:
            max_items: Maximum chunks to process per frame (controls gradual appearance)
        """
        processed = 0
        completed_batches = []  # Collect BatchComplete markers

        while processed < max_items:
            try:
                item = self._worker_output_queue.get_nowait()
            except Empty:
                break

            if isinstance(item, BatchComplete):
                # Queue is FIFO, so all chunks for this batch are already on the queue
                # We might not have processed them all yet, so store the marker
                completed_batches.append(item)
            elif isinstance(item, ChunkData):
                # Create chunk from pre-processed data
                chunk = Chunk.from_data(
                    surface_bytes=item.surface_bytes,
                    surface_size=item.surface_size,
                    vertices=item.vertices,
                    config=self.config,
                    space=self.space,
                    downsized=item.downsized,
                    cached_hsv_color=item.cached_hsv_color,
                    audio_path=item.audio_path,
                    curve_data=item.curve_data,
                    original_line_width=item.original_line_width,
                )
                self.chunks.append(chunk)

                # Track chunks integrated per batch
                batch_id = item.batch_id
                self._pending_batches[batch_id] = self._pending_batches.get(batch_id, 0) + 1

                processed += 1
            else:
                print(f"Unknown item type from worker: {type(item)}")
                processed += 1

        # Process completed batches
        for batch_complete in completed_batches:
            batch_id = batch_complete.batch_id
            chunks_added = self._pending_batches.pop(batch_id, 0)
            upload_type = self._batch_upload_types.pop(batch_id, batch_complete.upload_type)
            if isinstance(upload_type, tuple):
                upload_type = upload_type[0]  # Handle legacy format
            print(f"Batch {batch_id} complete ({chunks_added} chunks).")

            if self._on_batch_complete:
                self._on_batch_complete(upload_type)

    def cleanup(self) -> None:
        """
        Clean up resources before shutdown.
        Terminates the background worker process gracefully.
        """
        print("Shutting down background worker...")
        try:
            # Send shutdown signal
            self._worker_input_queue.put(None)
            # Wait for worker to finish
            self._worker_process.join(timeout=2.0)
            if self._worker_process.is_alive():
                print("Worker did not exit in time, terminating...")
                self._worker_process.terminate()
                self._worker_process.join(timeout=1.0)
        except Exception as e:
            print(f"Error during cleanup: {e}")
        print("Cleanup complete.")
