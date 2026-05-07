"""
Production-ready settings with full environment-based configuration.
"""

from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Optional, List
import os


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # ── App ──
    APP_NAME: str = "ClinicalAI Early Warning System"
    VERSION: str = "1.0.0"
    ENV: str = "development"
    DEBUG: bool = False

    # ── Database ──
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/clinical_dev.db"

    # ── JWT ──
    SECRET_KEY: str = "change-me-in-production-use-256-bit-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours

    # ── CORS ──
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # ── Groq ──
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # ── OpenAI (optional fallback) ──
    OPENAI_API_KEY: Optional[str] = None

    # ── Rate Limiting ──
    RATE_LIMIT_LOGIN: str = "10/minute"
    RATE_LIMIT_API: str = "120/minute"
    RATE_LIMIT_CHAT: str = "30/minute"

    # ── ML Paths ──
    MODELS_DIR: str = "src/ml/models"
    FEATURES_PATH: str = "src/data/features/feature_list.json"

    # ── Hospital ──
    HOSPITAL_NAME: str = "City General Hospital"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
