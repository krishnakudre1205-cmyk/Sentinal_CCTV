from abc import ABC, abstractmethod
import cv2
import numpy as np
from typing import List, Tuple, Dict, Any


class BaseVisualEmbedder(ABC):
    """
    Abstract Modular Interface for Vehicle Visual Appearance Embedding Extraction.
    Allows lightweight default color/texture embedder or heavy deep Re-ID models
    (e.g., ResNet-50 / OSNet / CLIP) to be plugged in seamlessly.
    """

    @abstractmethod
    def extract_visual_embedding(self, vehicle_crop: np.ndarray) -> List[float]:
        """Extracts a normalized N-dimensional feature vector representing visual appearance."""
        pass

    @abstractmethod
    def detect_dominant_color(self, vehicle_crop: np.ndarray) -> Tuple[str, float]:
        """Detects dominant vehicle color and confidence score."""
        pass


class LightweightColorEmbedder(BaseVisualEmbedder):
    """
    Default lightweight L2-normalized visual embedder using HSV chrominance spectrum
    histograms, spatial moment descriptors, and color space classification.
    Runs 100% locally with zero external heavy model overhead.
    """

    def __init__(self, embedding_dim: int = 128):
        self.embedding_dim = embedding_dim

    def extract_visual_embedding(self, vehicle_crop: np.ndarray) -> List[float]:
        """
        Extracts a 128-dimensional L2-normalized visual feature vector
        from HSV color distribution histograms and structural spatial moments.
        """
        if vehicle_crop is None or vehicle_crop.size == 0:
            return [0.0] * self.embedding_dim

        # Resize for consistent feature extraction
        resized = cv2.resize(vehicle_crop, (128, 128))
        hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV)

        # 1. HSV Histograms (H: 32, S: 16, V: 16 = 64 dimensions)
        h_hist = cv2.calcHist([hsv], [0], None, [32], [0, 180]).flatten()
        s_hist = cv2.calcHist([hsv], [1], None, [16], [0, 256]).flatten()
        v_hist = cv2.calcHist([hsv], [2], None, [16], [0, 256]).flatten()

        color_feat = np.concatenate([h_hist, s_hist, v_hist])
        color_feat = color_feat / (np.linalg.norm(color_feat) + 1e-7)

        # 2. Structural Gray Spatial Moments (64 dimensions)
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        blocks = []
        for r in range(4):
            for c in range(4):
                block = gray[r*32:(r+1)*32, c*32:(c+1)*32]
                blocks.append(np.mean(block))
                blocks.append(np.std(block))
                blocks.append(np.median(block))
                blocks.append(float(np.percentile(block, 75)))
        spatial_feat = np.array(blocks, dtype=np.float32)
        spatial_feat = spatial_feat / (np.linalg.norm(spatial_feat) + 1e-7)

        # Combine into 128-dim vector
        raw_vec = np.concatenate([color_feat, spatial_feat])
        if len(raw_vec) < self.embedding_dim:
            raw_vec = np.pad(raw_vec, (0, self.embedding_dim - len(raw_vec)))
        elif len(raw_vec) > self.embedding_dim:
            raw_vec = raw_vec[:self.embedding_dim]

        # Final L2-normalization
        norm_vec = raw_vec / (np.linalg.norm(raw_vec) + 1e-7)
        return [round(float(v), 5) for v in norm_vec]

    def detect_dominant_color(self, vehicle_crop: np.ndarray) -> Tuple[str, float]:
        """
        Classifies dominant vehicle color (white, black, silver, red, blue, yellow, green, orange).
        """
        if vehicle_crop is None or vehicle_crop.size == 0:
            return "unknown", 0.5

        resized = cv2.resize(vehicle_crop, (100, 100))
        hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV)

        # Crop central body 60% region to exclude background street/sky
        center = hsv[20:80, 20:80]
        h_channel = center[:, :, 0]
        s_channel = center[:, :, 1]
        v_channel = center[:, :, 2]

        mean_v = np.mean(v_channel)
        mean_s = np.mean(s_channel)
        mean_h = np.mean(h_channel)

        if mean_v < 60:
            return "black", 0.92
        elif mean_v > 200 and mean_s < 40:
            return "white", 0.94
        elif mean_s < 45 and 60 <= mean_v <= 200:
            return "silver", 0.88
        else:
            # Hue color ranges
            if mean_h < 12 or mean_h > 165:
                return "red", 0.90
            elif 12 <= mean_h < 25:
                return "orange", 0.88
            elif 25 <= mean_h < 35:
                return "yellow", 0.91
            elif 35 <= mean_h < 85:
                return "green", 0.89
            elif 85 <= mean_h < 140:
                return "blue", 0.93
            else:
                return "purple", 0.85


# ==============================================================================
# PLUGGABLE DEEP RE-ID EXTENSION POINT
# ==============================================================================
# To use a deep Metric Re-ID model (e.g. ResNet-50 / OSNet / CLIP), implement:
#
# class HeavyReIDEmbedder(BaseVisualEmbedder):
#     def __init__(self, model_weights_path: str):
#         self.model = load_torch_osnet_model(model_weights_path)
#
#     def extract_visual_embedding(self, vehicle_crop: np.ndarray) -> List[float]:
#         return self.model.forward_embedding(vehicle_crop)
# ==============================================================================

# Singleton instance
default_visual_embedder = LightweightColorEmbedder()
