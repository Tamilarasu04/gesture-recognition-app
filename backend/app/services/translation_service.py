from collections import OrderedDict

from app.config import Config
from app.utils.errors import APIError

# deep-translator / googletrans language code mapping
LANG_MAP = {
    "zh-cn": "zh-CN",
    "zh": "zh-CN",
}

_TRANSLATION_CACHE: OrderedDict = OrderedDict()
_CACHE_MAX = 300


def _cache_get(key):
    if key in _TRANSLATION_CACHE:
        _TRANSLATION_CACHE.move_to_end(key)
        return _TRANSLATION_CACHE[key]
    return None


def _cache_set(key, value):
    _TRANSLATION_CACHE[key] = value
    _TRANSLATION_CACHE.move_to_end(key)
    while len(_TRANSLATION_CACHE) > _CACHE_MAX:
        _TRANSLATION_CACHE.popitem(last=False)


def translate_text(text: str, target_lang: str, source_lang: str = "en") -> dict:
    if not text or not text.strip():
        raise APIError("Text is required for translation", 400)

    if target_lang not in Config.SUPPORTED_LANGUAGES:
        raise APIError(f"Unsupported language: {target_lang}", 400)

    if target_lang == source_lang or target_lang == "en":
        return {
            "original_text": text,
            "translated_text": text,
            "source_language": source_lang,
            "target_language": target_lang,
            "provider": "none",
        }

    cache_key = (text.strip().lower(), target_lang, source_lang)
    cached = _cache_get(cache_key)
    if cached:
        return cached

    provider = Config.TRANSLATION_PROVIDER
    errors = []

    if provider == "google" and Config.GOOGLE_TRANSLATE_API_KEY:
        try:
            result = _translate_google_api(text, target_lang, source_lang)
            _cache_set(cache_key, result)
            return result
        except Exception as exc:
            errors.append(f"google_api: {exc}")

    try:
        result = _translate_googletrans(text, target_lang, source_lang)
        _cache_set(cache_key, result)
        return result
    except Exception as exc:
        errors.append(f"googletrans: {exc}")

    try:
        result = _translate_deep_translator(text, target_lang, source_lang)
        _cache_set(cache_key, result)
        return result
    except Exception as exc:
        errors.append(f"deep_translator: {exc}")

    raise APIError(
        "Translation failed. Check internet connection. " + "; ".join(errors),
        502,
    )


def _translate_google_api(text: str, target_lang: str, source_lang: str) -> dict:
    import requests

    url = "https://translation.googleapis.com/language/translate/v2"
    params = {"key": Config.GOOGLE_TRANSLATE_API_KEY}
    payload = {
        "q": text,
        "target": target_lang,
        "source": source_lang,
        "format": "text",
    }
    resp = requests.post(url, params=params, json=payload, timeout=15)
    if resp.status_code != 200:
        raise APIError(f"Google Translate API error: {resp.text}", 502)

    data = resp.json()
    translated = data["data"]["translations"][0]["translatedText"]
    return _result(text, translated, source_lang, target_lang, "google")


def _translate_googletrans(text: str, target_lang: str, source_lang: str) -> dict:
    """Same library as your gesture_webapp/app.py."""
    from googletrans import Translator

    dest = LANG_MAP.get(target_lang, target_lang)
    src = "auto" if source_lang == "en" else LANG_MAP.get(source_lang, source_lang)
    translator = Translator()
    result = translator.translate(text, dest=dest, src=src)
    translated = result.text
    if not translated:
        raise APIError("googletrans returned empty text", 502)
    return _result(text, translated, source_lang, target_lang, "googletrans")


def _translate_deep_translator(text: str, target_lang: str, source_lang: str) -> dict:
    from deep_translator import GoogleTranslator

    tgt = LANG_MAP.get(target_lang, target_lang)
    src = LANG_MAP.get(source_lang, source_lang)
    translated = GoogleTranslator(source=src, target=tgt).translate(text)
    if not translated:
        raise APIError("deep_translator returned empty text", 502)
    return _result(text, translated, source_lang, target_lang, "deep_translator")


def _result(text, translated, source_lang, target_lang, provider):
    return {
        "original_text": text,
        "translated_text": translated,
        "source_language": source_lang,
        "target_language": target_lang,
        "provider": provider,
    }
