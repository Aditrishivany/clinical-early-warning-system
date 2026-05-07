"""
File: src/api/routes/auth.py
Purpose: Authentication endpoints for staff and patients
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from src.database.connection import get_db
from src.database.models import Staff, Patient, PatientAssignment

router = APIRouter()


# ─────────────────────────────────────────
# REQUEST SCHEMA
# ─────────────────────────────────────────
class LoginRequest(BaseModel):
    staff_id: str
    password: str


# ─────────────────────────────────────────
# LOGIN ENDPOINT
# ─────────────────────────────────────────
@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login for staff (admin/doctor/nurse) and patients.
    Returns user profile + assigned patients.
    """

    staff_id = request.staff_id.strip()
    password = request.password.strip()

    print(f"  Login attempt: {staff_id}")

    # ── Check Staff ──
    staff = db.query(Staff).filter(
        Staff.staff_id == staff_id,
        Staff.is_active == True
    ).first()

    if staff:
        print(f"  Found staff: {staff.name} ({staff.role})")
        if staff.password != password:
            raise HTTPException(
                status_code=401,
                detail="Invalid password"
            )

        # Get assigned patients
        assigned_patients = []
        if staff.role == 'doctor':
            assignments = db.query(PatientAssignment).filter(
                PatientAssignment.doctor_id == staff_id,
                PatientAssignment.is_active == True
            ).all()
            assigned_patients = [a.patient_id for a in assignments]

        elif staff.role == 'nurse':
            assignments = db.query(PatientAssignment).filter(
                PatientAssignment.nurse_id  == staff_id,
                PatientAssignment.is_active == True
            ).all()
            assigned_patients = [a.patient_id for a in assignments]

        return {
            "success": True,
            "user": {
                "id":                staff.staff_id,
                "name":              staff.name,
                "role":              staff.role,
                "title":             staff.title,
                "specialty":         staff.specialty,
                "ward":              staff.ward,
                "hospital":          staff.hospital or "City General Hospital",
                "avatar":            staff.avatar,
                "color":             _role_color(staff.role),
                "assigned_patients": assigned_patients,
            }
        }

    # ── Check Patient ──
    patient = db.query(Patient).filter(
        Patient.patient_id    == staff_id,
        Patient.is_discharged == False
    ).first()

    if patient:
        print(f"  Found patient: {patient.name}")
        if patient.password != password:
            raise HTTPException(
                status_code=401,
                detail="Invalid password"
            )

        # Get assignment info
        assignment = db.query(PatientAssignment).filter(
            PatientAssignment.patient_id == staff_id,
            PatientAssignment.is_active  == True
        ).first()

        return {
            "success": True,
            "user": {
                "id":         patient.patient_id,
                "name":       patient.name,
                "role":       "patient",
                "title":      "Patient",
                "age":        patient.age,
                "gender":     patient.gender,
                "ward":       patient.ward,
                "bed_number": patient.bed_number,
                "blood_type": patient.blood_type,
                "allergies":  patient.allergies or [],
                "dob":        patient.dob,
                "doctor":     assignment.doctor_id if assignment else "Not assigned",
                "nurse":      assignment.nurse_id  if assignment else "Not assigned",
                "hospital":   "City General Hospital",
                "avatar":     patient.name[:2].upper() if patient.name else "PT",
                "color":      "#0891b2",
                "assigned_patients": [],
            }
        }

    # ── Not Found ──
    print(f"  ❌ Login failed for: {staff_id}")
    raise HTTPException(
        status_code=401,
        detail="Invalid ID or password. Please check your credentials."
    )


# ─────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────
def _role_color(role: str) -> str:
    colors = {
        "admin":  "#7c3aed",
        "doctor": "#2563eb",
        "nurse":  "#059669",
    }
    return colors.get(role, "#6b7280")


# ─────────────────────────────────────────
# GET ALL STAFF (Admin only)
# ─────────────────────────────────────────
@router.get("/staff")
def get_all_staff(db: Session = Depends(get_db)):
    """Get all active staff members."""
    staff = db.query(Staff).filter(
        Staff.is_active == True
    ).all()

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
        ]
    }


# ─────────────────────────────────────────
# GET ALL PATIENTS (Admin only)
# ─────────────────────────────────────────
@router.get("/patients")
def get_all_patients(db: Session = Depends(get_db)):
    """Get all active patients with assignments."""
    patients = db.query(Patient).filter(
        Patient.is_discharged == False
    ).all()

    result = []
    for p in patients:
        assignment = db.query(PatientAssignment).filter(
            PatientAssignment.patient_id == p.patient_id,
            PatientAssignment.is_active  == True
        ).first()

        result.append({
            "patient_id": p.patient_id,
            "name":       p.name,
            "age":        p.age,
            "gender":     p.gender,
            "ward":       p.ward,
            "bed_number": p.bed_number,
            "blood_type": p.blood_type,
            "allergies":  p.allergies or [],
            "admitted_at": str(p.admitted_at),
            "doctor_id":  assignment.doctor_id if assignment else None,
            "nurse_id":   assignment.nurse_id  if assignment else None,
        })

    return {"total": len(result), "patients": result}


# ─────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────
@router.get("/health")
def auth_health():
    return {"status": "healthy", "service": "auth"}