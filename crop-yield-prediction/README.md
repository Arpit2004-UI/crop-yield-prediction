# Smart Crop Yield Prediction System

A full-stack web app that estimates crop yield (kg/ha) with your **existing trained Extra Trees pipeline**, stores every prediction in **MySQL**, and shows history and a dashboard in **React**.

> **Intended use:** local development or a trusted demonstration. There is **no authentication**, so anyone who can reach the API can read and delete records. Do not expose it to the public internet as-is.

## 1. Architecture

```
React (Vite, :5173)  --Axios-->  Flask REST API (:5000)  --SQLAlchemy-->  MySQL (crop_yield_db)
                                      |
                                      +--joblib--> ml/crop_yield_model.joblib (scikit-learn pipeline)
                                      +--reads---> ml/model_metadata.json    (supported categories, ranges)
```

* The browser never computes a prediction. Flask validates input, calls `pipeline.predict`, saves the row, returns the result.
* `ml/model_metadata.json` is generated from your model (see §6) and cross-checked against the pipeline's encoder at start-up. If they disagree, the model is reported as unavailable instead of guessing.

## 2. Stack
React 18 + Vite, React Router, Axios, Tailwind CSS 3, Recharts, Lucide · Flask, Flask-CORS, Flask-SQLAlchemy, PyMySQL · scikit-learn 1.6.1, pandas, NumPy, joblib · MySQL 8.0.16+.

## 3. Prerequisites
Python 3.10–3.12, Node.js 18+, MySQL 8.0.16+ (older versions ignore CHECK constraints), Git.

## 4. Project structure
```
backend/   Flask app (app/routes, services, models, database), tests/, config.py, app.py
frontend/  React app (src/components, pages, services, hooks, utils)
ml/        crop_yield_model.joblib (you add it), model_metadata.json, export_metadata.py, training_notebook.ipynb
database/  schema.sql (schema + example queries)
```

## 5. Setup, step by step

### 5.1 MySQL
1. Install MySQL Server and start it.
2. Open a MySQL shell: `mysql -u root -p`
3. Create the database and table: `source /full/path/to/database/schema.sql;`  
   (or `mysql -u root -p < database/schema.sql`)
4. Create a limited user (use your own password):
   ```sql
   CREATE USER 'crop_app'@'localhost' IDENTIFIED BY 'your-strong-password';
   GRANT SELECT, INSERT, UPDATE, DELETE, CREATE ON crop_yield_db.* TO 'crop_app'@'localhost';
   ```

### 5.2 Model file
Copy your trained model to **`ml/crop_yield_model.joblib`**.  
If you do not have it, in the Colab notebook that trained the final model run `joblib.dump(final_model, "crop_yield_model.joblib")`, then download it from the Files panel (left sidebar). It must be the final `Pipeline([("preprocessor", ...), ("model", ExtraTreesRegressor)])` (not the dict saved by an earlier notebook cell). The file is ~300 MB and is git-ignored.

**Important:** the model was pickled with **scikit-learn 1.6.1**; `requirements.txt` pins that version. Loading with another version fails or is unsafe.

### 5.3 Backend
```bash
cd backend
python -m venv .venv                 # create an isolated Python environment
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                 # Windows: copy .env.example .env
# edit .env: set DB_USER, DB_PASSWORD, etc.
python app.py                        # API at http://127.0.0.1:5000
```
Check it: open http://127.0.0.1:5000/api/health — you should see `"success": true`.

### 5.4 Frontend
```bash
cd frontend
npm install
cp .env.example .env                 # VITE_API_URL=http://localhost:5000/api
npm run dev                          # http://localhost:5173
```

## 6. Model metadata
`ml/model_metadata.json` is already generated for the supplied model. Regenerate it only if you replace the model:
```bash
python ml/export_metadata.py --model ml/crop_yield_model.joblib --csv /path/to/Custom_Crops_yield_Historical_Dataset.csv
```

## 7. Environment variables (backend/.env)
`DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME` · `FRONTEND_ORIGIN` (the only CORS origin allowed) · `MODEL_PATH`, `MODEL_METADATA_PATH` (relative to `backend/`) · `AUTO_CREATE_TABLES` · `PORT`. Frontend: `VITE_API_URL`.

## 8. API
All responses are JSON: `{"success": true, ...}` or `{"success": false, "error": {"code", "message", "details?"}}`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | API, model and DB status (503 if the model or DB is down) |
| GET | `/api/options` | Crops, states, districts-by-state, observed ranges, reported evaluation |
| POST | `/api/predict` | Validate, predict, save. 201 on success, 422 with per-field `details` on invalid input, 503 if model missing |
| GET | `/api/predictions` | Query: `page, per_page (max 100), q, crop, state, year, date_from, date_to (YYYY-MM-DD), sort_by, order` |
| GET | `/api/predictions/<id>` | One record |
| DELETE | `/api/predictions/<id>` | Delete one record (no auth; see warning above) |
| GET | `/api/dashboard/stats` | Totals, by-crop, per-day counts, recent records (same filters, optional) |

Request body for `/api/predict` (exact field names):
```json
{"Crop":"rice","Year":2017,"State Name":"Chhattisgarh","Dist Name":"Durg","Area_ha":1000,
 "Temperature_C":25,"Humidity_%":70,"pH":6.5,"Rainfall_mm":800,"Wind_Speed_m_s":2,"Solar_Radiation_MJ_m2_day":18}
```
Response: `prediction.predicted_yield_kg_per_ha`, `prediction.estimated_production_kg` (= yield × area), `inputs`, and `warnings[]`.

## 9. Tests
```bash
cd backend && pytest -q          # 31 API/DB tests with a MOCK model + in-memory SQLite, plus 3 real-model smoke tests
cd frontend && npm test          # validation tests (Vitest)
```
* The mock tests verify code paths only. They say nothing about model accuracy.
* The 3 real-model tests run automatically when `ml/crop_yield_model.joblib` exists; they check that the file loads and returns finite, non-negative output. They are **not** an evaluation.
* Tests use SQLite purely as a throwaway test database. The application itself requires MySQL.

## 10. Known model limitations (please keep these in your report)
* **Coverage:** the saved model knows only **7 states (Andhra Pradesh, Chhattisgarh, Karnataka, Madhya Pradesh, Maharashtra, Tamil Nadu, Telangana) and 120 districts**, although the CSV has 20 states/311 districts. Other places are rejected. Without this check the pipeline silently returns a number for unknown places (its encoder ignores unknown categories), so Haryana/Rohtak from the original example request is rejected by design.
* Reported test results (from your notebook, not recomputed here): MAE ≈ 481.72 kg/ha, RMSE ≈ 809.12 kg/ha, R² ≈ 0.7364. R² by crop: chickpea 0.395, cotton −0.065, maize 0.526, rice 0.684.
* **Cotton is unreliable** (negative R²); the UI and API warn.
* Weather/soil inputs take only a few repeated values in the data (e.g. pH is only 6.0 or 6.5), so they add little signal. Values outside the training range trigger a warning.
* N/P/K nutrient columns are **not** used (suspected target leakage).
* Data ends in 2017; years outside 1966–2017 trigger a warning, and accuracy for current conditions is **not established**.
* No confidence or uncertainty value is shown, because none has been evaluated.

## 11. Troubleshooting
| Symptom | Fix |
|---|---|
| Red banner "Model file not found" | Put `crop_yield_model.joblib` in `ml/` (§5.2) and restart Flask |
| `AttributeError: _RemainderColsList` or `InconsistentVersionWarning` | Wrong scikit-learn; `pip install scikit-learn==1.6.1` |
| `Access denied for user` / `Can't connect to MySQL` | Check `.env`, that MySQL is running, and that `schema.sql` was run |
| `cryptography package is required` | `pip install cryptography` (in requirements) |
| Browser "Network Error" / CORS | Backend not running, wrong `VITE_API_URL`, or `FRONTEND_ORIGIN` ≠ the URL in your browser |
| 422 "not covered by the trained model" | Choose a supported state/district from the dropdowns |
| `CHECK` constraints not enforced | Upgrade to MySQL ≥ 8.0.16 |

## 12. Security notes
Input validated server-side; ORM-parameterised queries; whitelisted sort columns; escaped search wildcards; CORS limited to one origin; 16 KB request cap and page-size cap; errors never include stack traces or credentials; secrets only via `.env` (git-ignored).
