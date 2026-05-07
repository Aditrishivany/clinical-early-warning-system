"""
File: src/api/routes/rag.py
Purpose: RAG endpoints for clinical Q&A
"""

import sys
sys.path.append(".")

from fastapi import APIRouter
from pydantic import BaseModel, Field
from src.rag.rag_engine import ClinicalRAGEngine

router = APIRouter()

# Initialize RAG engine
print("  🔧 Loading RAG engine for API...")
rag_engine = ClinicalRAGEngine()


from typing import Optional, Dict, Any

class ClinicalQuestion(BaseModel):
    question: str
    patient_context: Optional[Dict[str, Any]] = {}

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What is the sepsis protocol?",
                "patient_context": {}
            }
        }


@router.post("/ask")
def ask_clinical_question(body: ClinicalQuestion):
    """
    Ask a clinical question — RAG searches
    medical guidelines and returns answer with sources.
    """
    result = rag_engine.answer(
        body.question,
        body.patient_context
    )
    return result


@router.get("/guidelines")
def list_guidelines():
    """List all available medical guidelines."""
    from src.rag.documents.medical_guidelines import MEDICAL_GUIDELINES
    return {
        "total": len(MEDICAL_GUIDELINES),
        "guidelines": [
            {
                "id":       g["id"],
                "title":    g["title"],
                "category": g["category"],
            }
            for g in MEDICAL_GUIDELINES
        ]
    }


@router.get("/search")
def search_guidelines(q: str):
    """Search medical guidelines by keyword."""
    results = rag_engine.search(q, top_k=3)
    return {
        "query":   q,
        "results": results
    }