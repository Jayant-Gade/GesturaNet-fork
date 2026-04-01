import os
import urllib.request

import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python.vision import (
    HandLandmarker,
    HandLandmarkerOptions,
    RunningMode,
)

from config import MODEL_PATH, MODEL_URL


def _download_model_if_needed():
    if not os.path.exists(MODEL_PATH):
        print("[MediaPipe] Downloading hand landmarker model...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print("[MediaPipe] Model downloaded ✓")


def create_hand_landmarker() -> HandLandmarker: # type: ignore
    """Download the model if needed and return a configured HandLandmarker."""
    _download_model_if_needed()

    options = HandLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=RunningMode.IMAGE,
        num_hands=2,
        min_hand_detection_confidence=0.7,
        min_hand_presence_confidence=0.7,
        min_tracking_confidence=0.7,
    )
    return HandLandmarker.create_from_options(options)


# Module-level singleton — import `hands` directly where needed
hands = create_hand_landmarker()
