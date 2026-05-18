import threading
from pathlib import Path

import joblib
import numpy as np

from app.config import Config
from app.utils.errors import APIError

_model_lock = threading.Lock()
_classifier = None
_label_encoder = None

# Same mapping as your gesture_webapp/app.py
MEANING_MAP = {
    "G_ok": "OK",
    "G_like": "I like this",
    "G_dislike": "I dislike this",
    "G_palm": "Stop",
    "G_fist": "Hello",
    "G_one": "One",
    "G_two_up": "Two",
    "G_three": "Three",
    "G_rock": "Rock",
    "G_stop": "Stop",
    "G_call": "Call me",
    "G_mute": "Mute",
}


def _landmarks_to_features(landmarks: list) -> np.ndarray:
    """
    Flatten 21 landmarks to 63 features: x0,y0,z0 ... x20,y20,z20
    (raw MediaPipe coords — must match training in gesture_dataset.csv)
    """
    coords = []
    for pt in landmarks:
        if isinstance(pt, dict):
            coords.extend([float(pt.get("x", 0)), float(pt.get("y", 0)), float(pt.get("z", 0))])
        else:
            seq = list(pt)
            coords.extend([float(seq[0]), float(seq[1]), float(seq[2] if len(seq) > 2 else 0)])
    if len(coords) != 63:
        raise APIError(f"Expected 63 values (21x3), got {len(coords)}", 400)
    return np.array(coords, dtype=np.float32).reshape(1, -1)


def load_model():
    global _classifier, _label_encoder
    with _model_lock:
        if _classifier is not None:
            return

        model_path = Path(Config.MODEL_PATH)
        encoder_path = Path(Config.LABEL_ENCODER_PATH)

        if not model_path.exists():
            raise APIError(f"Model not found: {model_path}", 503)
        if not encoder_path.exists():
            raise APIError(f"Label encoder not found: {encoder_path}", 503)

        _classifier = joblib.load(model_path)
        _label_encoder = joblib.load(encoder_path)


def predict_gesture(landmarks: list) -> dict:
    load_model()
    features = _landmarks_to_features(landmarks)

    with _model_lock:
        pred = _classifier.predict(features)[0]
        proba = _classifier.predict_proba(features)[0]
        label = _label_encoder.inverse_transform([pred])[0]
        confidence = float(np.max(proba))

    english_text = MEANING_MAP.get(label, label.replace("G_", "").replace("_", " ").title())
    display_name = label.replace("G_", "").replace("_", " ")

    return {
        "gesture": label,
        "gesture_key": label.lower(),
        "display_name": display_name,
        "english_text": english_text,
        "confidence": round(confidence * 100, 2),
        "is_confident": confidence >= Config.PREDICTION_CONFIDENCE_THRESHOLD,
        "probabilities": {
            _label_encoder.inverse_transform([i])[0]: round(float(p) * 100, 2)
            for i, p in enumerate(proba)
        },
    }
