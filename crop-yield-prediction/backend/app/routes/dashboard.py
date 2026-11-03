from flask import Blueprint, jsonify, request

from app.database import crud
from app.routes.predictions import parse_filters

bp = Blueprint("dashboard", __name__)


@bp.get("/dashboard/stats")
def stats():
    return jsonify({"success": True, "stats": crud.dashboard_stats(parse_filters(request.args))})
