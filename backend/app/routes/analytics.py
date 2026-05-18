from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services.history_service import get_analytics, get_user_history

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/analytics", methods=["GET"])
@jwt_required(optional=True)
def analytics():
    user_id = get_jwt_identity()
    data = get_analytics(user_id)
    return jsonify({"success": True, "data": data})


@analytics_bp.route("/history", methods=["GET"])
@jwt_required(optional=True)
def history():
    user_id = get_jwt_identity()
    limit = min(int(request.args.get("limit", 50)), 200)
    if not user_id:
        return jsonify({"success": True, "data": []})
    items = get_user_history(user_id, limit)
    return jsonify({"success": True, "data": items})
