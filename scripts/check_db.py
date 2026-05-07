import sys
sys.path.append('.')

from src.database.connection import SessionLocal
from src.database.models import Patient, VitalReading, Prediction, Alert

db = SessionLocal()

patients   = db.query(Patient).count()
readings   = db.query(VitalReading).count()
preds      = db.query(Prediction).count()
alerts     = db.query(Alert).count()
unresolved = db.query(Alert).filter(Alert.is_resolved == False).count()

print("=" * 40)
print("  DATABASE STATUS")
print("=" * 40)
print(f"  Patients   : {patients}")
print(f"  Readings   : {readings}")
print(f"  Predictions: {preds}")
print(f"  All Alerts : {alerts}")
print(f"  Unresolved : {unresolved}")
print("=" * 40)

db.close()