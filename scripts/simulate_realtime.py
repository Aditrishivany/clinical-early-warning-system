"""
File: scripts/simulate_realtime.py
Purpose: Simulate real-time patient vital signs monitoring
         Mimics bedside monitors sending data to our system
"""

import requests
import time
import random
import numpy as np
from datetime import datetime

# ─────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────
API_URL       = "http://127.0.0.1:8000/api/v1/analyze"
INTERVAL_SECS = 120        # Send vitals every 30 seconds
NUM_PATIENTS  = 5         # Simulate 5 patients simultaneously

print("=" * 60)
print("  REAL-TIME PATIENT MONITOR SIMULATOR")
print("=" * 60)
print(f"  API URL  : {API_URL}")
print(f"  Interval : Every {INTERVAL_SECS} seconds")
print(f"  Patients : {NUM_PATIENTS} simulated patients")
print(f"  Press Ctrl+C to stop")
print("=" * 60)


# ─────────────────────────────────────────
# PATIENT PROFILES
# Simulates different patient scenarios
# ─────────────────────────────────────────
PATIENT_PROFILES = [
    {
        "patient_id": "PT-SIM-001",
        "name":       "John Smith",
        "age":        72,
        "gender":     "M",
        "ward":       "ICU",
        "scenario":   "deteriorating",   # Gets worse over time
        "base_vitals": {
            "heart_rate":       88,
            "systolic_bp":      118,
            "diastolic_bp":     75,
            "temperature":      37.2,
            "respiratory_rate": 18,
            "spo2":             96,
            "consciousness":    0,
            "urine_output":     45,
            "glucose":          6.8,
            "pain_score":       2,
        }
    },
    {
        "patient_id": "PT-SIM-002",
        "name":       "Mary Johnson",
        "age":        65,
        "gender":     "F",
        "ward":       "HDU",
        "scenario":   "critical",        # Already critical
        "base_vitals": {
            "heart_rate":       125,
            "systolic_bp":      88,
            "diastolic_bp":     55,
            "temperature":      39.1,
            "respiratory_rate": 26,
            "spo2":             91,
            "consciousness":    1,
            "urine_output":     15,
            "glucose":          10.5,
            "pain_score":       7,
        }
    },
    {
        "patient_id": "PT-SIM-003",
        "name":       "Robert Davis",
        "age":        45,
        "gender":     "M",
        "ward":       "General",
        "scenario":   "stable",          # Remains stable
        "base_vitals": {
            "heart_rate":       76,
            "systolic_bp":      122,
            "diastolic_bp":     78,
            "temperature":      36.8,
            "respiratory_rate": 15,
            "spo2":             98,
            "consciousness":    0,
            "urine_output":     52,
            "glucose":          5.4,
            "pain_score":       1,
        }
    },
    {
        "patient_id": "PT-SIM-004",
        "name":       "Sarah Wilson",
        "age":        58,
        "gender":     "F",
        "ward":       "Emergency",
        "scenario":   "recovering",      # Gets better over time
        "base_vitals": {
            "heart_rate":       112,
            "systolic_bp":      95,
            "diastolic_bp":     62,
            "temperature":      38.6,
            "respiratory_rate": 23,
            "spo2":             93,
            "consciousness":    0,
            "urine_output":     28,
            "glucose":          8.2,
            "pain_score":       5,
        }
    },
    {
        "patient_id": "PT-SIM-005",
        "name":       "James Brown",
        "age":        83,
        "gender":     "M",
        "ward":       "ICU",
        "scenario":   "fluctuating",     # Unstable, goes up and down
        "base_vitals": {
            "heart_rate":       105,
            "systolic_bp":      102,
            "diastolic_bp":     65,
            "temperature":      38.0,
            "respiratory_rate": 21,
            "spo2":             94,
            "consciousness":    0,
            "urine_output":     32,
            "glucose":          9.1,
            "pain_score":       4,
        }
    },
]


# ─────────────────────────────────────────
# VITAL SIGN SIMULATOR
# ─────────────────────────────────────────
class PatientSimulator:
    """Simulates realistic vital sign changes for one patient."""

    def __init__(self, profile: dict):
        self.profile  = profile
        self.vitals   = profile["base_vitals"].copy()
        self.scenario = profile["scenario"]
        self.cycle    = 0

    def update_vitals(self) -> dict:
        """Update vitals based on scenario and add realistic noise."""

        self.cycle += 1

        # Apply scenario-based trends
        if self.scenario == "deteriorating":
            self._deteriorate()

        elif self.scenario == "recovering":
            self._recover()

        elif self.scenario == "critical":
            self._stay_critical()

        elif self.scenario == "fluctuating":
            self._fluctuate()

        else:  # stable
            self._stay_stable()

        # Add realistic noise to all vitals
        self._add_noise()

        # Clip to safe ranges
        self._clip_vitals()

        return self.vitals.copy()

    def _deteriorate(self):
        """Patient gradually gets worse."""
        factor = min(self.cycle * 0.5, 10)
        self.vitals["heart_rate"]       += factor * 0.8
        self.vitals["systolic_bp"]      -= factor * 0.6
        self.vitals["temperature"]      += factor * 0.05
        self.vitals["respiratory_rate"] += factor * 0.4
        self.vitals["spo2"]             -= factor * 0.3
        self.vitals["urine_output"]     -= factor * 0.5

        # Consciousness worsens at cycle 15
        if self.cycle > 15:
            self.vitals["consciousness"] = min(2, self.cycle // 10)

    def _recover(self):
        """Patient gradually gets better."""
        factor = min(self.cycle * 0.3, 8)
        self.vitals["heart_rate"]       -= factor * 0.5
        self.vitals["systolic_bp"]      += factor * 0.4
        self.vitals["temperature"]      -= factor * 0.04
        self.vitals["respiratory_rate"] -= factor * 0.3
        self.vitals["spo2"]             += factor * 0.2
        self.vitals["urine_output"]     += factor * 0.8

    def _stay_critical(self):
        """Patient remains in critical state."""
        pass  # noise handles variation

    def _fluctuate(self):
        """Patient vitals go up and down."""
        wave = np.sin(self.cycle * 0.5) * 8
        self.vitals["heart_rate"]       += wave
        self.vitals["systolic_bp"]      -= wave * 0.5
        self.vitals["spo2"]             -= abs(wave) * 0.2
        self.vitals["respiratory_rate"] += wave * 0.3

    def _stay_stable(self):
        """Patient remains stable."""
        pass  # noise handles variation

    def _add_noise(self):
        """Add realistic measurement noise."""
        noise = {
            "heart_rate":       random.uniform(-3, 3),
            "systolic_bp":      random.uniform(-4, 4),
            "diastolic_bp":     random.uniform(-3, 3),
            "temperature":      random.uniform(-0.1, 0.1),
            "respiratory_rate": random.uniform(-1, 1),
            "spo2":             random.uniform(-0.5, 0.5),
            "urine_output":     random.uniform(-3, 3),
            "glucose":          random.uniform(-0.2, 0.2),
        }
        for key, val in noise.items():
            self.vitals[key] = round(self.vitals[key] + val, 1)

    def _clip_vitals(self):
        """Keep vitals in physiologically possible ranges."""
        clips = {
            "heart_rate":       (20,  200),
            "systolic_bp":      (50,  220),
            "diastolic_bp":     (20,  140),
            "temperature":      (34,  42),
            "respiratory_rate": (4,   45),
            "spo2":             (60,  100),
            "urine_output":     (0,   150),
            "glucose":          (1.5, 25),
            "pain_score":       (0,   10),
            "consciousness":    (0,   3),
        }
        for key, (low, high) in clips.items():
            self.vitals[key] = max(low, min(high, self.vitals[key]))


# ─────────────────────────────────────────
# SEND VITALS TO API
# ─────────────────────────────────────────
def send_vitals(profile: dict, vitals: dict) -> dict:
    """Send patient vitals to our FastAPI and get AI analysis."""

    payload = {
        "patient_id":       profile["patient_id"],
        "age":              profile["age"],
        "gender":           profile["gender"],
        "ward":             profile["ward"],
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
        response = requests.post(
            API_URL,
            json=payload,
            timeout=10
        )
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"Status {response.status_code}"}
    except requests.exceptions.ConnectionError:
        return {"error": "API not running"}
    except Exception as e:
        return {"error": str(e)}


# ─────────────────────────────────────────
# DISPLAY RESULT
# ─────────────────────────────────────────
def display_result(profile: dict, vitals: dict, result: dict):
    """Print formatted result to terminal."""

    now = datetime.now().strftime("%H:%M:%S")

    if "error" in result:
        print(f"  [{now}] ❌ {profile['patient_id']} — {result['error']}")
        return

    report = result.get("report", {})
    pred   = report.get("prediction", {})

    risk_icons = {0: "🟢", 1: "🟡", 2: "🔴"}
    risk_level = pred.get("risk_level", 0)
    risk_icon  = risk_icons.get(risk_level, "⚪")

    sepsis = "🚨 SEPSIS!" if report.get(
        "warnings", {}
    ).get("sepsis_alert") else ""

    print(
        f"  [{now}] {risk_icon} {profile['patient_id']:12s} "
        f"({profile['scenario']:12s}) | "
        f"HR:{vitals['heart_rate']:5.1f} "
        f"BP:{vitals['systolic_bp']:5.1f}/{vitals['diastolic_bp']:4.1f} "
        f"SpO2:{vitals['spo2']:4.1f}% "
        f"Temp:{vitals['temperature']:4.1f}°C "
        f"RR:{vitals['respiratory_rate']:4.1f} "
        f"| NEWS2:{pred.get('news2_score', '?'):2} "
        f"Risk:{pred.get('risk_label', '?'):6s} "
        f"Conf:{pred.get('confidence', 0):5.1f}% "
        f"{sepsis}"
    )


# ─────────────────────────────────────────
# MAIN SIMULATION LOOP
# ─────────────────────────────────────────
def main():
    """Main simulation loop."""

    # Create simulators for each patient
    simulators = [
        PatientSimulator(profile)
        for profile in PATIENT_PROFILES
    ]

    print(f"\n  Starting simulation with {len(simulators)} patients...")
    print(f"  {'Time':8s} {'Patient':12s} {'Scenario':12s} | "
          f"{'Vitals':50s} | {'AI Assessment'}")
    print("  " + "─" * 110)

    cycle = 0

    while True:
        cycle += 1
        print(f"\n  ── Cycle {cycle} "
              f"({datetime.now().strftime('%H:%M:%S')}) ──")

        for simulator in simulators:
            # Update vitals
            vitals = simulator.update_vitals()

            # Send to API
            result = send_vitals(simulator.profile, vitals)

            # Display result
            display_result(simulator.profile, vitals, result)

            # Small delay between patients
            time.sleep(2)

        print(f"\n  ⏳ Next update in {INTERVAL_SECS} seconds... "
              f"(Ctrl+C to stop)")
        time.sleep(INTERVAL_SECS)


# ─────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n  ✅ Simulation stopped.")
        print("  Check your dashboard for the recorded data!")
        print("  All vitals have been saved to the database.\n")