from flask import Blueprint, jsonify, request

from app.services.speech_service import generate_speech
from app.utils.errors import APIError

speech_bp = Blueprint("speech", __name__)


@speech_bp.route("/speech", methods=["POST"])
def speech():
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    language = data.get("language", "en")

    if not text:
        raise APIError("text is required", 400)

    result = generate_speech(text, language)
    return jsonify({"success": True, "data": result})
