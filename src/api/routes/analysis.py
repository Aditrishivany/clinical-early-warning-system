"""
Full analysis endpoint — ML + multi-agent pipeline + database persistence.
"""

import logging
import joblib
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from src.agents.coordinator import AgentCoordinator
from src.database.connection import get_db
from src.database.repository import (
    get_or_create_patient, save_vital_reading, save_prediction,
    save_agent_report, save_alerts, get_dashboard_stats,
    get_active_alerts, get_high_risk_patients,
    get_patient_reports, get_patient_vitals_history, write_audit,
)
from src.utils.features import build_features, get_news2_score, get_news2_category, get_clinical_concerns
from src.utils.security import get_current_user_optional
from config.settings import settings

logger     = logging.getLogger(__name__)
router     = APIRouter()
coordinator = AgentCoordinator()

# ── Load model ────────────────────────────────────────────────────────────────
_MODELS_DIR = Path(settings.MODELS_DIR)

try:
    model  = joblib.load(_MODELS_DIR / "early_warning_model.joblib")
    scaler = joblib.load(_MODELS_DIR / "feature_scaler.joblib")
    logger.info("Analysis route: ML model loaded")
except Exception as e:
    logger.error("Model load error: %s", e)
    model  = None
    scaler = None

_RISK_LABELS = {0: "Low", 1: "Medium", 2: "High"}
_RISK_COLORS = {0: "green", 1: "orange", 2: "red"}
_RECOMMENDATIONS = {
    0: "Continue routine monitoring every 4 hours.",
    1: "Increase monitoring to every 2 hours. Notify nurse in charge.",
    2: "URGENT: Notify physician immediately. Consider ICU transfer.",
}


# ── Schema ────────────────────────────────────────────────────────────────────

class PatientInput(BaseModel):
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


# ── Main analysis endpoint ────────────────────────────────────────────────────

@router.post("/analyze")
def full_analysis(
    patient: PatientInput,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),
):
    """Full clinical analysis: ML + agents + database persistence."""
    if model is None:
        raise HTTPException(status_code=503, detail="ML model not available")

    try:
        patient_dict = patient.model_dump()

        # Step 1: ML prediction
        X        = build_features(patient_dict)
        X_scaled = scaler.transform(X)

        risk_level    = int(model.predict(X_scaled)[0])
        probabilities = model.predict_proba(X_scaled)[0]
        confidence    = round(float(probabilities[risk_level]) * 100, 2)
        news2_total   = get_news2_score(patient_dict)

        prediction = {
            "risk_level":     risk_level,
            "risk_label":     _RISK_LABELS[risk_level],
            "risk_color":     _RISK_COLORS[risk_level],
            "confidence":     confidence,
            "news2_score":    news2_total,
            "news2_category": get_news2_category(news2_total),
            "top_concerns":   get_clinical_concerns(patient_dict),
            "recommendation": _RECOMMENDATIONS[risk_level],
            "probabilities": {
                "low":    round(float(probabilities[0]) * 100, 2),
                "medium": round(float(probabilities[1]) * 100, 2),
                "high":   round(float(probabilities[2]) * 100, 2),
            },
        }

        # Step 2: Run agents
        report = coordinator.run(patient_dict, prediction)

        # Step 3: Persist to database
        get_or_create_patient(db, patient_dict)
        save_vital_reading(db, patient_dict, news2_total)
        save_prediction(db, patient.patient_id, prediction)
        save_agent_report(db, report)
        save_alerts(db, patient.patient_id, report.get("warnings", {}))

        # Audit
        performer = current_user.get("sub", "api") if current_user else "api"
        write_audit(
            db, "patient_analyzed", performer,
            patient_id=patient.patient_id,
            details={"risk_label": prediction["risk_label"], "news2": news2_total},
        )

        return {
            "status":     "success",
            "saved_to_db": True,
            "timestamp":   datetime.utcnow().isoformat(),
            "report":      report,
        }

    except HTTPException:
        raise
    except Exception:
        logger.exception("Analysis error for patient %s", patient.patient_id)
        raise HTTPException(status_code=500, detail="Analysis failed — check server logs")


# ── Dashboard read endpoints ──────────────────────────────────────────────────

@router.get("/dashboard/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user_optional),
):
    return get_dashboard_stats(db)


@router.get("/dashboard/alerts")
def active_alerts(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user_optional),
):
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
        ],
    }


@router.get("/dashboard/high-risk")
def high_risk_patients(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user_optional),
):
    patients = get_high_risk_patients(db)
    return {"total": len(patients), "patients": patients}


@router.get("/patient/{patient_id}/history")
def patient_history(
    patient_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user_optional),
):
    vitals  = get_patient_vitals_history(db, patient_id)
    reports = get_patient_reports(db, patient_id)
    return {
        "patient_id":      patient_id,
        "total_readings":  len(vitals),
        "total_reports":   len(reports),
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
                "report_id":    r.report_id,
                "alert_level":  r.alert_level,
                "generated_at": str(r.generated_at),
                "summary":      r.executive_summary,
            }
            for r in reports
        ],
    }


@router.get("/analyze/health")
def analysis_health():
    return {
        "status":      "healthy",
        "agents":      ["Triage", "Warning", "Insight"],
        "model_ready": model is not None,
        "database":    "connected",
    }
