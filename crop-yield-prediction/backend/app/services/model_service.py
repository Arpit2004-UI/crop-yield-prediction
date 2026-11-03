"""Loads the trained scikit-learn pipeline, validates inputs against ITS schema and runs predictions.

Source of truth for supported categories and feature order: ml/model_metadata.json, which is
cross-checked against the pipeline's own encoder at load time. Nothing is retrained or altered.
"""
import json
import logging
import math
from pathlib import Path

import pandas as pd

log = logging.getLogger(__name__)

# Hard sanity limits (physically/agronomically reasonable). Separate from "observed in training" warnings.
LIMITS = {
    "Year": (1900, 2100),
    "Area_ha": (0.01, 5_000_000),
    "Temperature_C": (-10, 55),
    "Humidity_%": (0, 100),
    "pH": (3.0, 10.0),
    "Rainfall_mm": (0, 10_000),
    "Wind_Speed_m_s": (0, 50),
    "Solar_Radiation_MJ_m2_day": (0, 40),
}
NUMERIC_FIELDS = list(LIMITS)


class ModelUnavailableError(RuntimeError):
    pass


class InputValidationError(ValueError):
    def __init__(self, errors: dict):
        super().__init__("Invalid input")
        self.errors = errors


class ModelService:
    def __init__(self, model_path=None, metadata_path=None):
        self.model_path, self.metadata_path = model_path, metadata_path
        self.model = None
        self.metadata = None
        self.load_error = None

    @classmethod
    def from_objects(cls, model, metadata):
        """Used by automated tests with a MOCK model. Never used by the running application."""
        svc = cls()
        svc.model, svc.metadata = model, metadata
        return svc

    # ------------------------------------------------------------------ loading
    def load(self):
        try:
            self.metadata = json.loads(Path(self.metadata_path).read_text())
        except Exception as exc:
            self.load_error = f"Model metadata unreadable ({self.metadata_path}): {exc.__class__.__name__}"
            log.error(self.load_error)
            return self
        if not Path(self.model_path).is_file():
            self.load_error = (f"Model file not found at {self.model_path}. Export crop_yield_model.joblib from "
                               "Google Colab and place it in the ml/ folder (see README).")
            log.error(self.load_error)
            return self
        try:
            import joblib
            model = joblib.load(self.model_path)
            self._verify_against_metadata(model)
            # Single-row requests: avoid thread-pool overhead of n_jobs=-1 (does not change predictions).
            if hasattr(model, "named_steps") and hasattr(model.named_steps.get("model"), "n_jobs"):
                model.named_steps["model"].n_jobs = 1
            self.model = model
        except Exception as exc:
            self.load_error = f"Model could not be loaded: {exc.__class__.__name__}: {exc}"
            log.error(self.load_error)
        return self

    def _verify_against_metadata(self, model):
        names = [str(c) for c in model.feature_names_in_]
        if names != self.metadata["feature_order"]:
            raise ModelUnavailableError(f"Feature order mismatch: model={names} metadata={self.metadata['feature_order']}")
        pre = model.named_steps["preprocessor"]
        enc = pre.named_transformers_["categorical"].named_steps["encoder"]
        cols = list(pre.transformers_[0][2])
        key = {"Crop": "crops", "State Name": "states"}
        for col, cats in zip(cols, enc.categories_):
            cats = [str(c) for c in cats]
            if col in key and cats != self.metadata[key[col]]:
                raise ModelUnavailableError(f"{col} categories in metadata differ from the model.")
            if col == "Dist Name":
                known = {d for ds in self.metadata["districts_by_state"].values() for d in ds}
                if set(cats) != known:
                    raise ModelUnavailableError("District categories in metadata differ from the model.")

    @property
    def ready(self):
        return self.model is not None and self.metadata is not None

    # ------------------------------------------------------------------ options
    def options(self):
        m = self.metadata
        return {
            "crops": m["crops"],
            "states": m["states"],
            "districts_by_state": m["districts_by_state"],
            "feature_order": m["feature_order"],
            "observed_ranges": m["observed_ranges"],
            "observed_environment_values": m.get("observed_environment_values", {}),
            "limits": {k: list(v) for k, v in LIMITS.items()},
            "evaluation": m.get("evaluation"),
        }

    # ------------------------------------------------------------------ validation
    def validate(self, payload):
        """Return (clean_payload, warnings). Raises InputValidationError with per-field messages."""
        if not isinstance(payload, dict):
            raise InputValidationError({"_": "Request body must be a JSON object."})
        m, errors, clean, warnings = self.metadata, {}, {}, []

        crop = payload.get("Crop")
        crops = {c.lower(): c for c in m["crops"]}
        if not isinstance(crop, str) or not crop.strip():
            errors["Crop"] = "Crop is required."
        elif crop.strip().lower() not in crops:
            errors["Crop"] = f"Unsupported crop. Choose one of: {', '.join(m['crops'])}."
        else:
            clean["Crop"] = crops[crop.strip().lower()]

        states = {s.lower(): s for s in m["states"]}
        state = payload.get("State Name")
        if not isinstance(state, str) or not state.strip():
            errors["State Name"] = "State is required."
        elif state.strip().lower() not in states:
            errors["State Name"] = (f"'{state.strip()}' is not covered by the trained model. "
                                    f"Supported states: {', '.join(m['states'])}.")
        else:
            clean["State Name"] = states[state.strip().lower()]

        dist = payload.get("Dist Name")
        if not isinstance(dist, str) or not dist.strip():
            errors["Dist Name"] = "District is required."
        elif "State Name" in clean:
            ds = {d.lower(): d for d in m["districts_by_state"][clean["State Name"]]}
            if dist.strip().lower() not in ds:
                errors["Dist Name"] = f"'{dist.strip()}' is not a supported district of {clean['State Name']}."
            else:
                clean["Dist Name"] = ds[dist.strip().lower()]

        for f in NUMERIC_FIELDS:
            raw = payload.get(f)
            if raw is None or (isinstance(raw, str) and not raw.strip()):
                errors[f] = f"{f} is required."
                continue
            if isinstance(raw, bool):
                errors[f] = f"{f} must be a number."
                continue
            try:
                val = float(raw)
            except (TypeError, ValueError):
                errors[f] = f"{f} must be a number."
                continue
            if not math.isfinite(val):
                errors[f] = f"{f} must be a finite number."
                continue
            lo, hi = LIMITS[f]
            if f == "Area_ha" and val <= 0:
                errors[f] = "Cultivated area must be greater than zero."
            elif not lo <= val <= hi:
                errors[f] = f"{f} must be between {lo} and {hi}."
            elif f == "Year" and val != int(val):
                errors[f] = "Year must be a whole number."
            else:
                clean[f] = int(val) if f == "Year" else val

        if errors:
            raise InputValidationError(errors)

        rng = m["observed_ranges"]
        if not rng["Year"][0] <= clean["Year"] <= rng["Year"][1]:
            warnings.append(f"Year {clean['Year']} is outside the training data ({int(rng['Year'][0])}-{int(rng['Year'][1])}). "
                            "The model has not been validated for this period.")
        for f in NUMERIC_FIELDS[1:]:
            lo, hi = rng[f]
            if not lo <= clean[f] <= hi:
                warnings.append(f"{f} = {clean[f]:g} is outside the range seen in training ({lo:g}-{hi:g}); "
                                "the prediction extrapolates beyond the data.")
        if clean["Crop"] == "cotton":
            warnings.append("Cotton predictions are unreliable: the model's test R² for cotton was negative (about -0.065).")
        return clean, warnings

    # ------------------------------------------------------------------ prediction
    def predict(self, clean: dict) -> float:
        if not self.ready:
            raise ModelUnavailableError(self.load_error or "Model is not loaded.")
        row = pd.DataFrame([{k: clean[k] for k in self.metadata["feature_order"]}])[self.metadata["feature_order"]]
        value = float(self.model.predict(row)[0])
        if not math.isfinite(value):
            raise ModelUnavailableError("Model returned a non-finite value.")
        return max(0.0, value)
