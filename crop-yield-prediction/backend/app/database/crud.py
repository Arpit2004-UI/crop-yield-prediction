"""CRUD helpers. All queries go through the SQLAlchemy ORM (parameterised)."""
from datetime import datetime, timedelta

from sqlalchemy import func, or_, select

from app.extensions import db
from app.models import PredictionHistory as P

SORTABLE = {
    "id": P.id,
    "crop": P.crop,
    "state_name": P.state_name,
    "district_name": P.district_name,
    "year": P.year,
    "area_ha": P.area_ha,
    "predicted_yield_kg_per_ha": P.predicted_yield_kg_per_ha,
    "estimated_production_kg": P.estimated_production_kg,
    "created_at": P.created_at,
}


def create_prediction(clean: dict, predicted_yield: float) -> P:
    """Persist one prediction. Production is derived from the stored (2-decimal) yield so the UI reconciles."""
    y = round(float(predicted_yield), 2)
    row = P(
        crop=clean["Crop"], year=clean["Year"], state_name=clean["State Name"],
        district_name=clean["Dist Name"], area_ha=clean["Area_ha"],
        temperature_c=clean["Temperature_C"], humidity=clean["Humidity_%"], soil_ph=clean["pH"],
        rainfall_mm=clean["Rainfall_mm"], wind_speed_m_s=clean["Wind_Speed_m_s"],
        solar_radiation=clean["Solar_Radiation_MJ_m2_day"],
        predicted_yield_kg_per_ha=y, estimated_production_kg=round(y * float(clean["Area_ha"]), 2),
    )
    db.session.add(row)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return row


def get_prediction(pid: int):
    return db.session.get(P, pid)


def delete_prediction(pid: int) -> bool:
    row = db.session.get(P, pid)
    if row is None:
        return False
    try:
        db.session.delete(row)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return True


def _escape_like(s: str) -> str:
    return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def apply_filters(stmt, f: dict):
    if f.get("crop"):
        stmt = stmt.where(P.crop == f["crop"])
    if f.get("state"):
        stmt = stmt.where(P.state_name == f["state"])
    if f.get("year"):
        stmt = stmt.where(P.year == f["year"])
    if f.get("date_from"):
        stmt = stmt.where(P.created_at >= f["date_from"])
    if f.get("date_to"):  # inclusive of the whole end day
        stmt = stmt.where(P.created_at < f["date_to"] + timedelta(days=1))
    q = (f.get("q") or "").strip()
    if q:
        like = f"%{_escape_like(q)}%"
        conds = [P.crop.like(like, escape="\\"), P.state_name.like(like, escape="\\"),
                 P.district_name.like(like, escape="\\")]
        if q.isdigit():
            conds.append(P.id == int(q))
        stmt = stmt.where(or_(*conds))
    return stmt


def list_predictions(filters: dict, sort_by: str, order: str, page: int, per_page: int):
    col = SORTABLE.get(sort_by, P.created_at)
    ordering = col.asc() if order == "asc" else col.desc()
    base = apply_filters(select(P), filters)
    total = db.session.scalar(apply_filters(select(func.count(P.id)), filters)) or 0
    rows = db.session.scalars(base.order_by(ordering, P.id.desc()).limit(per_page).offset((page - 1) * per_page)).all()
    return rows, total


def dashboard_stats(filters: dict) -> dict:
    total = db.session.scalar(apply_filters(select(func.count(P.id)), filters)) or 0
    avg_yield = db.session.scalar(apply_filters(select(func.avg(P.predicted_yield_kg_per_ha)), filters))

    by_crop_rows = db.session.execute(apply_filters(
        select(P.crop, func.count(P.id), func.avg(P.predicted_yield_kg_per_ha)).group_by(P.crop)
        .order_by(func.count(P.id).desc(), P.crop.asc()), filters)).all()
    by_crop = [{"crop": c, "count": int(n), "avg_yield_kg_per_ha": round(float(a), 2)} for c, n, a in by_crop_rows]

    day = func.date(P.created_at)
    over_time_rows = db.session.execute(apply_filters(
        select(day, func.count(P.id)).group_by(day).order_by(day.asc()), filters)).all()
    over_time = [{"date": str(d), "count": int(n)} for d, n in over_time_rows]

    recent = db.session.scalars(apply_filters(select(P), filters).order_by(P.created_at.desc(), P.id.desc()).limit(8)).all()
    states = [s for (s,) in db.session.execute(select(P.state_name).distinct().order_by(P.state_name)).all()]

    return {
        "total_predictions": int(total),
        "most_predicted_crop": by_crop[0]["crop"] if by_crop else None,
        "average_predicted_yield_kg_per_ha": round(float(avg_yield), 2) if avg_yield is not None else None,
        "predictions_by_crop": by_crop,
        "predictions_over_time": over_time,
        "recent_predictions": [r.to_dict() for r in recent],
        "available_states": states,
        "source": "Application prediction history stored in MySQL (not historical agricultural measurements).",
    }


def parse_date(value):
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d")
