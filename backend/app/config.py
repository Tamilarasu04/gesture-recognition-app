import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_EXPIRE_HOURS", "24")))

    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/gesture_app")
    MONGODB_DB = os.getenv("MONGODB_DB", "gesture_app")

    _DEFAULT_MODEL = BASE_DIR / "models" / "gesture_only_model.joblib"
    _FALLBACK_MODEL = Path(r"C:\Users\DELL\Desktop\gesture_output\models\gesture_only_model.joblib")
    _DEFAULT_ENCODER = BASE_DIR / "models" / "gesture_label_encoder.joblib"
    _FALLBACK_ENCODER = Path(r"C:\Users\DELL\Desktop\gesture_output\models\gesture_label_encoder.joblib")

    MODEL_PATH = os.getenv(
        "MODEL_PATH",
        str(_DEFAULT_MODEL if _DEFAULT_MODEL.exists() else _FALLBACK_MODEL),
    )
    LABEL_ENCODER_PATH = os.getenv(
        "LABEL_ENCODER_PATH",
        str(_DEFAULT_ENCODER if _DEFAULT_ENCODER.exists() else _FALLBACK_ENCODER),
    )

    GOOGLE_TRANSLATE_API_KEY = os.getenv("GOOGLE_TRANSLATE_API_KEY", "")
    TRANSLATION_PROVIDER = os.getenv("TRANSLATION_PROVIDER", "google")  # google | deep_translator

    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,https://*.vercel.app",
    )

    RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "120 per minute")
    PREDICTION_CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.55"))

    GESTURE_LABELS = {
        "ok": "OK",
        "like": "I like this",
        "dislike": "I dislike this",
        "stop": "Stop",
        "hello": "Hello",
        "call_me": "Call me",
        "one": "One",
        "two": "Two",
        "three": "Three",
        "rock": "Rock on",
        "mute": "Mute",
    }

    SUPPORTED_LANGUAGES = {
        "en": "English",
        "ta": "Tamil",
        "hi": "Hindi",
        "te": "Telugu",
        "ml": "Malayalam",
        "kn": "Kannada",
        "bn": "Bengali",
        "fr": "French",
        "es": "Spanish",
        "ar": "Arabic",
        "ja": "Japanese",
        "ko": "Korean",
        "zh-cn": "Chinese (Simplified)",
    }
