import { useState } from 'react';
import { MessageCircle, Send, BookOpen, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { askClinicalQuestion } from '../../services/api';

const PATIENT_QUESTIONS = [
  "What does my NEWS2 score mean?",
  "Why is my heart rate being monitored?",
  "What is sepsis and should I be worried?",
  "What do my blood pressure readings mean?",
  "Why is oxygen saturation important?",
  "What happens if my condition gets worse?",
];

const PatientAsk = () => {
  const { user }                  = useAuth();
  const [question, setQuestion]   = useState('');
  const [answer,   setAnswer]     = useState(null);
  const [loading,  setLoading]    = useState(false);

  const handleAsk = async (q) => {
    const text = (q || question).trim();
    if (!text) return;

    setLoading(true);
    setAnswer(null);
    if (!q) setQuestion(text);

    try {
      const data = await askClinicalQuestion(text, {
        age:    user?.age,
        gender: user?.gender,
        ward:   user?.ward,
      });
      setAnswer(data);
    } catch (err) {
      setAnswer({ error: 'Unable to get an answer. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '800px' }}>

      {/* ── Header ── */}
      <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: '#eff6ff', border: '1px solid #bfdbfe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MessageCircle size={17} color="var(--blue)" />
          </div>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>
            Ask a Health Question
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Get clear, simple answers about your health condition. Our AI searches clinical guidelines to answer your questions.
        </p>
      </div>

      {/* ── Quick Questions ── */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Common questions
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {PATIENT_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => handleAsk(q)}
              style={{
                padding: '10px 14px',
                background: '#f0f9ff', color: '#0369a1',
                border: '1px solid #bae6fd', borderRadius: 'var(--r-sm)',
                cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                textAlign: 'left', transition: 'all 0.15s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e0f2fe'; e.currentTarget.style.borderColor = '#7dd3fc'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.borderColor = '#bae6fd'; }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── Custom Input ── */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Or ask your own question
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            className="input"
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
            placeholder="Type your health question here…"
            style={{ flex: 1 }}
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '0 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {loading
              ? <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin" />
              : <Send size={14} />
            }
            {loading ? '' : 'Ask'}
          </button>
        </div>
      </div>

      {/* ── Answer ── */}
      {answer && !answer.error && (
        <div className="card animate-fade" style={{ padding: '24px' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            marginBottom: '16px', paddingBottom: '16px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#eff6ff', border: '1px solid #bfdbfe', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageCircle size={15} color="var(--blue)" />
            </div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text)', lineHeight: '1.4' }}>
              {answer.question}
            </p>
          </div>

          <div style={{
            background: '#f0f9ff', borderRadius: 'var(--r-md)',
            padding: '16px', marginBottom: '16px',
            borderLeft: '4px solid #0891b2',
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
              {answer.answer}
            </p>
          </div>

          {answer.sources?.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <BookOpen size={13} color="var(--text-muted)" />
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Based on clinical guidelines
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {answer.sources.map(source => (
                  <span key={source.id} style={{
                    background: '#eff6ff', color: '#2563eb',
                    padding: '3px 10px', borderRadius: '12px',
                    fontSize: '11px', border: '1px solid #bfdbfe',
                  }}>
                    {source.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{
            padding: '10px 14px', background: '#fef3c7',
            borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'flex-start', gap: '8px',
          }}>
            <AlertTriangle size={13} color="#92400e" style={{ marginTop: '1px', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '11px', color: '#92400e', lineHeight: '1.4' }}>
              This information is for educational purposes only. Always follow your doctor's advice.
            </p>
          </div>
        </div>
      )}

      {answer?.error && (
        <div className="card" style={{
          padding: '20px', background: '#fff5f5', border: '1px solid #fecaca',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={15} color="#dc2626" />
            <p style={{ margin: 0, color: '#dc2626', fontSize: '13px', fontWeight: '500' }}>
              {answer.error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAsk;
