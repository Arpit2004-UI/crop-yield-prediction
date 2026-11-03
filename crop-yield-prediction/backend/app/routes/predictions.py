import logging

from flask import Blueprint, current_app, jsonify, request

from app.database import crud
from app.errors import ApiError
from app.services import InputValidationError, ModelUnavailableError

log = logging.getLogger(__name__)
bp = Blueprint("predictions", __name__)


def parse_filters(args):
    f = {"crop": (args.get("crop") or "").strip().lower() or None,
         "state": (args.get("state") or "").strip() or None,
         "q": (args.get("q") or "").strip()[:100] or None}
    try:
        f["year"] = int(args["year"]) if args.get("year") else None
        f["date_from"] = crud.parse_date(args.get("date_from"))
        f["date_to"] = crud.parse_date(args.get("date_to"))
    except ValueError:
        raise ApiError("Invalid filter: year must be an integer and dates must be YYYY-MM-DD.", 400, "invalid_filter")
    return f


@bp.post("/predict")
def predict():
    svc = current_app.extensions["model_service"]
    if not svc.ready:
        raise ApiError("The prediction model is not available. " + (svc.load_error or ""), 503, "model_unavailable")
    payload = request.get_json(silent=True)
    if payload is None:
        raise ApiError("Request body must be valid JSON (Content-Type: application/json).", 400, "invalid_json")
    try:
        clean, warnings = svc.validate(payload)
    except InputValidationError as e:
        raise ApiError("Some inputs are invalid.", 422, "validation_error", e.errors)
    try:
        value = svc.predict(clean)
    except ModelUnavailableError as e:
        raise ApiError(str(e), 503, "model_unavailable")
    except Exception:
        log.exception("Model prediction failed")
        raise ApiError("The model failed to produce a prediction for these inputs.", 500, "prediction_failed")

    row = crud.create_prediction(clean, value)
    return jsonify({
        "success": True,
        "message": "Prediction generated successfully.",
        "prediction": {
            "id": row.id,
            "crop": row.crop,
            "predicted_yield_kg_per_ha": float(row.predicted_yield_kg_per_ha),
            "area_ha": float(row.area_ha),
            "estimated_production_kg": float(row.estimated_production_kg),
            "created_at": row.created_at.isoformat() + "Z",
        },
        "inputs": row.to_dict(),
        "warnings": warnings,
    }), 201


@bp.get("/predictions")
def list_predictions():
    a = request.args
    try:
        page = max(1, int(a.get("page", 1)))
        per_page = min(current_app.config["MAX_PAGE_SIZE"], max(1, int(a.get("per_page", 10))))
    except ValueError:
        raise ApiError("page and per_page must be integers.", 400, "invalid_pagination")
    order = "asc" if a.get("order") == "asc" else "desc"
    rows, total = crud.list_predictions(parse_filters(a), a.get("sort_by", "created_at"), order, page, per_page)
    return jsonify({
        "success": True,
        "predictions": [r.to_dict() for r in rows],
        "pagination": {"page": page, "per_page": per_page, "total": total,
                       "total_pages": max(1, -(-total // per_page))},
    })


@bp.get("/predictions/<int:pid>")
def get_prediction(pid):
    row = crud.get_prediction(pid)
    if row is None:
        raise ApiError("Prediction not found.", 404, "not_found")
    return jsonify({"success": True, "prediction": row.to_dict()})


@bp.delete("/predictions/<int:pid>")
def delete_prediction(pid):
    # No authentication: intended for local/trusted demo use only (documented in README).
    if not crud.delete_prediction(pid):
        raise ApiError("Prediction not found.", 404, "not_found")
    return jsonify({"success": True, "message": "Prediction deleted."})
