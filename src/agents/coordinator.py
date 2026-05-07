"""
File: src/agents/coordinator.py
Purpose: Manager agent that coordinates all other agents
"""

from datetime import datetime
from src.agents.triage_agent  import TriageAgent
from src.agents.warning_agent import WarningAgent
from src.agents.insight_agent import InsightAgent


class AgentCoordinator:
    """
    Manager Agent — orchestrates all clinical AI agents.
    Runs them in sequence and compiles final report.
    """

    def __init__(self):
        print("\n  🤖 Initializing Multi-Agent System...")
        self.triage_agent  = TriageAgent()
        self.warning_agent = WarningAgent()
        self.insight_agent = InsightAgent()
        print("  ✅ All agents ready!\n")

    def run(self, patient_data: dict, prediction: dict) -> dict:
        """
        Run all agents and compile final clinical report.
        
        Args:
            patient_data: Raw patient vitals dict
            prediction:   ML model prediction dict
            
        Returns:
            Complete clinical report from all agents
        """

        print(f"  🔄 Running agents for patient: "
              f"{patient_data.get('patient_id', 'Unknown')}")

        start_time = datetime.now()

        # ── Step 1: Triage Agent ──
        print("  → Triage Agent analyzing...")
        triage_result = self.triage_agent.analyze(
            patient_data, prediction
        )

        # ── Step 2: Warning Agent ──
        print("  → Warning Agent analyzing...")
        warning_result = self.warning_agent.analyze(
            patient_data, prediction
        )

        # ── Step 3: Insight Agent ──
        print("  → Insight Agent analyzing...")
        insight_result = self.insight_agent.analyze(
            patient_data, prediction,
            triage_result, warning_result
        )

        # ── Compile Final Report ──
        duration = (datetime.now() - start_time).total_seconds()

        report = {
            "report_id":      f"RPT-{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
            "generated_at":   datetime.now().isoformat(),
            "processing_time": f"{duration:.2f}s",
            "patient_id":     patient_data.get("patient_id"),

            # ML Prediction
            "prediction": {
                "risk_level":  prediction.get("risk_level"),
                "risk_label":  prediction.get("risk_label"),
                "risk_color":  prediction.get("risk_color"),
                "confidence":  prediction.get("confidence"),
                "news2_score": prediction.get("news2_score"),
            },

            # Agent Results
            "triage":   triage_result,
            "warnings": warning_result,
            "insights": insight_result,

            # Executive Summary
            "executive_summary": self._compile_summary(
                prediction, triage_result,
                warning_result, insight_result
            ),

            # Alert Level
            "alert_level": self._get_alert_level(
                prediction, warning_result
            ),
        }

        print(f"  ✅ Report generated in {duration:.2f}s")
        return report

    def _get_alert_level(
        self, prediction: dict, warnings: dict
    ) -> str:
        risk  = prediction.get("risk_level", 0)
        crits = len(warnings.get("critical", []))

        if risk == 2 or crits > 0: return "CRITICAL"
        if risk == 1:               return "WARNING"
        return "NORMAL"

    def _compile_summary(
        self, prediction, triage, warnings, insights
    ) -> str:
        return (
            f"[ML] {prediction.get('risk_label')} Risk "
            f"({prediction.get('confidence')}% confident). "
            f"[TRIAGE] {triage.get('priority_label')} — "
            f"{triage.get('time_to_seen')}. "
            f"[WARNINGS] {warnings.get('summary')} "
            f"[INSIGHTS] {insights.get('summary')}"
        )