"""
Unit tests for dedicated data ingestion APIs.
"""

import sys
import time

sys.path.append(".")

from fastapi.testclient import TestClient

from src.api.main import app


client = TestClient(app)


def sample_vitals(patient_id=None):
    return {
        "patient_id": patient_id or f"PT-INGEST-{int(time.time() * 1000)}",
        "age": 64,
        "gender": "F",
        "ward": "HDU",
        "heart_rate": 102,
        "systolic_bp": 104,
        "diastolic_bp": 70,
        "temperature": 37.8,
        "respiratory_rate": 22,
        "spo2": 94,
        "consciousness": 0,
        "urine_output": 45,
        "glucose": 7.2,
        "pain_score": 3,
        "source": "unit-test-monitor",
        "recorded_by": "pytest",
    }


def test_ingest_vitals_returns_success():
    response = client.post("/api/v1/ingest/vitals", json=sample_vitals())
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["reading_id"] > 0
    assert "news2_score" in data


def test_ingest_batch_returns_count():
    response = client.post(
        "/api/v1/ingest/vitals/batch",
        json={"readings": [sample_vitals(), sample_vitals()]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["ingested"] == 2
