"""
RAG chatbot endpoint — persistent conversation history, role-aware context,
input sanitisation, auth-aware.
"""

import logging
import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from typing import Optional
from sqlalchemy.orm import Session

from src.database.connection import get_db
from src.database.models import Patient, VitalReading, Prediction, Alert, PatientAssignment
from src.database.repository import (
    get_conversation_history, append_conversation,
    clear_conversation, write_audit,
)
from src.rag.rag_engine import ClinicalRAGEngine
from src.utils.security import get_current_user_optional
from config.settings import settings

logger     = logging.getLogger(__name__)
router     = APIRouter()
rag_engine = ClinicalRAGEngine()

_MAX_INPUT_LEN = 500     # chars — prevent oversized prompts
_MAX_HISTORY   = 10      # message pairs kept


# ── Schemas ───────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    message:          str
    user_id:          str
    user_role:        str
    session_id:       Optional[str] = None
    patient_context:  Optional[dict] = {}

    @field_validator("message")
    @classmethod
    def sanitise_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty")
        # Truncate to prevent prompt injection via oversized input
        return v[:_MAX_INPUT_LEN]

    @field_validator("user_role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = {"admin", "doctor", "nurse", "patient"}
        if v not in allowed:
            raise ValueError(f"Invalid role. Must be one of: {allowed}")
        return v


class ClinicalQuestion(BaseModel):
    question:        str
    patient_context: Optional[dict] = {}


# ── Patient data helpers ──────────────────────────────────────────────────────

def _get_patient_data(db: Session, patient_id: str) -> dict:
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        return {}

    latest_vital = (
        db.query(VitalReading)
        .filter(VitalReading.patient_id == patient_id)
        .order_by(VitalReading.recorded_at.desc())
        .first()
    )
    latest_pred = (
        db.query(Prediction)
        .filter(Prediction.patient_id == patient_id)
        .order_by(Prediction.predicted_at.desc())
        .first()
    )
    alerts = db.query(Alert).filter(
        Alert.patient_id  == patient_id,
        Alert.is_resolved == False,
    ).all()
    assignment = db.query(PatientAssignment).filter(
        PatientAssignment.patient_id == patient_id,
        PatientAssignment.is_active  == True,
    ).first()

    return {
        "patient_id":   patient.patient_id,
        "name":         patient.name,
        "age":          patient.age,
        "gender":       patient.gender,
        "ward":         patient.ward,
        "bed_number":   patient.bed_number,
        "blood_type":   patient.blood_type,
        "allergies":    patient.allergies or [],
        "admitted_at":  str(patient.admitted_at),
        "doctor":       assignment.doctor_id if assignment else "Not assigned",
        "nurse":        assignment.nurse_id  if assignment else "Not assigned",
        "current_vitals": {
            "heart_rate":       latest_vital.heart_rate       if latest_vital else None,
            "systolic_bp":      latest_vital.systolic_bp      if latest_vital else None,
            "temperature":      latest_vital.temperature      if latest_vital else None,
            "respiratory_rate": latest_vital.respiratory_rate if latest_vital else None,
            "spo2":             latest_vital.spo2             if latest_vital else None,
            "news2_score":      latest_vital.news2_score      if latest_vital else None,
        } if latest_vital else {},
        "risk_assessment": {
            "risk_label":  latest_pred.risk_label  if latest_pred else "Unknown",
            "confidence":  latest_pred.confidence  if latest_pred else 0,
            "news2_score": latest_pred.news2_score if latest_pred else 0,
        } if latest_pred else {},
        "active_alerts": [
            {"type": a.alert_type, "severity": a.severity, "message": a.message}
            for a in alerts
        ],
    }


def _get_doctor_data(db: Session, doctor_id: str) -> dict:
    assignments = db.query(PatientAssignment).filter(
        PatientAssignment.doctor_id == doctor_id,
        PatientAssignment.is_active == True,
    ).all()
    patients_data = []
    for asgn in assignments:
        pred = (
            db.query(Prediction)
            .filter(Prediction.patient_id == asgn.patient_id)
            .order_by(Prediction.predicted_at.desc())
            .first()
        )
        pat = db.query(Patient).filter(Patient.patient_id == asgn.patient_id).first()
        alert_count = db.query(Alert).filter(
            Alert.patient_id  == asgn.patient_id,
            Alert.is_resolved == False,
        ).count()
        if pat:
            patients_data.append({
                "patient_id":    pat.patient_id,
                "name":          pat.name,
                "age":           pat.age,
                "ward":          pat.ward,
                "bed_number":    pat.bed_number,
                "risk_label":    pred.risk_label  if pred else "Unknown",
                "news2_score":   pred.news2_score if pred else 0,
                "active_alerts": alert_count,
            })
    return {"assigned_patients": patients_data}


def _get_nurse_data(db: Session, nurse_id: str) -> dict:
    assignments = db.query(PatientAssignment).filter(
        PatientAssignment.nurse_id  == nurse_id,
        PatientAssignment.is_active == True,
    ).all()
    patients_data = []
    for asgn in assignments:
        vital = (
            db.query(VitalReading)
            .filter(VitalReading.patient_id == asgn.patient_id)
            .order_by(VitalReading.recorded_at.desc())
            .first()
        )
        pat = db.query(Patient).filter(Patient.patient_id == asgn.patient_id).first()
        if pat:
            patients_data.append({
                "patient_id":  pat.patient_id,
                "name":        pat.name,
                "ward":        pat.ward,
                "bed_number":  pat.bed_number,
                "heart_rate":  vital.heart_rate  if vital else None,
                "spo2":        vital.spo2        if vital else None,
                "news2_score": vital.news2_score if vital else None,
            })
    return {"ward_patients": patients_data}


# ── System prompt builder ─────────────────────────────────────────────────────

def _build_system_prompt(user_role: str, real_data: dict, guidelines_text: str) -> str:
    hospital = settings.HOSPITAL_NAME

    if user_role == "patient":
        vit = real_data.get("current_vitals", {})
        risk = real_data.get("risk_assessment", {})
        allergies = ", ".join(real_data.get("allergies", [])) or "None known"
        return f"""You are a caring AI health assistant for {hospital}.

Patient: {real_data.get('name', 'Patient')}, {real_data.get('age')} y/o {real_data.get('gender')}
Ward: {real_data.get('ward')} | Blood Type: {real_data.get('blood_type')}
Allergies: {allergies} | Doctor: {real_data.get('doctor')}

Latest Vitals: HR {vit.get('heart_rate')} bpm, SpO2 {vit.get('spo2')}%, \
Temp {vit.get('temperature')}°C, RR {vit.get('respiratory_rate')}/min
Risk: {risk.get('risk_label')} | NEWS2: {risk.get('news2_score')}
Active Alerts: {len(real_data.get('active_alerts', []))}

Medical Guidelines:
{guidelines_text}

Rules: Be warm and empathetic. Explain medical terms simply. \
Always recommend consulting their doctor for clinical decisions. \
Never cause unnecessary anxiety. Be honest but gentle."""

    if user_role == "doctor":
        pts = real_data.get("assigned_patients", [])
        pts_str = "\n".join(
            f"  • {p['name']} ({p['patient_id']}): {p['risk_label']} risk, "
            f"NEWS2 {p['news2_score']}, Ward {p['ward']}, {p['active_alerts']} alert(s)"
            for p in pts
        ) or "  No assigned patients found."
        return f"""You are an expert AI clinical decision support assistant for {hospital}.

Assigned Patients ({len(pts)}):
{pts_str}

Medical Guidelines:
{guidelines_text}

Rules: Provide evidence-based clinical decision support. Reference specific patient data. \
Use proper medical terminology. Flag critical findings. Support — never replace — clinical judgement."""

    if user_role == "nurse":
        ward_pts = real_data.get("ward_patients", [])
        pts_str = "\n".join(
            f"  • {p['name']} ({p['patient_id']}): HR {p['heart_rate']}, "
            f"SpO2 {p['spo2']}%, NEWS2 {p['news2_score']}, Bed {p['bed_number']}"
            for p in ward_pts
        ) or "  No ward patients found."
        return f"""You are an AI ward assistant for nursing staff at {hospital}.

Ward Patients ({len(ward_pts)}):
{pts_str}

Medical Guidelines:
{guidelines_text}

Rules: Help with clinical observations, documentation, and nursing interventions. \
Alert to concerning vital sign changes. Use clear, actionable language."""

    return f"""You are an AI clinical assistant for {hospital}.

Medical Guidelines:
{guidelines_text}

Provide accurate, helpful medical information."""


# ── Chat endpoint ─────────────────────────────────────────────────────────────

@router.post("/chat")
def chat(
    body: ChatMessage,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),
):
    """Multi-turn clinical chatbot with persistent history and role-aware context."""
    session_id = body.session_id or body.user_id
    user_id    = body.user_id
    user_role  = body.user_role
    message    = body.message

    # Fetch real data based on role
    real_data: dict = {}
    if user_role == "patient":
        real_data = _get_patient_data(db, user_id)
    elif user_role == "doctor":
        real_data = _get_doctor_data(db, user_id)
    elif user_role == "nurse":
        real_data = _get_nurse_data(db, user_id)

    # Search medical guidelines
    guidelines = rag_engine.search(message, top_k=2)
    guidelines_text = "\n\n".join(
        f"[{g['title']}]\n{g['content'][:300]}" for g in guidelines
    ) if guidelines else ""

    system_prompt = _build_system_prompt(user_role, real_data, guidelines_text)

    # Retrieve persistent conversation history
    history = get_conversation_history(db, session_id, limit=_MAX_HISTORY * 2)

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": message})

    # Generate response via Groq
    try:
        from groq import Groq
        api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
        if not api_key:
            raise ValueError("GROQ_API_KEY not configured")

        client   = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model       = settings.GROQ_MODEL,
            messages    = messages,
            temperature = 0.4,
            max_tokens  = 600,
        )
        answer     = response.choices[0].message.content
        ai_powered = True

    except Exception as exc:
        logger.warning("Groq unavailable (%s), falling back to rule-based", exc)
        result     = rag_engine.answer(message, body.patient_context)
        answer     = result["answer"]
        ai_powered = False

    # Persist conversation turn
    append_conversation(db, session_id, user_id, "user",      message)
    append_conversation(db, session_id, user_id, "assistant", answer)

    # Audit (only for clinical roles)
    if user_role in ("doctor", "nurse"):
        performer = current_user.get("sub", user_id) if current_user else user_id
        write_audit(db, "chat_query", performer, details={"role": user_role, "ai": ai_powered})

    return {
        "answer":     answer,
        "sources":    [{"title": g["title"]} for g in guidelines],
        "ai_powered": ai_powered,
        "timestamp":  datetime.utcnow().isoformat(),
    }


@router.post("/chat/clear")
def clear_chat(
    user_id: str,
    db: Session = Depends(get_db),
):
    clear_conversation(db, user_id)
    return {"success": True, "message": "Conversation cleared"}


@router.post("/ask")
def ask_clinical_question(
    body: ClinicalQuestion,
    db: Session = Depends(get_db),
):
    """Legacy endpoint — direct RAG Q&A without conversation memory."""
    result = rag_engine.answer(body.question, body.patient_context or {})
    return result


@router.get("/guidelines")
def list_guidelines():
    from src.rag.documents.medical_guidelines import MEDICAL_GUIDELINES
    return {
        "total": len(MEDICAL_GUIDELINES),
        "retrieval": "embeddings_vector_store",
        "vector_store": rag_engine.vector_store_backend,
        "guidelines": [
            {"id": g["id"], "title": g["title"], "category": g["category"]}
            for g in MEDICAL_GUIDELINES
        ],
    }


@router.get("/search")
def search_guidelines(q: str):
    results = rag_engine.search(q, top_k=3)
    return {
        "query": q,
        "retrieval": "embeddings_vector_store",
        "vector_store": rag_engine.vector_store_backend,
        "results": results,
    }
