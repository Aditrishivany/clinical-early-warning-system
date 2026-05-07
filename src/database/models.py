"""
File: src/database/models.py
Purpose: Complete database schema for real clinical system
"""

from sqlalchemy import (
    Column, Integer, Float, String,
    DateTime, Boolean, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database.connection import Base


# ─────────────────────────────────────────
# TABLE 1: Staff (Doctors + Nurses + Admin)
# ─────────────────────────────────────────
class Staff(Base):
    __tablename__ = "staff"

    id          = Column(Integer, primary_key=True)
    staff_id    = Column(String(50), unique=True, index=True)
    name        = Column(String(100))
    role        = Column(String(20))   # admin/doctor/nurse
    title       = Column(String(100))
    specialty   = Column(String(100))
    ward        = Column(String(50))
    hospital    = Column(String(100), default="City General Hospital")
    password    = Column(String(100))  # simple demo password
    avatar      = Column(String(10))
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime, default=datetime.now)

    def __repr__(self):
        return f"<Staff {self.staff_id} ({self.role})>"


# ─────────────────────────────────────────
# TABLE 2: Patients
# ─────────────────────────────────────────
class Patient(Base):
    __tablename__ = "patients"

    id            = Column(Integer, primary_key=True)
    patient_id    = Column(String(50), unique=True, index=True)
    name          = Column(String(100))
    age           = Column(Float)
    gender        = Column(String(10))
    dob           = Column(String(20))
    blood_type    = Column(String(10))
    allergies     = Column(JSON, default=list)
    ward          = Column(String(50))
    bed_number    = Column(String(20))
    admitted_at   = Column(DateTime, default=datetime.now)
    is_discharged = Column(Boolean, default=False)
    discharged_at = Column(DateTime, nullable=True)
    created_at    = Column(DateTime, default=datetime.now)
    password      = Column(String(100), default="patient123")

    # Relationships
    vitals      = relationship("VitalReading",  back_populates="patient")
    predictions = relationship("Prediction",    back_populates="patient")
    alerts      = relationship("Alert",         back_populates="patient")
    assignments = relationship("PatientAssignment", back_populates="patient")

    def __repr__(self):
        return f"<Patient {self.patient_id}>"


# ─────────────────────────────────────────
# TABLE 3: Patient Assignments
# ─────────────────────────────────────────
class PatientAssignment(Base):
    __tablename__ = "patient_assignments"

    id          = Column(Integer, primary_key=True)
    patient_id  = Column(String(50), ForeignKey("patients.patient_id"))
    doctor_id   = Column(String(50), ForeignKey("staff.staff_id"))
    nurse_id    = Column(String(50), ForeignKey("staff.staff_id"))
    ward        = Column(String(50))
    bed_number  = Column(String(20))
    assigned_at = Column(DateTime, default=datetime.now)
    is_active   = Column(Boolean, default=True)

    # Relationships
    patient = relationship("Patient", back_populates="assignments")

    def __repr__(self):
        return f"<Assignment {self.patient_id}>"


# ─────────────────────────────────────────
# TABLE 4: Vital Readings
# ─────────────────────────────────────────
class VitalReading(Base):
    __tablename__ = "vital_readings"

    id               = Column(Integer, primary_key=True, index=True)
    patient_id       = Column(String(50), ForeignKey("patients.patient_id"))
    recorded_at      = Column(DateTime, default=datetime.now)
    recorded_by      = Column(String(50), default="AUTO")  # AUTO or staff_id
    source           = Column(String(20), default="monitor") # monitor/manual

    # Core Vitals
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

    # Calculated
    news2_score       = Column(Integer)
    pulse_pressure    = Column(Float)
    shock_index       = Column(Float)

    # Relationship
    patient = relationship("Patient", back_populates="vitals")

    def __repr__(self):
        return f"<VitalReading {self.patient_id}>"


# ─────────────────────────────────────────
# TABLE 5: ML Predictions
# ─────────────────────────────────────────
class Prediction(Base):
    __tablename__ = "predictions"

    id             = Column(Integer, primary_key=True, index=True)
    patient_id     = Column(String(50), ForeignKey("patients.patient_id"))
    predicted_at   = Column(DateTime, default=datetime.now)
    risk_level     = Column(Integer)
    risk_label     = Column(String(20))
    confidence     = Column(Float)
    news2_score    = Column(Integer)
    news2_category = Column(String(20))
    prob_low       = Column(Float)
    prob_medium    = Column(Float)
    prob_high      = Column(Float)
    top_concerns   = Column(JSON)
    recommendation = Column(Text)

    # Relationship
    patient = relationship("Patient", back_populates="predictions")

    def __repr__(self):
        return f"<Prediction {self.patient_id}: {self.risk_label}>"


# ─────────────────────────────────────────
# TABLE 6: Agent Reports
# ─────────────────────────────────────────
class AgentReport(Base):
    __tablename__ = "agent_reports"

    id                = Column(Integer, primary_key=True)
    report_id         = Column(String(50), unique=True, index=True)
    patient_id        = Column(String(50), index=True)
    generated_at      = Column(DateTime, default=datetime.now)
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


# ─────────────────────────────────────────
# TABLE 7: Alerts (with full lifecycle)
# ─────────────────────────────────────────
class Alert(Base):
    __tablename__ = "alerts"

    id          = Column(Integer, primary_key=True, index=True)
    patient_id  = Column(String(50), ForeignKey("patients.patient_id"))
    created_at  = Column(DateTime, default=datetime.now)
    alert_type  = Column(String(50))
    severity    = Column(String(20))
    message     = Column(Text)
    action      = Column(Text)

    # Acknowledgment (Nurse)
    is_acknowledged  = Column(Boolean, default=False)
    acknowledged_at  = Column(DateTime, nullable=True)
    acknowledged_by  = Column(String(100), nullable=True)

    # Resolution (Doctor)
    is_resolved      = Column(Boolean, default=False)
    resolved_at      = Column(DateTime, nullable=True)
    resolved_by      = Column(String(100), nullable=True)
    resolution_notes = Column(Text, nullable=True)

    # Relationship
    patient = relationship("Patient", back_populates="alerts")

    def __repr__(self):
        return f"<Alert {self.patient_id}: {self.alert_type}>"


# ─────────────────────────────────────────
# TABLE 8: Audit Log
# ─────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_log"

    id           = Column(Integer, primary_key=True)
    timestamp    = Column(DateTime, default=datetime.now)
    action       = Column(String(100))
    performed_by = Column(String(100))
    patient_id   = Column(String(50), nullable=True)
    details      = Column(JSON)

    def __repr__(self):
        return f"<AuditLog {self.action} by {self.performed_by}>"