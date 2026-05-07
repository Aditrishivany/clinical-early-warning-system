// LoginPage.jsx — stunning split-panel with smooth animations

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Activity, Users, Zap, Eye, EyeOff } from 'lucide-react';

const QUICK_ACCOUNTS = [
  { id: 'ADM001',     pass: 'admin123',   role: 'Admin',   color: '#7C3AED' },
  { id: 'DOC001',     pass: 'doctor123',  role: 'Doctor',  color: '#2563EB' },
  { id: 'DOC002',     pass: 'doctor123',  role: 'Doctor',  color: '#2563EB' },
  { id: 'NRS001',     pass: 'nurse123',   role: 'Nurse',   color: '#059669' },
  { id: 'NRS002',     pass: 'nurse123',   role: 'Nurse',   color: '#059669' },
  { id: 'PT-SIM-001', pass: 'patient123', role: 'Patient', color: '#0891B2' },
  { id: 'PT-SIM-002', pass: 'patient123', role: 'Patient', color: '#0891B2' },
];

const STATS = [
  { Icon: Activity, value: '99.9%', label: 'Uptime'   },
  { Icon: Zap,      value: '<2s',   label: 'Response' },
  { Icon: Users,    value: '5+',    label: 'AI Agents'},
];

const LoginPage = () => {
  const { login } = useAuth();
  const [staffId,   setStaffId]   = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [focusId,   setFocusId]   = useState(false);
  const [focusPwd,  setFocusPwd]  = useState(false);

  const handleLogin = async () => {
    if (!staffId || !password) { setError('Please enter your ID and password'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await login(staffId.trim(), password.trim());
      if (!result.success) setError(result.error || 'Invalid credentials');
    } catch {
      setError('Cannot connect to server. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleLogin(); };

  const inputStyle = (focused) => ({
    width:         '100%',
    padding:       '11px 14px',
    background:    focused ? '#FAFBFF' : '#F8FAFC',
    border:        `1.5px solid ${focused ? '#2563EB' : '#E2E8F0'}`,
    borderRadius:  '9px',
    color:         '#0F172A',
    fontSize:      '14px',
    outline:       'none',
    boxSizing:     'border-box',
    transition:    'all 0.15s ease',
    boxShadow:     focused ? '0 0 0 3px rgba(37,99,235,0.10)' : 'none',
    fontFamily:    'inherit',
  });

  return (
    <div style={{
      minHeight:  '100vh',
      display:    'flex',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>

      {/* ══ LEFT PANEL — Branding ══ */}
      <div style={{
        flex:           1,
        background:     'linear-gradient(150deg, #0B1120 0%, #0F1F3D 50%, #0B1A2E 100%)',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        alignItems:     'center',
        padding:        '60px 48px',
        position:       'relative',
        overflow:       'hidden',
      }}>

        {/* Ambient orbs */}
        <div style={{
          position: 'absolute', top: '-120px', right: '-80px',
          width: '380px', height: '380px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '60%',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Top accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, #3B82F6, #0EA5E9, transparent)',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '380px', width: '100%' }}>

          {/* Logo */}
          <div style={{
            width:          '72px',
            height:         '72px',
            borderRadius:   '20px',
            background:     'linear-gradient(135deg, #1D4ED8, #3B82F6)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            margin:         '0 auto 28px',
            boxShadow:      '0 8px 32px rgba(37,99,235,0.4), 0 2px 8px rgba(0,0,0,0.2)',
          }} className="animate-float">
            <Shield size={32} color="white" strokeWidth={2} />
          </div>

          {/* Thin accent line */}
          <div style={{
            height: '1px', width: '40px', margin: '0 auto 24px',
            background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)',
          }} />

          <h1 style={{
            fontSize:     '38px',
            fontWeight:   '800',
            color:        '#F1F5F9',
            margin:       '0 0 6px',
            letterSpacing:'-1px',
            lineHeight:   '1.1',
          }}>
            ClinicalAI
          </h1>

          <p style={{
            color:         '#3B82F6',
            fontSize:      '11px',
            margin:        '0 0 20px',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            fontWeight:    '700',
          }}>
            Early Warning System
          </p>

          <p style={{
            color:      'rgba(148,163,184,0.8)',
            fontSize:   '14px',
            lineHeight: '1.7',
            margin:     '0 0 44px',
          }}>
            AI-powered real-time patient monitoring,
            intelligent triage, and early deterioration detection.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {STATS.map(({ Icon, value, label }) => (
              <div key={label} style={{
                flex:          1,
                padding:       '14px 10px',
                background:    'rgba(255,255,255,0.03)',
                border:        '1px solid rgba(255,255,255,0.06)',
                borderRadius:  '12px',
                textAlign:     'center',
              }}>
                <Icon size={16} color="#3B82F6" style={{ margin: '0 auto 6px', display: 'block' }} />
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#60A5FA', letterSpacing: '-0.5px' }}>
                  {value}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{
          position:  'absolute',
          bottom:    '20px',
          color:     '#1E293B',
          fontSize:  '11px',
          letterSpacing: '0.2px',
        }}>
          City General Hospital © 2026
        </p>
      </div>

      {/* ══ RIGHT PANEL — Login form ══ */}
      <div style={{
        width:          '460px',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        padding:        '56px 48px',
        background:     '#FFFFFF',
        boxShadow:      '-12px 0 40px rgba(0,0,0,0.08)',
        position:       'relative',
      }}>

        {/* Top blue accent */}
        <div style={{
          position:   'absolute',
          top:        0, left: 0, right: 0,
          height:     '3px',
          background: 'linear-gradient(90deg, #1D4ED8, #3B82F6, #0EA5E9)',
        }} />

        {/* Heading */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: '0 0 5px', letterSpacing: '-0.5px' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            Sign in to access your clinical dashboard
          </p>
        </div>

        {/* ID field */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{
            display: 'block', fontSize: '11px', fontWeight: '700',
            color: '#374151', marginBottom: '7px',
            textTransform: 'uppercase', letterSpacing: '0.6px',
          }}>
            Staff ID / Patient ID
          </label>
          <input
            type="text"
            value={staffId}
            onChange={e => setStaffId(e.target.value)}
            onKeyDown={handleKey}
            placeholder="e.g. DOC001, NRS001, PT-SIM-001"
            onFocus={() => setFocusId(true)}
            onBlur={() => setFocusId(false)}
            style={inputStyle(focusId)}
          />
        </div>

        {/* Password field */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{
            display: 'block', fontSize: '11px', fontWeight: '700',
            color: '#374151', marginBottom: '7px',
            textTransform: 'uppercase', letterSpacing: '0.6px',
          }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Enter your password"
              onFocus={() => setFocusPwd(true)}
              onBlur={() => setFocusPwd(false)}
              style={{ ...inputStyle(focusPwd), paddingRight: '42px' }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{
                position:   'absolute', right: '12px', top: '50%',
                transform:  'translateY(-50%)',
                background: 'none', border: 'none',
                cursor:     'pointer', color: '#94A3B8',
                display:    'flex', padding: '2px',
              }}
            >
              {showPass
                ? <EyeOff size={16} />
                : <Eye     size={16} />
              }
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background:   '#FEF2F2',
            border:       '1px solid #FECACA',
            borderRadius: '8px',
            padding:      '10px 14px',
            fontSize:     '13px',
            color:        '#B91C1C',
            marginBottom: '16px',
            display:      'flex',
            alignItems:   'center',
            gap:          '8px',
          }} className="animate-fade-in">
            <span style={{ fontSize: '15px' }}>⚠</span>
            {error}
          </div>
        )}

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width:         '100%',
            padding:       '13px',
            background:    loading ? '#E2E8F0' : 'linear-gradient(135deg, #1D4ED8, #2563EB)',
            color:         loading ? '#94A3B8' : 'white',
            border:        'none',
            borderRadius:  '9px',
            fontSize:      '14px',
            fontWeight:    '700',
            cursor:        loading ? 'not-allowed' : 'pointer',
            transition:    'all 0.2s ease',
            letterSpacing: '0.2px',
            boxShadow:     loading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
            fontFamily:    'inherit',
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            gap:           '8px',
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.45)'; }}}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)'; }}
        >
          {loading
            ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(148,163,175,0.3)', borderTopColor: '#94A3B8', borderRadius: '50%' }} className="animate-spin" /> Signing in…</>
            : 'Sign In →'
          }
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '22px 0 14px' }}>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Quick Access
          </span>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
        </div>

        {/* Quick login chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {QUICK_ACCOUNTS.map(acc => (
            <button
              key={acc.id}
              onClick={() => { setStaffId(acc.id); setPassword(acc.pass); setError(''); }}
              style={{
                padding:      '4px 12px',
                background:   `${acc.color}0D`,
                color:        acc.color,
                border:       `1px solid ${acc.color}22`,
                borderRadius: '20px',
                fontSize:     '11px',
                cursor:       'pointer',
                fontWeight:   '600',
                transition:   'all 0.12s ease',
                fontFamily:   'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${acc.color}1A`; e.currentTarget.style.borderColor = `${acc.color}44`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${acc.color}0D`; e.currentTarget.style.borderColor = `${acc.color}22`; }}
            >
              {acc.role[0]} · {acc.id}
            </button>
          ))}
        </div>

        {/* System status */}
        <div style={{
          marginTop:    '28px',
          padding:      '11px 14px',
          background:   '#F8FAFC',
          border:       '1px solid #E2E8F0',
          borderRadius: '9px',
          display:      'flex',
          alignItems:   'center',
          gap:          '10px',
        }}>
          <div className="status-dot live" />
          <div>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#0F172A' }}>System Online</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#64748B' }}>All services operational · v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
