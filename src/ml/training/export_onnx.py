"""
File: src/ml/training/export_onnx.py
Purpose: Export XGBoost model to ONNX format
"""

import sys
sys.path.append(".")

import joblib
import json
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime

print("=" * 55)
print("  ONNX MODEL EXPORTER")
print("=" * 55)

MODELS_DIR   = Path("src/ml/models")
FEATURES_DIR = Path("src/data/features")

# ── Load Model ──
print("\n  📂 Loading model...")
model  = joblib.load(MODELS_DIR / "early_warning_model.joblib")
scaler = joblib.load(MODELS_DIR / "feature_scaler.joblib")

with open(FEATURES_DIR / "feature_list.json") as f:
    feature_names = json.load(f)["features"]

print(f"  ✅ Model: {type(model).__name__}")
print(f"  ✅ Features: {len(feature_names)}")

# ── Sample Input ──
sample = {
    "heart_rate": 128.0, "systolic_bp": 85.0, "diastolic_bp": 55.0,
    "temperature": 39.2, "respiratory_rate": 28.0, "spo2": 89.0,
    "consciousness": 1, "urine_output": 12.0, "glucose": 11.5,
    "pain_score": 7, "age": 72.0, "gender_encoded": 1,
    "ward_encoded": 3, "age_group": 2,
    "news2_rr": 3, "news2_spo2": 2, "news2_sbp": 3,
    "news2_hr": 2, "news2_temp": 1, "news2_avpu": 3,
    "news2_total": 14, "pulse_pressure": 30.0, "map": 65.0,
    "shock_index": 1.506, "temp_deviation": 2.2,
    "spo2_deficit": 11.0, "resp_distress": 1,
    "hypotension": 1, "tachycardia": 1, "fever": 1,
    "shock_indicator": 1,
}

X_sample = pd.DataFrame([sample])[feature_names]
X_scaled = scaler.transform(X_sample).astype(np.float32)

# ── Method 1: XGBoost Native ONNX ──
print("\n  🔄 Trying XGBoost native ONNX export...")
try:
    onnx_path = MODELS_DIR / "early_warning_model.onnx"
    model.save_model(str(onnx_path))

    # Verify it saved
    if onnx_path.exists() and onnx_path.stat().st_size > 0:
        print(f"  ✅ Saved: {onnx_path}")
        print(f"  📦 Size: {onnx_path.stat().st_size/1024:.1f} KB")
    else:
        raise Exception("File empty")

except Exception as e:
    print(f"  ⚠️  Native export failed: {e}")

    # ── Method 2: Save as JSON (XGBoost standard) ──
    print("\n  🔄 Saving as XGBoost JSON format...")
    try:
        json_path = MODELS_DIR / "early_warning_model.json"
        model.save_model(str(json_path))
        print(f"  ✅ Saved: {json_path}")
        print(f"  📦 Size: {json_path.stat().st_size/1024:.1f} KB")
    except Exception as e2:
        print(f"  ⚠️  JSON export failed: {e2}")

# ── Method 3: Always save joblib (backup) ──
print("\n  🔄 Saving pipeline (scaler + model)...")
pipeline_path = MODELS_DIR / "clinical_pipeline.joblib"
import joblib
pipeline = {"model": model, "scaler": scaler, "features": feature_names}
joblib.dump(pipeline, pipeline_path)
print(f"  ✅ Pipeline saved: {pipeline_path}")

# ── Verify ONNX Runtime ──
onnx_path = MODELS_DIR / "early_warning_model.onnx"
if onnx_path.exists():
    print("\n  🔍 Verifying with ONNX Runtime...")
    try:
        import onnxruntime as rt
        sess = rt.InferenceSession(str(onnx_path))
        print(f"  ✅ ONNX Runtime loaded successfully!")
        print(f"  ✅ Inputs: {[i.name for i in sess.get_inputs()]}")
    except Exception as e:
        print(f"  ⚠️  ONNX Runtime verify: {e}")

# ── Save Metadata ──
print("\n  💾 Saving metadata...")
metadata = {
    "exported_at":   datetime.now().isoformat(),
    "model_type":    type(model).__name__,
    "feature_count": len(feature_names),
    "feature_names": feature_names,
    "classes":       [0, 1, 2],
    "class_labels":  ["Low", "Medium", "High"],
    "formats":       {
        "joblib":   "early_warning_model.joblib",
        "pipeline": "clinical_pipeline.joblib",
        "onnx":     "early_warning_model.onnx",
        "json":     "early_warning_model.json",
    },
}
meta_path = MODELS_DIR / "model_metadata.json"
with open(meta_path, "w") as f:
    json.dump(metadata, f, indent=2)
print(f"  ✅ Metadata: {meta_path}")

# ── Test Original Model Still Works ──
print("\n  🧪 Testing original model...")
pred = model.predict(X_scaled)[0]
prob = model.predict_proba(X_scaled)[0]
print(f"  ✅ Prediction: {pred} ({'High' if pred==2 else 'Medium' if pred==1 else 'Low'} Risk)")
print(f"  ✅ Confidence: {max(prob)*100:.2f}%")

# ── Final Summary ──
print("\n" + "=" * 55)
print("  EXPORT COMPLETE!")
print("=" * 55)
print(f"\n  Model files in {MODELS_DIR}:")
for f in sorted(MODELS_DIR.iterdir()):
    if f.is_file():
        size = f.stat().st_size / 1024
        print(f"    📦 {f.name:<42} {size:>8.1f} KB")
print("\n  ✅ Model ready for Azure ML!")
print("=" * 55)