"""
File: scripts/test_agents.py
Purpose: Test the multi-agent system locally
"""

import sys
sys.path.append(".")

from src.agents.coordinator import AgentCoordinator

# ── Test Patient (High Risk) ──
patient_data = {
    "patient_id":       "PT1001",
    "age":              72,
    "gender":           "M",
    "ward":             "ICU",
    "heart_rate":       128,
    "systolic_bp":      85,
    "diastolic_bp":     55,
    "temperature":      39.2,
    "respiratory_rate": 28,
    "spo2":             89,
    "consciousness":    1,
    "urine_output":     12,
    "glucose":          11.5,
    "pain_score":       7,
}

# ── Simulate ML Prediction ──
prediction = {
    "risk_level":  2,
    "risk_label":  "High",
    "risk_color":  "red",
    "confidence":  99.99,
    "news2_score": 13,
    "top_concerns": [
        "Tachycardia (HR: 128)",
        "Hypotension (SBP: 85)",
        "Low SpO2 (89%)",
        "Fever (39.2°C)",
        "Altered consciousness",
    ],
}

# ── Run Coordinator ──
coordinator = AgentCoordinator()
report      = coordinator.run(patient_data, prediction)

# ── Print Report ──
print("\n" + "="*60)
print("  CLINICAL AI REPORT")
print("="*60)
print(f"  Report ID   : {report['report_id']}")
print(f"  Patient     : {report['patient_id']}")
print(f"  Alert Level : {report['alert_level']}")
print(f"  Risk        : {report['prediction']['risk_label']} "
      f"({report['prediction']['confidence']}%)")

print(f"\n  📋 TRIAGE:")
print(f"  Priority    : {report['triage']['priority_label']}")
print(f"  Location    : {report['triage']['location']}")
print(f"  Time        : {report['triage']['time_to_seen']}")
print(f"  Resources   : {len(report['triage']['resources'])} required")

print(f"\n  🚨 WARNINGS:")
print(f"  Critical    : {len(report['warnings']['critical'])}")
print(f"  Warnings    : {len(report['warnings']['warnings'])}")
if report['warnings']['sepsis_alert']:
    print(f"  {report['warnings']['sepsis_alert']}")

print(f"\n  💊 INSIGHTS:")
for action in report['insights']['immediate_actions']:
    print(f"  → {action}")

print(f"\n  📝 SUMMARY:")
print(f"  {report['executive_summary']}")
print("="*60)
print("\n  🎉 Multi-Agent System Working!\n")