import sys
sys.path.append('.')

from src.database.connection import SessionLocal
from src.database.models import Prediction

db = SessionLocal()

try:
    preds = db.query(Prediction).order_by(
        Prediction.predicted_at.desc()
    ).limit(5).all()
    
    print(f"Total predictions found: {len(preds)}")
    
    for p in preds:
        print(f"  {p.patient_id} | {p.risk_label} | {p.predicted_at}")

except Exception as e:
    print(f"ERROR: {e}")

finally:
    db.close()