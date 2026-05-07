"""
File: src/agents/insight_agent.py
Purpose: Provides clinical insights and treatment recommendations
"""

from datetime import datetime


class InsightAgent:
    """
    Insight Agent — generates clinical recommendations
    based on patient vitals and risk assessment.
    """

    def __init__(self):
        self.name = "Insight Agent"

    def analyze(
        self,
        patient_data: dict,
        prediction:   dict,
        triage:       dict,
        warnings:     dict
    ) -> dict:
        """Generate clinical insights and recommendations."""

        risk_level   = prediction.get("risk_level", 0)
        news2_score  = prediction.get("news2_score", 0)
        concerns     = prediction.get("top_concerns", [])
        critical     = warnings.get("critical", [])
        warn_list    = warnings.get("warnings", [])
        sepsis_alert = warnings.get("sepsis_alert")

        immediate_actions = []
        investigations    = []
        treatments        = []
        monitoring        = []

        # ── Immediate Actions by Risk ──
        if risk_level == 2:
            immediate_actions.extend([
                "Call senior physician / registrar IMMEDIATELY",
                "Ensure IV access (2 large bore cannulas)",
                "Attach continuous cardiac monitor",
                "Prepare for potential ICU transfer",
                "Alert ICU team and bed manager",
            ])
        elif risk_level == 1:
            immediate_actions.extend([
                "Notify nurse in charge",
                "Increase observation frequency to every 30 mins",
                "Establish IV access",
                "Contact duty doctor within 30 minutes",
            ])
        else:
            immediate_actions.extend([
                "Continue routine 4-hourly observations",
                "Document in patient notes",
            ])

        # ── Investigations ──
        if news2_score >= 5:
            investigations.extend([
                "Full Blood Count (FBC)",
                "Urea & Electrolytes (U&E)",
                "C-Reactive Protein (CRP)",
                "Lactate level",
                "Blood cultures x2 (if fever)",
                "Arterial Blood Gas (ABG)",
                "12-lead ECG",
                "Chest X-ray",
            ])
        elif news2_score >= 3:
            investigations.extend([
                "FBC + U&E",
                "CRP",
                "ECG if tachycardic",
            ])

        # ── Specific Treatments ──
        vitals_str = str(concerns)

        if "Low SpO2" in vitals_str or "hypox" in vitals_str.lower():
            treatments.append(
                "Oxygen: Start 15L via non-rebreathe mask, "
                "titrate to SpO2 >94%"
            )

        if "Hypotension" in vitals_str:
            treatments.append(
                "Fluids: 500ml 0.9% NaCl bolus over 15 mins, "
                "reassess after"
            )

        if "Fever" in vitals_str or "fever" in vitals_str.lower():
            treatments.append(
                "Antipyretics: Paracetamol 1g IV/oral "
                "if temperature >38.5°C"
            )

        if sepsis_alert:
            treatments.extend([
                "SEPSIS BUNDLE — Start within 1 hour:",
                "  → Blood cultures before antibiotics",
                "  → IV antibiotics (per local protocol)",
                "  → IV fluids 30ml/kg if hypotensive",
                "  → Measure lactate",
                "  → Monitor urine output (catheterise)",
            ])

        if "High glucose" in vitals_str:
            treatments.append(
                "Glycaemic control: Check insulin sliding scale, "
                "target glucose 6-10 mmol/L"
            )

        # ── Monitoring Plan ──
        if risk_level == 2:
            monitoring = [
                "Continuous cardiac + SpO2 monitoring",
                "BP every 15 minutes",
                "Urine output hourly (catheterise)",
                "GCS every 30 minutes",
                "Repeat NEWS2 every 30 minutes",
            ]
        elif risk_level == 1:
            monitoring = [
                "SpO2 continuous monitoring",
                "BP + HR every 30 minutes",
                "Repeat NEWS2 every hour",
                "Fluid balance chart",
            ]
        else:
            monitoring = [
                "Routine observations every 4 hours",
                "Repeat NEWS2 at next obs round",
            ]

        # ── Clinical Summary ──
        summary = self._generate_summary(
            patient_data, prediction, news2_score,
            risk_level, sepsis_alert
        )

        return {
            "agent":              self.name,
            "timestamp":          datetime.now().isoformat(),
            "immediate_actions":  immediate_actions,
            "investigations":     investigations,
            "treatments":         treatments,
            "monitoring_plan":    monitoring,
            "sepsis_protocol":    sepsis_alert is not None,
            "clinical_summary":   summary,
            "summary": (
                f"{len(immediate_actions)} immediate actions, "
                f"{len(investigations)} investigations, "
                f"{len(treatments)} treatments recommended."
            )
        }

    def _generate_summary(
        self, patient_data, prediction,
        news2_score, risk_level, sepsis_alert
    ) -> str:
        """Generate a clinical handover summary."""

        age    = patient_data.get("age", "Unknown")
        gender = patient_data.get("gender", "Unknown")
        ward   = patient_data.get("ward", "Unknown")
        pid    = patient_data.get("patient_id", "Unknown")
        label  = prediction.get("risk_label", "Unknown")

        summary = (
            f"Patient {pid}, {age}yr {gender}, {ward}. "
            f"NEWS2 score {news2_score} — {label} Risk. "
        )

        if sepsis_alert:
            summary += "SEPSIS PROTOCOL ACTIVATED. "

        if risk_level == 2:
            summary += (
                "Patient requires IMMEDIATE senior review. "
                "ICU transfer should be considered."
            )
        elif risk_level == 1:
            summary += (
                "Patient requires URGENT medical review "
                "within 30 minutes."
            )
        else:
            summary += "Continue routine monitoring."

        return summary