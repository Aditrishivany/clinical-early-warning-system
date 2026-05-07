"""
File: tests/integration/test_full_pipeline.py
Purpose: End-to-end integration tests
Run: pytest tests/integration/ -v
"""

import pytest
import sys
sys.path.append(".")

from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)


class TestFullPipeline:
    """End-to-end tests for the complete clinical pipeline."""

    PATIENT_DATA = {
        "patient_id": "PT-INTEGRATION-001",
        "age": 72, "gender": "M", "ward": "ICU",
        "heart_rate": 128, "systolic_bp": 85,
        "diastolic_bp": 55, "temperature": 39.2,
        "respiratory_rate": 28, "spo2": 89,
        "consciousness": 1, "urine_output": 12,
        "glucose": 11.5, "pain_score": 7,
    }

    def test_full_analysis_pipeline(self):
        """Test complete: vitals → ML → agents → DB."""
        response = client.post("/api/v1/analyze", json=self.PATIENT_DATA)
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "success"
        assert data["saved_to_db"] == True

        report = data["report"]
        assert report["alert_level"] == "CRITICAL"
        assert report["triage"]["priority"] == 1
        assert report["warnings"]["sepsis_alert"] is not None
        assert len(report["insights"]["immediate_actions"]) > 0

    def test_patient_history_after_analysis(self):
        """After analysis, patient history should be available."""
        client.post("/api/v1/analyze", json=self.PATIENT_DATA)
        response = client.get(f"/api/v1/patient/{self.PATIENT_DATA['patient_id']}/history")
        assert response.status_code == 200

        data = response.json()
        assert data["total_readings"] > 0
        assert data["total_reports"] > 0

    def test_dashboard_stats_update_after_analysis(self):
        """Dashboard stats should reflect new analysis."""
        client.post("/api/v1/analyze", json=self.PATIENT_DATA)
        response = client.get("/api/v1/dashboard/stats")
        assert response.status_code == 200

        data = response.json()
        assert data["total_patients"] > 0
        assert data["total_readings"] > 0

    def test_rag_answers_clinical_question(self):
        """RAG should answer clinical questions."""
        response = client.post("/api/v1/rag/ask", json={
            "question": "What is the sepsis protocol?",
            "patient_context": {}
        })
        assert response.status_code == 200

        data = response.json()
        assert len(data["answer"]) > 0
        assert len(data["sources"]) > 0

    def test_auth_and_role_access(self):
        """Test login for each role."""
        roles = [
            ("ADM001", "admin123",  "admin"),
            ("DOC001", "doctor123", "doctor"),
            ("NRS001", "nurse123",  "nurse"),
        ]
        for staff_id, password, role in roles:
            response = client.post("/api/v1/auth/login", json={
                "staff_id": staff_id, "password": password
            })
            assert response.status_code == 200
            assert response.json()["user"]["role"] == role