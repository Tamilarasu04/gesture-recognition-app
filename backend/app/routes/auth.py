from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services.auth_service import login_user, register_user
from app.utils.errors import APIError

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")
    name = data.get("name", "").strip()
    result = register_user(email, password, name)
    return jsonify({"success": True, "data": result}), 201


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")
    if not email or not password:
        raise APIError("Email and password are required", 400)
    result = login_user(email, password)
    return jsonify({"success": True, "data": result})


@auth_bp.route("/auth/me", methods=["GET"])
@jwt_required()
def me():
    return jsonify({"success": True, "data": {"user_id": get_jwt_identity()}})
