from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pymongo import MongoClient
from pymongo.errors import ConfigurationError

jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=[])
mongo_client = None
db = None


def init_mongo(app):
    global mongo_client, db
    uri = app.config["MONGODB_URI"]
    try:
        mongo_client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        mongo_client.admin.command("ping")
        db = mongo_client[app.config["MONGODB_DB"]]
        app.logger.info("MongoDB connected successfully")
    except (ConfigurationError, Exception) as exc:
        app.logger.warning("MongoDB unavailable: %s. Running without persistence.", exc)
        mongo_client = None
        db = None
