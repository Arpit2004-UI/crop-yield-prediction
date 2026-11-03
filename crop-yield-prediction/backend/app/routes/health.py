from flask import Blueprint, current_app, jsonify
from sqlalchemy import text

from app.extensions import db

bp = Blueprint("health", __name__)


@bp.get("/health")
def health():
    svc = current_app.extensions["model_service"]
    try:
        db.session.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    body = {
        "success": svc.ready and db_ok,
        "api": "ok",
        "model": {"loaded": svc.ready, "detail": None if svc.ready else svc.load_error},
        "database": {"connected": db_ok},
    }
    return jsonify(body), 200 if body["success"] else 503
