"""Environment-based configuration. No credentials are hardcoded."""
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.engine import URL

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _path(env_name: str, default: str) -> str:
    p = Path(os.getenv(env_name, default))
    return str(p if p.is_absolute() else (BASE_DIR / p).resolve())


def _database_uri():
    # URL.create escapes special characters in the password safely.
    return URL.create(
        "mysql+pymysql",
        username=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        database=os.getenv("DB_NAME", "crop_yield_db"),
        query={"charset": "utf8mb4"},
    )


class Config:
    SQLALCHEMY_DATABASE_URI = _database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True, "pool_recycle": 280}
    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    MODEL_PATH = _path("MODEL_PATH", "../ml/crop_yield_model.joblib")
    MODEL_METADATA_PATH = _path("MODEL_METADATA_PATH", "../ml/model_metadata.json")
    AUTO_CREATE_TABLES = os.getenv("AUTO_CREATE_TABLES", "true").lower() == "true"
    MAX_CONTENT_LENGTH = 16 * 1024  # prediction payloads are tiny; reject anything larger
    MAX_PAGE_SIZE = 100
    JSON_SORT_KEYS = False
