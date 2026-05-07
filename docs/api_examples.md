# API Examples

## Data Ingestion

```http
POST /api/v1/ingest/vitals
Content-Type: application/json
```

```json
{
  "patient_id": "PT-DEMO-001",
  "age": 72,
  "gender": "M",
  "ward": "ICU",
  "heart_rate": 128,
  "systolic_bp": 85,
  "diastolic_bp": 55,
  "temperature": 39.2,
  "respiratory_rate": 28,
  "spo2": 89,
  "consciousness": 1,
  "urine_output": 12,
  "glucose": 11.5,
  "pain_score": 7,
  "source": "bedside-monitor",
  "recorded_by": "NRS001"
}
```

## ML Prediction

```http
POST /api/v1/predict
```

Uses the same vital-sign payload and returns risk level, confidence, NEWS2, concerns, and recommendation.

## Multi-Agent Analysis

```http
POST /api/v1/analyze
```

Runs ML prediction plus Triage, Warning, and Insight agents, then persists the report and alerts.

## RAG Search

```http
GET /api/v1/rag/search?q=sepsis
```

Returns clinical guideline matches with `retrieval=embeddings_vector_store` metadata.
