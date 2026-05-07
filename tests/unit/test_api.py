"""
File: tests/unit/test_api.py
Purpose: Unit tests for FastAPI endpoints
Run: pytest tests/unit/test_api.py -v
"""

import pytest
import sys
sys.path.append(".")

from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

# ─────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────
@pytest.fixture
def high_risk_vitals():
    return {
        "patient_id": "PT-TEST-API",
        "age": 72, "gender": "M", "ward": "ICU",
        "heart_rate": 128, "systolic_bp": 85,
        "diastolic_bp": 55, "temperature": 39.2,
        "respiratory_rate": 28, "spo2": 89,
        "consciousness": 1, "urine_output": 12,
        "glucose": 11.5, "pain_score": 7,
    }

@pytest.fixture
def low_risk_vitals():
    return {
        "patient_id": "PT-TEST-LOW",
        "age": 35, "gender": "F", "ward": "General",
        "heart_rate": 72, "systolic_bp": 118,
        "diastolic_bp": 76, "temperature": 36.8,
        "respiratory_rate": 14, "spo2": 99,
        "consciousness": 0, "urine_output": 55,
        "glucose": 5.2, "pain_score": 1,
    }


# ─────────────────────────────────────────
# ROOT + HEALTH TESTS
# ─────────────────────────────────────────
class TestHealthEndpoints:

    def test_root_returns_200(self):
        response = client.get("/")
        assert response.status_code == 200

    def test_root_has_status(self):
        response = client.get("/")
        data = response.json()
        assert "status" in data
        assert data["status"] == "running"

    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_is_healthy(self):
        response = client.get("/health")
        data = response.json()
        assert data["status"] == "healthy"


# ─────────────────────────────────────────
# PREDICTION TESTS
# ─────────────────────────────────────────
class TestPredictionEndpoint:

    def test_predict_returns_200(self, high_risk_vitals):
        response = client.post("/api/v1/predict", json=high_risk_vitals)
        assert response.status_code == 200

    def test_predict_returns_risk_level(self, high_risk_vitals):
        response = client.post("/api/v1/predict", json=high_risk_vitals)
        data = response.json()
        assert "risk_level" in data
        assert data["risk_level"] in [0, 1, 2]

    def test_predict_high_risk_patient(self, high_risk_vitals):
        response = client.post("/api/v1/predict", json=high_risk_vitals)
        data = response.json()
        assert data["risk_level"] == 2
        assert data["risk_label"] == "High"

    def test_predict_low_risk_patient(self, low_risk_vitals):
        response = client.post("/api/v1/predict", json=low_risk_vitals)
        data = response.json()
        assert data["risk_level"] == 0
        assert data["risk_label"] == "Low"

    def test_predict_returns_confidence(self, high_risk_vitals):
        response = client.post("/api/v1/predict", json=high_risk_vitals)
        data = response.json()
        assert "confidence" in data
        assert 0 <= data["confidence"] <= 100

    def test_predict_returns_news2(self, high_risk_vitals):
        response = client.post("/api/v1/predict", json=high_risk_vitals)
        data = response.json()
        assert "news2_score" in data
        assert data["news2_score"] >= 0

    def test_predict_returns_recommendation(self, high_risk_vitals):
        response = client.post("/api/v1/predict", json=high_risk_vitals)
        data = response.json()
        assert "recommendation" in data
        assert len(data["recommendation"]) > 0

    def test_predict_invalid_data_returns_422(self):
        response = client.post("/api/v1/predict", json={"invalid": "data"})
        assert response.status_code == 422


# ─────────────────────────────────────────
# ANALYSIS TESTS
# ─────────────────────────────────────────
class TestAnalysisEndpoint:

    def _get_unique_patient(self):
        """Generate unique patient ID for each test."""
        import time
        return {
            "patient_id": f"PT-TEST-{int(time.time()*1000)}",
            "age": 72, "gender": "M", "ward": "ICU",
            "heart_rate": 128, "systolic_bp": 85,
            "diastolic_bp": 55, "temperature": 39.2,
            "respiratory_rate": 28, "spo2": 89,
            "consciousness": 1, "urine_output": 12,
            "glucose": 11.5, "pain_score": 7,
        }

    def test_analyze_returns_200(self):
        response = client.post("/api/v1/analyze", json=self._get_unique_patient())
        assert response.status_code == 200

    def test_analyze_returns_report(self):
        response = client.post("/api/v1/analyze", json=self._get_unique_patient())
        data = response.json()
        assert "report" in data

    def test_analyze_report_has_triage(self):
        response = client.post("/api/v1/analyze", json=self._get_unique_patient())
        data = response.json()
        assert "triage" in data["report"]

    def test_analyze_report_has_warnings(self):
        response = client.post("/api/v1/analyze", json=self._get_unique_patient())
        data = response.json()
        assert "warnings" in data["report"]

    def test_analyze_report_has_insights(self):
        response = client.post("/api/v1/analyze", json=self._get_unique_patient())
        data = response.json()
        assert "insights" in data["report"]

    def test_analyze_saved_to_db(self):
        response = client.post("/api/v1/analyze", json=self._get_unique_patient())
        data = response.json()
        assert data.get("saved_to_db") == True

# ─────────────────────────────────────────
# DASHBOARD TESTS
# ─────────────────────────────────────────
class TestDashboardEndpoints:

    def test_stats_returns_200(self):
        response = client.get("/api/v1/dashboard/stats")
        assert response.status_code == 200

    def test_stats_has_required_fields(self):
        response = client.get("/api/v1/dashboard/stats")
        data = response.json()
        required = ["total_patients", "high_risk", "medium_risk", "low_risk", "active_alerts"]
        for field in required:
            assert field in data

    def test_alerts_returns_200(self):
        response = client.get("/api/v1/dashboard/alerts")
        assert response.status_code == 200

    def test_high_risk_returns_200(self):
        response = client.get("/api/v1/dashboard/high-risk")
        assert response.status_code == 200


# ─────────────────────────────────────────
# AUTH TESTS
# ─────────────────────────────────────────
class TestAuthEndpoints:

    def test_login_admin_success(self):
        response = client.post("/api/v1/auth/login", json={
            "staff_id": "ADM001", "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["user"]["role"] == "admin"

    def test_login_doctor_success(self):
        response = client.post("/api/v1/auth/login", json={
            "staff_id": "DOC001", "password": "doctor123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "doctor"

    def test_login_invalid_returns_401(self):
        response = client.post("/api/v1/auth/login", json={
            "staff_id": "INVALID", "password": "wrong"
        })
        assert response.status_code == 401

    def test_login_wrong_password_returns_401(self):
        response = client.post("/api/v1/auth/login", json={
            "staff_id": "ADM001", "password": "wrongpassword"
        })
        assert response.status_code == 401