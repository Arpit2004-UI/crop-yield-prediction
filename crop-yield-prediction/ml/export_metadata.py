"""Generate ml/model_metadata.json from the trained pipeline and the CSV.

The metadata is the single source of truth for what the API accepts:
  * categories come from the pipeline's own OneHotEncoder (what the model really knows)
  * district -> state mapping and observed numeric ranges come from the CSV, restricted
    to the states/districts the model was trained on.

Usage (from the repository root, backend virtualenv active):
    python ml/export_metadata.py --model ml/crop_yield_model.joblib --csv path/to/Custom_Crops_yield_Historical_Dataset.csv
"""
import argparse
import json
from pathlib import Path

import joblib
import pandas as pd

ENV_COLS = ["Temperature_C", "Humidity_%", "pH", "Rainfall_mm", "Wind_Speed_m_s", "Solar_Radiation_MJ_m2_day"]

# Reported by the project owner for the final candidate model (time-based split).
# They are NOT recomputed here and must not be presented as validated for current conditions.
REPORTED_EVALUATION = {
    "source": "Reported by the project owner from the training notebook; not recomputed by this application.",
    "overall": {"mae_kg_per_ha": 481.72, "rmse_kg_per_ha": 809.12, "r2": 0.7364},
    "r2_by_crop": {"chickpea": 0.395, "cotton": -0.065, "maize": 0.526, "rice": 0.684},
    "data_years": [1966, 2017],
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="ml/crop_yield_model.joblib")
    ap.add_argument("--csv", required=True)
    ap.add_argument("--out", default="ml/model_metadata.json")
    a = ap.parse_args()

    pipe = joblib.load(a.model)
    pre = pipe.named_steps["preprocessor"]
    enc = pre.named_transformers_["categorical"].named_steps["encoder"]
    cat_cols = list(pre.transformers_[0][2])
    cats = {c: [str(v) for v in vals] for c, vals in zip(cat_cols, enc.categories_)}

    df = pd.read_csv(a.csv)
    df.columns = df.columns.str.strip()
    df = df[df["State Name"].isin(cats["State Name"]) & df["Dist Name"].isin(cats["Dist Name"])]
    mapping = {s: sorted(g["Dist Name"].unique().tolist()) for s, g in df.groupby("State Name")}
    missing = set(cats["Dist Name"]) - {d for v in mapping.values() for d in v}
    if missing:
        raise SystemExit(f"Model districts missing from CSV: {sorted(missing)}")

    ranges = {c: [float(df[c].min()), float(df[c].max())] for c in ["Year", "Area_ha"] + ENV_COLS}
    meta = {
        "model_name": "Extra Trees regression pipeline",
        "feature_order": [str(c) for c in pipe.feature_names_in_],
        "target": "Yield_kg_per_ha",
        "crops": cats["Crop"],
        "states": cats["State Name"],
        "districts_by_state": mapping,
        "observed_ranges": ranges,
        "observed_environment_values": {c: sorted(df[c].unique().tolist()) for c in ENV_COLS},
        "training_rows_in_csv_for_model_states": int(len(df)),
        "evaluation": REPORTED_EVALUATION,
    }
    Path(a.out).write_text(json.dumps(meta, indent=2))
    print("Wrote", a.out)


if __name__ == "__main__":
    main()
