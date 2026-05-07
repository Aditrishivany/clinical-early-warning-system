"""
File: scripts/seed_data.py
Purpose: Seed real staff and patient data into database
"""

import sys
sys.path.append('.')

from src.database.connection import engine, Base, SessionLocal
from src.database.models import Staff, Patient, PatientAssignment

# Create all tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("=" * 55)
print("  SEEDING REAL HOSPITAL DATA")
print("=" * 55)

# ─────────────────────────────────────────
# STAFF DATA
# ─────────────────────────────────────────
staff_data = [
    # Admin
    {
        "staff_id":  "ADM001",
        "name":      "Dr. Sarah Admin",
        "role":      "admin",
        "title":     "Hospital Administrator",
        "specialty": "Administration",
        "ward":      "ALL",
        "password":  "admin123",
        "avatar":    "SA",
    },
    # Doctors
    {
        "staff_id":  "DOC001",
        "name":      "Dr. James Wilson",
        "role":      "doctor",
        "title":     "Senior Physician",
        "specialty": "Critical Care Medicine",
        "ward":      "ICU",
        "password":  "doctor123",
        "avatar":    "JW",
    },
    {
        "staff_id":  "DOC002",
        "name":      "Dr. Priya Sharma",
        "role":      "doctor",
        "title":     "Consultant Physician",
        "specialty": "Emergency Medicine",
        "ward":      "Emergency",
        "password":  "doctor123",
        "avatar":    "PS",
    },
    # Nurses
    {
        "staff_id":  "NRS001",
        "name":      "Nurse Emily Chen",
        "role":      "nurse",
        "title":     "Senior Ward Nurse",
        "specialty": "Critical Care",
        "ward":      "ICU",
        "password":  "nurse123",
        "avatar":    "EC",
    },
    {
        "staff_id":  "NRS002",
        "name":      "Nurse Robert Kumar",
        "role":      "nurse",
        "title":     "Ward Nurse",
        "specialty": "General Medicine",
        "ward":      "General",
        "password":  "nurse123",
        "avatar":    "RK",
    },
]

print("\n  Adding staff...")
for s in staff_data:
    existing = db.query(Staff).filter(
        Staff.staff_id == s["staff_id"]
    ).first()
    if not existing:
        staff = Staff(**s)
        db.add(staff)
        print(f"  ✅ Added: {s['name']} ({s['role']})")
    else:
        print(f"  ⏭️  Exists: {s['name']}")

db.commit()

# ─────────────────────────────────────────
# PATIENT DATA
# ─────────────────────────────────────────
patients_data = [
    {
        "patient_id": "PT-SIM-001",
        "name":       "John Smith",
        "age":        72,
        "gender":     "M",
        "dob":        "1952-03-15",
        "blood_type": "O+",
        "allergies":  ["Penicillin", "Aspirin"],
        "ward":       "ICU",
        "bed_number": "ICU-01",
        "password":   "patient123",
    },
    {
        "patient_id": "PT-SIM-002",
        "name":       "Mary Johnson",
        "age":        65,
        "gender":     "F",
        "dob":        "1959-07-22",
        "blood_type": "A+",
        "allergies":  ["Sulfa"],
        "ward":       "ICU",
        "bed_number": "ICU-02",
        "password":   "patient123",
    },
    {
        "patient_id": "PT-SIM-003",
        "name":       "Robert Davis",
        "age":        45,
        "gender":     "M",
        "dob":        "1979-11-08",
        "blood_type": "B+",
        "allergies":  [],
        "ward":       "General",
        "bed_number": "GEN-05",
        "password":   "patient123",
    },
    {
        "patient_id": "PT-SIM-004",
        "name":       "Sarah Wilson",
        "age":        58,
        "gender":     "F",
        "dob":        "1966-04-30",
        "blood_type": "AB+",
        "allergies":  ["Latex"],
        "ward":       "Emergency",
        "bed_number": "EM-03",
        "password":   "patient123",
    },
    {
        "patient_id": "PT-SIM-005",
        "name":       "James Brown",
        "age":        83,
        "gender":     "M",
        "dob":        "1941-09-12",
        "blood_type": "O-",
        "allergies":  ["Codeine", "Ibuprofen"],
        "ward":       "ICU",
        "bed_number": "ICU-03",
        "password":   "patient123",
    },
]

print("\n  Adding patients...")
for p in patients_data:
    existing = db.query(Patient).filter(
        Patient.patient_id == p["patient_id"]
    ).first()
    if not existing:
        patient = Patient(**p)
        db.add(patient)
        print(f"  ✅ Added: {p['name']} ({p['patient_id']})")
    else:
        # Update existing patient info
        for key, value in p.items():
            setattr(existing, key, value)
        print(f"  🔄 Updated: {p['name']}")

db.commit()

# ─────────────────────────────────────────
# PATIENT ASSIGNMENTS
# ─────────────────────────────────────────
assignments_data = [
    # ICU patients → Dr. Wilson + Nurse Emily
    {
        "patient_id": "PT-SIM-001",
        "doctor_id":  "DOC001",
        "nurse_id":   "NRS001",
        "ward":       "ICU",
        "bed_number": "ICU-01",
    },
    {
        "patient_id": "PT-SIM-002",
        "doctor_id":  "DOC001",
        "nurse_id":   "NRS001",
        "ward":       "ICU",
        "bed_number": "ICU-02",
    },
    {
        "patient_id": "PT-SIM-005",
        "doctor_id":  "DOC001",
        "nurse_id":   "NRS001",
        "ward":       "ICU",
        "bed_number": "ICU-03",
    },
    # General/Emergency → Dr. Sharma + Nurse Robert
    {
        "patient_id": "PT-SIM-003",
        "doctor_id":  "DOC002",
        "nurse_id":   "NRS002",
        "ward":       "General",
        "bed_number": "GEN-05",
    },
    {
        "patient_id": "PT-SIM-004",
        "doctor_id":  "DOC002",
        "nurse_id":   "NRS002",
        "ward":       "Emergency",
        "bed_number": "EM-03",
    },
]

print("\n  Adding assignments...")
for a in assignments_data:
    existing = db.query(PatientAssignment).filter(
        PatientAssignment.patient_id == a["patient_id"],
        PatientAssignment.is_active  == True
    ).first()
    if not existing:
        assignment = PatientAssignment(**a)
        db.add(assignment)
        print(f"  ✅ Assigned: {a['patient_id']} → {a['doctor_id']} + {a['nurse_id']}")
    else:
        print(f"  ⏭️  Already assigned: {a['patient_id']}")

db.commit()
db.close()

print("\n" + "=" * 55)
print("  ✅ SEEDING COMPLETE!")
print("=" * 55)
print("\n  Login Credentials:")
print("  Admin  : ADM001 / admin123")
print("  Doctor : DOC001 or DOC002 / doctor123")
print("  Nurse  : NRS001 or NRS002 / nurse123")
print("  Patient: PT-SIM-001 to PT-SIM-005 / patient123")
print("=" * 55)