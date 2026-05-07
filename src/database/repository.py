"""
Data access layer — clean SQL queries, proper transactions, audit logging.
"""

import logging
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime
from typing import Optional

from src.database.models import (
    Patient, VitalReading, Prediction, AgentReport,
    Alert, AuditLog, ConversationHistory
)

logger = logging.getLogger(__name__)


# ── Patient ──────────────────────────────────────────────────────────────────

def get_or_create_patient(db: Session, patient_data: dict) -> Patient:
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
    return db.query(Patient).filter(Patient.is_discharged == False).all()


def get_patient_by_id(db: Session, patient_id: str) -> Optional[Patient]:
    return db.query(Patient).filter(Patient.patient_id == patient_id).first()


# ── Vital Readings ────────────────────────────────────────────────────────────

def save_vital_reading(db: Session, patient_data: dict, news2_score: int) -> VitalReading:
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
        shock_index = round(
            patient_data.get("heart_rate", 0) /
            max(patient_data.get("systolic_bp", 1), 1), 3
        ),
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


def get_patient_vitals_history(db: Session, patient_id: str, limit: int = 20) -> list:
    return (
        db.query(VitalReading)
        .filter(VitalReading.patient_id == patient_id)
        .order_by(desc(VitalReading.recorded_at))
        .limit(limit)
        .all()
    )


# ── Predictions ───────────────────────────────────────────────────────────────

def save_prediction(db: Session, patient_id: str, prediction: dict) -> Prediction:
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


def get_recent_predictions(db: Session, limit: int = 50) -> list:
    return (
        db.query(Prediction)
        .order_by(desc(Prediction.predicted_at))
        .limit(limit)
        .all()
    )


def get_high_risk_patients(db: Session) -> list:
    """
    Efficient SQL query: get the latest prediction per patient,
    sorted by risk level descending.
    Uses a correlated subquery instead of loading all rows into Python.
    """
    try:
        # Subquery: max predicted_at per patient
        latest_subq = (
            db.query(
                Prediction.patient_id,
                func.max(Prediction.predicted_at).label("max_at"),
            )
            .group_by(Prediction.patient_id)
            .subquery()
        )

        latest_preds = (
            db.query(Prediction)
            .join(
                latest_subq,
                (Prediction.patient_id == latest_subq.c.patient_id) &
                (Prediction.predicted_at == latest_subq.c.max_at),
            )
            .order_by(desc(Prediction.risk_level), desc(Prediction.predicted_at))
            .all()
        )

        return [
            {
                "patient_id":   p.patient_id,
                "risk_level":   p.risk_level,
                "risk_label":   p.risk_label or "Low",
                "confidence":   p.confidence or 0,
                "news2_score":  p.news2_score or 0,
                "predicted_at": str(p.predicted_at),
            }
            for p in latest_preds
        ]
    except Exception:
        logger.exception("Error fetching high-risk patients")
        return []


# ── Agent Reports ─────────────────────────────────────────────────────────────

def save_agent_report(db: Session, report: dict) -> AgentReport:
    agent_report = AgentReport(
        report_id         = report.get("report_id"),
        patient_id        = report.get("patient_id"),
        alert_level       = report.get("alert_level"),
        executive_summary = report.get("executive_summary"),
        triage_result     = report.get("triage"),
        warning_result    = report.get("warnings"),
        insight_result    = report.get("insights"),
        prediction        = report.get("prediction"),
        sepsis_protocol   = report.get("insights", {}).get("sepsis_protocol", False),
        processing_time   = report.get("processing_time"),
    )
    db.add(agent_report)
    db.commit()
    db.refresh(agent_report)
    return agent_report


def get_patient_reports(db: Session, patient_id: str, limit: int = 10) -> list:
    return (
        db.query(AgentReport)
        .filter(AgentReport.patient_id == patient_id)
        .order_by(desc(AgentReport.generated_at))
        .limit(limit)
        .all()
    )


# ── Alerts ────────────────────────────────────────────────────────────────────

def save_alerts(db: Session, patient_id: str, warnings: dict) -> list:
    # Auto-resolve previous unresolved alerts for this patient
    db.query(Alert).filter(
        Alert.patient_id == patient_id,
        Alert.is_resolved == False,
    ).update({
        "is_resolved": True,
        "resolved_at": datetime.utcnow(),
        "resolved_by": "System — superseded by new assessment",
    }, synchronize_session=False)

    saved = []

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
    return (
        db.query(Alert)
        .filter(Alert.is_resolved == False)
        .order_by(desc(Alert.created_at))
        .all()
    )


# ── Dashboard Stats ───────────────────────────────────────────────────────────

def get_dashboard_stats(db: Session) -> dict:
    total_patients = db.query(Patient).filter(Patient.is_discharged == False).count()
    total_readings = db.query(VitalReading).count()

    # Latest risk distribution using efficient SQL subquery
    latest_subq = (
        db.query(
            Prediction.patient_id,
            func.max(Prediction.predicted_at).label("max_at"),
        )
        .group_by(Prediction.patient_id)
        .subquery()
    )

    latest_preds = (
        db.query(Prediction)
        .join(
            latest_subq,
            (Prediction.patient_id == latest_subq.c.patient_id) &
            (Prediction.predicted_at == latest_subq.c.max_at),
        )
        .all()
    )

    high_risk   = sum(1 for p in latest_preds if p.risk_level == 2)
    medium_risk = sum(1 for p in latest_preds if p.risk_level == 1)
    low_risk    = sum(1 for p in latest_preds if p.risk_level == 0)

    active_alerts = db.query(Alert).filter(Alert.is_resolved == False).count()

    return {
        "total_patients": total_patients,
        "total_readings": total_readings,
        "active_alerts":  active_alerts,
        "high_risk":      high_risk,
        "medium_risk":    medium_risk,
        "low_risk":       low_risk,
    }


# ── Conversation History (persistent chat) ────────────────────────────────────

def get_conversation_history(db: Session, session_id: str, limit: int = 20) -> list:
    rows = (
        db.query(ConversationHistory)
        .filter(ConversationHistory.session_id == session_id)
        .order_by(ConversationHistory.created_at.asc())
        .limit(limit)
        .all()
    )
    return [{"role": r.role, "content": r.content} for r in rows]


def append_conversation(db: Session, session_id: str, user_id: str, role: str, content: str):
    entry = ConversationHistory(
        session_id = session_id,
        user_id    = user_id,
        role       = role,
        content    = content,
    )
    db.add(entry)
    db.commit()


def clear_conversation(db: Session, session_id: str):
    db.query(ConversationHistory).filter(
        ConversationHistory.session_id == session_id
    ).delete()
    db.commit()


# ── Audit Log ─────────────────────────────────────────────────────────────────

def write_audit(
    db: Session,
    action: str,
    performed_by: str,
    patient_id: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
):
    log = AuditLog(
        action       = action,
        performed_by = performed_by,
        patient_id   = patient_id,
        details      = details or {},
        ip_address   = ip_address,
    )
    db.add(log)
    try:
        db.commit()
    except Exception:
        db.rollback()
        logger.warning("Failed to write audit log for action=%s", action)
