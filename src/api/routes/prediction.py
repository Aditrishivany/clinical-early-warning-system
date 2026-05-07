"""
File: src/api/routes/prediction.py
Purpose: Patient risk prediction endpoint
"""

import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import json

router = APIRouter()
from src.agents.coordinator import AgentCoordinator
coordinator = AgentCoordinator()

# ─────────────────────────────────────────
# LOAD MODEL ON STARTUP
# ─────────────────────────────────────────
MODELS_DIR = Path("src/ml/models")

try:
    model  = joblib.load(MODELS_DIR / "early_warning_model.joblib")
    scaler = joblib.load(MODELS_DIR / "feature_scaler.joblib")

    with open("src/data/features/feature_list.json") as f:
        FEATURE_NAMES = json.load(f)["features"]

    print("  ✅ ML Model loaded successfully")
except Exception as e:
    print(f"  ❌ Model load error: {e}")
    model  = None
    scaler = None


# ─────────────────────────────────────────
# REQUEST SCHEMA
# ─────────────────────────────────────────
class PatientVitals(BaseModel):
    """Input schema — all vital signs for one patient."""

    # Patient Info
    patient_id:       str   = Field(..., example="PT1001")
    age:              float = Field(..., ge=0,   le=120,  example=65)
    gender:           str   = Field(..., example="M")
    ward:             str   = Field(..., example="ICU")

    # Core Vitals
    heart_rate:       float = Field(..., ge=20,  le=250,  example=95)
    systolic_bp:      float = Field(..., ge=50,  le=250,  example=110)
    diastolic_bp:     float = Field(..., ge=20,  le=150,  example=70)
    temperature:      float = Field(..., ge=30,  le=45,   example=38.5)
    respiratory_rate: float = Field(..., ge=4,   le=60,   example=22)
    spo2:             float = Field(..., ge=50,  le=100,  example=94)
    consciousness:    int   = Field(..., ge=0,   le=3,    example=0)
    urine_output:     float = Field(..., ge=0,   le=200,  example=35)
    glucose:          float = Field(..., ge=1,   le=30,   example=7.5)
    pain_score:       int   = Field(..., ge=0,   le=10,   example=3)

    class Config:
        json_schema_extra = {
            "example": {
                "patient_id": "PT1001",
                "age": 65, "gender": "M", "ward": "ICU",
                "heart_rate": 95, "systolic_bp": 110,
                "diastolic_bp": 70, "temperature": 38.5,
                "respiratory_rate": 22, "spo2": 94,
                "consciousness": 0, "urine_output": 35,
                "glucose": 7.5, "pain_score": 3
            }
        }


# ─────────────────────────────────────────
# RESPONSE SCHEMA
# ─────────────────────────────────────────
class PredictionResponse(BaseModel):
    patient_id:      str
    risk_level:      int
    risk_label:      str
    risk_color:      str
    confidence:      float
    news2_score:     int
    news2_category:  str
    top_concerns:    list
    recommendation:  str
    probabilities:   dict


# ─────────────────────────────────────────
# HELPER: Build feature vector
# ─────────────────────────────────────────
def build_features(v: PatientVitals) -> pd.DataFrame:
    """Convert patient vitals to ML feature vector."""

    # Encode gender and ward
    gender_encoded = 1 if v.gender == "M" else 0
    ward_map       = {"ICU": 3, "HDU": 2, "Emergency": 2, "General": 1}
    ward_encoded   = ward_map.get(v.ward, 1)

    # Age group
    if v.age <= 40:   age_group = 0
    elif v.age <= 60: age_group = 1
    elif v.age <= 75: age_group = 2
    else:             age_group = 3

    # NEWS2 scores
    def rr_score(rr):
        if rr <= 8:  return 3
        if rr <= 11: return 1
        if rr <= 20: return 0
        if rr <= 24: return 2
        return 3

    def spo2_score(s):
        if s <= 83: return 3
        if s <= 85: return 2
        if s <= 87: return 1
        if s <= 92: return 0
        if s <= 94: return 1
        if s <= 96: return 2
        return 3

    def sbp_score(sbp):
        if sbp <= 90:  return 3
        if sbp <= 100: return 2
        if sbp <= 110: return 1
        if sbp <= 219: return 0
        return 3

    def hr_score(hr):
        if hr <= 40:  return 3
        if hr <= 50:  return 1
        if hr <= 90:  return 0
        if hr <= 110: return 1
        if hr <= 130: return 2
        return 3

    def temp_score(t):
        if t <= 35.0: return 3
        if t <= 36.0: return 1
        if t <= 38.0: return 0
        if t <= 39.0: return 1
        return 2

    n_rr   = rr_score(v.respiratory_rate)
    n_spo2 = spo2_score(v.spo2)
    n_sbp  = sbp_score(v.systolic_bp)
    n_hr   = hr_score(v.heart_rate)
    n_temp = temp_score(v.temperature)
    n_avpu = 3 if v.consciousness > 0 else 0
    news2  = n_rr + n_spo2 + n_sbp + n_hr + n_temp + n_avpu

    # Engineered features
    pulse_pressure = v.systolic_bp - v.diastolic_bp
    map_val        = round(v.diastolic_bp + (pulse_pressure / 3), 1)
    shock_index    = round(v.heart_rate / v.systolic_bp, 3)
    temp_deviation = round(abs(v.temperature - 37.0), 2)
    spo2_deficit   = round(100 - v.spo2, 1)
    resp_distress  = 1 if (v.respiratory_rate > 25 or v.spo2 < 92) else 0
    hypotension    = 1 if v.systolic_bp < 90 else 0
    tachycardia    = 1 if v.heart_rate > 100 else 0
    fever          = 1 if v.temperature > 38.3 else 0
    shock_ind      = 1 if (shock_index > 1.0 and hypotension == 1) else 0

    features = {
        "heart_rate": v.heart_rate, "systolic_bp": v.systolic_bp,
        "diastolic_bp": v.diastolic_bp, "temperature": v.temperature,
        "respiratory_rate": v.respiratory_rate, "spo2": v.spo2,
        "consciousness": v.consciousness, "urine_output": v.urine_output,
        "glucose": v.glucose, "pain_score": v.pain_score,
        "age": v.age, "gender_encoded": gender_encoded,
        "ward_encoded": ward_encoded, "age_group": age_group,
        "news2_rr": n_rr, "news2_spo2": n_spo2, "news2_sbp": n_sbp,
        "news2_hr": n_hr, "news2_temp": n_temp, "news2_avpu": n_avpu,
        "news2_total": news2, "pulse_pressure": pulse_pressure,
        "map": map_val, "shock_index": shock_index,
        "temp_deviation": temp_deviation, "spo2_deficit": spo2_deficit,
        "resp_distress": resp_distress, "hypotension": hypotension,
        "tachycardia": tachycardia, "fever": fever,
        "shock_indicator": shock_ind,
    }

    return pd.DataFrame([features])[FEATURE_NAMES]


# ─────────────────────────────────────────
# HELPER: Clinical concerns
# ─────────────────────────────────────────
def get_concerns(v: PatientVitals) -> list:
    concerns = []
    if v.heart_rate > 100:       concerns.append(f"Tachycardia (HR: {v.heart_rate})")
    if v.systolic_bp < 90:       concerns.append(f"Hypotension (SBP: {v.systolic_bp})")
    if v.spo2 < 92:              concerns.append(f"Low SpO2 ({v.spo2}%)")
    if v.respiratory_rate > 25:  concerns.append(f"High RR ({v.respiratory_rate})")
    if v.temperature > 38.3:     concerns.append(f"Fever ({v.temperature}°C)")
    if v.consciousness > 0:      concerns.append("Altered consciousness")
    if v.glucose > 10:           concerns.append(f"High glucose ({v.glucose})")
    return concerns if concerns else ["Vitals within acceptable range"]


# ─────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────
@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "version": "1.0.0"
    }


@router.post("/predict", response_model=PredictionResponse)
def predict_risk(vitals: PatientVitals):
    """
    Predict patient deterioration risk from vital signs.
    Returns risk level, NEWS2 score, and clinical recommendations.
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="ML model not loaded. Please check model files."
        )

    try:
        # Build feature vector
        X        = build_features(vitals)
        X_scaled = scaler.transform(X)

        # Predict
        risk_level   = int(model.predict(X_scaled)[0])
        probabilities = model.predict_proba(X_scaled)[0]
        confidence   = round(float(probabilities[risk_level]) * 100, 2)

        # Risk metadata
        risk_labels = {0: "Low",    1: "Medium",  2: "High"}
        risk_colors = {0: "green",  1: "orange",  2: "red"}
        recommendations = {
            0: "Continue routine monitoring every 4 hours.",
            1: "Increase monitoring to every 2 hours. Notify nurse in charge.",
            2: "URGENT: Notify physician immediately. Consider ICU transfer.",
        }

        # NEWS2
        features_df = build_features(vitals)
        news2_total = int(features_df["news2_total"].iloc[0])
        news2_cat   = "Low" if news2_total <= 4 else "Medium" if news2_total <= 6 else "High"

        return PredictionResponse(
            patient_id     = vitals.patient_id,
            risk_level     = risk_level,
            risk_label     = risk_labels[risk_level],
            risk_color     = risk_colors[risk_level],
            confidence     = confidence,
            news2_score    = news2_total,
            news2_category = news2_cat,
            top_concerns   = get_concerns(vitals),
            recommendation = recommendations[risk_level],
            probabilities  = {
                "low":    round(float(probabilities[0]) * 100, 2),
                "medium": round(float(probabilities[1]) * 100, 2),
                "high":   round(float(probabilities[2]) * 100, 2),
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model-info")
def model_info():
    """Returns model metadata and performance metrics."""
    eval_path = Path("src/ml/evaluation/model_evaluation.json")
    if eval_path.exists():
        with open(eval_path) as f:
            return json.load(f)
    return {"message": "Evaluation data not found"}