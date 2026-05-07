// File: src/dashboard/src/components/ClinicalQA.jsx
import { useState } from 'react';
import { askClinicalQuestion } from '../services/api';

const SAMPLE_QUESTIONS = [
  "What is the sepsis treatment protocol?",
  "What does a NEWS2 score of 7 mean?",
  "How do I manage respiratory distress?",
  "What are the signs of cardiac emergency?",
  "When should I give IV fluids?",
];

const ClinicalQA = () => {
  const [question, setQuestion] = useState('');
  const [answer,   setAnswer]   = useState(null);
  const [loading,  setLoading]  = useState(false);

  const handleAsk = async (q) => {
    const questionToAsk = q || question;
    if (!questionToAsk.trim()) return;

    setLoading(true);
    setAnswer(null);
    setQuestion(questionToAsk);

    try {
      // Direct fetch with exact format API expects
      const response = await fetch('http://127.0.0.1:8000/api/v1/rag/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          question: questionToAsk,
          patient_context: {}
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('API Error:', errText);
        throw new Error(`Status: ${response.status}`);
      }

      const data = await response.json();
      setAnswer(data);

    } catch (err) {
      console.error('RAG Error:', err);
      setAnswer({ error: `Failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '12px',
      padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
        💬 Clinical Q&A (RAG)
      </h2>

      {/* Sample Questions */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px 0' }}>
          Quick questions:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {SAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleAsk(q)}
              style={{
                padding:         '4px 10px',
                backgroundColor: '#eff6ff',
                color:           '#2563eb',
                border:          '1px solid #bfdbfe',
                borderRadius:    '16px',
                fontSize:        '11px',
                cursor:          'pointer',
                fontWeight:      '500',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="Ask a clinical question..."
          style={{
            flex: 1, padding: '10px 12px',
            border: '1px solid #e5e7eb', borderRadius: '8px',
            fontSize: '13px',
          }}
        />
        <button
          onClick={() => handleAsk()}
          disabled={loading}
          style={{
            padding:         '10px 16px',
            backgroundColor: '#2563eb',
            color:           'white',
            border:          'none',
            borderRadius:    '8px',
            cursor:          'pointer',
            fontWeight:      '600',
            fontSize:        '13px',
          }}
        >
          {loading ? '...' : 'Ask'}
        </button>
      </div>

      {/* Answer */}
      {answer && !answer.error && (
        <div style={{
          backgroundColor: '#f9fafb', borderRadius: '8px',
          padding: '16px', border: '1px solid #e5e7eb',
        }}>
          <p style={{
            margin: '0 0 8px 0', fontSize: '13px',
            fontWeight: '600', color: '#111827',
          }}>
            Q: {answer.question}
          </p>

          <div style={{
            backgroundColor: 'white', padding: '12px',
            borderRadius: '6px', marginBottom: '10px',
            border: '1px solid #e5e7eb',
          }}>
            <p style={{
              margin: 0, fontSize: '13px',
              color: '#374151', lineHeight: '1.6',
              whiteSpace: 'pre-line',
            }}>
              {answer.answer}
            </p>
          </div>

          {/* Sources */}
          {answer.sources?.length > 0 && (
            <div>
              <p style={{
                margin: '0 0 6px 0', fontSize: '11px',
                color: '#6b7280', fontWeight: '600',
              }}>
                📚 Sources:
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {answer.sources.map((source) => (
                  <span key={source.id} style={{
                    backgroundColor: '#eff6ff',
                    color:           '#1d4ed8',
                    padding:         '2px 8px',
                    borderRadius:    '12px',
                    fontSize:        '11px',
                    border:          '1px solid #bfdbfe',
                  }}>
                    {source.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {answer?.error && (
        <div style={{
          padding: '12px', backgroundColor: '#fee2e2',
          borderRadius: '8px', color: '#dc2626', fontSize: '13px',
        }}>
          ❌ {answer.error}
        </div>
      )}
    </div>
  );
};

export default ClinicalQA;