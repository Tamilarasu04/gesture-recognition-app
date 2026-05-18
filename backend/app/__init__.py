import os

from flask import Flask, jsonify
from flask_cors import CORS

from app.config import Config
from app.extensions import init_mongo, jwt, limiter
from app.routes.analytics import analytics_bp
from app.routes.auth import auth_bp
from app.routes.predict import predict_bp
from app.routes.speech import speech_bp
from app.routes.translate import translate_bp
from app.services.gesture_service import load_model
from app.utils.errors import register_error_handlers


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    origins = [o.strip() for o in app.config["CORS_ORIGINS"].split(",") if o.strip()]
    CORS(
        app,
        resources={r"/api/*": {"origins": origins}},
        supports_credentials=True,
    )

    jwt.init_app(app)
    limiter.init_app(app)
    limiter.default_limits = [app.config.get("RATE_LIMIT_DEFAULT", "120 per minute")]

    init_mongo(app)
    register_error_handlers(app)

    app.register_blueprint(predict_bp, url_prefix="/api")
    app.register_blueprint(translate_bp, url_prefix="/api")
    app.register_blueprint(speech_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")

    @app.route("/api/health", methods=["GET"])
    def health():
        try:
            load_model()
            model_status = "loaded"
        except Exception:
            model_status = "missing"

        return jsonify(
            {
                "success": True,
                "status": "healthy",
                "model": model_status,
                "mongodb": "connected" if app.extensions.get("mongo_connected") else "optional",
            }
        )

    @app.route("/", methods=["GET"])
    def root():
        return jsonify(
            {
                "name": "Gesture Recognition API",
                "version": "1.0.0",
                "docs": "/api/health",
            }
        )

    with app.app_context():
        try:
            load_model()
            app.logger.info("Gesture model loaded")
        except Exception as exc:
            app.logger.warning("Model not loaded at startup: %s", exc)

    return app
