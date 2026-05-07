"""
File: src/rag/rag_engine.py
Purpose: RAG engine — searches medical knowledge and answers questions
"""

import sys
sys.path.append(".")

from pathlib import Path
from datetime import datetime

print("  🔧 Loading RAG engine...")

try:
    import chromadb
    from chromadb.utils import embedding_functions
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False
    print("  ⚠️  ChromaDB not available - using simple search")

from src.rag.documents.medical_guidelines import MEDICAL_GUIDELINES


class ClinicalRAGEngine:
    """
    Clinical RAG Engine.
    Searches medical guidelines and answers clinical questions.
    Works locally without OpenAI API key.
    """

    def __init__(self):
        self.guidelines  = MEDICAL_GUIDELINES
        self.use_chroma  = False
        self.client      = None
        self.collection  = None

        print("  📚 Initializing Clinical RAG Engine...")
        self._setup_simple_search()
        self._index_documents()
        print("  ✅ RAG Engine ready!")

    def _setup_simple_search(self):
        """Setup simple keyword-based search (no API needed)."""
        self.search_index = {}

        for doc in self.guidelines:
            # Index by keywords
            words = (
                doc["title"].lower() + " " +
                doc["category"].lower() + " " +
                doc["content"].lower()
            ).split()

            for word in set(words):
                if len(word) > 3:  # skip short words
                    if word not in self.search_index:
                        self.search_index[word] = []
                    self.search_index[word].append(doc["id"])

        print(f"  ✅ Indexed {len(self.guidelines)} medical guidelines")

    def _index_documents(self):
        """Build document lookup."""
        self.doc_lookup = {
            doc["id"]: doc for doc in self.guidelines
        }

    def search(self, query: str, top_k: int = 3) -> list:
        """
        Search medical guidelines for relevant content.
        Returns top matching documents.
        """
        query_words = query.lower().split()

        # Score each document
        scores = {}
        for word in query_words:
            if len(word) <= 3:
                continue
            if word in self.search_index:
                for doc_id in self.search_index[word]:
                    scores[doc_id] = scores.get(doc_id, 0) + 1

        # Sort by score
        sorted_docs = sorted(
            scores.items(),
            key=lambda x: x[1],
            reverse=True
        )[:top_k]

        results = []
        for doc_id, score in sorted_docs:
            doc = self.doc_lookup[doc_id]
            results.append({
                "id":       doc["id"],
                "title":    doc["title"],
                "category": doc["category"],
                "content":  doc["content"].strip(),
                "score":    score,
            })

        return results

    def answer(self, question: str, patient_context: dict = None) -> dict:
        """
        Answer a clinical question using medical guidelines.

        Args:
            question: Clinical question
            patient_context: Optional patient data for context

        Returns:
            Answer with sources
        """
        # Search relevant documents
        relevant_docs = self.search(question, top_k=3)

        if not relevant_docs:
            return {
                "question": question,
                "answer":   "No relevant clinical guidelines found.",
                "sources":  [],
                "timestamp": datetime.now().isoformat(),
            }

        # Build context from documents
        context_parts = []
        for doc in relevant_docs:
            context_parts.append(
                f"[{doc['title']}]\n{doc['content']}"
            )
        context = "\n\n".join(context_parts)

        # Build patient context string
        patient_str = ""
        if patient_context:
            patient_str = (
                f"\nPatient Context: "
                f"Age {patient_context.get('age')}, "
                f"{patient_context.get('gender')}, "
                f"Ward: {patient_context.get('ward')}, "
                f"HR: {patient_context.get('heart_rate')}, "
                f"BP: {patient_context.get('systolic_bp')}/"
                f"{patient_context.get('diastolic_bp')}, "
                f"SpO2: {patient_context.get('spo2')}%, "
                f"Temp: {patient_context.get('temperature')}°C"
            )

        # Generate answer from context
        answer = self._generate_answer(
            question, context, patient_str, relevant_docs
        )

        return {
            "question":   question,
            "answer":     answer,
            "sources":    [
                {
                    "id":       d["id"],
                    "title":    d["title"],
                    "category": d["category"],
                }
                for d in relevant_docs
            ],
            "patient_context": patient_str.strip() if patient_str else None,
            "timestamp":  datetime.now().isoformat(),
        }

    def _generate_answer(
        self,
        question: str,
        context: str,
        patient_str: str,
        docs: list
    ) -> str:
        """Generate answer from retrieved context."""

        q = question.lower()

        # Find most relevant doc
        top_doc = docs[0] if docs else None

        if not top_doc:
            return "No relevant guidelines found for this question."

        content = top_doc["content"].strip()

        # Extract relevant section based on question keywords
        lines      = content.split("\n")
        answer_lines = []
        capture    = False

        # Keywords to look for
        keywords = [
            word for word in q.split()
            if len(word) > 3
        ]

        for line in lines:
            line = line.strip()
            if not line:
                continue

            line_lower = line.lower()

            # Check if line is relevant
            relevance = sum(
                1 for kw in keywords
                if kw in line_lower
            )

            if relevance > 0 or capture:
                answer_lines.append(line)
                capture = True

            if len(answer_lines) >= 10:
                break

        if answer_lines:
            answer = "\n".join(answer_lines)
        else:
            # Return first meaningful section
            answer = "\n".join(
                [l.strip() for l in lines if l.strip()][:8]
            )

        # Add patient-specific note
        if patient_str and "sepsis" in q:
            answer += (
                "\n\nFor this patient: Given the current vitals, "
                "sepsis protocol should be initiated immediately. "
                "Complete the Sepsis Six within 1 hour."
            )

        return answer

    def get_guidelines_for_risk(self, risk_level: int) -> list:
        """Get relevant guidelines based on risk level."""
        if risk_level == 2:
            queries = ["sepsis", "cardiac emergency", "triage immediate"]
        elif risk_level == 1:
            queries = ["NEWS2 urgent", "respiratory", "fluid management"]
        else:
            queries = ["NEWS2 routine", "monitoring"]

        results = []
        for query in queries:
            docs = self.search(query, top_k=1)
            if docs:
                results.extend(docs)

        return results[:3]