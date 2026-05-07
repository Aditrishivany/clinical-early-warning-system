"""
File: src/ml/training/train_model.py
Purpose: Train XGBoost early warning model
"""

import pandas as pd
import numpy as np
import json
import joblib
from pathlib import Path
from datetime import datetime

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, accuracy_score
)
from xgboost import XGBClassifier

print("=" * 55)
print("  CLINICAL ML MODEL TRAINER - STARTING")
print("=" * 55)

# ─────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────
FEATURES_DIR = Path("src/data/features")
MODELS_DIR   = Path("src/ml/models")
EVAL_DIR     = Path("src/ml/evaluation")

MODELS_DIR.mkdir(parents=True, exist_ok=True)
EVAL_DIR.mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────
# STEP 1: Load Data
# ─────────────────────────────────────────
print("\n  📂 Loading feature data...")

X = pd.read_csv(FEATURES_DIR / "X_features.csv")
y = pd.read_csv(FEATURES_DIR / "y_labels.csv").squeeze()

with open(FEATURES_DIR / "feature_list.json") as f:
    feature_info = json.load(f)
    FEATURE_NAMES = feature_info["features"]

print(f"  ✅ Features loaded : {X.shape[0]:,} records x {X.shape[1]} features")
print(f"  ✅ Labels loaded   : {y.value_counts().to_dict()}")

# ─────────────────────────────────────────
# STEP 2: Train/Test Split
# ─────────────────────────────────────────
print("\n  ✂️  Splitting data...")

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y        # keeps risk distribution equal in both splits
)

print(f"  ✅ Training set : {len(X_train):,} records")
print(f"  ✅ Test set     : {len(X_test):,} records")

# ─────────────────────────────────────────
# STEP 3: Scale Features
# ─────────────────────────────────────────
print("\n  ⚖️  Scaling features...")

scaler  = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

print("  ✅ Features scaled")

# ─────────────────────────────────────────
# STEP 4: Train XGBoost Model
# ─────────────────────────────────────────
print("\n  🧠 Training XGBoost model...")
print("  ⏳ Please wait — this takes 30-60 seconds...")

model = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    use_label_encoder=False,
    eval_metric="mlogloss",
    random_state=42,
    n_jobs=-1           # use all CPU cores
)

model.fit(
    X_train_scaled, y_train,
    eval_set=[(X_test_scaled, y_test)],
    verbose=False
)

print("  ✅ Model training complete!")

# ─────────────────────────────────────────
# STEP 5: Evaluate Model
# ─────────────────────────────────────────
print("\n  📊 Evaluating model...")

y_pred      = model.predict(X_test_scaled)
y_pred_prob = model.predict_proba(X_test_scaled)

accuracy = accuracy_score(y_test, y_pred)
auc      = roc_auc_score(y_test, y_pred_prob, multi_class="ovr")

print(f"\n  {'='*45}")
print(f"  MODEL PERFORMANCE")
print(f"  {'='*45}")
print(f"  Accuracy : {accuracy*100:.2f}%")
print(f"  AUC-ROC  : {auc:.4f}")
print(f"\n  Classification Report:")
print(classification_report(
    y_test, y_pred,
    target_names=["Low Risk", "Medium Risk", "High Risk"]
))

# Confusion Matrix
cm = confusion_matrix(y_test, y_pred)
print(f"  Confusion Matrix:")
print(f"  (Rows=Actual, Cols=Predicted)")
print(f"  Labels: Low | Medium | High")
print(f"  {cm}")

# ─────────────────────────────────────────
# STEP 6: Feature Importance
# ─────────────────────────────────────────
print("\n  🔍 Top 10 Most Important Features:")

importance_df = pd.DataFrame({
    "feature":   FEATURE_NAMES,
    "importance": model.feature_importances_
}).sort_values("importance", ascending=False)

for i, row in importance_df.head(10).iterrows():
    bar = "█" * int(row["importance"] * 100)
    print(f"  {row['feature']:25s} {row['importance']:.4f} {bar}")

# ─────────────────────────────────────────
# STEP 7: Cross Validation
# ─────────────────────────────────────────
print("\n  🔄 Running 5-fold Cross Validation...")

cv      = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(
    model, X_train_scaled, y_train,
    cv=cv, scoring="accuracy", n_jobs=-1
)

print(f"  CV Scores  : {[f'{s:.3f}' for s in cv_scores]}")
print(f"  CV Mean    : {cv_scores.mean():.4f}")
print(f"  CV Std Dev : {cv_scores.std():.4f}")

# ─────────────────────────────────────────
# STEP 8: Save Model + Scaler
# ─────────────────────────────────────────
print("\n  💾 Saving model files...")

# Save model
model_path  = MODELS_DIR / "early_warning_model.joblib"
scaler_path = MODELS_DIR / "feature_scaler.joblib"

joblib.dump(model,  model_path)
joblib.dump(scaler, scaler_path)

print(f"  📁 Saved: {model_path}")
print(f"  📁 Saved: {scaler_path}")

# Save evaluation results
eval_results = {
    "trained_at"    : datetime.now().isoformat(),
    "accuracy"      : round(float(accuracy), 4),
    "auc_roc"       : round(float(auc), 4),
    "cv_mean"       : round(float(cv_scores.mean()), 4),
    "cv_std"        : round(float(cv_scores.std()), 4),
    "train_records" : len(X_train),
    "test_records"  : len(X_test),
    "n_features"    : len(FEATURE_NAMES),
    "top_features"  : importance_df.head(5)["feature"].tolist(),
    "confusion_matrix": cm.tolist(),
}

eval_path = EVAL_DIR / "model_evaluation.json"
with open(eval_path, "w") as f:
    json.dump(eval_results, f, indent=2)

print(f"  📁 Saved: {eval_path}")

# Save feature importance
imp_path = EVAL_DIR / "feature_importance.csv"
importance_df.to_csv(imp_path, index=False)
print(f"  📁 Saved: {imp_path}")

# ─────────────────────────────────────────
# FINAL SUMMARY
# ─────────────────────────────────────────
print("\n" + "=" * 55)
print("  TRAINING COMPLETE!")
print("=" * 55)
print(f"  ✅ Accuracy  : {accuracy*100:.2f}%")
print(f"  ✅ AUC-ROC   : {auc:.4f}")
print(f"  ✅ CV Score  : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
print(f"\n  Files saved in: src/ml/models/")
print(f"    → early_warning_model.joblib")
print(f"    → feature_scaler.joblib")
print("\n  🎉 Model ready for deployment!")
print("=" * 55)