// File: src/dashboard/src/pages/LoginPage.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { id:'ADM001',     pass:'admin123',   role:'Admin',   color:'#7c3aed', icon:'👨‍💼' },
  { id:'DOC001',     pass:'doctor123',  role:'Doctor',  color:'#1e40af', icon:'👨‍⚕️' },
  { id:'DOC002',     pass:'doctor123',  role:'Doctor',  color:'#1e40af', icon:'👨‍⚕️' },
  { id:'NRS001',     pass:'nurse123',   role:'Nurse',   color:'#065f46', icon:'👩‍⚕️' },
  { id:'NRS002',     pass:'nurse123',   role:'Nurse',   color:'#065f46', icon:'👩‍⚕️' },
  { id:'PT-SIM-001', pass:'patient123', role:'Patient', color:'#0e7490', icon:'🤒'  },
  { id:'PT-SIM-002', pass:'patient123', role:'Patient', color:'#0e7490', icon:'🤒'  },
  { id:'PT-SIM-003', pass:'patient123', role:'Patient', color:'#0e7490', icon:'🤒'  },
];

const LoginPage = () => {
  const { login }    = useAuth();
  const [staffId,  setStaffId]  = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [focusId,  setFocusId]  = useState(false);
  const [focusPwd, setFocusPwd] = useState(false);

  const handleLogin = async () => {
    if (!staffId || !password) { setError('Please enter your ID and password'); return; }
    setLoading(true); setError('');
    try {
      const result = await login(staffId.trim(), password.trim());
      if (!result.success) setError(result.error || 'Invalid credentials');
    } catch { setError('Cannot connect. Is the server running?'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:  '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 40%, #fff8f0 100%)',
      display:    'flex',
      fontFamily: "'Inter', sans-serif",
      position:   'relative',
      overflow:   'hidden',
    }}>

      {/* Left Panel — Branding */}
      <div style={{
        flex:           1,
        background:     'linear-gradient(160deg, #0c1445 0%, #0e1a5e 40%, #162074 100%)',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        alignItems:     'center',
        padding:        '60px',
        position:       'relative',
        overflow:       'hidden',
      }}>

        {/* Gold accent */}
        <div style={{
          position:'absolute', top:0, left:0, right:0,
          height:'2px',
          background:'linear-gradient(90deg, transparent, #d4af37, transparent)',
        }}/>

        {/* Decorative circles */}
        <div style={{
          position:'absolute', top:'-100px', right:'-100px',
          width:'400px', height:'400px', borderRadius:'50%',
          border:'1px solid rgba(212,175,55,0.08)',
          pointerEvents:'none',
        }}/>
        <div style={{
          position:'absolute', bottom:'-80px', left:'-80px',
          width:'300px', height:'300px', borderRadius:'50%',
          border:'1px solid rgba(59,130,246,0.1)',
          pointerEvents:'none',
        }}/>
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          width:'600px', height:'600px', borderRadius:'50%',
          background:'radial-gradient(circle, rgba(30,64,175,0.15) 0%, transparent 70%)',
          pointerEvents:'none',
        }}/>

        {/* Content */}
        <div style={{ position:'relative', textAlign:'center', maxWidth:'400px' }}>

          {/* Hospital Icon */}
          <div style={{
            width:'80px', height:'80px', borderRadius:'20px',
            background:'linear-gradient(135deg, #1e40af, #3b82f6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'36px', margin:'0 auto 28px',
            boxShadow:'0 8px 32px rgba(30,64,175,0.4)',
          }} className="animate-float">
            🏥
          </div>

          {/* Gold line */}
          <div style={{
            height:'1px', width:'60px', margin:'0 auto 24px',
            background:'linear-gradient(90deg, transparent, #d4af37, transparent)',
          }}/>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize:   '36px',
            fontWeight: '700',
            color:      '#ffffff',
            margin:     '0 0 8px',
            letterSpacing:'-0.5px',
            lineHeight: '1.2',
          }}>
            ClinicalAI
          </h1>

          <p style={{
            color:        'rgba(212,175,55,0.9)',
            fontSize:     '12px',
            margin:       '0 0 20px',
            letterSpacing:'3px',
            textTransform:'uppercase',
            fontWeight:   '600',
          }}>
            Early Warning System
          </p>

          <p style={{
            color:      'rgba(255,255,255,0.45)',
            fontSize:   '14px',
            lineHeight: '1.7',
            margin:     '0 0 40px',
          }}>
            AI-powered clinical intelligence for real-time patient monitoring, triage, and early warning detection.
          </p>

          {/* Stats */}
          <div style={{ display:'flex', gap:'24px', justifyContent:'center' }}>
            {[
              { value:'99.9%', label:'Uptime'     },
              { value:'<2s',   label:'Response'   },
              { value:'5+',    label:'AI Agents'  },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign:'center' }}>
                <p style={{
                  margin:0, fontSize:'20px', fontWeight:'800',
                  color:'#d4af37', letterSpacing:'-0.5px',
                }}>
                  {stat.value}
                </p>
                <p style={{ margin:'2px 0 0', fontSize:'10px', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'1px' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p style={{
          position:'absolute', bottom:'24px',
          color:'rgba(255,255,255,0.2)', fontSize:'11px', letterSpacing:'0.3px',
        }}>
          City General Hospital © 2026
        </p>
      </div>

      {/* Right Panel — Login Form */}
      <div style={{
        width:          '480px',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        padding:        '60px 50px',
        background:     '#ffffff',
        boxShadow:      '-8px 0 48px rgba(0,0,0,0.06)',
        position:       'relative',
      }}>

        {/* Gold top line */}
        <div style={{
          position:'absolute', top:0, left:0, right:0,
          height:'3px',
          background:'linear-gradient(90deg, #b8960c, #d4af37, #b8960c)',
        }}/>

        <div style={{ marginBottom:'36px' }}>
          <h2 style={{
            fontSize:'26px', fontWeight:'800',
            color:'var(--text)', margin:'0 0 6px',
            letterSpacing:'-0.5px',
          }}>
            Welcome Back
          </h2>
          <p style={{ fontSize:'14px', color:'var(--text-muted)', margin:0 }}>
            Sign in to access your clinical dashboard
          </p>
        </div>

        {/* Staff ID */}
        <div style={{ marginBottom:'16px' }}>
          <label style={{
            display:'block', fontSize:'11px', fontWeight:'700',
            color:'var(--text-secondary)', marginBottom:'8px',
            textTransform:'uppercase', letterSpacing:'0.8px',
          }}>
            Staff ID / Patient ID
          </label>
          <input
            type="text"
            value={staffId}
            onChange={e => setStaffId(e.target.value)}
            placeholder="e.g. DOC001, NRS001, PT-SIM-001"
            onFocus={() => setFocusId(true)}
            onBlur={() => setFocusId(false)}
            style={{
              width:'100%', padding:'12px 16px',
              background: focusId ? '#f8faff' : '#fafbfd',
              border:`1.5px solid ${focusId ? '#1e40af' : 'var(--border)'}`,
              borderRadius:'var(--radius-sm)',
              color:'var(--text)', fontSize:'14px', outline:'none',
              boxSizing:'border-box', transition:'all 0.2s ease',
              boxShadow: focusId ? '0 0 0 3px rgba(30,64,175,0.08)' : 'none',
              fontFamily:"'Inter',sans-serif",
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom:'24px' }}>
          <label style={{
            display:'block', fontSize:'11px', fontWeight:'700',
            color:'var(--text-secondary)', marginBottom:'8px',
            textTransform:'uppercase', letterSpacing:'0.8px',
          }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Enter your password"
            onFocus={() => setFocusPwd(true)}
            onBlur={() => setFocusPwd(false)}
            style={{
              width:'100%', padding:'12px 16px',
              background: focusPwd ? '#f8faff' : '#fafbfd',
              border:`1.5px solid ${focusPwd ? '#1e40af' : 'var(--border)'}`,
              borderRadius:'var(--radius-sm)',
              color:'var(--text)', fontSize:'14px', outline:'none',
              boxSizing:'border-box', transition:'all 0.2s ease',
              boxShadow: focusPwd ? '0 0 0 3px rgba(30,64,175,0.08)' : 'none',
              fontFamily:"'Inter',sans-serif",
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background:'#fef2f2', border:'1px solid #fecaca',
            borderRadius:'var(--radius-sm)', padding:'10px 14px',
            fontSize:'13px', color:'#991b1b', marginBottom:'16px',
            animation:'fadeIn 0.2s ease',
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width:'100%', padding:'14px',
            background: loading
              ? '#e5e7eb'
              : 'linear-gradient(135deg, #0c1445, #1e40af)',
            color:        loading ? '#9ca3af' : 'white',
            border:       'none',
            borderRadius: 'var(--radius-sm)',
            fontSize:     '14px',
            fontWeight:   '700',
            cursor:       loading ? 'not-allowed' : 'pointer',
            transition:   'all 0.25s ease',
            letterSpacing:'0.3px',
            boxShadow:    loading ? 'none' : '0 4px 16px rgba(12,20,69,0.3)',
            fontFamily:   "'Inter',sans-serif",
          }}
          onMouseEnter={e => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(12,20,69,0.4)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 16px rgba(12,20,69,0.3)';
          }}
        >
          {loading ? (
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
              <span style={{
                width:'14px', height:'14px',
                border:'2px solid rgba(156,163,175,0.3)',
                borderTopColor:'#9ca3af',
                borderRadius:'50%',
                display:'inline-block',
                animation:'spin 0.8s linear infinite',
              }}/>
              Signing in...
            </span>
          ) : 'Sign In →'}
        </button>

        {/* Gold divider */}
        <div style={{
          display:'flex', alignItems:'center', gap:'12px', margin:'24px 0 16px',
        }}>
          <div style={{ flex:1, height:'1px', background:'var(--border)' }}/>
          <span style={{ fontSize:'10px', color:'var(--text-muted)', fontWeight:'600', textTransform:'uppercase', letterSpacing:'1px' }}>
            Quick Access
          </span>
          <div style={{ flex:1, height:'1px', background:'var(--border)' }}/>
        </div>

        {/* Demo Accounts */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
          {DEMO_ACCOUNTS.map(acc => (
            <button
              key={acc.id}
              onClick={() => { setStaffId(acc.id); setPassword(acc.pass); setError(''); }}
              style={{
                padding:'5px 12px',
                background:`${acc.color}08`,
                color:acc.color,
                border:`1px solid ${acc.color}20`,
                borderRadius:'20px',
                fontSize:'11px', cursor:'pointer',
                fontWeight:'600', transition:'all 0.15s ease',
                fontFamily:"'Inter',sans-serif",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `${acc.color}15`;
                e.currentTarget.style.borderColor = `${acc.color}40`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = `${acc.color}08`;
                e.currentTarget.style.borderColor = `${acc.color}20`;
              }}
            >
              {acc.icon} {acc.id}
            </button>
          ))}
        </div>

        {/* System Status */}
        <div style={{
          marginTop:'32px', padding:'12px 16px',
          background:'#f8faff', border:'1px solid #e8ecf8',
          borderRadius:'var(--radius-sm)',
          display:'flex', alignItems:'center', gap:'10px',
        }}>
          <div style={{
            width:'8px', height:'8px', borderRadius:'50%',
            background:'#10b981',
            boxShadow:'0 0 0 2px rgba(16,185,129,0.2)',
          }} className="animate-pulse"/>
          <div>
            <p style={{ margin:0, fontSize:'12px', fontWeight:'600', color:'var(--text)' }}>
              System Online
            </p>
            <p style={{ margin:0, fontSize:'10px', color:'var(--text-muted)' }}>
              All services operational · v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;