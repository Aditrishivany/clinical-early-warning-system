"""
File: src/api/routes/analysis.py
Purpose: Full analysis endpoint — ML + Agents + Database
"""
from src.database.models import Patient, VitalReading, Prediction, Alert
import joblib
import json
import sys
import pandas as pd
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime

sys.path.append(".")

from src.agents.coordinator  import AgentCoordinator
from src.database.connection import get_db
from src.database.repository import (
    get_or_create_patient,
    save_vital_reading,
    save_prediction,
    save_agent_report,
    save_alerts,
    get_dashboard_stats,
    get_recent_predictions,
    get_high_risk_patients,
    get_patient_reports,
    get_active_alerts,
    get_patient_vitals_history,
)

router      = APIRouter()
coordinator = AgentCoordinator()

# ─────────────────────────────────────────
# LOAD MODEL
# ─────────────────────────────────────────
MODELS_DIR = Path("src/ml/models")

try:
    model  = joblib.load(MODELS_DIR / "early_warning_model.joblib")
    scaler = joblib.load(MODELS_DIR / "feature_scaler.joblib")
    with open("src/data/features/feature_list.json") as f:
        FEATURE_NAMES = json.load(f)["features"]
    print("  ✅ Analysis route: ML Model loaded")
except Exception as e:
    print(f"  ❌ Model load error: {e}")
    model  = None
    scaler = None


# ─────────────────────────────────────────
# INPUT SCHEMA
# ─────────────────────────────────────────
class PatientInput(BaseModel):
    patient_id:       str   = Field(..., example="PT1001")
    age:              float = Field(..., example=72)
    gender:           str   = Field(..., example="M")
    ward:             str   = Field(..., example="ICU")
    heart_rate:       float = Field(..., example=128)
    systolic_bp:      float = Field(..., example=85)
    diastolic_bp:     float = Field(..., example=55)
    temperature:      float = Field(..., example=39.2)
    respiratory_rate: float = Field(..., example=28)
    spo2:             float = Field(..., example=89)
    consciousness:    int   = Field(..., example=1)
    urine_output:     float = Field(..., example=12)
    glucose:          float = Field(..., example=11.5)
    pain_score:       int   = Field(..., example=7)


# ─────────────────────────────────────────
# FEATURE BUILDER
# ─────────────────────────────────────────
def build_features(v: PatientInput) -> pd.DataFrame:
    gender_encoded = 1 if v.gender == "M" else 0
    ward_map       = {"ICU": 3, "HDU": 2, "Emergency": 2, "General": 1}
    ward_encoded   = ward_map.get(v.ward, 1)

    if v.age <= 40:   age_group = 0
    elif v.age <= 60: age_group = 1
    elif v.age <= 75: age_group = 2
    else:             age_group = 3

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
# MAIN ANALYSIS ENDPOINT
# ─────────────────────────────────────────
@router.post("/analyze")
def full_analysis(
    patient: PatientInput,
    db: Session = Depends(get_db)
):
    """
    Complete clinical analysis:
    ML Prediction + All Agents + Save to Database
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # ── Step 1: ML Prediction ──
        X        = build_features(patient)
        X_scaled = scaler.transform(X)

        risk_level    = int(model.predict(X_scaled)[0])
        probabilities = model.predict_proba(X_scaled)[0]
        confidence    = round(float(probabilities[risk_level]) * 100, 2)
        news2_total   = int(X["news2_total"].iloc[0])

        risk_labels = {0: "Low", 1: "Medium", 2: "High"}
        risk_colors = {0: "green", 1: "orange", 2: "red"}
        recommendations = {
            0: "Continue routine monitoring every 4 hours.",
            1: "Increase monitoring to every 2 hours. Notify nurse in charge.",
            2: "URGENT: Notify physician immediately. Consider ICU transfer.",
        }

        concerns = []
        if patient.heart_rate > 100:
            concerns.append(f"Tachycardia (HR: {patient.heart_rate})")
        if patient.systolic_bp < 90:
            concerns.append(f"Hypotension (SBP: {patient.systolic_bp})")
        if patient.spo2 < 92:
            concerns.append(f"Low SpO2 ({patient.spo2}%)")
        if patient.respiratory_rate > 25:
            concerns.append(f"High RR ({patient.respiratory_rate})")
        if patient.temperature > 38.3:
            concerns.append(f"Fever ({patient.temperature}°C)")
        if patient.consciousness > 0:
            concerns.append("Altered consciousness")

        prediction = {
            "risk_level":     risk_level,
            "risk_label":     risk_labels[risk_level],
            "risk_color":     risk_colors[risk_level],
            "confidence":     confidence,
            "news2_score":    news2_total,
            "news2_category": "Low" if news2_total <= 4 else "Medium" if news2_total <= 6 else "High",
            "top_concerns":   concerns,
            "recommendation": recommendations[risk_level],
            "probabilities": {
                "low":    round(float(probabilities[0]) * 100, 2),
                "medium": round(float(probabilities[1]) * 100, 2),
                "high":   round(float(probabilities[2]) * 100, 2),
            }
        }

        # ── Step 2: Run All Agents ──
        patient_dict = patient.dict()
        report       = coordinator.run(patient_dict, prediction)

        # ── Step 3: Save to Database ──
        get_or_create_patient(db, patient_dict)
        save_vital_reading(db, patient_dict, news2_total)
        save_prediction(db, patient.patient_id, prediction)
        save_agent_report(db, report)
        save_alerts(db, patient.patient_id, report["warnings"])

        return {
            "status":    "success",
            "saved_to_db": True,
            "timestamp": datetime.now().isoformat(),
            "report":    report,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────
# DATABASE READ ENDPOINTS
# ─────────────────────────────────────────
@router.get("/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    """Get summary stats for dashboard."""
    return get_dashboard_stats(db)


@router.get("/dashboard/alerts")
def active_alerts(db: Session = Depends(get_db)):
    """Get all active unresolved alerts."""
    alerts = get_active_alerts(db)
    return {
        "total": len(alerts),
        "alerts": [
            {
                "id":         a.id,
                "patient_id": a.patient_id,
                "type":       a.alert_type,
                "severity":   a.severity,
                "message":    a.message,
                "action":     a.action,
                "created_at": str(a.created_at),
            }
            for a in alerts
        ]
    }


@router.get("/dashboard/high-risk")
def high_risk_patients(db: Session = Depends(get_db)):
    """Get all high risk patients."""
    try:
        all_preds = db.query(Prediction).order_by(
            Prediction.predicted_at.desc()
        ).all()

        # Get latest prediction per patient
        seen   = set()
        latest = []
        for pred in all_preds:
            if pred.patient_id not in seen:
                seen.add(pred.patient_id)
                latest.append(pred)

        # Sort by risk level
        latest.sort(key=lambda x: x.risk_level, reverse=True)

        patients = [
            {
                "patient_id":   p.patient_id,
                "risk_level":   p.risk_level,
                "risk_label":   p.risk_label or "Low",
                "confidence":   p.confidence or 0,
                "news2_score":  p.news2_score or 0,
                "predicted_at": str(p.predicted_at),
            }
            for p in latest
        ]

        return {
            "total":    len(patients),
            "patients": patients
        }

    except Exception as e:
        print(f"Error: {e}")
        return {"total": 0, "patients": []}


@router.get("/patient/{patient_id}/history")
def patient_history(
    patient_id: str,
    db: Session = Depends(get_db)
):
    """Get full history for a patient."""
    vitals  = get_patient_vitals_history(db, patient_id)
    reports = get_patient_reports(db, patient_id)

    return {
        "patient_id":    patient_id,
        "total_readings": len(vitals),
        "total_reports":  len(reports),
        "recent_vitals": [
            {
                "recorded_at":     str(v.recorded_at),
                "heart_rate":      v.heart_rate,
                "systolic_bp":     v.systolic_bp,
                "spo2":            v.spo2,
                "temperature":     v.temperature,
                "news2_score":     v.news2_score,
            }
            for v in vitals
        ],
        "recent_reports": [
            {
                "report_id":   r.report_id,
                "alert_level": r.alert_level,
                "generated_at": str(r.generated_at),
                "summary":     r.executive_summary,
            }
            for r in reports
        ]
    }


@router.get("/analyze/health")
def analysis_health():
    return {
        "status":      "healthy",
        "agents":      ["Triage", "Warning", "Insight"],
        "model_ready": model is not None,
        "database":    "connected"
    }