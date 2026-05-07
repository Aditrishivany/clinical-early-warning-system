"""
Dedicated data ingestion APIs for bedside monitors, simulators, and batch feeds.
"""

import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from config.settings import settings
from src.database.connection import get_db
from src.database.repository import (
    get_or_create_patient,
    save_vital_reading,
    write_audit,
)
from src.utils.features import get_news2_category, get_news2_score
from src.utils.security import get_current_user_optional

logger = logging.getLogger(__name__)
router = APIRouter()


class VitalIngest(BaseModel):
    patient_id:       str   = Field(..., example="PT1001")
    age:              float = Field(..., ge=0,  le=120)
    gender:           str   = Field(..., example="M")
    ward:             str   = Field(..., example="ICU")
    heart_rate:       float = Field(..., ge=20, le=250)
    systolic_bp:      float = Field(..., ge=50, le=250)
    diastolic_bp:     float = Field(..., ge=20, le=150)
    temperature:      float = Field(..., ge=30, le=45)
    respiratory_rate: float = Field(..., ge=4,  le=60)
    spo2:             float = Field(..., ge=50, le=100)
    consciousness:    int   = Field(..., ge=0,  le=3)
    urine_output:     float = Field(..., ge=0,  le=200)
    glucose:          float = Field(..., ge=1,  le=30)
    pain_score:       int   = Field(..., ge=0,  le=10)
    source:           str   = Field("monitor", max_length=30)
    recorded_by:      str   = Field("API", max_length=50)
    recorded_at:      Optional[datetime] = None


class BatchIngest(BaseModel):
    readings: List[VitalIngest] = Field(..., min_length=1, max_length=500)


def _save_ingested_reading(db: Session, payload: VitalIngest):
    data = payload.model_dump()
    recorded_at = data.pop("recorded_at", None)
    source = data.pop("source", "monitor")
    recorded_by = data.pop("recorded_by", "API")

    get_or_create_patient(db, data)
    news2_score = get_news2_score(data)
    reading = save_vital_reading(db, data, news2_score)
    reading.source = source
    reading.recorded_by = recorded_by
    if recorded_at:
        reading.recorded_at = recorded_at
    db.commit()
    db.refresh(reading)

    return {
        "reading_id": reading.id,
        "patient_id": reading.patient_id,
        "recorded_at": reading.recorded_at.isoformat(),
        "news2_score": news2_score,
        "news2_category": get_news2_category(news2_score),
        "source": reading.source,
    }


@router.post("/vitals")
def ingest_vitals(
    payload: VitalIngest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),
):
    """Ingest one vital-sign reading and persist it to the operational database."""
    try:
        result = _save_ingested_reading(db, payload)
        performer = current_user.get("sub", payload.recorded_by) if current_user else payload.recorded_by
        write_audit(
            db,
            "vitals_ingested",
            performer,
            patient_id=payload.patient_id,
            details={"source": payload.source, "reading_id": result["reading_id"]},
        )
        return {"status": "success", "database": settings.DATABASE_URL.split("://", 1)[0], **result}
    except Exception:
        logger.exception("Vital ingestion failed for patient %s", payload.patient_id)
        raise HTTPException(status_code=500, detail="Vital ingestion failed")


@router.post("/vitals/batch")
def ingest_vitals_batch(
    payload: BatchIngest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),
):
    """Batch ingestion endpoint for ADF, Databricks, simulators, or monitor exports."""
    saved = []
    try:
        for reading in payload.readings:
            saved.append(_save_ingested_reading(db, reading))
        performer = current_user.get("sub", "batch_api") if current_user else "batch_api"
        write_audit(
            db,
            "vitals_batch_ingested",
            performer,
            details={"count": len(saved), "source": payload.readings[0].source},
        )
        return {"status": "success", "ingested": len(saved), "readings": saved}
    except Exception:
        logger.exception("Batch vital ingestion failed")
        raise HTTPException(status_code=500, detail="Batch vital ingestion failed")
