"""
ML prediction endpoint — uses shared feature engineering utility.
"""

import json
import logging
import joblib
import numpy as np
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from src.utils.features import build_features, get_news2_score, get_news2_category, get_clinical_concerns
from src.utils.security import get_current_user_optional
from config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Load model once at startup ────────────────────────────────────────────────
_MODELS_DIR = Path(settings.MODELS_DIR)

try:
    model  = joblib.load(_MODELS_DIR / "early_warning_model.joblib")
    scaler = joblib.load(_MODELS_DIR / "feature_scaler.joblib")
    logger.info("ML model loaded from %s", _MODELS_DIR)
except Exception as e:
    logger.error("Model load failed: %s", e)
    model  = None
    scaler = None

_RISK_LABELS = {0: "Low",    1: "Medium",  2: "High"}
_RISK_COLORS = {0: "green",  1: "orange",  2: "red"}
_RECOMMENDATIONS = {
    0: "Continue routine monitoring every 4 hours.",
    1: "Increase monitoring to every 2 hours. Notify nurse in charge.",
    2: "URGENT: Notify physician immediately. Consider ICU transfer.",
}


# ── Schemas ───────────────────────────────────────────────────────────────────

class PatientVitals(BaseModel):
    patient_id:       str   = Field(..., example="PT1001")
    age:              float = Field(..., ge=0,  le=120)
    gender:           str   = Field(..., example="M")
    ward:             str   = Field(..., example="ICU")
    heart_rate:       float = Field(..., ge=20, le=250)
    systolic_bp:      float = Field(..., ge=50, le=250)
    diastolic_bp:     float = Field(..., ge=20, le=150)
    temperature:      float = Field(..., ge=30, le=45)
    respiratory_rate: float = Field(..., ge=4,  le=60)
    spo2:             float = Field(..., ge=50, le=100)
    consciousness:    int   = Field(..., ge=0,  le=3)
    urine_output:     float = Field(..., ge=0,  le=200)
    glucose:          float = Field(..., ge=1,  le=30)
    pain_score:       int   = Field(..., ge=0,  le=10)


class PredictionResponse(BaseModel):
    patient_id:     str
    risk_level:     int
    risk_label:     str
    risk_color:     str
    confidence:     float
    news2_score:    int
    news2_category: str
    top_concerns:   list
    recommendation: str
    probabilities:  dict


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": model is not None, "version": settings.VERSION}


@router.post("/predict", response_model=PredictionResponse)
def predict_risk(
    vitals: PatientVitals,
    _current_user: dict = Depends(get_current_user_optional),
):
    """Predict patient deterioration risk from vital signs."""
    if model is None:
        raise HTTPException(status_code=503, detail="ML model not available")

    try:
        X        = build_features(vitals.model_dump())
        X_scaled = scaler.transform(X)

        risk_level    = int(model.predict(X_scaled)[0])
        probabilities = model.predict_proba(X_scaled)[0]
        confidence    = round(float(probabilities[risk_level]) * 100, 2)
        news2         = get_news2_score(vitals.model_dump())

        return PredictionResponse(
            patient_id     = vitals.patient_id,
            risk_level     = risk_level,
            risk_label     = _RISK_LABELS[risk_level],
            risk_color     = _RISK_COLORS[risk_level],
            confidence     = confidence,
            news2_score    = news2,
            news2_category = get_news2_category(news2),
            top_concerns   = get_clinical_concerns(vitals.model_dump()),
            recommendation = _RECOMMENDATIONS[risk_level],
            probabilities  = {
                "low":    round(float(probabilities[0]) * 100, 2),
                "medium": round(float(probabilities[1]) * 100, 2),
                "high":   round(float(probabilities[2]) * 100, 2),
            },
        )

    except Exception as e:
        logger.exception("Prediction error for patient %s", vitals.patient_id)
        raise HTTPException(status_code=500, detail="Prediction failed — check server logs")


@router.get("/model-info")
def model_info():
    eval_path = Path("src/ml/evaluation/model_evaluation.json")
    if eval_path.exists():
        with open(eval_path) as f:
            return json.load(f)
    return {"message": "Evaluation data not found"}
