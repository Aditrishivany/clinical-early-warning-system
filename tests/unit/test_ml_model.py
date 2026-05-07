"""
File: tests/unit/test_ml_model.py
Purpose: Unit tests for ML model
Run: pytest tests/unit/test_ml_model.py -v
"""

import pytest
import numpy as np
import pandas as pd
import joblib
import json
from pathlib import Path

# ─────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────
@pytest.fixture
def model():
    """Load trained model."""
    path = Path("src/ml/models/early_warning_model.joblib")
    assert path.exists(), "Model file not found! Run training first."
    return joblib.load(path)

@pytest.fixture
def scaler():
    """Load feature scaler."""
    path = Path("src/ml/models/feature_scaler.joblib")
    assert path.exists(), "Scaler file not found! Run training first."
    return joblib.load(path)

@pytest.fixture
def feature_names():
    """Load feature names."""
    path = Path("src/data/features/feature_list.json")
    assert path.exists(), "Feature list not found!"
    with open(path) as f:
        return json.load(f)["features"]

@pytest.fixture
def sample_high_risk():
    """High risk patient vitals."""
    return {
        "heart_rate": 128, "systolic_bp": 85, "diastolic_bp": 55,
        "temperature": 39.2, "respiratory_rate": 28, "spo2": 89,
        "consciousness": 1, "urine_output": 12, "glucose": 11.5,
        "pain_score": 7, "age": 72, "gender_encoded": 1,
        "ward_encoded": 3, "age_group": 2,
        "news2_rr": 3, "news2_spo2": 2, "news2_sbp": 3,
        "news2_hr": 2, "news2_temp": 1, "news2_avpu": 3,
        "news2_total": 14, "pulse_pressure": 30, "map": 65.0,
        "shock_index": 1.506, "temp_deviation": 2.2,
        "spo2_deficit": 11.0, "resp_distress": 1,
        "hypotension": 1, "tachycardia": 1, "fever": 1,
        "shock_indicator": 1,
    }

@pytest.fixture
def sample_low_risk():
    """Low risk patient vitals."""
    return {
        "heart_rate": 72, "systolic_bp": 118, "diastolic_bp": 76,
        "temperature": 36.8, "respiratory_rate": 14, "spo2": 99,
        "consciousness": 0, "urine_output": 55, "glucose": 5.2,
        "pain_score": 1, "age": 35, "gender_encoded": 0,
        "ward_encoded": 1, "age_group": 0,
        "news2_rr": 0, "news2_spo2": 3, "news2_sbp": 0,
        "news2_hr": 0, "news2_temp": 0, "news2_avpu": 0,
        "news2_total": 3, "pulse_pressure": 42, "map": 90.0,
        "shock_index": 0.61, "temp_deviation": 0.2,
        "spo2_deficit": 1.0, "resp_distress": 0,
        "hypotension": 0, "tachycardia": 0, "fever": 0,
        "shock_indicator": 0,
    }


# ─────────────────────────────────────────
# TESTS
# ─────────────────────────────────────────
class TestMLModel:

    def test_model_loads(self, model):
        """Model should load without errors."""
        assert model is not None

    def test_scaler_loads(self, scaler):
        """Scaler should load without errors."""
        assert scaler is not None

    def test_model_predicts_high_risk(self, model, scaler, feature_names, sample_high_risk):
        """High risk vitals should predict risk level 2."""
        X = pd.DataFrame([sample_high_risk])[feature_names]
        X_scaled = scaler.transform(X)
        pred = model.predict(X_scaled)[0]
        assert pred == 2, f"Expected High Risk (2), got {pred}"

    def test_model_predicts_low_risk(self, model, scaler, feature_names, sample_low_risk):
        """Low risk vitals should predict risk level 0."""
        X = pd.DataFrame([sample_low_risk])[feature_names]
        X_scaled = scaler.transform(X)
        pred = model.predict(X_scaled)[0]
        assert pred == 0, f"Expected Low Risk (0), got {pred}"

    def test_probabilities_sum_to_one(self, model, scaler, feature_names, sample_high_risk):
        """Probabilities should sum to 1.0."""
        X = pd.DataFrame([sample_high_risk])[feature_names]
        X_scaled = scaler.transform(X)
        probs = model.predict_proba(X_scaled)[0]
        assert abs(sum(probs) - 1.0) < 1e-6

    def test_output_shape(self, model, scaler, feature_names, sample_high_risk):
        """Model should output 3 probability classes."""
        X = pd.DataFrame([sample_high_risk])[feature_names]
        X_scaled = scaler.transform(X)
        probs = model.predict_proba(X_scaled)
        assert probs.shape[1] == 3

    def test_feature_count(self, feature_names):
        """Should have correct number of features."""
        assert len(feature_names) == 31

    def test_batch_prediction(self, model, scaler, feature_names, sample_high_risk, sample_low_risk):
        """Model should handle batch predictions."""
        X = pd.DataFrame([sample_high_risk, sample_low_risk])[feature_names]
        X_scaled = scaler.transform(X)
        preds = model.predict(X_scaled)
        assert len(preds) == 2

    def test_confidence_range(self, model, scaler, feature_names, sample_high_risk):
        """Confidence should be between 0 and 100."""
        X = pd.DataFrame([sample_high_risk])[feature_names]
        X_scaled = scaler.transform(X)
        probs = model.predict_proba(X_scaled)[0]
        risk_level = model.predict(X_scaled)[0]
        confidence = float(probs[risk_level]) * 100
        assert 0 <= confidence <= 100