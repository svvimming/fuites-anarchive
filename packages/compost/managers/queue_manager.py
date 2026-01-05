"""Upload queue and background processing management."""
import multiprocessing
import os
import threading
import uuid
import io
import numpy as np
import pygame
import pymunk
from queue import Queue, Empty
from typing import Dict, Any, List, Tuple, Callable, Optional

from processors import ChunkData, BatchComplete, background_loop
from utils.image_utils import scale_image_to_fit, resize_image_to_dimensions
from utils.logging_utils import get_logger
from entities import Chunk

_logger = get_logger(__name__)


class QueueManager:
    """Manages queues for async upload and background processing."""

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

        # File dialog results queue (Dialog threads -> Main thread)
        self._dialog_queue: Queue[Tuple[str, Any]] = Queue()
        self._dialog_open = False

        # Background processing queues (Main <-> Background process)
        self._task_queue: multiprocessing.Queue = multiprocessing.Queue()
        self._results_queue: multiprocessing.Queue = multiprocessing.Queue()

        # Batch tracking
        self._pending_batches: Dict[str, int] = {}  # batch_id -> chunks remaining
        self._batch_upload_types: Dict[str, str] = {}  # batch_id -> upload_type

        # Chunks list reference (will be set by simulation)
        self.chunks: List[Chunk] = []

        # Callback for batch completion
        self._on_batch_complete: Optional[Callable[[str], None]] = None

        # Start background process
        self._background_process = multiprocessing.Process(
            target=background_loop,
            args=(self._task_queue, self._results_queue, config),
            daemon=True
        )
        self._background_process.start()

    def set_chunks_list(self, chunks: List[Chunk]) -> None:
        """Set reference to the main chunks list."""
        self.chunks = chunks

    def set_batch_complete_callback(self, callback: Callable[[str], None]) -> None:
        """Set callback for when a batch completes processing."""
        self._on_batch_complete = callback

    def on_upload_received(
        self,
        image_bytes: bytes,
        target_width: Optional[int] = None,
        target_height: Optional[int] = None
    ) -> None:
        """
        Handle incoming image upload (callback from HTTP server).

        Args:
            image_bytes: Raw image data
            target_width: Optional target width
            target_height: Optional target height
        """
        if image_bytes:
            self._upload_queue.put((image_bytes, target_width, target_height))

    def _load_and_submit_image(
        self,
        image_bytes: bytes,
        target_width: Optional[int] = None,
        target_height: Optional[int] = None
    ) -> bool:
        """
        Load image from raw bytes and submit for processing.

        Args:
            image_bytes: Raw image data
            target_width: Optional target width
            target_height: Optional target height

        Returns:
            True if submission succeeded, False otherwise
        """
        try:
            bytes_io = io.BytesIO(image_bytes)
            image = pygame.image.load(bytes_io).convert_alpha()
        except Exception as exc:
            _logger.warning("Failed to load image from bytes: %s", exc)
            return False

        self.submit_image(image, target_width, target_height)
        return True

    def submit_image(
        self,
        image: pygame.Surface,
        target_width: Optional[int] = None,
        target_height: Optional[int] = None
    ) -> None:
        """
        Submit an image for background segmentation processing.

        Args:
            image: Loaded image surface to process
            target_width: Optional target width
            target_height: Optional target height
        """
        # Scale the image to fit the screen (fast, keep on main thread)
        max_width = self.width
        max_height = self.height

        if target_width is not None and target_height is not None:
            _logger.debug("Using target dimensions: %dx%d", target_width, target_height)
            image = resize_image_to_dimensions(image, target_width, target_height, max_width, max_height)
        else:
            _logger.debug("Scaling to fit screen: %dx%d", max_width, max_height)
            image = scale_image_to_fit(image, max_width, max_height)

        _logger.debug("Image scaled to %s, sending to background", image.get_size())

        # Convert pygame surface to numpy RGBA array
        try:
            rgb_array = pygame.surfarray.array3d(image).swapaxes(0, 1)  # (H, W, 3)
            alpha_array = pygame.surfarray.array_alpha(image).swapaxes(0, 1)  # (H, W)
            # Combine into RGBA
            image_rgba = np.dstack((rgb_array, alpha_array))  # (H, W, 4)
        except Exception as e:
            _logger.warning("Failed to convert image to array: %s", e)
            return

        # Generate unique batch ID
        batch_id = str(uuid.uuid4())[:8]
        self._batch_upload_types[batch_id] = "image"

        # Send to background process
        self._task_queue.put(("image", image_rgba, image.get_size(), batch_id))
        _logger.info("Image batch %s queued for processing", batch_id)

    def submit_audio(self, audio_path: str) -> None:
        """
        Submit an audio file for background segmentation processing.

        Args:
            audio_path: Path to the audio file
        """
        import os
        # Generate unique batch ID
        batch_id = str(uuid.uuid4())[:8]
        self._batch_upload_types[batch_id] = "sound"

        # Send to background process
        self._task_queue.put(("sound", audio_path, batch_id))
        _logger.info("Sound batch %s queued: %s", batch_id, os.path.basename(audio_path))

    # ----------------------------------------------------------------
    # Non-blocking file dialog (native macOS via osascript)
    # ----------------------------------------------------------------
    IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.bmp', '.heic', '.gif'}
    AUDIO_EXTS = {'.wav', '.mp3', '.flac', '.ogg', '.m4a', '.aac', '.aiff'}

    def open_file_dialog(self) -> None:
        """Open file dialog for image or audio (non-blocking)."""
        if self._dialog_open:
            return
        self._dialog_open = True

        def _run():
            import subprocess
            script = 'POSIX path of (choose file of type {"public.image", "public.audio"} with prompt "Select an image or audio file")'
            try:
                result = subprocess.run(
                    ["osascript", "-e", script],
                    capture_output=True, text=True, timeout=120
                )
                path = result.stdout.strip()
                if path and os.path.exists(path):
                    ext = os.path.splitext(path)[1].lower()
                    if ext in self.IMAGE_EXTS:
                        if ext == '.heic':
                            import pillow_heif
                            pillow_heif.register_heif_opener()
                            from PIL import Image
                            pil_img = Image.open(path).convert("RGBA")
                            surface = pygame.image.fromstring(pil_img.tobytes(), pil_img.size, "RGBA")
                        else:
                            surface = pygame.image.load(path).convert_alpha()
                        self._dialog_queue.put(("image", surface))
                    elif ext in self.AUDIO_EXTS:
                        self._dialog_queue.put(("audio", path))
                    else:
                        _logger.warning("Unknown file type: %s", ext)
            except subprocess.TimeoutExpired:
                pass
            except Exception as e:
                _logger.warning("File dialog error: %s", e)
            finally:
                self._dialog_open = False

        threading.Thread(target=_run, daemon=True).start()

    def process_dialogs(self) -> None:
        """Process completed file dialog results. Call from main loop."""
        while True:
            try:
                kind, data = self._dialog_queue.get_nowait()
                if kind == "image":
                    self.submit_image(data, None, None)
                elif kind == "audio":
                    self.submit_audio(data)
            except Empty:
                break

    def _process_pending_uploads(self, max_items: int = 4) -> None:
        """
        Process pending uploads from the upload queue.

        Args:
            max_items: Maximum items to process per call
        """
        processed = 0
        while processed < max_items:
            try:
                data_tuple = self._upload_queue.get_nowait()
            except Empty:
                break
            try:
                image_bytes, target_width, target_height = data_tuple
                self._load_and_submit_image(image_bytes, target_width, target_height)
            finally:
                processed += 1

    def receive_chunks(self, max_items: int = 15) -> None:
        """
        Receive processed chunks from background and create physics bodies.
        Call this each frame to integrate completed chunks without blocking.

        Args:
            max_items: Maximum chunks to integrate per frame (controls gradual appearance)
        """
        processed = 0
        completed_batches = []  # Collect BatchComplete markers

        while processed < max_items:
            try:
                item = self._results_queue.get_nowait()
            except Empty:
                break

            if isinstance(item, BatchComplete):
                # Queue is FIFO, so all chunks for this batch are already on the queue
                # We might not have processed them all yet, so store the marker
                completed_batches.append(item)
            elif isinstance(item, ChunkData):
                # Create chunk from segment data
                chunk = Chunk.from_segment(
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
                _logger.warning("Unknown item type from background: %s", type(item))
                processed += 1

        # Process completed batches
        for batch_complete in completed_batches:
            batch_id = batch_complete.batch_id
            chunks_added = self._pending_batches.pop(batch_id, 0)
            upload_type = self._batch_upload_types.pop(batch_id, batch_complete.upload_type)
            if isinstance(upload_type, tuple):
                upload_type = upload_type[0]  # Handle legacy format
            _logger.info("Batch %s complete (%d chunks)", batch_id, chunks_added)

            if self._on_batch_complete:
                self._on_batch_complete(upload_type)

    def cleanup(self) -> None:
        """
        Clean up resources before shutdown.
        Terminates the background process gracefully.
        """
        _logger.info("Shutting down background process...")
        try:
            # Send shutdown signal
            self._task_queue.put(None)
            # Wait for background process to finish
            self._background_process.join(timeout=2.0)
            if self._background_process.is_alive():
                _logger.warning("Background process did not exit in time, terminating")
                self._background_process.terminate()
                self._background_process.join(timeout=1.0)
        except Exception as e:
            _logger.warning("Error during cleanup: %s", e)
        _logger.info("Cleanup complete")
