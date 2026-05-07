// File: src/dashboard/src/pages/patient/PatientAsk.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const PATIENT_QUESTIONS = [
  "What does my NEWS2 score mean?",
  "Why is my heart rate being monitored?",
  "What is sepsis and should I be worried?",
  "What do my blood pressure readings mean?",
  "Why is oxygen saturation important?",
  "What happens if my condition gets worse?",
];

const PatientAsk = () => {
  const { user }        = useAuth();
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
      const response = await fetch('http://127.0.0.1:8000/api/v1/rag/ask', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          question:        questionToAsk,
          patient_context: {
            age:    user?.age,
            gender: user?.gender,
            ward:   user?.ward,
          },
        }),
      });
      const data = await response.json();
      setAnswer(data);
    } catch (err) {
      setAnswer({ error: 'Unable to get answer. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '800px' }}>

      {/* Header */}
      <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700' }}>
          💬 Ask a Health Question
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
          Get clear, simple answers about your health condition.
          Our AI searches medical guidelines to answer your questions.
        </p>
      </div>

      {/* Quick Questions */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <p style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
          Common questions patients ask:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {PATIENT_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => handleAsk(q)}
              style={{
                padding:         '10px 14px',
                backgroundColor: '#f0f9ff',
                color:           '#0369a1',
                border:          '1px solid #bae6fd',
                borderRadius:    '8px',
                cursor:          'pointer',
                fontSize:        '12px',
                textAlign:       'left',
                transition:      'all 0.15s',
                fontWeight:      '500',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e0f2fe'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f0f9ff'}
            >
              💭 {q}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Question */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
          Or ask your own question:
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
            placeholder="Type your health question here..."
            style={{
              flex:         1,
              padding:      '10px 14px',
              border:       '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize:     '13px',
              outline:      'none',
            }}
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading}
            style={{
              padding:         '10px 20px',
              backgroundColor: '#0891b2',
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
      </div>

      {/* Answer */}
      {answer && !answer.error && (
        <div className="card animate-fade" style={{ padding: '24px' }}>
          <div style={{
            display:         'flex',
            alignItems:      'center',
            gap:             '10px',
            marginBottom:    '16px',
            paddingBottom:   '16px',
            borderBottom:    '1px solid #e5e7eb',
          }}>
            <span style={{ fontSize: '24px' }}>💬</span>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {answer.question}
            </p>
          </div>

          <div style={{
            backgroundColor: '#f0f9ff',
            borderRadius:    '10px',
            padding:         '16px',
            marginBottom:    '16px',
            borderLeft:      '4px solid #0891b2',
          }}>
            <p style={{
              margin:     0,
              fontSize:   '13px',
              color:      '#374151',
              lineHeight: '1.7',
              whiteSpace: 'pre-line',
            }}>
              {answer.answer}
            </p>
          </div>

          {/* Sources */}
          {answer.sources?.length > 0 && (
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                📚 Based on clinical guidelines:
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {answer.sources.map(source => (
                  <span key={source.id} style={{
                    backgroundColor: '#eff6ff',
                    color:           '#2563eb',
                    padding:         '3px 10px',
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

          <div style={{
            marginTop:       '12px',
            padding:         '10px 14px',
            backgroundColor: '#fef3c7',
            borderRadius:    '8px',
            fontSize:        '11px',
            color:           '#92400e',
          }}>
            ⚠️ This information is for educational purposes only.
            Always follow your doctor's advice.
          </div>
        </div>
      )}

      {answer?.error && (
        <div className="card" style={{
          padding:         '20px',
          backgroundColor: '#fff5f5',
          border:          '1px solid #fecaca',
        }}>
          <p style={{ margin: 0, color: '#dc2626', fontSize: '13px' }}>
            ❌ {answer.error}
          </p>
        </div>
      )}
    </div>
  );
};

export default PatientAsk;