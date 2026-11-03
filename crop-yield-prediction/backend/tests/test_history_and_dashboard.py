from app.database import crud
from app.extensions import db
from app.models import PredictionHistory


def make(client, payload, **kw):
    p = {**payload, **kw}
    r = client.post("/api/predict", json=p)
    assert r.status_code == 201, r.get_json()
    return r.get_json()["prediction"]["id"]


def seed(client, payload):
    make(client, payload)                                                       # rice Durg
    make(client, payload, Crop="rice", Year=2016)
    make(client, payload, Crop="maize")
    make(client, payload, Crop="chickpea", **{"State Name": "Karnataka", "Dist Name": "Bangalore"})


def test_database_insert_and_retrieve(app, client, payload):
    pid = make(client, payload)
    with app.app_context():
        row = db.session.get(PredictionHistory, pid)
        assert row.crop == "rice" and float(row.estimated_production_kg) == 2_000_000.0
    d = client.get(f"/api/predictions/{pid}").get_json()["prediction"]
    assert d["district_name"] == "Durg" and d["created_at"].endswith("Z")


def test_get_missing_and_delete(client, payload):
    assert client.get("/api/predictions/999").status_code == 404
    pid = make(client, payload)
    assert client.delete(f"/api/predictions/{pid}").status_code == 200
    assert client.delete(f"/api/predictions/{pid}").status_code == 404
    assert client.get(f"/api/predictions/{pid}").status_code == 404


def test_pagination(client, payload):
    for _ in range(7):
        make(client, payload)
    a = client.get("/api/predictions?per_page=3&page=1").get_json()
    assert len(a["predictions"]) == 3 and a["pagination"] == {"page": 1, "per_page": 3, "total": 7, "total_pages": 3}
    assert len(client.get("/api/predictions?per_page=3&page=3").get_json()["predictions"]) == 1
    assert client.get("/api/predictions?per_page=3&page=9").get_json()["predictions"] == []
    assert client.get("/api/predictions?per_page=100000").get_json()["pagination"]["per_page"] == 100
    assert client.get("/api/predictions?page=x").status_code == 400


def test_filters_search_and_sort(client, payload):
    seed(client, payload)
    g = lambda q: client.get("/api/predictions?" + q).get_json()
    assert g("crop=rice")["pagination"]["total"] == 2
    assert g("state=Karnataka")["pagination"]["total"] == 1
    assert g("year=2016")["pagination"]["total"] == 1
    assert g("q=bangalore")["pagination"]["total"] == 1
    assert g("q=100%25")["pagination"]["total"] == 0          # % is escaped, not a wildcard
    assert g("q=1")["pagination"]["total"] >= 1              # numeric id search
    ys = [p["predicted_yield_kg_per_ha"] for p in g("sort_by=predicted_yield_kg_per_ha&order=asc")["predictions"]]
    assert ys == sorted(ys)
    assert g("sort_by=password;DROP TABLE x")["pagination"]["total"] == 4   # unknown sort key falls back safely
    assert client.get("/api/predictions?date_from=2020-13-45").status_code == 400
    assert g("date_from=2999-01-01")["pagination"]["total"] == 0


def test_dashboard_stats(client, payload):
    s = client.get("/api/dashboard/stats").get_json()["stats"]
    assert s["total_predictions"] == 0 and s["most_predicted_crop"] is None and s["recent_predictions"] == []
    seed(client, payload)
    s = client.get("/api/dashboard/stats").get_json()["stats"]
    assert s["total_predictions"] == 4 and s["most_predicted_crop"] == "rice"
    assert {c["crop"]: c["count"] for c in s["predictions_by_crop"]} == {"rice": 2, "maize": 1, "chickpea": 1}
    assert sum(d["count"] for d in s["predictions_over_time"]) == 4
    assert len(s["recent_predictions"]) == 4 and "Karnataka" in s["available_states"]
    f = client.get("/api/dashboard/stats?crop=maize").get_json()["stats"]
    assert f["total_predictions"] == 1 and f["most_predicted_crop"] == "maize"
