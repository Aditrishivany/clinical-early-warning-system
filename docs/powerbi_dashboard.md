# Power BI Dashboard Deliverable

## Export Dataset

Run:

```powershell
python scripts/export_powerbi_dataset.py
```

This creates:

- `reports/powerbi/dim_patient.csv`
- `reports/powerbi/fact_vitals.csv`
- `reports/powerbi/fact_patient_risk.csv`
- `reports/powerbi/powerbi_metrics.json`

## Report Pages

1. **Operations Overview**
   - Cards: total patients, high-risk patients, active alerts, average NEWS2.
   - Charts: risk distribution by ward, active alerts by severity.

2. **Patient Deterioration Trends**
   - NEWS2 trend over time.
   - Heart rate, SpO2, respiratory rate, and systolic BP trend by patient.
   - Slicer for ward and patient ID.

3. **Model Outputs**
   - Latest risk label and confidence.
   - Probability columns: low, medium, high.
   - Table of top recommendations.

4. **Agent Insights**
   - Agent report summaries from the backend dashboard endpoints.
   - Alert level and immediate actions.

## Suggested DAX Measures

```DAX
Total Patients = DISTINCTCOUNT(dim_patient[patient_id])
High Risk Patients = CALCULATE(DISTINCTCOUNT(fact_patient_risk[patient_id]), fact_patient_risk[risk_level] = 2)
Active Alerts = SUM(fact_patient_risk[active_alerts])
Average NEWS2 = AVERAGE(fact_patient_risk[news2_score])
Anomaly Count = COUNTROWS(FILTER(fact_vitals, fact_vitals[news2_score] >= 7 || fact_vitals[spo2] < 90))
```

## Publishing

For local evaluation, import the CSVs into Power BI Desktop. For Azure evaluation, connect Power BI Service directly to Azure SQL and schedule refresh with an organizational gateway or cloud refresh.
