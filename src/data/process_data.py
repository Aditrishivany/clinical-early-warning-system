"""
File: src/data/process_data.py
Purpose: Clean raw data + engineer clinical features
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json

print("=" * 55)
print("  CLINICAL DATA PROCESSOR - STARTING")
print("=" * 55)

# ─────────────────────────────────────────
# PATHS - Using simple relative paths
# ─────────────────────────────────────────
RAW_PATH       = Path("src/data/raw/patient_vitals_raw.csv")
PROCESSED_DIR  = Path("src/data/processed")
FEATURES_DIR   = Path("src/data/features")

# Create folders if they don't exist
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
FEATURES_DIR.mkdir(parents=True, exist_ok=True)

print(f"\n  Checking raw file: {RAW_PATH}")
print(f"  File exists: {RAW_PATH.exists()}")

# ─────────────────────────────────────────
# LOAD
# ─────────────────────────────────────────
df = pd.read_csv(RAW_PATH, parse_dates=["timestamp"])
print(f"  ✅ Loaded {len(df):,} records")

# ─────────────────────────────────────────
# CLEAN
# ─────────────────────────────────────────
print("\n  🧹 Cleaning data...")

df = df.drop_duplicates()

vitals = [
    "heart_rate", "systolic_bp", "diastolic_bp",
    "temperature", "respiratory_rate", "spo2",
    "urine_output", "glucose"
]
for col in vitals:
    if df[col].isnull().any():
        df[col] = df[col].fillna(df[col].median())

df["heart_rate"]       = df["heart_rate"].clip(20, 250)
df["systolic_bp"]      = df["systolic_bp"].clip(50, 250)
df["diastolic_bp"]     = df["diastolic_bp"].clip(20, 150)
df["temperature"]      = df["temperature"].clip(30, 45)
df["respiratory_rate"] = df["respiratory_rate"].clip(4, 60)
df["spo2"]             = df["spo2"].clip(50, 100)
df["glucose"]          = df["glucose"].clip(1.0, 30.0)

df["gender_encoded"] = (df["gender"] == "M").astype(int)

ward_map = {"ICU": 3, "HDU": 2, "Emergency": 2, "General": 1}
df["ward_encoded"] = df["ward"].map(ward_map).fillna(1).astype(int)

print(f"  ✅ Cleaning done: {len(df):,} records")

# ─────────────────────────────────────────
# NEWS2 SCORE
# ─────────────────────────────────────────
print("\n  🏥 Calculating NEWS2 scores...")

def rr_score(rr):
    if rr <= 8:   return 3
    if rr <= 11:  return 1
    if rr <= 20:  return 0
    if rr <= 24:  return 2
    return 3

def spo2_score(s):
    if s <= 83:  return 3
    if s <= 85:  return 2
    if s <= 87:  return 1
    if s <= 92:  return 0
    if s <= 94:  return 1
    if s <= 96:  return 2
    return 3

def sbp_score(sbp):
    if sbp <= 90:   return 3
    if sbp <= 100:  return 2
    if sbp <= 110:  return 1
    if sbp <= 219:  return 0
    return 3

def hr_score(hr):
    if hr <= 40:   return 3
    if hr <= 50:   return 1
    if hr <= 90:   return 0
    if hr <= 110:  return 1
    if hr <= 130:  return 2
    return 3

def temp_score(temp):
    if temp <= 35.0:  return 3
    if temp <= 36.0:  return 1
    if temp <= 38.0:  return 0
    if temp <= 39.0:  return 1
    return 2

df["news2_rr"]    = df["respiratory_rate"].apply(rr_score)
df["news2_spo2"]  = df["spo2"].apply(spo2_score)
df["news2_sbp"]   = df["systolic_bp"].apply(sbp_score)
df["news2_hr"]    = df["heart_rate"].apply(hr_score)
df["news2_temp"]  = df["temperature"].apply(temp_score)
df["news2_avpu"]  = df["consciousness"].apply(lambda x: 3 if x > 0 else 0)

df["news2_total"] = (
    df["news2_rr"] + df["news2_spo2"] + df["news2_sbp"] +
    df["news2_hr"] + df["news2_temp"] + df["news2_avpu"]
)

print(f"  ✅ NEWS2 done. Average score: {df['news2_total'].mean():.2f}")

# ─────────────────────────────────────────
# FEATURE ENGINEERING
# ─────────────────────────────────────────
print("\n  ⚙️  Engineering features...")

df["pulse_pressure"] = df["systolic_bp"] - df["diastolic_bp"]
df["map"]            = (df["diastolic_bp"] + (df["pulse_pressure"] / 3)).round(1)
df["shock_index"]    = (df["heart_rate"] / df["systolic_bp"]).round(3)
df["temp_deviation"] = (df["temperature"] - 37.0).abs().round(2)
df["spo2_deficit"]   = (100 - df["spo2"]).round(1)
df["resp_distress"]  = ((df["respiratory_rate"] > 25) | (df["spo2"] < 92)).astype(int)
df["hypotension"]    = (df["systolic_bp"] < 90).astype(int)
df["tachycardia"]    = (df["heart_rate"] > 100).astype(int)
df["fever"]          = (df["temperature"] > 38.3).astype(int)
df["shock_indicator"]= ((df["shock_index"] > 1.0) & (df["hypotension"] == 1)).astype(int)
df["age_group"]      = pd.cut(
    df["age"],
    bins=[0, 40, 60, 75, 100],
    labels=[0, 1, 2, 3]
).astype(int)

print(f"  ✅ Features engineered")

# ─────────────────────────────────────────
# SELECT FEATURES
# ─────────────────────────────────────────
FEATURE_COLUMNS = [
    "heart_rate", "systolic_bp", "diastolic_bp",
    "temperature", "respiratory_rate", "spo2",
    "consciousness", "urine_output", "glucose", "pain_score",
    "age", "gender_encoded", "ward_encoded", "age_group",
    "news2_rr", "news2_spo2", "news2_sbp",
    "news2_hr", "news2_temp", "news2_avpu", "news2_total",
    "pulse_pressure", "map", "shock_index",
    "temp_deviation", "spo2_deficit",
    "resp_distress", "hypotension", "tachycardia",
    "fever", "shock_indicator",
]

X = df[FEATURE_COLUMNS]
y = df["risk_level"]

# ─────────────────────────────────────────
# SAVE FILES
# ─────────────────────────────────────────
print("\n  💾 Saving files...")

p1 = PROCESSED_DIR / "patient_vitals_processed.csv"
p2 = FEATURES_DIR  / "X_features.csv"
p3 = FEATURES_DIR  / "y_labels.csv"
p4 = FEATURES_DIR  / "feature_list.json"

df.to_csv(p1, index=False)
print(f"  📁 Saved: {p1}")

X.to_csv(p2, index=False)
print(f"  📁 Saved: {p2}")

y.to_csv(p3, index=False)
print(f"  📁 Saved: {p3}")

with open(p4, "w") as f:
    json.dump({"features": FEATURE_COLUMNS, "target": "risk_level"}, f, indent=2)
print(f"  📁 Saved: {p4}")

# ─────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────
print("\n" + "=" * 55)
print("  FINAL SUMMARY")
print("=" * 55)
print(f"  Total Records  : {len(df):,}")
print(f"  Total Features : {len(FEATURE_COLUMNS)}")
print(f"\n  Risk Distribution:")
for level, name in [(0,"Low"),(1,"Medium"),(2,"High")]:
    count = (y == level).sum()
    pct   = count / len(y) * 100
    print(f"    {name:8s}: {count:,} ({pct:.1f}%)")

print("\n  ✅ ALL FILES SAVED SUCCESSFULLY!")
print("  🎉 Processing complete!")
print("=" * 55)