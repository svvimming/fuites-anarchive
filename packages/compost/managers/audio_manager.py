"""Audio playback system with proximity-based volume."""
import pygame
import math
import os
import random
from typing import Dict, Set, Tuple, Any, List


class AudioManager:
    """Manages proximity-based audio playback for sound chunks."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the audio manager.

        Args:
            config: Global configuration dict
        """
        self.config = config
        self.playing_chunks: Dict = {}  # {chunk: channel}
        self.chunk_volumes: Dict = {}   # {chunk: volume}
        self.last_hovered_chunks: Set = set()
        self.sound_cache: Dict[str, pygame.mixer.Sound] = {}  # {path: Sound}

        # Initialize pygame mixer for audio playback with multiple channels
        try:
            pygame.mixer.init(frequency=22050, size=-16, channels=2, buffer=2048)
            pygame.mixer.set_num_channels(256)  # Allow up to 256 simultaneous sounds
            print("Audio mixer initialized successfully with 256 channels (buffer: 2048)")
        except pygame.error as e:
            print(f"Failed to initialize audio mixer: {e}")

    def handle_audio_hover(self, mouse_pos: Tuple[int, int], chunks: List) -> None:
        """
        Handle proximity-based audio playback for sound chunks using inverse square law.
        All sound chunks within max_distance play simultaneously with volume based on distance.

        Args:
            mouse_pos: (x, y) mouse position
            chunks: List of all chunks to check for audio
        """
        # Get hover configuration
        hover_cfg = self.config["sound"]["hover"]
        max_distance = hover_cfg["max_distance"]
        reference_distance = hover_cfg["reference_distance"]
        min_volume_threshold = hover_cfg["min_volume_threshold"]
        epsilon = 1.0  # Small value to prevent division by zero

        cursor_x, cursor_y = mouse_pos
        currently_playing = set(self.playing_chunks.keys())
        should_be_playing = set()

        # Iterate through all chunks with audio
        for chunk in chunks:
            if not chunk.audio_path:
                continue

            # Calculate distance from cursor to chunk center
            chunk_pos = chunk.body.position
            dx = cursor_x - chunk_pos.x
            dy = cursor_y - chunk_pos.y
            distance = math.sqrt(dx * dx + dy * dy)

            # Skip chunks beyond max distance
            if distance > max_distance:
                continue

            # Calculate volume using inverse square law
            # volume = (reference_distance^2) / (distance^2 + epsilon)
            distance_squared = distance * distance + epsilon
            volume = (reference_distance * reference_distance) / distance_squared

            # Clamp volume to [0, 1.0] range
            volume = max(0.0, min(1.0, volume))

            # Debug: print chunks that are skipped due to low volume
            if volume < min_volume_threshold:
                # Only print occasionally to avoid spam
                if random.random() < 0.01:  # 1% chance to print
                    print(f"Chunk skipped: volume {volume:.4f} below threshold {min_volume_threshold} (distance: {distance:.1f})")

            # Only play if volume is above threshold
            if volume >= min_volume_threshold:
                should_be_playing.add(chunk)

                if chunk in self.playing_chunks:
                    # Update volume for already playing chunk
                    channel = self.playing_chunks[chunk]
                    if channel:
                        channel.set_volume(volume)
                    self.chunk_volumes[chunk] = volume
                else:
                    # Start playing new chunk
                    try:
                        # Use cached Sound object if available, otherwise create and cache it
                        if chunk.audio_path not in self.sound_cache:
                            self.sound_cache[chunk.audio_path] = pygame.mixer.Sound(chunk.audio_path)
                        sound = self.sound_cache[chunk.audio_path]
                        channel = sound.play(loops=-1)  # Loop continuously
                        if channel:
                            channel.set_volume(volume)
                            self.playing_chunks[chunk] = channel
                            self.chunk_volumes[chunk] = volume
                            print(f"Playing audio: {os.path.basename(chunk.audio_path)} at volume {volume:.3f}")
                    except pygame.error as e:
                        print(f"Failed to play audio {chunk.audio_path}: {e}")
                    except Exception as e:
                        print(f"Unexpected error playing audio {chunk.audio_path}: {e}")

        # Stop chunks that are no longer in range or below threshold
        chunks_to_stop = currently_playing - should_be_playing
        for chunk in chunks_to_stop:
            if chunk in self.playing_chunks:
                channel = self.playing_chunks[chunk]
                if channel:
                    channel.stop()
                del self.playing_chunks[chunk]
                if chunk in self.chunk_volumes:
                    del self.chunk_volumes[chunk]
                print(f"Stopped audio: {os.path.basename(chunk.audio_path)}")

    def cleanup_finished_audio(self) -> None:
        """
        Clean up the playing_chunks dict by removing chunks whose audio channels have finished.
        This is lightweight and runs every frame to dynamically track individual completions.
        """
        # Create a list of chunks to remove (can't modify dict while iterating)
        finished_chunks = []

        for chunk, channel in self.playing_chunks.items():
            if not channel.get_busy():  # Channel is no longer playing
                finished_chunks.append(chunk)

        # Remove finished chunks from the tracking dict
        for chunk in finished_chunks:
            del self.playing_chunks[chunk]
            if chunk in self.chunk_volumes:
                del self.chunk_volumes[chunk]

    def stop_all(self) -> None:
        """Stop all playing audio."""
        for chunk, channel in list(self.playing_chunks.items()):
            if channel:
                channel.stop()
        self.playing_chunks.clear()
        self.chunk_volumes.clear()

    def get_volume(self, chunk) -> float:
        """Get the current volume for a chunk."""
        return self.chunk_volumes.get(chunk, 0.0)
