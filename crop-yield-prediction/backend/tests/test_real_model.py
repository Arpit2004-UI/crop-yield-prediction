"""Optional smoke test against the REAL trained pipeline. Skipped automatically if the file is absent.
This checks that the artefact loads and returns sane output; it is not a model evaluation."""
import pytest

from tests.conftest import ROOT
from app.services import ModelService

MODEL = ROOT / "ml" / "crop_yield_model.joblib"
pytestmark = pytest.mark.skipif(not MODEL.is_file(), reason="ml/crop_yield_model.joblib not present")


@pytest.fixture(scope="module")
def svc():
    s = ModelService(str(MODEL), str(ROOT / "ml" / "model_metadata.json")).load()
    assert s.ready, s.load_error
    return s


def test_real_model_loads_and_matches_metadata(svc):
    assert svc.model.n_features_in_ == 11


def test_real_model_predicts_finite_non_negative(svc):
    clean, _ = svc.validate({"Crop": "rice", "Year": 2010, "State Name": "Chhattisgarh", "Dist Name": "Durg",
                             "Area_ha": 548000, "Temperature_C": 25, "Humidity_%": 80, "pH": 6.5,
                             "Rainfall_mm": 1200, "Wind_Speed_m_s": 2, "Solar_Radiation_MJ_m2_day": 18})
    y = svc.predict(clean)
    assert 0 <= y < 20000


def test_real_model_is_deterministic(svc):
    clean, _ = svc.validate({"Crop": "maize", "Year": 2000, "State Name": "Karnataka", "Dist Name": "Bangalore",
                             "Area_ha": 5000, "Temperature_C": 22, "Humidity_%": 70, "pH": 6.0,
                             "Rainfall_mm": 800, "Wind_Speed_m_s": 2.5, "Solar_Radiation_MJ_m2_day": 20})
    assert svc.predict(clean) == svc.predict(clean)
