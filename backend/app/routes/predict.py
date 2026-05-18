from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.config import Config
from app.services.gesture_service import predict_gesture
from app.services.history_service import save_gesture_history
from app.utils.errors import APIError

predict_bp = Blueprint("predict", __name__)


@predict_bp.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}
    landmarks = data.get("landmarks")

    if not landmarks or not isinstance(landmarks, list):
        raise APIError("landmarks array (21 points x,y,z) is required", 400)
    if len(landmarks) != 21:
        raise APIError(f"Expected 21 landmarks, got {len(landmarks)}", 400)

    result = predict_gesture(landmarks)
    return jsonify({"success": True, "data": result})


@predict_bp.route("/predict/sentence", methods=["POST"])
def build_sentence():
    from app.services.gesture_service import MEANING_MAP

    data = request.get_json(silent=True) or {}
    gestures = data.get("gestures", [])
    if not gestures:
        raise APIError("gestures list is required", 400)

    texts = []
    for g in gestures:
        label = str(g)
        texts.append(MEANING_MAP.get(label, Config.GESTURE_LABELS.get(label.lower(), label)))

    sentence = " ".join(texts)
    return jsonify({"success": True, "data": {"sentence": sentence, "gesture_count": len(texts)}})


@predict_bp.route("/predict/history", methods=["POST"])
@jwt_required(optional=True)
def predict_and_save():
    data = request.get_json(silent=True) or {}
    landmarks = data.get("landmarks")
    translated_text = data.get("translated_text")
    language = data.get("language", "en")

    if not landmarks:
        raise APIError("landmarks are required", 400)

    result = predict_gesture(landmarks)
    user_id = get_jwt_identity()
    history_id = None
    if user_id:
        record = {**result, "translated_text": translated_text, "language": language}
        history_id = save_gesture_history(user_id, record)

    return jsonify({"success": True, "data": {**result, "history_id": history_id}})
