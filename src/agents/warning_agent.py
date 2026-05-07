"""
File: src/agents/warning_agent.py
Purpose: Identifies which vitals are dangerous and generates alerts
"""

from datetime import datetime


class WarningAgent:
    """
    Warning Agent — detects dangerous vital sign patterns
    and generates specific clinical alerts.
    """

    def __init__(self):
        self.name = "Warning Agent"
        print(f"  ✅ {self.name} initialized")

    def analyze(self, patient_data: dict, prediction: dict) -> dict:
        """Analyze vitals and generate specific warnings."""

        warnings  = []
        critical  = []
        watch_list = []

        hr   = patient_data.get("heart_rate", 80)
        sbp  = patient_data.get("systolic_bp", 120)
        dbp  = patient_data.get("diastolic_bp", 80)
        temp = patient_data.get("temperature", 37.0)
        rr   = patient_data.get("respiratory_rate", 16)
        spo2 = patient_data.get("spo2", 98)
        avpu = patient_data.get("consciousness", 0)
        uo   = patient_data.get("urine_output", 50)
        gluc = patient_data.get("glucose", 5.5)
        pain = patient_data.get("pain_score", 0)

        # ── CRITICAL Alerts ──
        if spo2 < 85:
            critical.append({
                "vital":   "SpO2",
                "value":   f"{spo2}%",
                "normal":  "95-100%",
                "alert":   "CRITICAL: Severe hypoxia — immediate oxygen therapy required",
                "action":  "Apply high-flow oxygen, call respiratory team NOW"
            })

        if sbp < 80:
            critical.append({
                "vital":   "Systolic BP",
                "value":   f"{sbp} mmHg",
                "normal":  "90-140 mmHg",
                "alert":   "CRITICAL: Severe hypotension — shock suspected",
                "action":  "IV fluids bolus, vasopressors may be needed"
            })

        if hr > 140 or hr < 40:
            critical.append({
                "vital":   "Heart Rate",
                "value":   f"{hr} bpm",
                "normal":  "60-100 bpm",
                "alert":   "CRITICAL: Extreme heart rate — cardiac emergency",
                "action":  "ECG immediately, cardiac team alert"
            })

        if avpu >= 2:
            critical.append({
                "vital":   "Consciousness",
                "value":   ["Alert","Voice","Pain","Unresponsive"][avpu],
                "normal":  "Alert",
                "alert":   "CRITICAL: Severely reduced consciousness",
                "action":  "Protect airway, urgent neurological assessment"
            })

        # ── WARNING Alerts ──
        if 85 <= spo2 < 92:
            warnings.append({
                "vital":  "SpO2",
                "value":  f"{spo2}%",
                "normal": "95-100%",
                "alert":  "WARNING: Low oxygen saturation",
                "action": "Apply oxygen, monitor continuously"
            })

        if 80 <= sbp < 90:
            warnings.append({
                "vital":  "Systolic BP",
                "value":  f"{sbp} mmHg",
                "normal": "90-140 mmHg",
                "alert":  "WARNING: Hypotension detected",
                "action": "IV access, fluid challenge, monitor"
            })

        if 100 < hr <= 140:
            warnings.append({
                "vital":  "Heart Rate",
                "value":  f"{hr} bpm",
                "normal": "60-100 bpm",
                "alert":  "WARNING: Tachycardia",
                "action": "ECG, check for pain/fever/dehydration"
            })

        if temp > 38.5:
            warnings.append({
                "vital":  "Temperature",
                "value":  f"{temp}°C",
                "normal": "36.1-37.5°C",
                "alert":  "WARNING: High fever — possible sepsis",
                "action": "Blood cultures, sepsis screening, antipyretics"
            })

        if rr > 25:
            warnings.append({
                "vital":  "Respiratory Rate",
                "value":  f"{rr} /min",
                "normal": "12-20 /min",
                "alert":  "WARNING: Respiratory distress",
                "action": "Chest assessment, ABG if available"
            })

        if gluc > 11:
            warnings.append({
                "vital":  "Glucose",
                "value":  f"{gluc} mmol/L",
                "normal": "4-7 mmol/L",
                "alert":  "WARNING: Hyperglycemia",
                "action": "Insulin sliding scale review"
            })

        # ── Watch List ──
        if uo < 20:
            watch_list.append("Low urine output — monitor fluid balance")
        if pain >= 7:
            watch_list.append(f"High pain score ({pain}/10) — review analgesia")
        if 37.5 < temp <= 38.5:
            watch_list.append(f"Low-grade fever ({temp}°C) — monitor trend")

        # ── Sepsis Screening ──
        sepsis_flags = sum([
            temp > 38.3 or temp < 36.0,
            hr > 90,
            rr > 20,
            sbp < 100,
        ])
        sepsis_alert = None
        if sepsis_flags >= 3:
            sepsis_alert = (
                "🚨 SEPSIS ALERT: Patient meets "
                f"{sepsis_flags}/4 SIRS criteria. "
                "Activate sepsis protocol immediately."
            )

        # ── Overall Warning Level ──
        if len(critical) > 0:
            overall = "CRITICAL"
        elif len(warnings) >= 2:
            overall = "HIGH WARNING"
        elif len(warnings) == 1:
            overall = "WARNING"
        else:
            overall = "STABLE"

        return {
            "agent":        self.name,
            "timestamp":    datetime.now().isoformat(),
            "overall":      overall,
            "critical":     critical,
            "warnings":     warnings,
            "watch_list":   watch_list,
            "sepsis_alert": sepsis_alert,
            "total_alerts": len(critical) + len(warnings),
            "summary": (
                f"{len(critical)} critical alerts, "
                f"{len(warnings)} warnings detected. "
                f"Overall status: {overall}."
            )
        }