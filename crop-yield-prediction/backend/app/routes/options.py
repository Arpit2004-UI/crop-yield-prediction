from flask import Blueprint, current_app, jsonify

from app.errors import ApiError

bp = Blueprint("options", __name__)


@bp.get("/options")
def options():
    svc = current_app.extensions["model_service"]
    if svc.metadata is None:
        raise ApiError(svc.load_error or "Model metadata unavailable.", 503, "model_unavailable")
    return jsonify({"success": True, "options": svc.options()})
