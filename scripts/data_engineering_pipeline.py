"""
Create the Raw -> Staged -> Curated data engineering deliverables.

This script mirrors the Azure Data Factory/Databricks flow locally:
1. Raw: source vitals as received from monitors.
2. Staged: typed, deduplicated, clipped clinical values.
3. Curated: analytics/model-ready records with NEWS2 and engineered features.

Parquet is written when pyarrow/fastparquet is available; CSV copies are always
written so the pipeline remains executable on a fresh student machine.
"""

from pathlib import Path
import json
import sys

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parents[1]))

from src.utils.features import build_features, get_news2_category, get_news2_score


RAW_SOURCE = Path("src/data/raw/patient_vitals_raw.csv")
LAKE_ROOT = Path("src/data/lakehouse")
RAW_DIR = LAKE_ROOT / "raw" / "vitals"
STAGED_DIR = LAKE_ROOT / "staged" / "vitals"
CURATED_DIR = LAKE_ROOT / "curated" / "patient_risk"


def write_dataset(df: pd.DataFrame, target_dir: Path, name: str) -> dict:
    target_dir.mkdir(parents=True, exist_ok=True)
    csv_path = target_dir / f"{name}.csv"
    parquet_path = target_dir / f"{name}.parquet"

    df.to_csv(csv_path, index=False)
    result = {"csv": str(csv_path), "parquet": None}

    try:
        df.to_parquet(parquet_path, index=False)
        result["parquet"] = str(parquet_path)
    except Exception as exc:
        result["parquet_error"] = f"{type(exc).__name__}: {exc}"

    return result


def build_curated(df: pd.DataFrame) -> pd.DataFrame:
    feature_rows = []
    for _, row in df.iterrows():
        payload = row.to_dict()
        news2 = get_news2_score(payload)
        features = build_features(payload).iloc[0].to_dict()
        feature_rows.append({
            **payload,
            **features,
            "news2_score": news2,
            "news2_category": get_news2_category(news2),
            "is_anomaly": int(
                news2 >= 7 or
                payload.get("spo2", 100) < 90 or
                payload.get("systolic_bp", 120) < 90
            ),
        })
    return pd.DataFrame(feature_rows)


def main():
    df_raw = pd.read_csv(RAW_SOURCE, parse_dates=["timestamp"])

    raw_result = write_dataset(df_raw, RAW_DIR, "patient_vitals_raw")

    staged = df_raw.drop_duplicates().copy()
    numeric_cols = [
        "age", "heart_rate", "systolic_bp", "diastolic_bp", "temperature",
        "respiratory_rate", "spo2", "consciousness", "urine_output",
        "glucose", "pain_score",
    ]
    for col in numeric_cols:
        staged[col] = pd.to_numeric(staged[col], errors="coerce")
        staged[col] = staged[col].fillna(staged[col].median())

    staged["heart_rate"] = staged["heart_rate"].clip(20, 250)
    staged["systolic_bp"] = staged["systolic_bp"].clip(50, 250)
    staged["diastolic_bp"] = staged["diastolic_bp"].clip(20, 150)
    staged["temperature"] = staged["temperature"].clip(30, 45)
    staged["respiratory_rate"] = staged["respiratory_rate"].clip(4, 60)
    staged["spo2"] = staged["spo2"].clip(50, 100)
    staged["glucose"] = staged["glucose"].clip(1, 30)
    staged_result = write_dataset(staged, STAGED_DIR, "patient_vitals_staged")

    curated = build_curated(staged)
    curated_result = write_dataset(curated, CURATED_DIR, "patient_risk_curated")

    manifest = {
        "pipeline": "clinical_early_warning_raw_staged_curated",
        "raw_records": int(len(df_raw)),
        "staged_records": int(len(staged)),
        "curated_records": int(len(curated)),
        "outputs": {
            "raw": raw_result,
            "staged": staged_result,
            "curated": curated_result,
        },
    }
    manifest_path = LAKE_ROOT / "pipeline_manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
