"""
File: tests/unit/test_rag.py
Purpose: Unit tests for RAG system
Run: pytest tests/unit/test_rag.py -v
"""

import pytest
import sys
sys.path.append(".")

from src.rag.rag_engine import ClinicalRAGEngine


@pytest.fixture
def rag_engine():
    return ClinicalRAGEngine()


class TestRAGEngine:

    def test_initialization(self, rag_engine):
        assert rag_engine is not None

    def test_search_returns_results(self, rag_engine):
        results = rag_engine.search("sepsis treatment")
        assert len(results) > 0

    def test_search_sepsis_returns_sepsis_doc(self, rag_engine):
        results = rag_engine.search("sepsis")
        ids = [r["id"] for r in results]
        assert any("SEPSIS" in id for id in ids)

    def test_search_returns_score(self, rag_engine):
        results = rag_engine.search("sepsis")
        for r in results:
            assert "score" in r
            assert r["score"] > 0
            assert r["retrieval"] == "embedding_vector_search"

    def test_vector_store_metadata(self, rag_engine):
        assert rag_engine.vector_store_backend is not None

    def test_answer_returns_response(self, rag_engine):
        result = rag_engine.answer("What is the sepsis protocol?")
        assert "answer" in result
        assert len(result["answer"]) > 0

    def test_answer_returns_sources(self, rag_engine):
        result = rag_engine.answer("What is NEWS2 score?")
        assert "sources" in result
        assert len(result["sources"]) > 0
        assert result["retrieval"] == "embeddings_vector_store"

    def test_answer_with_patient_context(self, rag_engine):
        context = {"age": 72, "gender": "M", "spo2": 89}
        result = rag_engine.answer("What should I do for low SpO2?", context)
        assert result["answer"] is not None

    def test_guidelines_indexed(self, rag_engine):
        assert len(rag_engine.guidelines) == 7

    def test_search_respiratory(self, rag_engine):
        results = rag_engine.search("respiratory distress oxygen")
        assert len(results) > 0

    def test_get_guidelines_for_high_risk(self, rag_engine):
        results = rag_engine.get_guidelines_for_risk(2)
        assert len(results) > 0
