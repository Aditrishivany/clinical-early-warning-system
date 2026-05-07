"""
File: tests/unit/test_agents.py
Purpose: Unit tests for AI agents
Run: pytest tests/unit/test_agents.py -v
"""
import time
import pytest
import sys
sys.path.append(".")

from src.agents.triage_agent  import TriageAgent
from src.agents.warning_agent import WarningAgent
from src.agents.insight_agent import InsightAgent
from src.agents.coordinator   import AgentCoordinator


# ─────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────
@pytest.fixture
def high_risk_patient():
    return {
        "patient_id": "PT-TEST-001",
        "age": 72, "gender": "M", "ward": "ICU",
        "heart_rate": 128, "systolic_bp": 85,
        "diastolic_bp": 55, "temperature": 39.2,
        "respiratory_rate": 28, "spo2": 89,
        "consciousness": 1, "urine_output": 12,
        "glucose": 11.5, "pain_score": 7,
    }

@pytest.fixture
def low_risk_patient():
    return {
        "patient_id": "PT-TEST-002",
        "age": 35, "gender": "F", "ward": "General",
        "heart_rate": 72, "systolic_bp": 118,
        "diastolic_bp": 76, "temperature": 36.8,
        "respiratory_rate": 14, "spo2": 99,
        "consciousness": 0, "urine_output": 55,
        "glucose": 5.2, "pain_score": 1,
    }

@pytest.fixture
def high_risk_prediction():
    return {
        "risk_level": 2, "risk_label": "High",
        "confidence": 99.99, "news2_score": 13,
        "top_concerns": [
            "Tachycardia", "Hypotension", "Low SpO2"
        ],
    }

@pytest.fixture
def low_risk_prediction():
    return {
        "risk_level": 0, "risk_label": "Low",
        "confidence": 99.0, "news2_score": 2,
        "top_concerns": [],
    }


# ─────────────────────────────────────────
# TRIAGE AGENT TESTS
# ─────────────────────────────────────────
class TestTriageAgent:

    def test_initialization(self):
        agent = TriageAgent()
        assert agent is not None
        assert agent.name == "Triage Agent"

    def test_high_risk_gets_priority_1(self, high_risk_patient, high_risk_prediction):
        agent = TriageAgent()
        result = agent.analyze(high_risk_patient, high_risk_prediction)
        assert result["priority"] == 1
        assert result["priority_label"] == "IMMEDIATE"

    def test_low_risk_gets_priority_4(self, low_risk_patient, low_risk_prediction):
        agent = TriageAgent()
        result = agent.analyze(low_risk_patient, low_risk_prediction)
        assert result["priority"] == 4

    def test_result_has_required_fields(self, high_risk_patient, high_risk_prediction):
        agent = TriageAgent()
        result = agent.analyze(high_risk_patient, high_risk_prediction)
        required = ["priority", "priority_label", "location", "time_to_seen", "resources", "summary"]
        for field in required:
            assert field in result, f"Missing field: {field}"

    def test_high_risk_location_is_icu(self, high_risk_patient, high_risk_prediction):
        agent = TriageAgent()
        result = agent.analyze(high_risk_patient, high_risk_prediction)
        assert "ICU" in result["location"] or "Resuscitation" in result["location"]

    def test_resources_list_not_empty(self, high_risk_patient, high_risk_prediction):
        agent = TriageAgent()
        result = agent.analyze(high_risk_patient, high_risk_prediction)
        assert len(result["resources"]) > 0


# ─────────────────────────────────────────
# WARNING AGENT TESTS
# ─────────────────────────────────────────
class TestWarningAgent:

    def test_initialization(self):
        agent = WarningAgent()
        assert agent is not None
        assert agent.name == "Warning Agent"

    def test_detects_tachycardia(self, high_risk_patient, high_risk_prediction):
        agent = WarningAgent()
        result = agent.analyze(high_risk_patient, high_risk_prediction)
        all_alerts = result["warnings"] + result["critical"]
        vitals = [a["vital"] for a in all_alerts]
        assert any("Heart Rate" in v or "SpO2" in v for v in vitals)

    def test_detects_sepsis(self, high_risk_patient, high_risk_prediction):
        agent = WarningAgent()
        result = agent.analyze(high_risk_patient, high_risk_prediction)
        assert result["sepsis_alert"] is not None

    def test_stable_patient_no_critical(self, low_risk_patient, low_risk_prediction):
        agent = WarningAgent()
        result = agent.analyze(low_risk_patient, low_risk_prediction)
        assert len(result["critical"]) == 0

    def test_result_has_required_fields(self, high_risk_patient, high_risk_prediction):
        agent = WarningAgent()
        result = agent.analyze(high_risk_patient, high_risk_prediction)
        required = ["critical", "warnings", "watch_list", "sepsis_alert", "total_alerts", "summary"]
        for field in required:
            assert field in result, f"Missing field: {field}"

    def test_total_alerts_count(self, high_risk_patient, high_risk_prediction):
        agent = WarningAgent()
        result = agent.analyze(high_risk_patient, high_risk_prediction)
        expected = len(result["critical"]) + len(result["warnings"])
        assert result["total_alerts"] == expected


# ─────────────────────────────────────────
# INSIGHT AGENT TESTS
# ─────────────────────────────────────────
class TestInsightAgent:

    def test_initialization(self):
        agent = InsightAgent()
        assert agent is not None
        assert agent.name == "Insight Agent"

    def test_high_risk_has_immediate_actions(self, high_risk_patient, high_risk_prediction):
        triage  = TriageAgent().analyze(high_risk_patient, high_risk_prediction)
        warning = WarningAgent().analyze(high_risk_patient, high_risk_prediction)
        agent   = InsightAgent()
        result  = agent.analyze(high_risk_patient, high_risk_prediction, triage, warning)
        assert len(result["immediate_actions"]) > 0

    def test_high_risk_has_investigations(self, high_risk_patient, high_risk_prediction):
        triage  = TriageAgent().analyze(high_risk_patient, high_risk_prediction)
        warning = WarningAgent().analyze(high_risk_patient, high_risk_prediction)
        agent   = InsightAgent()
        result  = agent.analyze(high_risk_patient, high_risk_prediction, triage, warning)
        assert len(result["investigations"]) > 0

    def test_sepsis_activates_protocol(self, high_risk_patient, high_risk_prediction):
        triage  = TriageAgent().analyze(high_risk_patient, high_risk_prediction)
        warning = WarningAgent().analyze(high_risk_patient, high_risk_prediction)
        agent   = InsightAgent()
        result  = agent.analyze(high_risk_patient, high_risk_prediction, triage, warning)
        assert result["sepsis_protocol"] == True

    def test_result_has_clinical_summary(self, high_risk_patient, high_risk_prediction):
        triage  = TriageAgent().analyze(high_risk_patient, high_risk_prediction)
        warning = WarningAgent().analyze(high_risk_patient, high_risk_prediction)
        agent   = InsightAgent()
        result  = agent.analyze(high_risk_patient, high_risk_prediction, triage, warning)
        assert result["clinical_summary"] is not None
        assert len(result["clinical_summary"]) > 0


# ─────────────────────────────────────────
# COORDINATOR TESTS
# ─────────────────────────────────────────
class TestAgentCoordinator:

    def test_initialization(self):
        coordinator = AgentCoordinator()
        assert coordinator is not None

    def test_run_returns_report(self, high_risk_patient, high_risk_prediction):
        coordinator = AgentCoordinator()
        report = coordinator.run(high_risk_patient, high_risk_prediction)
        assert report is not None

    def test_report_has_all_sections(self, high_risk_patient, high_risk_prediction):
        coordinator = AgentCoordinator()
        report = coordinator.run(high_risk_patient, high_risk_prediction)
        required = ["report_id", "patient_id", "prediction", "triage", "warnings", "insights", "alert_level"]
        for field in required:
            assert field in report, f"Missing: {field}"

    def test_critical_patient_gets_critical_alert(self, high_risk_patient, high_risk_prediction):
        coordinator = AgentCoordinator()
        report = coordinator.run(high_risk_patient, high_risk_prediction)
        assert report["alert_level"] == "CRITICAL"

    def test_report_id_is_unique(self, high_risk_patient, high_risk_prediction):
    
        coordinator = AgentCoordinator()
        report1 = coordinator.run(high_risk_patient, high_risk_prediction)
        time.sleep(0.01)  # Small delay
        report2 = coordinator.run(high_risk_patient, high_risk_prediction)
        assert report1["report_id"] != report2["report_id"]

    def test_processing_time_recorded(self, high_risk_patient, high_risk_prediction):
        coordinator = AgentCoordinator()
        report = coordinator.run(high_risk_patient, high_risk_prediction)
        assert "processing_time" in report