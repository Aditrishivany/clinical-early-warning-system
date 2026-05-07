"""
Database schema for the Clinical Early Warning System.
"""

from sqlalchemy import (
    Column, Integer, Float, String,
    DateTime, Boolean, Text, ForeignKey, JSON, Index
)
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database.connection import Base


class Staff(Base):
    __tablename__ = "staff"

    id          = Column(Integer, primary_key=True)
    staff_id    = Column(String(50), unique=True, index=True, nullable=False)
    name        = Column(String(100), nullable=False)
    role        = Column(String(20), nullable=False)    # admin/doctor/nurse
    title       = Column(String(100))
    specialty   = Column(String(100))
    ward        = Column(String(50))
    hospital    = Column(String(100), default="City General Hospital")
    # Stores bcrypt hash or plain-text (legacy); always write bcrypt going forward
    password    = Column(String(200))
    avatar      = Column(String(10))
    is_active   = Column(Boolean, default=True, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login  = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<Staff {self.staff_id} ({self.role})>"


class Patient(Base):
    __tablename__ = "patients"

    id            = Column(Integer, primary_key=True)
    patient_id    = Column(String(50), unique=True, index=True, nullable=False)
    name          = Column(String(100))
    age           = Column(Float)
    gender        = Column(String(10))
    dob           = Column(String(20))
    blood_type    = Column(String(10))
    allergies     = Column(JSON, default=list)
    ward          = Column(String(50))
    bed_number    = Column(String(20))
    admitted_at   = Column(DateTime, default=datetime.utcnow)
    is_discharged = Column(Boolean, default=False, nullable=False)
    discharged_at = Column(DateTime, nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow, nullable=False)
    # Bcrypt hash or legacy plain-text
    password      = Column(String(200), default="patient123")

    vitals      = relationship("VitalReading",       back_populates="patient", cascade="all, delete-orphan")
    predictions = relationship("Prediction",         back_populates="patient", cascade="all, delete-orphan")
    alerts      = relationship("Alert",              back_populates="patient", cascade="all, delete-orphan")
    assignments = relationship("PatientAssignment",  back_populates="patient")

    def __repr__(self):
        return f"<Patient {self.patient_id}>"


class PatientAssignment(Base):
    __tablename__ = "patient_assignments"

    id          = Column(Integer, primary_key=True)
    patient_id  = Column(String(50), ForeignKey("patients.patient_id"), nullable=False)
    doctor_id   = Column(String(50), ForeignKey("staff.staff_id"), nullable=True)
    nurse_id    = Column(String(50), ForeignKey("staff.staff_id"), nullable=True)
    ward        = Column(String(50))
    bed_number  = Column(String(20))
    assigned_at = Column(DateTime, default=datetime.utcnow)
    is_active   = Column(Boolean, default=True, nullable=False)

    patient = relationship("Patient", back_populates="assignments")

    def __repr__(self):
        return f"<Assignment {self.patient_id}>"


class VitalReading(Base):
    __tablename__ = "vital_readings"

    id               = Column(Integer, primary_key=True, index=True)
    patient_id       = Column(String(50), ForeignKey("patients.patient_id"), nullable=False)
    recorded_at      = Column(DateTime, default=datetime.utcnow, nullable=False)
    recorded_by      = Column(String(50), default="AUTO")
    source           = Column(String(20), default="monitor")

    heart_rate        = Column(Float)
    systolic_bp       = Column(Float)
    diastolic_bp      = Column(Float)
    temperature       = Column(Float)
    respiratory_rate  = Column(Float)
    spo2              = Column(Float)
    consciousness     = Column(Integer)
    urine_output      = Column(Float)
    glucose           = Column(Float)
    pain_score        = Column(Integer)

    news2_score       = Column(Integer)
    pulse_pressure    = Column(Float)
    shock_index       = Column(Float)

    patient = relationship("Patient", back_populates="vitals")

    __table_args__ = (
        Index("ix_vitals_patient_recorded", "patient_id", "recorded_at"),
    )

    def __repr__(self):
        return f"<VitalReading {self.patient_id} @ {self.recorded_at}>"


class Prediction(Base):
    __tablename__ = "predictions"

    id             = Column(Integer, primary_key=True, index=True)
    patient_id     = Column(String(50), ForeignKey("patients.patient_id"), nullable=False)
    predicted_at   = Column(DateTime, default=datetime.utcnow, nullable=False)
    risk_level     = Column(Integer, nullable=False)
    risk_label     = Column(String(20))
    confidence     = Column(Float)
    news2_score    = Column(Integer)
    news2_category = Column(String(20))
    prob_low       = Column(Float)
    prob_medium    = Column(Float)
    prob_high      = Column(Float)
    top_concerns   = Column(JSON)
    recommendation = Column(Text)

    patient = relationship("Patient", back_populates="predictions")

    __table_args__ = (
        Index("ix_pred_patient_time", "patient_id", "predicted_at"),
    )

    def __repr__(self):
        return f"<Prediction {self.patient_id}: {self.risk_label}>"


class AgentReport(Base):
    __tablename__ = "agent_reports"

    id                = Column(Integer, primary_key=True)
    report_id         = Column(String(50), unique=True, index=True)
    patient_id        = Column(String(50), index=True, nullable=False)
    generated_at      = Column(DateTime, default=datetime.utcnow, nullable=False)
    alert_level       = Column(String(20))
    executive_summary = Column(Text)
    triage_result     = Column(JSON)
    warning_result    = Column(JSON)
    insight_result    = Column(JSON)
    prediction        = Column(JSON)
    sepsis_protocol   = Column(Boolean, default=False)
    processing_time   = Column(String(20))

    def __repr__(self):
        return f"<AgentReport {self.report_id}>"


class Alert(Base):
    __tablename__ = "alerts"

    id          = Column(Integer, primary_key=True, index=True)
    patient_id  = Column(String(50), ForeignKey("patients.patient_id"), nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow, nullable=False)
    alert_type  = Column(String(50))
    severity    = Column(String(20))
    message     = Column(Text)
    action      = Column(Text)

    is_acknowledged  = Column(Boolean, default=False)
    acknowledged_at  = Column(DateTime, nullable=True)
    acknowledged_by  = Column(String(100), nullable=True)

    is_resolved      = Column(Boolean, default=False)
    resolved_at      = Column(DateTime, nullable=True)
    resolved_by      = Column(String(100), nullable=True)
    resolution_notes = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="alerts")

    __table_args__ = (
        Index("ix_alerts_patient_resolved", "patient_id", "is_resolved"),
    )

    def __repr__(self):
        return f"<Alert {self.patient_id}: {self.alert_type}>"


class ConversationHistory(Base):
    """Persistent chat history — replaces in-memory dict in rag.py."""
    __tablename__ = "conversation_history"

    id         = Column(Integer, primary_key=True)
    session_id = Column(String(100), index=True, nullable=False)
    user_id    = Column(String(100), nullable=False)
    role       = Column(String(20), nullable=False)  # user/assistant/system
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_conv_session_created", "session_id", "created_at"),
    )


class AuditLog(Base):
    __tablename__ = "audit_log"

    id           = Column(Integer, primary_key=True)
    timestamp    = Column(DateTime, default=datetime.utcnow, nullable=False)
    action       = Column(String(100), nullable=False)
    performed_by = Column(String(100), nullable=False)
    patient_id   = Column(String(50), nullable=True, index=True)
    ip_address   = Column(String(45), nullable=True)
    details      = Column(JSON)

    __table_args__ = (
        Index("ix_audit_time", "timestamp"),
    )

    def __repr__(self):
        return f"<AuditLog {self.action} by {self.performed_by}>"
