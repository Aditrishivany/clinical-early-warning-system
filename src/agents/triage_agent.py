"""
File: src/agents/triage_agent.py
Purpose: Determines urgency level and bed/resource priority
"""

from datetime import datetime


class TriageAgent:
    """
    Triage Agent — decides urgency and resource allocation.
    Works locally without OpenAI (rule-based + AI-ready).
    """

    def __init__(self):
        self.name = "Triage Agent"
        print(f"  ✅ {self.name} initialized")

    def analyze(self, patient_data: dict, prediction: dict) -> dict:
        """
        Analyze patient and determine triage priority.
        
        Returns triage decision with:
        - Priority level (1=highest, 4=lowest)
        - Recommended location
        - Time to be seen
        - Required resources
        """

        risk_level  = prediction.get("risk_level", 0)
        news2_score = prediction.get("news2_score", 0)
        concerns    = prediction.get("top_concerns", [])
        ward        = patient_data.get("ward", "General")
        age         = patient_data.get("age", 50)

        # ── Determine Priority ──
        if risk_level == 2 or news2_score >= 7:
            priority       = 1
            priority_label = "IMMEDIATE"
            time_to_seen   = "NOW — within 5 minutes"
            location       = "ICU / Resuscitation Bay"
            color_code     = "RED"

        elif risk_level == 1 or news2_score >= 5:
            priority       = 2
            priority_label = "URGENT"
            time_to_seen   = "Within 30 minutes"
            location       = "HDU / High Dependency Unit"
            color_code     = "ORANGE"

        elif news2_score >= 3:
            priority       = 3
            priority_label = "SEMI-URGENT"
            time_to_seen   = "Within 2 hours"
            location       = "General Ward — close monitoring"
            color_code     = "YELLOW"

        else:
            priority       = 4
            priority_label = "ROUTINE"
            time_to_seen   = "Within 4 hours"
            location       = "General Ward"
            color_code     = "GREEN"

        # ── Determine Required Resources ──
        resources = []
        if news2_score >= 7:
            resources.extend([
                "Crash cart on standby",
                "Senior physician required",
                "ICU bed preparation",
                "Continuous cardiac monitoring"
            ])
        if "Low SpO2" in str(concerns):
            resources.append("Oxygen therapy / ventilator standby")
        if "Hypotension" in str(concerns):
            resources.append("IV access + fluid resuscitation")
        if "Altered consciousness" in str(concerns):
            resources.append("Neurological assessment team")
        if "Fever" in str(concerns):
            resources.append("Blood cultures + sepsis protocol")
        if not resources:
            resources.append("Standard ward monitoring")

        # ── Age Risk Factor ──
        age_note = ""
        if age >= 75:
            age_note = "⚠️ Elderly patient — higher risk of rapid deterioration"
        elif age >= 65:
            age_note = "Note: Patient over 65 — monitor closely"

        return {
            "agent":          self.name,
            "timestamp":      datetime.now().isoformat(),
            "priority":       priority,
            "priority_label": priority_label,
            "color_code":     color_code,
            "time_to_seen":   time_to_seen,
            "location":       location,
            "resources":      resources,
            "age_note":       age_note,
            "news2_score":    news2_score,
            "summary": (
                f"Patient classified as {priority_label} (Priority {priority}). "
                f"Must be seen {time_to_seen}. "
                f"Recommended location: {location}."
            )
        }