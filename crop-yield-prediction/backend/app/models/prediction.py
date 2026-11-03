from datetime import datetime, timezone

from sqlalchemy import Index, Numeric

from app.extensions import db


def _utcnow():
    # Stored as naive UTC (MySQL DATETIME has no timezone).
    return datetime.now(timezone.utc).replace(tzinfo=None)


class PredictionHistory(db.Model):
    __tablename__ = "prediction_history"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    crop = db.Column(db.String(32), nullable=False)
    year = db.Column(db.SmallInteger, nullable=False)
    state_name = db.Column(db.String(64), nullable=False)
    district_name = db.Column(db.String(64), nullable=False)
    area_ha = db.Column(Numeric(14, 2), nullable=False)
    temperature_c = db.Column(Numeric(5, 2), nullable=False)
    humidity = db.Column(Numeric(5, 2), nullable=False)
    soil_ph = db.Column(Numeric(4, 2), nullable=False)
    rainfall_mm = db.Column(Numeric(8, 2), nullable=False)
    wind_speed_m_s = db.Column(Numeric(5, 2), nullable=False)
    solar_radiation = db.Column(Numeric(5, 2), nullable=False)
    predicted_yield_kg_per_ha = db.Column(Numeric(12, 2), nullable=False)
    estimated_production_kg = db.Column(Numeric(20, 2), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=_utcnow)

    __table_args__ = (
        Index("idx_ph_created_at", "created_at"),
        Index("idx_ph_crop_created", "crop", "created_at"),
        Index("idx_ph_state_district", "state_name", "district_name"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "crop": self.crop,
            "year": self.year,
            "state_name": self.state_name,
            "district_name": self.district_name,
            "area_ha": float(self.area_ha),
            "temperature_c": float(self.temperature_c),
            "humidity": float(self.humidity),
            "soil_ph": float(self.soil_ph),
            "rainfall_mm": float(self.rainfall_mm),
            "wind_speed_m_s": float(self.wind_speed_m_s),
            "solar_radiation": float(self.solar_radiation),
            "predicted_yield_kg_per_ha": float(self.predicted_yield_kg_per_ha),
            "estimated_production_kg": float(self.estimated_production_kg),
            "created_at": self.created_at.isoformat() + "Z",
        }
