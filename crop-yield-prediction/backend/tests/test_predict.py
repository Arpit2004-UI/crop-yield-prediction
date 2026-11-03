import pytest

FEATURES = ['Crop', 'Year', 'State Name', 'Dist Name', 'Area_ha', 'Temperature_C', 'Humidity_%', 'pH',
            'Rainfall_mm', 'Wind_Speed_m_s', 'Solar_Radiation_MJ_m2_day']


def test_successful_prediction(client, payload, mock_model):
    r = client.post("/api/predict", json=payload)
    assert r.status_code == 201
    b = r.get_json()
    p = b["prediction"]
    assert b["success"] and p["predicted_yield_kg_per_ha"] == 2000.0
    assert p["estimated_production_kg"] == 2000.0 * 1000  # yield x area
    assert p["id"] >= 1
    # model received exactly the expected columns in the expected order
    assert list(mock_model.seen[0].columns) == FEATURES


def test_crop_and_state_are_case_insensitive_and_canonicalised(client, payload):
    payload.update({"Crop": " RICE ", "State Name": "chhattisgarh", "Dist Name": "durg"})
    r = client.post("/api/predict", json=payload)
    assert r.status_code == 201
    assert r.get_json()["inputs"]["state_name"] == "Chhattisgarh"


def test_cotton_and_future_year_warnings(client, payload):
    payload.update({"Crop": "cotton", "Year": 2026})
    w = client.post("/api/predict", json=payload).get_json()["warnings"]
    assert any("Cotton" in x for x in w) and any("outside the training data" in x for x in w)


@pytest.mark.parametrize("field,value", [
    ("Crop", "wheat"), ("Crop", ""), ("State Name", "Haryana"), ("Dist Name", "Rohtak"),
    ("Dist Name", "Hyderabad"),  # real district but belongs to another state
    ("Area_ha", 0), ("Area_ha", -5), ("Area_ha", "abc"), ("Area_ha", True),
    ("Year", 1800), ("Year", 2017.5), ("Humidity_%", 150), ("pH", 15), ("Temperature_C", None),
    ("Rainfall_mm", float("inf")),
])
def test_invalid_inputs_rejected_and_not_saved(client, payload, field, value):
    payload[field] = value
    r = client.post("/api/predict", json=payload)
    assert r.status_code == 422, (field, value, r.get_json())
    assert field in r.get_json()["error"]["details"]
    assert client.get("/api/predictions").get_json()["pagination"]["total"] == 0


def test_missing_fields_are_all_reported(client):
    r = client.post("/api/predict", json={})
    assert r.status_code == 422
    assert len(r.get_json()["error"]["details"]) == 11


def test_unsupported_state_is_rejected_not_silently_predicted(client, payload):
    payload.update({"State Name": "Haryana", "Dist Name": "Rohtak"})
    r = client.post("/api/predict", json=payload)
    assert r.status_code == 422 and "not covered by the trained model" in r.get_json()["error"]["details"]["State Name"]


def test_non_json_body(client):
    assert client.post("/api/predict", data="x", content_type="text/plain").status_code == 400
    assert client.post("/api/predict", json=[1, 2]).status_code == 422


def test_oversized_body_rejected(client):
    assert client.post("/api/predict", data="x" * 20000, content_type="application/json").status_code == 413
