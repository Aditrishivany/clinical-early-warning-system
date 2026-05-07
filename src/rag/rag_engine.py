"""
File: src/rag/rag_engine.py
Purpose: RAG engine with persisted embeddings and optional LLM generation.
"""

import logging
import os
import sys
from datetime import datetime
from pathlib import Path

import joblib
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

sys.path.append(".")

load_dotenv()

from src.rag.documents.medical_guidelines import MEDICAL_GUIDELINES

logger = logging.getLogger(__name__)
VECTOR_STORE_DIR = Path("src/rag/vector_store")
VECTOR_STORE_PATH = VECTOR_STORE_DIR / "clinical_guidelines_tfidf.joblib"

# ─────────────────────────────────────────
# GROQ CLIENT
# ─────────────────────────────────────────
try:
    from groq import Groq
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL   = os.getenv("GROQ_MODEL", "llama3-8b-8192")

    if GROQ_API_KEY:
        groq_client = Groq(api_key=GROQ_API_KEY)
        GROQ_AVAILABLE = True
    else:
        groq_client    = None
        GROQ_AVAILABLE = False

except Exception as e:
    groq_client    = None
    GROQ_AVAILABLE = False


class ClinicalRAGEngine:
    """
    Clinical RAG Engine with persisted embeddings.
    Uses a local TF-IDF embedding index as the default vector store so the app
    remains executable without cloud credentials. The same search contract can
    be backed by Azure AI Search or Chroma in deployment.
    """

    def __init__(self):
        self.guidelines = MEDICAL_GUIDELINES
        self._setup_doc_lookup()
        self._setup_vector_store()

    def _setup_doc_lookup(self):
        """Build document lookup."""
        self.doc_lookup = {
            doc["id"]: doc for doc in self.guidelines
        }

    def _doc_text(self, doc: dict) -> str:
        return f"{doc['title']} {doc['category']} {doc['content']}"

    def _setup_vector_store(self):
        """
        Build or load a persisted embedding index.
        This is intentionally local and deterministic for unit tests and demos.
        """
        VECTOR_STORE_DIR.mkdir(parents=True, exist_ok=True)
        expected_ids = [doc["id"] for doc in self.guidelines]

        if VECTOR_STORE_PATH.exists():
            try:
                payload = joblib.load(VECTOR_STORE_PATH)
                if payload.get("doc_ids") == expected_ids:
                    self.vectorizer = payload["vectorizer"]
                    self.doc_vectors = payload["doc_vectors"]
                    self.doc_ids = payload["doc_ids"]
                    self.vector_store_backend = payload.get("backend", "tfidf")
                    return
            except Exception:
                logger.warning("RAG vector store could not be loaded; rebuilding")

        self.doc_ids = expected_ids
        corpus = [self._doc_text(doc) for doc in self.guidelines]
        self.vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
            sublinear_tf=True,
        )
        self.doc_vectors = self.vectorizer.fit_transform(corpus)
        self.vector_store_backend = "tfidf-local"
        joblib.dump(
            {
                "backend": self.vector_store_backend,
                "doc_ids": self.doc_ids,
                "vectorizer": self.vectorizer,
                "doc_vectors": self.doc_vectors,
                "built_at": datetime.utcnow().isoformat(),
            },
            VECTOR_STORE_PATH,
        )

    def search(self, query: str, top_k: int = 3) -> list:
        """Semantic document search over the local vector store."""
        if not query.strip():
            return []

        query_vector = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vector, self.doc_vectors).flatten()
        ranked = sorted(
            enumerate(similarities),
            key=lambda item: item[1],
            reverse=True,
        )[:top_k]

        results = []
        for idx, similarity in ranked:
            if similarity <= 0:
                continue
            doc_id = self.doc_ids[idx]
            doc = self.doc_lookup[doc_id]
            results.append({
                "id":       doc["id"],
                "title":    doc["title"],
                "category": doc["category"],
                "content":  doc["content"].strip(),
                "score":    round(float(similarity), 4),
                "retrieval": "embedding_vector_search",
                "vector_store": self.vector_store_backend,
            })

        return results

    def answer(
        self,
        question: str,
        patient_context: dict = None
    ) -> dict:
        """
        Answer clinical question using RAG + Groq AI.
        """

        # Search relevant documents
        relevant_docs = self.search(question, top_k=3)

        # Build context
        context = "\n\n".join([
            f"[{doc['title']}]\n{doc['content']}"
            for doc in relevant_docs
        ]) if relevant_docs else "No specific guidelines found."

        # Build patient context string
        patient_str = ""
        if patient_context and len(patient_context) > 0:
            patient_str = f"""
Current Patient Data:
- Age: {patient_context.get('age', 'Unknown')}
- Gender: {patient_context.get('gender', 'Unknown')}
- Ward: {patient_context.get('ward', 'Unknown')}
- Heart Rate: {patient_context.get('heart_rate', 'Unknown')} bpm
- Blood Pressure: {patient_context.get('systolic_bp', 'Unknown')}/{patient_context.get('diastolic_bp', 'Unknown')} mmHg
- SpO2: {patient_context.get('spo2', 'Unknown')}%
- Temperature: {patient_context.get('temperature', 'Unknown')}°C
- Respiratory Rate: {patient_context.get('respiratory_rate', 'Unknown')}/min
"""

        # Generate answer
        if GROQ_AVAILABLE:
            answer = self._groq_answer(
                question, context, patient_str
            )
        else:
            answer = self._rule_based_answer(
                question, relevant_docs
            )

        return {
            "question":        question,
            "answer":          answer,
            "sources":         [
                {
                    "id":       d["id"],
                    "title":    d["title"],
                    "category": d["category"],
                }
                for d in relevant_docs
            ],
            "patient_context": patient_str.strip() if patient_str else None,
            "ai_powered":      GROQ_AVAILABLE,
            "retrieval":       "embeddings_vector_store",
            "vector_store":    self.vector_store_backend,
            "timestamp":       datetime.now().isoformat(),
        }

    def _groq_answer(
        self,
        question: str,
        context: str,
        patient_str: str
    ) -> str:
        """Generate answer using Groq AI."""
        try:
            system_prompt = """You are an expert clinical AI assistant 
for a hospital early warning system. You provide accurate, 
concise medical information based on clinical guidelines.

Rules:
- Give clear, actionable clinical answers
- Always mention if something requires urgent attention
- Base answers on the provided guidelines
- Consider patient context if provided
- Keep answers concise but complete
- Use medical terminology appropriately
- Always recommend consulting a physician for critical decisions"""

            user_prompt = f"""Clinical Guidelines Context:
{context}

{patient_str}

Clinical Question: {question}

Please provide a clear, accurate clinical answer based on 
the guidelines above. If patient data is provided, 
personalize your response accordingly."""

            response = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=500,
            )

            return response.choices[0].message.content

        except Exception as e:
            return self._rule_based_answer(question, self.search(question))

    def _rule_based_answer(
        self,
        question: str,
        docs: list
    ) -> str:
        """Fallback rule-based answer."""
        if not docs:
            return "No relevant clinical guidelines found."

        top_doc = docs[0]
        content = top_doc["content"].strip()
        lines   = [l.strip() for l in content.split("\n") if l.strip()]
        return "\n".join(lines[:8])

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
