import { useState } from 'react';
import { Brain, Send, BookOpen, AlertTriangle, XCircle } from 'lucide-react';
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
    const text = (q || question).trim();
    if (!text) return;
    setLoading(true);
    setAnswer(null);
    setQuestion(text);
    try {
      const data = await askClinicalQuestion(text, {});
      setAnswer(data);
    } catch (err) {
      setAnswer({ error: `Failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: '#eff6ff', border: '1px solid #bfdbfe',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={16} color="var(--blue)" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>
            Clinical Q&A
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
            AI-powered RAG search across clinical guidelines
          </p>
        </div>
      </div>

      {/* Sample questions */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 8px' }}>
          Quick questions
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {SAMPLE_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => handleAsk(q)}
              style={{
                padding: '4px 10px',
                background: '#eff6ff', color: 'var(--blue)',
                border: '1px solid #bfdbfe', borderRadius: '16px',
                fontSize: '11px', cursor: 'pointer', fontWeight: '500',
                transition: 'all 0.12s ease', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          className="input"
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          placeholder="Ask a clinical question…"
          style={{ flex: 1 }}
        />
        <button
          onClick={() => handleAsk()}
          disabled={loading}
          className="btn btn-primary"
          style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          {loading
            ? <div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin" />
            : <Send size={13} />
          }
          {loading ? '' : 'Ask'}
        </button>
      </div>

      {/* Answer */}
      {answer && !answer.error && (
        <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: '16px', border: '1px solid var(--border)' }}>
          <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
            Q: {answer.question}
          </p>
          <div style={{
            background: 'var(--white)', padding: '12px',
            borderRadius: 'var(--r-sm)', marginBottom: '10px',
            border: '1px solid var(--border)',
            borderLeft: '3px solid var(--blue)',
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {answer.answer}
            </p>
          </div>
          {answer.sources?.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                <BookOpen size={12} color="var(--text-muted)" />
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Sources
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {answer.sources.map(source => (
                  <span key={source.id} style={{
                    background: '#eff6ff', color: '#1d4ed8',
                    padding: '2px 8px', borderRadius: '12px',
                    fontSize: '11px', border: '1px solid #bfdbfe',
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
          padding: '12px', background: '#fee2e2',
          borderRadius: 'var(--r-sm)', border: '1px solid #fecaca',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <XCircle size={14} color="#dc2626" />
          <span style={{ fontSize: '13px', color: '#dc2626' }}>{answer.error}</span>
        </div>
      )}
    </div>
  );
};

export default ClinicalQA;
