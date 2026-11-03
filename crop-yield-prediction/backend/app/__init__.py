import logging

from flask import Flask
from flask_cors import CORS

from app.errors import register_error_handlers
from app.extensions import db
from app.routes import register_routes
from app.services import ModelService


def create_app(config_overrides=None, model_service=None):
    """Application factory. `model_service` lets tests inject a mock model."""
    from config import Config

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    app = Flask(__name__)
    app.config.from_object(Config)
    if config_overrides:
        app.config.update(config_overrides)

    CORS(app, resources={r"/api/*": {"origins": [app.config["FRONTEND_ORIGIN"]]}}, methods=["GET", "POST", "DELETE"])
    db.init_app(app)

    svc = model_service or ModelService(app.config["MODEL_PATH"], app.config["MODEL_METADATA_PATH"]).load()
    app.extensions["model_service"] = svc

    register_error_handlers(app)
    register_routes(app)

    if app.config["AUTO_CREATE_TABLES"]:
        with app.app_context():
            from app import models  # noqa: F401  (register tables)
            try:
                db.create_all()
            except Exception as exc:  # DB may be down; /api/health will report it
                app.logger.error("Could not create tables: %s", exc.__class__.__name__)
    return app
