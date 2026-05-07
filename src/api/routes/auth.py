"""
Authentication endpoints — JWT tokens, bcrypt password verification, audit trail.
"""

import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from src.database.connection import get_db
from src.database.models import Staff, Patient, PatientAssignment
from src.database.repository import write_audit
from src.utils.security import verify_password, create_access_token, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

_ROLE_COLORS = {
    "admin":   "#7c3aed",
    "doctor":  "#2563eb",
    "nurse":   "#059669",
    "patient": "#0891b2",
}


# ── Schemas ───────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    staff_id: str
    password: str

    @field_validator("staff_id", "password")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login")
def login(request: LoginRequest, req: Request, db: Session = Depends(get_db)):
    """
    Authenticate staff or patient.
    Returns JWT access token + user profile.
    """
    uid      = request.staff_id
    ip       = req.client.host if req.client else "unknown"

    logger.info("Login attempt: %s from %s", uid, ip)

    # ── Try Staff ──
    staff = db.query(Staff).filter(
        Staff.staff_id == uid,
        Staff.is_active == True,
    ).first()

    if staff:
        if not verify_password(request.password, staff.password):
            write_audit(db, "login_failed", uid, details={"reason": "wrong_password"}, ip_address=ip)
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Update last login
        staff.last_login = datetime.utcnow()
        db.commit()

        # Build JWT payload
        token = create_access_token({
            "sub":  staff.staff_id,
            "role": staff.role,
            "name": staff.name,
        })

        # Assigned patients
        assigned = []
        if staff.role in ("doctor", "nurse"):
            field = PatientAssignment.doctor_id if staff.role == "doctor" else PatientAssignment.nurse_id
            assigned = [
                a.patient_id for a in db.query(PatientAssignment).filter(
                    field == uid,
                    PatientAssignment.is_active == True,
                ).all()
            ]

        write_audit(db, "login_success", uid, details={"role": staff.role}, ip_address=ip)
        logger.info("Login OK: %s (%s)", uid, staff.role)

        return {
            "success":      True,
            "access_token": token,
            "token_type":   "bearer",
            "user": {
                "id":                staff.staff_id,
                "name":              staff.name,
                "role":              staff.role,
                "title":             staff.title,
                "specialty":         staff.specialty,
                "ward":              staff.ward,
                "hospital":          staff.hospital or "City General Hospital",
                "avatar":            staff.avatar,
                "color":             _ROLE_COLORS.get(staff.role, "#6b7280"),
                "assigned_patients": assigned,
            },
        }

    # ── Try Patient ──
    patient = db.query(Patient).filter(
        Patient.patient_id    == uid,
        Patient.is_discharged == False,
    ).first()

    if patient:
        if not verify_password(request.password, patient.password):
            write_audit(db, "login_failed", uid, patient_id=uid, details={"reason": "wrong_password"}, ip_address=ip)
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_access_token({
            "sub":  patient.patient_id,
            "role": "patient",
            "name": patient.name,
        })

        assignment = db.query(PatientAssignment).filter(
            PatientAssignment.patient_id == uid,
            PatientAssignment.is_active  == True,
        ).first()

        write_audit(db, "login_success", uid, patient_id=uid, details={"role": "patient"}, ip_address=ip)

        return {
            "success":      True,
            "access_token": token,
            "token_type":   "bearer",
            "user": {
                "id":                patient.patient_id,
                "name":              patient.name,
                "role":              "patient",
                "title":             "Patient",
                "age":               patient.age,
                "gender":            patient.gender,
                "ward":              patient.ward,
                "bed_number":        patient.bed_number,
                "blood_type":        patient.blood_type,
                "allergies":         patient.allergies or [],
                "dob":               patient.dob,
                "doctor":            assignment.doctor_id if assignment else "Not assigned",
                "nurse":             assignment.nurse_id  if assignment else "Not assigned",
                "hospital":          "City General Hospital",
                "avatar":            patient.name[:2].upper() if patient.name else "PT",
                "color":             _ROLE_COLORS["patient"],
                "assigned_patients": [],
            },
        }

    write_audit(db, "login_failed", uid, details={"reason": "not_found"}, ip_address=ip)
    raise HTTPException(status_code=401, detail="Invalid ID or password")


# ── Staff list (admin-only) ───────────────────────────────────────────────────

@router.get("/staff")
def get_all_staff(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    staff = db.query(Staff).filter(Staff.is_active == True).all()
    return {
        "total": len(staff),
        "staff": [
            {
                "staff_id":  s.staff_id,
                "name":      s.name,
                "role":      s.role,
                "title":     s.title,
                "specialty": s.specialty,
                "ward":      s.ward,
            }
            for s in staff
        ],
    }


# ── Patient list (admin / doctor) ─────────────────────────────────────────────

@router.get("/patients")
def get_all_patients(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in ("admin", "doctor"):
        raise HTTPException(status_code=403, detail="Access denied")

    patients = db.query(Patient).filter(Patient.is_discharged == False).all()
    result   = []
    for p in patients:
        asgn = db.query(PatientAssignment).filter(
            PatientAssignment.patient_id == p.patient_id,
            PatientAssignment.is_active  == True,
        ).first()
        result.append({
            "patient_id":  p.patient_id,
            "name":        p.name,
            "age":         p.age,
            "gender":      p.gender,
            "ward":        p.ward,
            "bed_number":  p.bed_number,
            "blood_type":  p.blood_type,
            "allergies":   p.allergies or [],
            "admitted_at": str(p.admitted_at),
            "doctor_id":   asgn.doctor_id if asgn else None,
            "nurse_id":    asgn.nurse_id  if asgn else None,
        })
    return {"total": len(result), "patients": result}


@router.get("/health")
def auth_health():
    return {"status": "healthy", "service": "auth"}
