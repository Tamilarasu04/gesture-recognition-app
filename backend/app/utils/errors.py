from flask import jsonify


class APIError(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload or {}

    def to_dict(self):
        data = {"success": False, "error": self.message}
        data.update(self.payload)
        return data


def register_error_handlers(app):
    @app.errorhandler(APIError)
    def handle_api_error(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"success": False, "error": "Resource not found"}), 404

    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return jsonify({"success": False, "error": "Rate limit exceeded", "detail": str(e)}), 429

    @app.errorhandler(500)
    def internal_error(_):
        return jsonify({"success": False, "error": "Internal server error"}), 500
