// ChatBot.jsx — floating AI assistant with persistent chat, smooth animations

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, X, Trash2, Send, Bot, Zap } from 'lucide-react';
import { sendChatMessage, clearChatHistory } from '../services/api';

const ROLE_COLORS = {
  admin:   { primary: '#7C3AED', light: '#EDE9FE', border: '#C4B5FD' },
  doctor:  { primary: '#2563EB', light: '#EFF6FF', border: '#BFDBFE' },
  nurse:   { primary: '#059669', light: '#ECFDF5', border: '#A7F3D0' },
  patient: { primary: '#0891B2', light: '#F0F9FF', border: '#BAE6FD' },
};

const QUICK = {
  patient: ['What is my health status?', 'Explain my vitals', 'Am I at risk?', 'What to watch for?'],
  doctor:  ['List high-risk patients', 'Who needs attention now?', 'Sepsis protocol', 'NEWS2 guide'],
  nurse:   ['My ward patients', 'Critical vitals today', 'Sepsis checklist', 'When to escalate?'],
  admin:   ['System status', 'High-risk patients today', 'Active alerts', 'Patient statistics'],
};

const WELCOME = {
  patient: (name) => `Hello ${name}! I can see your vitals, risk assessment, and health data. Ask me anything.`,
  doctor:  (name) => `Hello Dr. ${name}! I have access to your patients' real-time data. How can I assist?`,
  nurse:   (name) => `Hello ${name}! I can see your ward patients' vitals. Ask me anything.`,
  admin:   (name) => `Hello ${name}! I'm your clinical AI assistant. Ask me anything about the system.`,
};

const Bubble = ({ msg, color }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display:        'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom:   '8px',
    }} className="animate-fade-in">
      {!isUser && (
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%',
          background: `linear-gradient(135deg, ${color.primary}, ${color.primary}BB)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: '8px', flexShrink: 0, marginTop: '2px',
        }}>
          <Bot size={12} color="white" />
        </div>
      )}
      <div style={{ maxWidth: '82%' }}>
        <div style={{
          padding:      '9px 13px',
          borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
          background:   isUser ? `linear-gradient(135deg, ${color.primary}, ${color.primary}DD)` : color.light,
          color:        isUser ? 'white' : '#0F172A',
          border:       isUser ? 'none' : `1px solid ${color.border}`,
          boxShadow:    '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.55', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {msg.content}
          </p>

          {msg.sources?.length > 0 && (
            <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {msg.sources.map((s, i) => (
                <span key={i} style={{
                  fontSize: '9px', padding: '2px 7px',
                  background: 'rgba(255,255,255,0.7)', color: color.primary,
                  border: `1px solid ${color.border}`, borderRadius: '10px',
                }}>
                  📚 {s.title}
                </span>
              ))}
            </div>
          )}
        </div>

        <p style={{
          margin: '3px 4px 0', fontSize: '9px',
          color: '#94A3B8', textAlign: isUser ? 'right' : 'left',
        }}>
          {msg.timestamp}
          {msg.ai_powered && ' · AI'}
        </p>
      </div>
    </div>
  );
};

const TypingIndicator = ({ color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
    <div style={{
      width: '26px', height: '26px', borderRadius: '50%',
      background: `linear-gradient(135deg, ${color.primary}, ${color.primary}BB)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Bot size={12} color="white" />
    </div>
    <div style={{
      padding: '10px 14px',
      background: color.light,
      border: `1px solid ${color.border}`,
      borderRadius: '14px 14px 14px 2px',
      display: 'flex', gap: '4px', alignItems: 'center',
    }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: color.primary,
          animation: `typing 1.2s ease ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  </div>
);

// Add typing keyframes to document (once)
if (typeof document !== 'undefined' && !document.getElementById('chat-keyframes')) {
  const s = document.createElement('style');
  s.id = 'chat-keyframes';
  s.textContent = `
    @keyframes typing {
      0%,80%,100% { transform:scale(.6); opacity:.4; }
      40%          { transform:scale(1);  opacity:1;  }
    }
    @keyframes chatSlide {
      from { opacity:0; transform:translateY(12px) scale(.97); }
      to   { opacity:1; transform:translateY(0)    scale(1);   }
    }
  `;
  document.head.appendChild(s);
}


const ChatBot = ({ patientId = null }) => {
  const { user } = useAuth();
  const [msgs,    setMsgs]    = useState([]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen,  setIsOpen]  = useState(false);
  const [unread,  setUnread]  = useState(0);
  const endRef = useRef(null);

  const color   = ROLE_COLORS[user?.role] || ROLE_COLORS.doctor;
  const quick   = QUICK[user?.role]       || [];
  const welcome = WELCOME[user?.role]     || (() => 'Hello! How can I help?');

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && msgs.length === 0) {
      setMsgs([{
        role:      'assistant',
        content:   welcome(user?.name || 'there'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
    if (isOpen) setUnread(0);
  }, [isOpen]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setLoading(true);

    setMsgs(p => [...p, {
      role:      'user',
      content:   text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);

    try {
      const data = await sendChatMessage({
        message:    text,
        user_id:    patientId || user?.id,
        user_role:  user?.role,
        session_id: user?.id,
      });

      const reply = {
        role:       'assistant',
        content:    data.answer || 'Sorry, I could not generate a response.',
        sources:    data.sources,
        ai_powered: data.ai_powered,
        timestamp:  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMsgs(p => [...p, reply]);
      if (!isOpen) setUnread(u => u + 1);

    } catch {
      setMsgs(p => [...p, {
        role:      'assistant',
        content:   'Sorry, I could not connect to the server. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try { await clearChatHistory(user?.id); } catch { /* ignore */ }
    setMsgs([]);
  };

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position:    'fixed',
          bottom:      '24px',
          right:       '24px',
          width:       '52px',
          height:      '52px',
          borderRadius:'50%',
          background:  `linear-gradient(135deg, ${color.primary}, ${color.primary}CC)`,
          border:      'none',
          cursor:      'pointer',
          boxShadow:   `0 4px 20px ${color.primary}50`,
          zIndex:      1000,
          display:     'flex',
          alignItems:  'center',
          justifyContent:'center',
          transition:  'all 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen
          ? <X size={20} color="white" strokeWidth={2.5} />
          : <MessageCircle size={20} color="white" strokeWidth={2} />
        }

        {/* Unread badge */}
        {!isOpen && unread > 0 && (
          <div style={{
            position:     'absolute',
            top:          '-2px',
            right:        '-2px',
            width:        '18px',
            height:       '18px',
            borderRadius: '50%',
            background:   '#EF4444',
            border:       '2px solid white',
            fontSize:     '9px',
            fontWeight:   '700',
            color:        'white',
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
          }}>
            {unread}
          </div>
        )}

        {/* Pulse ring when closed */}
        {!isOpen && (
          <div style={{
            position:     'absolute',
            inset:        '-4px',
            borderRadius: '50%',
            border:       `2px solid ${color.primary}`,
            animation:    'pulse-ring 2.5s ease-in-out infinite',
          }} />
        )}
      </button>

      {/* ── Chat window ── */}
      {isOpen && (
        <div style={{
          position:      'fixed',
          bottom:        '86px',
          right:         '24px',
          width:         '370px',
          height:        '540px',
          background:    'white',
          borderRadius:  '18px',
          boxShadow:     '0 12px 48px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
          border:        '1px solid var(--border)',
          display:       'flex',
          flexDirection: 'column',
          zIndex:        999,
          animation:     'chatSlide 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
          overflow:      'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding:      '13px 16px',
            background:   `linear-gradient(135deg, ${color.primary}, ${color.primary}CC)`,
            display:      'flex',
            alignItems:   'center',
            justifyContent:'space-between',
            flexShrink:   0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={18} color="white" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'white' }}>
                  Clinical AI Assistant
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={9} color="rgba(255,255,255,0.7)" />
                  <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>
                    Powered by Groq LLaMA 3.3
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={clearChat}
              title="Clear conversation"
              style={{
                background:   'rgba(255,255,255,0.15)',
                border:       'none',
                color:        'white',
                borderRadius: '8px',
                padding:      '5px 8px',
                cursor:       'pointer',
                display:      'flex',
                alignItems:   'center',
                gap:          '4px',
                fontSize:     '11px',
                fontWeight:   '600',
                transition:   'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              <Trash2 size={12} />
              Clear
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex:          1,
            overflowY:     'auto',
            padding:       '14px',
            display:       'flex',
            flexDirection: 'column',
          }}>
            {msgs.map((msg, i) => (
              <Bubble key={i} msg={msg} color={color} />
            ))}

            {loading && <TypingIndicator color={color} />}

            {/* Quick questions — shown only at start */}
            {msgs.length <= 1 && !loading && (
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {quick.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    style={{
                      padding:      '5px 10px',
                      fontSize:     '11px',
                      background:   color.light,
                      color:        color.primary,
                      border:       `1px solid ${color.border}`,
                      borderRadius: '12px',
                      cursor:       'pointer',
                      fontWeight:   '500',
                      fontFamily:   'inherit',
                      transition:   'all 0.12s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = `${color.primary}18`}
                    onMouseLeave={e => e.currentTarget.style.background = color.light}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{
            padding:    '10px 12px',
            borderTop:  '1px solid var(--border)',
            display:    'flex',
            gap:        '8px',
            background: '#FAFBFC',
            flexShrink: 0,
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask anything…"
              disabled={loading}
              style={{
                flex:         1,
                padding:      '9px 12px',
                border:       `1.5px solid ${input ? color.primary + '60' : 'var(--border)'}`,
                borderRadius: '10px',
                fontSize:     '13px',
                outline:      'none',
                fontFamily:   'inherit',
                background:   'white',
                color:        'var(--text)',
                transition:   'border-color 0.15s',
              }}
              onFocus={e  => e.target.style.borderColor = color.primary}
              onBlur={e   => e.target.style.borderColor = input ? `${color.primary}60` : 'var(--border)'}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                padding:      '9px 14px',
                background:   loading || !input.trim()
                  ? '#E2E8F0'
                  : `linear-gradient(135deg, ${color.primary}, ${color.primary}CC)`,
                color:        loading || !input.trim() ? '#94A3B8' : 'white',
                border:       'none',
                borderRadius: '10px',
                cursor:       loading || !input.trim() ? 'not-allowed' : 'pointer',
                display:      'flex',
                alignItems:   'center',
                justifyContent:'center',
                transition:   'all 0.15s ease',
                flexShrink:   0,
                boxShadow:    loading || !input.trim() ? 'none' : `0 2px 8px ${color.primary}40`,
              }}
            >
              {loading
                ? <div style={{ width: '14px', height: '14px', border: '2px solid rgba(148,163,175,0.3)', borderTopColor: '#94A3B8', borderRadius: '50%' }} className="animate-spin" />
                : <Send size={14} strokeWidth={2.5} />
              }
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
