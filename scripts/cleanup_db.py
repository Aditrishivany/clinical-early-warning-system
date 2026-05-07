import sys
sys.path.append('.')

from src.database.connection import SessionLocal
from src.database.models import Alert, Prediction
from datetime import datetime

db = SessionLocal()

# Resolve ALL old alerts
resolved = db.query(Alert).filter(
    Alert.is_resolved == False
).update({
    'is_resolved': True,
    'resolved_at': datetime.now(),
    'resolved_by': 'Bulk cleanup'
})

db.commit()
db.close()

print(f'✅ Database cleaned!')
print(f'✅ Resolved {resolved} old alerts!')
print('Restart the API now.')