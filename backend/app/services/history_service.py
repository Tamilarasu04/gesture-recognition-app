from datetime import datetime, timezone

from flask_jwt_extended import get_jwt_identity

from app.extensions import db


def save_gesture_history(user_id: str, record: dict) -> str | None:
    if db is None:
        return None
    doc = {
        "user_id": user_id,
        "gesture": record.get("gesture"),
        "english_text": record.get("english_text"),
        "confidence": record.get("confidence"),
        "translated_text": record.get("translated_text"),
        "language": record.get("language", "en"),
        "created_at": datetime.now(timezone.utc),
    }
    result = db.gesture_history.insert_one(doc)
    return str(result.inserted_id)


def save_translation_session(user_id: str, session_data: dict) -> str | None:
    if db is None:
        return None
    doc = {
        "user_id": user_id,
        "sentence": session_data.get("sentence"),
        "translations": session_data.get("translations", []),
        "language": session_data.get("language"),
        "created_at": datetime.now(timezone.utc),
    }
    result = db.translation_sessions.insert_one(doc)
    return str(result.inserted_id)


def get_user_history(user_id: str, limit: int = 50) -> list:
    if db is None:
        return []
    cursor = (
        db.gesture_history.find({"user_id": user_id})
        .sort("created_at", -1)
        .limit(limit)
    )
    items = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["created_at"] = doc["created_at"].isoformat()
        items.append(doc)
    return items


def get_analytics(user_id: str | None = None) -> dict:
    if db is None:
        return {"total_gestures": 0, "by_gesture": [], "by_language": [], "daily_counts": []}

    match = {"user_id": user_id} if user_id else {}

    pipeline_gesture = [
        {"$match": match},
        {"$group": {"_id": "$gesture", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    by_gesture = [
        {"gesture": g["_id"], "count": g["count"]}
        for g in db.gesture_history.aggregate(pipeline_gesture)
    ]

    pipeline_lang = [
        {"$match": match},
        {"$group": {"_id": "$language", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    by_language = [
        {"language": l["_id"] or "en", "count": l["count"]}
        for l in db.gesture_history.aggregate(pipeline_lang)
    ]

    pipeline_daily = [
        {"$match": match},
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}
                },
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
        {"$limit": 14},
    ]
    daily_counts = [
        {"date": d["_id"], "count": d["count"]}
        for d in db.gesture_history.aggregate(pipeline_daily)
    ]

    total = db.gesture_history.count_documents(match) if match else db.gesture_history.count_documents({})

    return {
        "total_gestures": total,
        "by_gesture": by_gesture,
        "by_language": by_language,
        "daily_counts": daily_counts,
    }
