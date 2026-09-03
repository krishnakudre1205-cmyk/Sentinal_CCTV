"""
VIDEO PROCESSOR SERVICE (Module 0 Placeholder)
----------------------------------------------
Architecture Role:
- Frame decoding, temporal subsampling (e.g. 5-10 FPS for AI inference).
- ROI (Region of Interest) cropping, timestamp synchronization, and frame queue management.

[FUTURE MODULE INTEGRATION]:
- Module 1: FFmpeg pipe decoding and multi-threaded frame queue.
- Motion detection pre-filter to reduce idle AI compute.
"""

from typing import Any, Generator, Optional


class VideoProcessor:
    def __init__(self, target_fps: int = 10, resize_dims: tuple = (1280, 720)):
        self.target_fps = target_fps
        self.resize_dims = resize_dims

    def process_stream(self, stream_source: Any) -> Generator[Any, None, None]:
        """
        [PLACEHOLDER] Process incoming raw frames and yield pre-processed frames for AI engine.
        """
        # Future: yield decoded, resized, and timestamped frames
        yield None
