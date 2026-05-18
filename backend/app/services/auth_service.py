from datetime import datetime, timezone

import bcrypt
from flask_jwt_extended import create_access_token

from app.extensions import db
from app.utils.errors import APIError


def _users_collection():
    if db is None:
        return None
    return db.users


def register_user(email: str, password: str, name: str) -> dict:
    if not email or not password:
        raise APIError("Email and password are required", 400)
    if len(password) < 6:
        raise APIError("Password must be at least 6 characters", 400)

    users = _users_collection()
    if users is None:
        raise APIError("Database unavailable. Set MONGODB_URI.", 503)

    if users.find_one({"email": email.lower()}):
        raise APIError("Email already registered", 409)

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    doc = {
        "email": email.lower(),
        "name": name or email.split("@")[0],
        "password": hashed,
        "created_at": datetime.now(timezone.utc),
    }
    result = users.insert_one(doc)
    token = create_access_token(identity=str(result.inserted_id))
    return {
        "user": {"id": str(result.inserted_id), "email": doc["email"], "name": doc["name"]},
        "access_token": token,
    }


def login_user(email: str, password: str) -> dict:
    users = _users_collection()
    if users is None:
        raise APIError("Database unavailable. Set MONGODB_URI.", 503)

    user = users.find_one({"email": email.lower()})
    if not user:
        raise APIError("Invalid credentials", 401)

    if not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        raise APIError("Invalid credentials", 401)

    token = create_access_token(identity=str(user["_id"]))
    return {
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name", ""),
        },
        "access_token": token,
    }
