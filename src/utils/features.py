"""
Shared feature engineering utility — single source of truth for ML feature building.
Eliminates duplication across prediction.py and analysis.py.
"""

import json
import logging
import pandas as pd
from pathlib import Path
from functools import lru_cache

logger = logging.getLogger(__name__)

_FEATURE_NAMES = None


@lru_cache(maxsize=1)
def get_feature_names() -> list:
    path = Path("src/data/features/feature_list.json")
    with open(path) as f:
        return json.load(f)["features"]


# ── NEWS2 component scorers ──

def _rr_score(rr: float) -> int:
    if rr <= 8:  return 3
    if rr <= 11: return 1
    if rr <= 20: return 0
    if rr <= 24: return 2
    return 3


def _spo2_score(s: float) -> int:
    if s <= 83: return 3
    if s <= 85: return 2
    if s <= 87: return 1
    if s <= 92: return 0
    if s <= 94: return 1
    if s <= 96: return 2
    return 3


def _sbp_score(sbp: float) -> int:
    if sbp <= 90:  return 3
    if sbp <= 100: return 2
    if sbp <= 110: return 1
    if sbp <= 219: return 0
    return 3


def _hr_score(hr: float) -> int:
    if hr <= 40:  return 3
    if hr <= 50:  return 1
    if hr <= 90:  return 0
    if hr <= 110: return 1
    if hr <= 130: return 2
    return 3


def _temp_score(t: float) -> int:
    if t <= 35.0: return 3
    if t <= 36.0: return 1
    if t <= 38.0: return 0
    if t <= 39.0: return 1
    return 2


def build_features(vitals: dict) -> pd.DataFrame:
    """
    Build ML feature vector from a vitals dict.
    Required keys: age, gender, ward, heart_rate, systolic_bp, diastolic_bp,
    temperature, respiratory_rate, spo2, consciousness, urine_output,
    glucose, pain_score
    """
    age              = float(vitals.get("age", 50))
    gender           = str(vitals.get("gender", "M"))
    ward             = str(vitals.get("ward", "General"))
    heart_rate       = float(vitals.get("heart_rate", 80))
    systolic_bp      = float(vitals.get("systolic_bp", 120))
    diastolic_bp     = float(vitals.get("diastolic_bp", 80))
    temperature      = float(vitals.get("temperature", 37.0))
    respiratory_rate = float(vitals.get("respiratory_rate", 16))
    spo2             = float(vitals.get("spo2", 98))
    consciousness    = int(vitals.get("consciousness", 0))
    urine_output     = float(vitals.get("urine_output", 50))
    glucose          = float(vitals.get("glucose", 5.5))
    pain_score       = int(vitals.get("pain_score", 0))

    gender_encoded = 1 if gender == "M" else 0
    ward_map       = {"ICU": 3, "HDU": 2, "Emergency": 2, "General": 1}
    ward_encoded   = ward_map.get(ward, 1)

    if age <= 40:   age_group = 0
    elif age <= 60: age_group = 1
    elif age <= 75: age_group = 2
    else:           age_group = 3

    n_rr   = _rr_score(respiratory_rate)
    n_spo2 = _spo2_score(spo2)
    n_sbp  = _sbp_score(systolic_bp)
    n_hr   = _hr_score(heart_rate)
    n_temp = _temp_score(temperature)
    n_avpu = 3 if consciousness > 0 else 0
    news2  = n_rr + n_spo2 + n_sbp + n_hr + n_temp + n_avpu

    pulse_pressure = systolic_bp - diastolic_bp
    map_val        = round(diastolic_bp + (pulse_pressure / 3), 1)
    shock_index    = round(heart_rate / max(systolic_bp, 1), 3)
    temp_deviation = round(abs(temperature - 37.0), 2)
    spo2_deficit   = round(100 - spo2, 1)
    resp_distress  = 1 if (respiratory_rate > 25 or spo2 < 92) else 0
    hypotension    = 1 if systolic_bp < 90 else 0
    tachycardia    = 1 if heart_rate > 100 else 0
    fever          = 1 if temperature > 38.3 else 0
    shock_ind      = 1 if (shock_index > 1.0 and hypotension == 1) else 0

    row = {
        "heart_rate": heart_rate, "systolic_bp": systolic_bp,
        "diastolic_bp": diastolic_bp, "temperature": temperature,
        "respiratory_rate": respiratory_rate, "spo2": spo2,
        "consciousness": consciousness, "urine_output": urine_output,
        "glucose": glucose, "pain_score": pain_score,
        "age": age, "gender_encoded": gender_encoded,
        "ward_encoded": ward_encoded, "age_group": age_group,
        "news2_rr": n_rr, "news2_spo2": n_spo2, "news2_sbp": n_sbp,
        "news2_hr": n_hr, "news2_temp": n_temp, "news2_avpu": n_avpu,
        "news2_total": news2, "pulse_pressure": pulse_pressure,
        "map": map_val, "shock_index": shock_index,
        "temp_deviation": temp_deviation, "spo2_deficit": spo2_deficit,
        "resp_distress": resp_distress, "hypotension": hypotension,
        "tachycardia": tachycardia, "fever": fever,
        "shock_indicator": shock_ind,
    }

    return pd.DataFrame([row])[get_feature_names()]


def get_news2_score(vitals: dict) -> int:
    return int(build_features(vitals)["news2_total"].iloc[0])


def get_news2_category(score: int) -> str:
    if score <= 4:  return "Low"
    if score <= 6:  return "Medium"
    return "High"


def get_clinical_concerns(vitals: dict) -> list:
    concerns = []
    hr   = float(vitals.get("heart_rate", 80))
    sbp  = float(vitals.get("systolic_bp", 120))
    spo2 = float(vitals.get("spo2", 98))
    rr   = float(vitals.get("respiratory_rate", 16))
    temp = float(vitals.get("temperature", 37.0))
    avpu = int(vitals.get("consciousness", 0))
    gluc = float(vitals.get("glucose", 5.5))

    if hr > 100:    concerns.append(f"Tachycardia (HR: {hr})")
    if sbp < 90:    concerns.append(f"Hypotension (SBP: {sbp})")
    if spo2 < 92:   concerns.append(f"Low SpO2 ({spo2}%)")
    if rr > 25:     concerns.append(f"High RR ({rr})")
    if temp > 38.3: concerns.append(f"Fever ({temp}°C)")
    if avpu > 0:    concerns.append("Altered consciousness")
    if gluc > 10:   concerns.append(f"Hyperglycaemia ({gluc} mmol/L)")
    return concerns or ["Vitals within acceptable range"]
