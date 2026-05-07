"""
Export Power BI-ready CSV tables from the operational SQLite/Azure SQL schema.

Outputs:
- fact_patient_risk.csv: latest model outputs and alert counts
- fact_vitals.csv: vital sign trend table
- dim_patient.csv: patient demographics
- powerbi_metrics.json: KPI definitions for the report
"""

from pathlib import Path
import json
import sys

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parents[1]))

from src.database.connection import engine


OUT_DIR = Path("reports/powerbi")


def read_sql(query: str) -> pd.DataFrame:
    with engine.connect() as conn:
        return pd.read_sql_query(query, conn)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    dim_patient = read_sql("""
        SELECT patient_id, name, age, gender, ward, bed_number, admitted_at, is_discharged
        FROM patients
    """)

    fact_vitals = read_sql("""
        SELECT patient_id, recorded_at, source, heart_rate, systolic_bp, diastolic_bp,
               temperature, respiratory_rate, spo2, consciousness, urine_output,
               glucose, pain_score, news2_score, pulse_pressure, shock_index
        FROM vital_readings
    """)

    fact_patient_risk = read_sql("""
        SELECT p.patient_id, p.predicted_at, p.risk_level, p.risk_label, p.confidence,
               p.news2_score, p.news2_category, p.prob_low, p.prob_medium, p.prob_high,
               p.recommendation,
               COALESCE(a.active_alerts, 0) AS active_alerts
        FROM predictions p
        LEFT JOIN (
            SELECT patient_id, COUNT(*) AS active_alerts
            FROM alerts
            WHERE is_resolved = 0
            GROUP BY patient_id
        ) a ON a.patient_id = p.patient_id
    """)

    dim_patient.to_csv(OUT_DIR / "dim_patient.csv", index=False)
    fact_vitals.to_csv(OUT_DIR / "fact_vitals.csv", index=False)
    fact_patient_risk.to_csv(OUT_DIR / "fact_patient_risk.csv", index=False)

    metrics = {
        "cards": [
            "Total Patients",
            "High Risk Patients",
            "Active Alerts",
            "Average NEWS2 Score",
        ],
        "charts": [
            "Risk distribution by ward",
            "NEWS2 trend over time",
            "SpO2 and heart-rate trend by patient",
            "Alert severity counts",
        ],
        "refresh_source": "SQLite locally; Azure SQL connection string in production",
    }
    (OUT_DIR / "powerbi_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Power BI dataset exported to {OUT_DIR}")


if __name__ == "__main__":
    main()
