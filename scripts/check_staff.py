import sys
sys.path.append('.')

from src.database.connection import SessionLocal
from src.database.models import Staff, Patient, PatientAssignment

db = SessionLocal()

print("=" * 50)
print("  STAFF IN DATABASE")
print("=" * 50)
staff = db.query(Staff).all()
for s in staff:
    print(f"  {s.staff_id} | {s.name} | {s.role} | pwd: {s.password}")
print(f"  Total: {len(staff)}")

print("\n  PATIENTS IN DATABASE")
print("=" * 50)
patients = db.query(Patient).all()
for p in patients:
    print(f"  {p.patient_id} | {p.name} | pwd: {p.password}")
print(f"  Total: {len(patients)}")

db.close()