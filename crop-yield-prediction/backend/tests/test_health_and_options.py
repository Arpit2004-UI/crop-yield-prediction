from app import create_app
from app.services import ModelService
from sqlalchemy.pool import StaticPool

SQLITE = {"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite://",
          "SQLALCHEMY_ENGINE_OPTIONS": {"poolclass": StaticPool, "connect_args": {"check_same_thread": False}}}


def test_health_ok(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.get_json()
    assert body["success"] and body["model"]["loaded"] and body["database"]["connected"]


def test_missing_model_file_is_reported_not_crashing(tmp_path, payload):
    svc = ModelService(str(tmp_path / "nope.joblib"), str(tmp_path.parents[0] / "none.json")).load()
    app = create_app(SQLITE, model_service=svc)
    c = app.test_client()
    h = c.get("/api/health")
    assert h.status_code == 503 and h.get_json()["model"]["loaded"] is False
    p = c.post("/api/predict", json=payload)
    assert p.status_code == 503
    assert p.get_json()["error"]["code"] == "model_unavailable"
    assert "Traceback" not in p.get_data(as_text=True)


def test_missing_model_with_valid_metadata(tmp_path):
    from tests.conftest import ROOT
    svc = ModelService(str(tmp_path / "nope.joblib"), str(ROOT / "ml" / "model_metadata.json")).load()
    assert not svc.ready and "Google Colab" in svc.load_error
    assert create_app(SQLITE, model_service=svc).test_client().get("/api/options").status_code == 200


def test_options_match_model_schema(client):
    o = client.get("/api/options").get_json()["options"]
    assert o["crops"] == ["chickpea", "cotton", "maize", "rice"]
    assert len(o["states"]) == 7 and "Haryana" not in o["states"]
    assert sum(len(v) for v in o["districts_by_state"].values()) == 120
