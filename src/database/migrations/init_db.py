"""
File: src/database/migrations/init_db.py
Purpose: Create all database tables
"""

import sys
sys.path.append(".")

from src.database.connection import engine, Base
from src.database.models import (
    Patient, VitalReading, Prediction, AgentReport, Alert
)

print("=" * 50)
print("  DATABASE INITIALIZER")
print("=" * 50)

print("\n  Creating all tables...")
Base.metadata.create_all(bind=engine)

print("  ✅ patients         table created")
print("  ✅ vital_readings   table created")
print("  ✅ predictions      table created")
print("  ✅ agent_reports    table created")
print("  ✅ alerts           table created")

print("\n  🎉 Database ready!")
print(f"  📁 Location: clinical_dev.db")
print("=" * 50)