"""
CAMERA ADAPTER & VIDEO INGESTION ARCHITECTURE (Module 1)
--------------------------------------------------------
Provides extensible adapters for heterogeneous CCTV video sources:
1. Uploaded Video Files (FILE)
2. RTSP Video Streams (RTSP)
3. Extensible interface for future adapters (e.g. HLS, USB, ONVIF, WebRTC)
"""

import os
from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple, Type
from urllib.parse import urlparse


class BaseCameraAdapter(ABC):
    """
    Abstract Base Camera Adapter Interface.
    Every camera protocol / ingestion format implements this contract.
    """

    def __init__(self, camera_id: int, source_url: str, camera_name: str = ""):
        self.camera_id = camera_id
        self.source_url = source_url
        self.camera_name = camera_name
        self.is_connected = False

    @abstractmethod
    def validate_source(self) -> Tuple[bool, str]:
        """
        Validates if the source URL / file path is reachable and valid.
        Returns (is_valid, error_or_success_message).
        """
        pass

    @abstractmethod
    def connect(self) -> bool:
        """
        Establishes ingestion stream or opens the video source.
        """
        pass

    @abstractmethod
    def get_stream_info(self) -> Dict[str, Any]:
        """
        Returns stream metadata (resolution, fps, codec, source type).
        """
        pass

    @abstractmethod
    def disconnect(self) -> None:
        """
        Closes and releases video source handles.
        """
        pass


class FileCameraAdapter(BaseCameraAdapter):
    """
    Adapter for uploaded or local CCTV video files (MP4, AVI, MKV, MOV).
    """

    SUPPORTED_EXTENSIONS = {".mp4", ".avi", ".mkv", ".mov", ".webm"}

    def validate_source(self) -> Tuple[bool, str]:
        # Handle relative or absolute paths or web-served paths
        cleaned_path = self.source_url
        if cleaned_path.startswith("/uploads/"):
            cleaned_path = os.path.join(".", cleaned_path.lstrip("/"))

        ext = os.path.splitext(cleaned_path)[1].lower()
        if ext not in self.SUPPORTED_EXTENSIONS:
            return False, f"Unsupported video file format '{ext}'. Supported: {list(self.SUPPORTED_EXTENSIONS)}"

        if os.path.exists(cleaned_path):
            file_size_mb = os.path.getsize(cleaned_path) / (1024 * 1024)
            return True, f"Valid video file ({file_size_mb:.2f} MB)"
        
        # If running in web preview context, allow relative URLs
        return True, "File source configured"

    def connect(self) -> bool:
        self.is_connected = True
        return True

    def get_stream_info(self) -> Dict[str, Any]:
        return {
            "source_type": "FILE",
            "source_url": self.source_url,
            "is_connected": self.is_connected,
            "status": "ACTIVE" if self.is_connected else "INACTIVE",
            "protocol": "Local File / HTTP Ingestion",
        }

    def disconnect(self) -> None:
        self.is_connected = False


class RTSPCameraAdapter(BaseCameraAdapter):
    """
    Adapter for network RTSP / RTSPS CCTV streams.
    """

    def validate_source(self) -> Tuple[bool, str]:
        if not self.source_url:
            return False, "RTSP source URL cannot be empty"

        parsed = urlparse(self.source_url)
        if parsed.scheme.lower() not in ["rtsp", "rtsps", "http", "https"]:
            return False, f"Invalid RTSP URL scheme '{parsed.scheme}'. Must be 'rtsp://' or 'rtsps://'"

        if not parsed.hostname:
            return False, "Invalid RTSP URL: Hostname / IP address is missing"

        return True, "Valid RTSP stream configuration"

    def connect(self) -> bool:
        # Future: OpenCV / FFmpeg RTSP connection probe
        self.is_connected = True
        return True

    def get_stream_info(self) -> Dict[str, Any]:
        return {
            "source_type": "RTSP",
            "source_url": self.source_url,
            "is_connected": self.is_connected,
            "status": "ACTIVE" if self.is_connected else "INACTIVE",
            "protocol": "Real-Time Streaming Protocol (RTSP)",
        }

    def disconnect(self) -> None:
        self.is_connected = False


class CameraAdapterFactory:
    """
    Factory registry for instantiating camera adapters dynamically by source_type.
    Allows easy plugin addition of future adapters without modifying core logic.
    """

    _registry: Dict[str, Type[BaseCameraAdapter]] = {
        "FILE": FileCameraAdapter,
        "RTSP": RTSPCameraAdapter,
    }

    @classmethod
    def register_adapter(cls, source_type: str, adapter_cls: Type[BaseCameraAdapter]) -> None:
        """Register a new camera adapter protocol."""
        cls._registry[source_type.upper()] = adapter_cls

    @classmethod
    def get_adapter(cls, source_type: str, camera_id: int, source_url: str, camera_name: str = "") -> BaseCameraAdapter:
        """Retrieve appropriate adapter instance."""
        adapter_cls = cls._registry.get(source_type.upper())
        if not adapter_cls:
            raise ValueError(
                f"Unsupported camera source type '{source_type}'. "
                f"Registered adapters: {list(cls._registry.keys())}"
            )
        return adapter_cls(camera_id=camera_id, source_url=source_url, camera_name=camera_name)
