"""Test fixtures.

IMPORTANT: these tests use a MOCK model and an in-memory SQLite database. They verify the API,
validation and persistence logic only. They say nothing about the accuracy of the real model
(see test_real_model.py for the optional smoke test against the actual .joblib).
"""
import json
from pathlib import Path

import numpy as np
import pytest
from sqlalchemy.pool import StaticPool

from app import create_app
from app.extensions import db
from app.services import ModelService

ROOT = Path(__file__).resolve().parents[2]
METADATA = json.loads((ROOT / "ml" / "model_metadata.json").read_text())


class MockModel:
    """Deterministic stand-in: returns a fixed yield per crop and records what it was given."""
    VALUES = {"chickpea": 600.0, "cotton": 300.0, "maize": 1500.0, "rice": 2000.0}

    def __init__(self):
        self.seen = []

    def predict(self, df):
        self.seen.append(df)
        return np.array([self.VALUES[c] for c in df["Crop"]])


@pytest.fixture()
def mock_model():
    return MockModel()


@pytest.fixture()
def app(mock_model):
    svc = ModelService.from_objects(mock_model, METADATA)
    app = create_app(
        {"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite://",
         "SQLALCHEMY_ENGINE_OPTIONS": {"poolclass": StaticPool, "connect_args": {"check_same_thread": False}},
         "AUTO_CREATE_TABLES": True},
        model_service=svc,
    )
    yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def payload():
    return {"Crop": "rice", "Year": 2017, "State Name": "Chhattisgarh", "Dist Name": "Durg", "Area_ha": 1000,
            "Temperature_C": 25, "Humidity_%": 70, "pH": 6.5, "Rainfall_mm": 800,
            "Wind_Speed_m_s": 2, "Solar_Radiation_MJ_m2_day": 18}
