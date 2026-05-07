"""
File: src/database/repository.py
Purpose: Functions to save and retrieve data from database
"""

from sqlalchemy.orm import Session
from datetime import datetime
from src.database.models import (
    Patient, VitalReading, Prediction, AgentReport, Alert
)


# ─────────────────────────────────────────
# PATIENT FUNCTIONS
# ─────────────────────────────────────────
def get_or_create_patient(db: Session, patient_data: dict) -> Patient:
    """Get existing patient or create new one."""

    patient = db.query(Patient).filter(
        Patient.patient_id == patient_data["patient_id"]
    ).first()

    if not patient:
        patient = Patient(
            patient_id = patient_data["patient_id"],
            age        = patient_data.get("age"),
            gender     = patient_data.get("gender"),
            ward       = patient_data.get("ward"),
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

    return patient


def get_all_patients(db: Session) -> list:
    """Get all patients."""
    return db.query(Patient).all()


def get_patient_by_id(db: Session, patient_id: str) -> Patient:
    """Get single patient by ID."""
    return db.query(Patient).filter(
        Patient.patient_id == patient_id
    ).first()


# ─────────────────────────────────────────
# VITAL READING FUNCTIONS
# ─────────────────────────────────────────
def save_vital_reading(
    db: Session,
    patient_data: dict,
    news2_score: int
) -> VitalReading:
    """Save a new vital signs reading."""

    reading = VitalReading(
        patient_id       = patient_data["patient_id"],
        heart_rate       = patient_data.get("heart_rate"),
        systolic_bp      = patient_data.get("systolic_bp"),
        diastolic_bp     = patient_data.get("diastolic_bp"),
        temperature      = patient_data.get("temperature"),
        respiratory_rate = patient_data.get("respiratory_rate"),
        spo2             = patient_data.get("spo2"),
        consciousness    = patient_data.get("consciousness"),
        urine_output     = patient_data.get("urine_output"),
        glucose          = patient_data.get("glucose"),
        pain_score       = patient_data.get("pain_score"),
        news2_score      = news2_score,
        pulse_pressure   = (
            patient_data.get("systolic_bp", 0) -
            patient_data.get("diastolic_bp", 0)
        ),
        shock_index      = round(
            patient_data.get("heart_rate", 0) /
            max(patient_data.get("systolic_bp", 1), 1), 3
        ),
    )

    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


def get_patient_vitals_history(
    db: Session,
    patient_id: str,
    limit: int = 20
) -> list:
    """Get recent vital readings for a patient."""
    return (
        db.query(VitalReading)
        .filter(VitalReading.patient_id == patient_id)
        .order_by(VitalReading.recorded_at.desc())
        .limit(limit)
        .all()
    )


# ─────────────────────────────────────────
# PREDICTION FUNCTIONS
# ─────────────────────────────────────────
def save_prediction(
    db: Session,
    patient_id: str,
    prediction: dict
) -> Prediction:
    """Save ML prediction result."""

    probs = prediction.get("probabilities", {})

    pred = Prediction(
        patient_id     = patient_id,
        risk_level     = prediction.get("risk_level"),
        risk_label     = prediction.get("risk_label"),
        confidence     = prediction.get("confidence"),
        news2_score    = prediction.get("news2_score"),
        news2_category = prediction.get("news2_category", ""),
        prob_low       = probs.get("low", 0),
        prob_medium    = probs.get("medium", 0),
        prob_high      = probs.get("high", 0),
        top_concerns   = prediction.get("top_concerns", []),
        recommendation = prediction.get("recommendation", ""),
    )

    db.add(pred)
    db.commit()
    db.refresh(pred)
    return pred


def get_recent_predictions(
    db: Session,
    limit: int = 50
) -> list:
    """Get most recent predictions across all patients."""
    return (
        db.query(Prediction)
        .order_by(Prediction.predicted_at.desc())
        .limit(limit)
        .all()
    )


def get_high_risk_patients(db: Session) -> list:
    """Get unique patients with latest prediction."""

    try:
        all_preds = db.query(Prediction).order_by(
            Prediction.predicted_at.desc()
        ).all()

        # Get latest prediction per patient
        seen     = set()
        latest   = []
        for pred in all_preds:
            if pred.patient_id not in seen:
                seen.add(pred.patient_id)
                latest.append(pred)

        # Return all patients sorted by risk
        latest.sort(key=lambda x: x.risk_level, reverse=True)

        return [
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
    except Exception as e:
        print(f"Error in get_high_risk_patients: {e}")
        return []


# ─────────────────────────────────────────
# AGENT REPORT FUNCTIONS
# ─────────────────────────────────────────
def save_agent_report(
    db: Session,
    report: dict
) -> AgentReport:
    """Save full agent report."""

    agent_report = AgentReport(
        report_id         = report.get("report_id"),
        patient_id        = report.get("patient_id"),
        alert_level       = report.get("alert_level"),
        executive_summary = report.get("executive_summary"),
        triage_result     = report.get("triage"),
        warning_result    = report.get("warnings"),
        insight_result    = report.get("insights"),
        prediction        = report.get("prediction"),
        sepsis_protocol   = report.get(
            "insights", {}
        ).get("sepsis_protocol", False),
        processing_time   = report.get("processing_time"),
    )

    db.add(agent_report)
    db.commit()
    db.refresh(agent_report)
    return agent_report


def get_patient_reports(
    db: Session,
    patient_id: str,
    limit: int = 10
) -> list:
    """Get recent reports for a patient."""
    return (
        db.query(AgentReport)
        .filter(AgentReport.patient_id == patient_id)
        .order_by(AgentReport.generated_at.desc())
        .limit(limit)
        .all()
    )


# ─────────────────────────────────────────
# ALERT FUNCTIONS
# ─────────────────────────────────────────
def save_alerts(
    db: Session,
    patient_id: str,
    warnings: dict
) -> list:
    """Save alerts — resolve old ones first."""

    # Auto-resolve previous alerts for this patient
    db.query(Alert).filter(
        Alert.patient_id == patient_id,
        Alert.is_resolved == False
    ).update({
        "is_resolved": True,
        "resolved_at": datetime.now(),
        "resolved_by": "Auto-resolved by new assessment"
    })
    db.commit()

    saved = []

    # Only save CRITICAL and WARNING alerts
    for crit in warnings.get("critical", []):
        alert = Alert(
            patient_id = patient_id,
            alert_type = crit.get("vital", "Unknown"),
            severity   = "CRITICAL",
            message    = crit.get("alert", ""),
            action     = crit.get("action", ""),
        )
        db.add(alert)
        saved.append(alert)

    for warn in warnings.get("warnings", []):
        alert = Alert(
            patient_id = patient_id,
            alert_type = warn.get("vital", "Unknown"),
            severity   = "WARNING",
            message    = warn.get("alert", ""),
            action     = warn.get("action", ""),
        )
        db.add(alert)
        saved.append(alert)

    if warnings.get("sepsis_alert"):
        alert = Alert(
            patient_id = patient_id,
            alert_type = "SEPSIS",
            severity   = "CRITICAL",
            message    = warnings["sepsis_alert"],
            action     = "Activate sepsis protocol immediately",
        )
        db.add(alert)
        saved.append(alert)

    db.commit()
    return saved


def get_active_alerts(db: Session) -> list:
    """Get all unresolved alerts."""
    return (
        db.query(Alert)
        .filter(Alert.is_resolved == False)
        .order_by(Alert.created_at.desc())
        .all()
    )


# ─────────────────────────────────────────
# DASHBOARD STATS
# ─────────────────────────────────────────
def get_dashboard_stats(db: Session) -> dict:
    """Get accurate summary statistics."""

    # Simple direct queries that work
    total_patients = db.query(Patient).count()
    total_readings = db.query(VitalReading).count()

    # Get all predictions
    all_preds = db.query(Prediction).all()

    # Get latest prediction per patient
    latest = {}
    for pred in all_preds:
        pid = pred.patient_id
        if pid not in latest:
            latest[pid] = pred
        else:
            if pred.predicted_at > latest[pid].predicted_at:
                latest[pid] = pred

    high_risk   = sum(1 for p in latest.values() if p.risk_level == 2)
    medium_risk = sum(1 for p in latest.values() if p.risk_level == 1)
    low_risk    = sum(1 for p in latest.values() if p.risk_level == 0)

    active_alerts = db.query(Alert).filter(
        Alert.is_resolved == False
    ).count()

    return {
        "total_patients":  total_patients,
        "total_readings":  total_readings,
        "active_alerts":   active_alerts,
        "high_risk":       high_risk,
        "medium_risk":     medium_risk,
        "low_risk":        low_risk,
    }
