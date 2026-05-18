import os

bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"
workers = int(os.getenv("WEB_CONCURRENCY", "2"))
threads = int(os.getenv("GUNICORN_THREADS", "4"))
timeout = int(os.getenv("GUNICORN_TIMEOUT", "120"))
worker_class = "gthread"
preload_app = True
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info")
