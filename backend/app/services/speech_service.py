import base64
import io
import tempfile
from pathlib import Path

from gtts import gTTS

from app.config import Config
from app.utils.errors import APIError

LANG_MAP = {
    "zh-cn": "zh-cn",
    "zh": "zh-cn",
}


def generate_speech(text: str, language: str = "en") -> dict:
    if not text or not text.strip():
        raise APIError("Text is required for speech synthesis", 400)

    lang = LANG_MAP.get(language, language.split("-")[0])

    try:
        tts = gTTS(text=text, lang=lang, slow=False)
        buffer = io.BytesIO()
        tts.write_to_fp(buffer)
        buffer.seek(0)
        audio_b64 = base64.b64encode(buffer.read()).decode("utf-8")
        return {
            "audio_base64": audio_b64,
            "mime_type": "audio/mpeg",
            "language": lang,
            "text": text,
        }
    except Exception as exc:
        raise APIError(f"Speech generation failed: {exc}", 502) from exc
