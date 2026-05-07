"""
CLINICAL EARLY WARNING SYSTEM
===============================
File: src/data/generate_data.py
Purpose: Generate synthetic patient vital signs data for training
Author: Clinical AI Team
"""

import numpy as np
import pandas as pd
from pathlib import Path
import json
from datetime import datetime, timedelta
import random

# ─────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────
RANDOM_SEED = 42
NUM_PATIENTS = 500          # number of unique patients
RECORDS_PER_PATIENT = 20    # vitals recorded per patient
TOTAL_RECORDS = NUM_PATIENTS * RECORDS_PER_PATIENT  # 10,000 total

np.random.seed(RANDOM_SEED)
random.seed(RANDOM_SEED)

# ─────────────────────────────────────────
# OUTPUT PATHS
# ─────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent
RAW_DATA_DIR = BASE_DIR / "src" / "data" / "raw"
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)


# ─────────────────────────────────────────
# HELPER: Generate vitals for ONE risk level
# ─────────────────────────────────────────
def generate_vitals_for_risk(risk_level: int, n: int) -> dict:
    """
    Generate realistic vital signs based on risk level.
    
    risk_level:
        0 = Low Risk    (stable patient)
        1 = Medium Risk (deteriorating)
        2 = High Risk   (critical)
    """

    if risk_level == 0:
        # ── LOW RISK: Normal healthy ranges ──
        heart_rate        = np.random.normal(75, 8, n).clip(60, 100)
        systolic_bp       = np.random.normal(120, 10, n).clip(100, 140)
        diastolic_bp      = np.random.normal(80, 8, n).clip(60, 90)
        temperature       = np.random.normal(36.8, 0.3, n).clip(36.1, 37.5)
        respiratory_rate  = np.random.normal(16, 2, n).clip(12, 20)
        spo2              = np.random.normal(98, 1, n).clip(96, 100)
        consciousness     = np.random.choice([0], n)          # Alert
        urine_output      = np.random.normal(50, 10, n).clip(30, 80)
        glucose           = np.random.normal(5.5, 0.8, n).clip(4.0, 7.0)
        pain_score        = np.random.choice([0, 1, 2], n, p=[0.6, 0.3, 0.1])

    elif risk_level == 1:
        # ── MEDIUM RISK: Mildly abnormal ──
        heart_rate        = np.random.normal(100, 15, n).clip(50, 130)
        systolic_bp       = np.random.normal(100, 15, n).clip(80, 160)
        diastolic_bp      = np.random.normal(65, 10, n).clip(50, 95)
        temperature       = np.random.normal(37.8, 0.5, n).clip(36.5, 39.5)
        respiratory_rate  = np.random.normal(22, 4, n).clip(18, 28)
        spo2              = np.random.normal(94, 2, n).clip(90, 96)
        consciousness     = np.random.choice([0, 1], n, p=[0.6, 0.4])   # Alert/Voice
        urine_output      = np.random.normal(30, 10, n).clip(15, 50)
        glucose           = np.random.normal(8.0, 1.5, n).clip(6.0, 12.0)
        pain_score        = np.random.choice([2, 3, 4, 5], n, p=[0.2, 0.3, 0.3, 0.2])

    else:
        # ── HIGH RISK: Critical / dangerous ──
        heart_rate        = np.random.normal(130, 20, n).clip(40, 180)
        systolic_bp       = np.random.normal(80, 20, n).clip(60, 110)
        diastolic_bp      = np.random.normal(50, 15, n).clip(30, 70)
        temperature       = np.random.normal(39.5, 1.0, n).clip(34.0, 41.5)
        respiratory_rate  = np.random.normal(30, 5, n).clip(8, 40)
        spo2              = np.random.normal(88, 4, n).clip(70, 92)
        consciousness     = np.random.choice([1, 2, 3], n, p=[0.3, 0.4, 0.3])  # V/P/U
        urine_output      = np.random.normal(10, 8, n).clip(0, 25)
        glucose           = np.random.normal(12.0, 3.0, n).clip(2.5, 22.0)
        pain_score        = np.random.choice([5, 6, 7, 8, 9, 10], n)

    return {
        "heart_rate":       np.round(heart_rate, 1),
        "systolic_bp":      np.round(systolic_bp, 1),
        "diastolic_bp":     np.round(diastolic_bp, 1),
        "temperature":      np.round(temperature, 1),
        "respiratory_rate": np.round(respiratory_rate, 1),
        "spo2":             np.round(spo2, 1),
        "consciousness":    consciousness.astype(int),
        "urine_output":     np.round(urine_output, 1),
        "glucose":          np.round(glucose, 2),
        "pain_score":       pain_score.astype(int),
    }


# ─────────────────────────────────────────
# MAIN: Build the full dataset
# ─────────────────────────────────────────
def generate_dataset() -> pd.DataFrame:
    """Generate full patient dataset with all risk levels."""

    print("=" * 55)
    print("  CLINICAL EARLY WARNING — DATA GENERATOR")
    print("=" * 55)

    all_records = []
    patient_id  = 1000

    # Distribution: 50% Low, 30% Medium, 20% High risk
    risk_distribution = [
        (0, "Low",    int(NUM_PATIENTS * 0.50)),
        (1, "Medium", int(NUM_PATIENTS * 0.30)),
        (2, "High",   int(NUM_PATIENTS * 0.20)),
    ]

    for risk_level, risk_name, num_pts in risk_distribution:
        print(f"\n  Generating {risk_name} Risk patients ({num_pts} patients)...")

        total_n = num_pts * RECORDS_PER_PATIENT
        vitals  = generate_vitals_for_risk(risk_level, total_n)

        for i in range(num_pts):
            patient_id += 1
            age        = random.randint(18, 95)
            gender     = random.choice(["M", "F"])
            ward       = random.choice(["ICU", "HDU", "General", "Emergency"])
            base_time  = datetime(2024, 1, 1) + timedelta(days=random.randint(0, 365))

            for j in range(RECORDS_PER_PATIENT):
                idx = i * RECORDS_PER_PATIENT + j

                # Add small noise to simulate time progression
                time_offset = j * 4   # vitals every 4 hours

                record = {
                    # Patient identifiers
                    "patient_id":       f"PT{patient_id}",
                    "age":              age,
                    "gender":           gender,
                    "ward":             ward,
                    "timestamp":        base_time + timedelta(hours=time_offset),

                    # Vital signs
                    "heart_rate":       vitals["heart_rate"][idx],
                    "systolic_bp":      vitals["systolic_bp"][idx],
                    "diastolic_bp":     vitals["diastolic_bp"][idx],
                    "temperature":      vitals["temperature"][idx],
                    "respiratory_rate": vitals["respiratory_rate"][idx],
                    "spo2":             vitals["spo2"][idx],
                    "consciousness":    vitals["consciousness"][idx],
                    "urine_output":     vitals["urine_output"][idx],
                    "glucose":          vitals["glucose"][idx],
                    "pain_score":       vitals["pain_score"][idx],

                    # Target label
                    "risk_level":       risk_level,
                    "risk_label":       risk_name,
                }
                all_records.append(record)

    df = pd.DataFrame(all_records)
    df = df.sample(frac=1, random_state=RANDOM_SEED).reset_index(drop=True)

    print(f"\n  ✅ Total records generated: {len(df):,}")
    return df


# ─────────────────────────────────────────
# SAVE + SUMMARY
# ─────────────────────────────────────────
def save_and_summarize(df: pd.DataFrame):
    """Save dataset and print summary statistics."""

    # Save CSV
    csv_path = RAW_DATA_DIR / "patient_vitals_raw.csv"
    df.to_csv(csv_path, index=False)
    print(f"\n  📁 Saved: {csv_path}")

    # Save metadata
    metadata = {
        "generated_at":   datetime.now().isoformat(),
        "total_records":  len(df),
        "total_patients": df["patient_id"].nunique(),
        "features":       list(df.columns),
        "risk_distribution": df["risk_label"].value_counts().to_dict(),
        "date_range": {
            "start": str(df["timestamp"].min()),
            "end":   str(df["timestamp"].max()),
        }
    }

    meta_path = RAW_DATA_DIR / "metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"  📁 Saved: {meta_path}")

    # Print summary
    print("\n" + "=" * 55)
    print("  DATASET SUMMARY")
    print("=" * 55)
    print(f"  Total Records  : {len(df):,}")
    print(f"  Total Patients : {df['patient_id'].nunique()}")
    print(f"\n  Risk Distribution:")
    for label, count in df["risk_label"].value_counts().items():
        pct = count / len(df) * 100
        print(f"    {label:8s}: {count:,} records ({pct:.1f}%)")

    print(f"\n  Vital Signs Summary:")
    vitals_cols = [
        "heart_rate", "systolic_bp", "temperature",
        "respiratory_rate", "spo2"
    ]
    print(df[vitals_cols].describe().round(2).to_string())
    print("\n" + "=" * 55)


# ─────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────
if __name__ == "__main__":
    df = generate_dataset()
    save_and_summarize(df)
    print("\n  🎉 Data generation complete!")
    print("  Next step: Run the data processor.\n")