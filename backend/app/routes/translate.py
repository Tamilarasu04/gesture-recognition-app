from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.config import Config
from app.services.history_service import save_translation_session
from app.services.translation_service import translate_text
from app.utils.errors import APIError

translate_bp = Blueprint("translate", __name__)


@translate_bp.route("/translate", methods=["POST"])
def translate():
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    target_lang = data.get("target_language", data.get("language", "en"))
    source_lang = data.get("source_language", "en")

    result = translate_text(text, target_lang, source_lang)
    return jsonify({"success": True, "data": result})


@translate_bp.route("/translate/languages", methods=["GET"])
def languages():
    return jsonify(
        {
            "success": True,
            "data": [
                {"code": code, "name": name}
                for code, name in Config.SUPPORTED_LANGUAGES.items()
            ],
        }
    )


@translate_bp.route("/translate/session", methods=["POST"])
@jwt_required()
def save_session():
    data = request.get_json(silent=True) or {}
    user_id = get_jwt_identity()
    session_id = save_translation_session(user_id, data)
    return jsonify({"success": True, "data": {"session_id": session_id}})
