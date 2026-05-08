"""
File: scripts/simulate_realtime.py
Purpose: Simulate real-time vitals for ALL patients in database
"""

import requests
import time
import random
import numpy as np
import sys
import os
sys.path.append('.')

from datetime import datetime
from src.database.connection import SessionLocal
from src.database.models import Patient, PatientAssignment

API_URL       = os.getenv("CLINICALAI_API_URL", "http://127.0.0.1:8000/api/v1/analyze")
INTERVAL_SECS = 20

print("=" * 60)
print("  REAL-TIME PATIENT MONITOR SIMULATOR")
print("  Simulating ALL patients from database")
print("=" * 60)


# ─────────────────────────────────────────
# LOAD ALL PATIENTS FROM DB
# ─────────────────────────────────────────
def load_patients():
    db = SessionLocal()
    try:
        patients = db.query(Patient).filter(
            Patient.is_discharged == False
        ).all()

        result = []
        for p in patients:
            assignment = db.query(PatientAssignment).filter(
                PatientAssignment.patient_id == p.patient_id,
                PatientAssignment.is_active  == True
            ).first()

            result.append({
                "patient_id": p.patient_id,
                "name":       p.name,
                "age":        p.age,
                "gender":     p.gender,
                "ward":       assignment.ward if assignment else p.ward,
                "scenario":   _assign_scenario(p.ward),
            })

        return result
    finally:
        db.close()


def _assign_scenario(ward: str) -> str:
    """Assign scenario based on ward."""
    scenarios = {
        "ICU":       ["critical", "deteriorating", "fluctuating"],
        "HDU":       ["deteriorating", "fluctuating", "recovering"],
        "Emergency": ["critical", "deteriorating"],
        "General":   ["stable", "recovering", "stable"],
    }
    options = scenarios.get(ward, ["stable"])
    return random.choice(options)


# ─────────────────────────────────────────
# VITAL SIGNS SIMULATOR
# ─────────────────────────────────────────
class PatientSimulator:

    def __init__(self, profile: dict):
        self.profile  = profile
        self.scenario = profile["scenario"]
        self.cycle    = 0
        self.vitals   = self._base_vitals()

    def _base_vitals(self) -> dict:
        scenario = self.scenario
        if scenario == "critical":
            return {
                "heart_rate":       random.uniform(110, 140),
                "systolic_bp":      random.uniform(75, 95),
                "diastolic_bp":     random.uniform(45, 60),
                "temperature":      random.uniform(38.5, 40.0),
                "respiratory_rate": random.uniform(24, 32),
                "spo2":             random.uniform(85, 92),
                "consciousness":    random.choice([1, 2]),
                "urine_output":     random.uniform(8, 20),
                "glucose":          random.uniform(9, 14),
                "pain_score":       random.randint(6, 9),
            }
        elif scenario == "deteriorating":
            return {
                "heart_rate":       random.uniform(85, 105),
                "systolic_bp":      random.uniform(100, 120),
                "diastolic_bp":     random.uniform(60, 75),
                "temperature":      random.uniform(37.5, 38.8),
                "respiratory_rate": random.uniform(18, 24),
                "spo2":             random.uniform(91, 95),
                "consciousness":    0,
                "urine_output":     random.uniform(20, 35),
                "glucose":          random.uniform(7, 10),
                "pain_score":       random.randint(3, 6),
            }
        elif scenario == "recovering":
            return {
                "heart_rate":       random.uniform(80, 100),
                "systolic_bp":      random.uniform(108, 125),
                "diastolic_bp":     random.uniform(65, 80),
                "temperature":      random.uniform(37.0, 37.8),
                "respiratory_rate": random.uniform(16, 22),
                "spo2":             random.uniform(93, 97),
                "consciousness":    0,
                "urine_output":     random.uniform(30, 50),
                "glucose":          random.uniform(6, 8),
                "pain_score":       random.randint(2, 4),
            }
        elif scenario == "fluctuating":
            return {
                "heart_rate":       random.uniform(90, 120),
                "systolic_bp":      random.uniform(95, 115),
                "diastolic_bp":     random.uniform(55, 72),
                "temperature":      random.uniform(37.5, 39.0),
                "respiratory_rate": random.uniform(18, 26),
                "spo2":             random.uniform(90, 95),
                "consciousness":    random.choice([0, 1]),
                "urine_output":     random.uniform(15, 40),
                "glucose":          random.uniform(7, 12),
                "pain_score":       random.randint(3, 7),
            }
        else:  # stable
            return {
                "heart_rate":       random.uniform(65, 85),
                "systolic_bp":      random.uniform(112, 130),
                "diastolic_bp":     random.uniform(68, 82),
                "temperature":      random.uniform(36.5, 37.2),
                "respiratory_rate": random.uniform(13, 18),
                "spo2":             random.uniform(96, 99),
                "consciousness":    0,
                "urine_output":     random.uniform(40, 65),
                "glucose":          random.uniform(5, 7),
                "pain_score":       random.randint(0, 2),
            }

    def update_vitals(self) -> dict:
        self.cycle += 1

        # Apply trend
        if self.scenario == "deteriorating":
            factor = min(self.cycle * 0.3, 8)
            self.vitals["heart_rate"]       += factor * 0.5
            self.vitals["systolic_bp"]      -= factor * 0.4
            self.vitals["spo2"]             -= factor * 0.2
            self.vitals["respiratory_rate"] += factor * 0.3
            self.vitals["temperature"]      += factor * 0.03

        elif self.scenario == "recovering":
            factor = min(self.cycle * 0.2, 6)
            self.vitals["heart_rate"]       -= factor * 0.3
            self.vitals["systolic_bp"]      += factor * 0.3
            self.vitals["spo2"]             += factor * 0.15
            self.vitals["respiratory_rate"] -= factor * 0.2

        elif self.scenario == "fluctuating":
            wave = np.sin(self.cycle * 0.8) * 6
            self.vitals["heart_rate"]       += wave
            self.vitals["systolic_bp"]      -= wave * 0.4
            self.vitals["spo2"]             -= abs(wave) * 0.15

        # Add noise
        noise = {
            "heart_rate":       random.uniform(-3, 3),
            "systolic_bp":      random.uniform(-4, 4),
            "diastolic_bp":     random.uniform(-2, 2),
            "temperature":      random.uniform(-0.1, 0.1),
            "respiratory_rate": random.uniform(-1, 1),
            "spo2":             random.uniform(-0.5, 0.5),
            "urine_output":     random.uniform(-3, 3),
            "glucose":          random.uniform(-0.2, 0.2),
        }

        for key, val in noise.items():
            self.vitals[key] = self.vitals[key] + val

        # Clip ranges
        clips = {
            "heart_rate":       (30,  200),
            "systolic_bp":      (55,  220),
            "diastolic_bp":     (25,  140),
            "temperature":      (34,  42),
            "respiratory_rate": (6,   45),
            "spo2":             (65,  100),
            "urine_output":     (0,   150),
            "glucose":          (2,   25),
            "pain_score":       (0,   10),
            "consciousness":    (0,   3),
        }

        for key, (low, high) in clips.items():
            self.vitals[key] = max(low, min(high, self.vitals[key]))

        return self.vitals.copy()


# ─────────────────────────────────────────
# SEND VITALS
# ─────────────────────────────────────────
def send_vitals(profile: dict, vitals: dict) -> dict:
    payload = {
        "patient_id":       profile["patient_id"],
        "age":              float(profile["age"] or 50),
        "gender":           profile["gender"] or "M",
        "ward":             profile["ward"]   or "General",
        "heart_rate":       round(vitals["heart_rate"],       1),
        "systolic_bp":      round(vitals["systolic_bp"],      1),
        "diastolic_bp":     round(vitals["diastolic_bp"],     1),
        "temperature":      round(vitals["temperature"],      1),
        "respiratory_rate": round(vitals["respiratory_rate"], 1),
        "spo2":             round(vitals["spo2"],             1),
        "consciousness":    int(vitals["consciousness"]),
        "urine_output":     round(vitals["urine_output"],     1),
        "glucose":          round(vitals["glucose"],          1),
        "pain_score":       int(vitals["pain_score"]),
    }

    try:
        response = requests.post(API_URL, json=payload, timeout=15)
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"Status {response.status_code}"}
    except requests.exceptions.ConnectionError:
        return {"error": "API not running"}
    except Exception as e:
        return {"error": str(e)}


# ─────────────────────────────────────────
# DISPLAY
# ─────────────────────────────────────────
def display_result(profile: dict, vitals: dict, result: dict):
    now = datetime.now().strftime("%H:%M:%S")

    if "error" in result:
        print(f"  [{now}] ❌ {profile['patient_id']} — {result['error']}")
        return

    report     = result.get("report", {})
    pred       = report.get("prediction", {})
    risk_level = pred.get("risk_level", 0)
    risk_icons = {0: "🟢", 1: "🟡", 2: "🔴"}
    risk_icon  = risk_icons.get(risk_level, "⚪")
    sepsis     = "🚨 SEPSIS!" if report.get("warnings", {}).get("sepsis_alert") else ""

    print(
        f"  [{now}] {risk_icon} {profile['patient_id']:15s} "
        f"({profile['scenario']:12s}) | "
        f"HR:{vitals['heart_rate']:5.1f} "
        f"BP:{vitals['systolic_bp']:5.1f}/{vitals['diastolic_bp']:4.1f} "
        f"SpO2:{vitals['spo2']:4.1f}% "
        f"Temp:{vitals['temperature']:4.1f} "
        f"| NEWS2:{pred.get('news2_score','?'):2} "
        f"Risk:{pred.get('risk_label','?'):6s} "
        f"{sepsis}"
    )


# ─────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────
def main():
    print("\n  Loading patients from database...")
    patients = load_patients()

    if not patients:
        print("  ❌ No patients found in database!")
        print("  Run: python scripts/simple_seed.py")
        return

    print(f"  ✅ Found {len(patients)} patients:")
    for p in patients:
        print(f"     → {p['patient_id']} | {p['name']} | {p['ward']} | {p['scenario']}")

    simulators = [PatientSimulator(p) for p in patients]

    print(f"\n  Starting simulation...")
    print(f"  Interval: every {INTERVAL_SECS} seconds")
    print(f"  Press Ctrl+C to stop\n")
    print("  " + "─" * 100)

    cycle = 0
    while True:
        cycle += 1
        print(f"\n  ── Cycle {cycle} ({datetime.now().strftime('%H:%M:%S')}) "
              f"── {len(simulators)} patients ──")

        for sim in simulators:
            vitals = sim.update_vitals()
            result = send_vitals(sim.profile, vitals)
            display_result(sim.profile, vitals, result)
            time.sleep(1)

        print(f"\n  ⏳ Next update in {INTERVAL_SECS}s... (Ctrl+C to stop)")
        time.sleep(INTERVAL_SECS)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n  ✅ Simulation stopped!")
        print("  All vitals saved to database.\n")
