// File: src/dashboard/src/components/Layout.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const NAV_CONFIG = {
  admin: [
    { id:'dashboard', icon:'▣', label:'Overview'      },
    { id:'patients',  icon:'◈', label:'All Patients'  },
    { id:'monitor',   icon:'◎', label:'Live Monitor'  },
    { id:'alerts',    icon:'◉', label:'Alerts'        },
    { id:'analytics', icon:'◆', label:'Analytics'     },
    { id:'pipeline',  icon:'⬡', label:'Data Pipeline' },
  ],
  doctor: [
    { id:'dashboard', icon:'▣', label:'My Dashboard'  },
    { id:'patients',  icon:'◈', label:'My Patients'   },
    { id:'analyze',   icon:'◎', label:'AI Analysis'   },
    { id:'alerts',    icon:'◉', label:'Alerts'        },
    { id:'reports',   icon:'◆', label:'Reports'       },
    { id:'qa',        icon:'◇', label:'Clinical Q&A'  },
  ],
  nurse: [
    { id:'dashboard', icon:'▣', label:'Ward Overview' },
    { id:'monitor',   icon:'◎', label:'Live Vitals'   },
    { id:'vitals',    icon:'◈', label:'Enter Vitals'  },
    { id:'alerts',    icon:'◉', label:'Alerts'        },
    { id:'handover',  icon:'◆', label:'Handover'      },
  ],
  patient: [
    { id:'dashboard', icon:'▣', label:'My Health'     },
    { id:'vitals',    icon:'◈', label:'My Vitals'     },
    { id:'reports',   icon:'◆', label:'My Reports'    },
    { id:'ask',       icon:'◇', label:'Ask AI'        },
  ],
};

const ROLE_CONFIG = {
  admin:   { color:'#7c3aed', label:'Administrator', bg:'rgba(124,58,237,0.08)', border:'rgba(124,58,237,0.15)' },
  doctor:  { color:'#1e40af', label:'Physician',     bg:'rgba(30,64,175,0.08)',  border:'rgba(30,64,175,0.15)'  },
  nurse:   { color:'#065f46', label:'Nurse',         bg:'rgba(6,95,70,0.08)',    border:'rgba(6,95,70,0.15)'    },
  patient: { color:'#0e7490', label:'Patient',       bg:'rgba(14,116,144,0.08)', border:'rgba(14,116,144,0.15)' },
};

const Layout = ({ children, activePage, onNavigate, alertCount = 0 }) => {
  const { user, logout }  = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const navItems   = NAV_CONFIG[user?.role]  || [];
  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.admin;

  return (
    <div style={{ display:'flex', minHeight:'100vh', backgroundColor:'var(--bg)', fontFamily:"'Inter',sans-serif" }}>

      {/* ── Sidebar ── */}
      <div style={{
        width:      collapsed ? '64px' : '240px',
        background: 'linear-gradient(180deg, #0c1445 0%, #0e1654 50%, #0c1445 100%)',
        display:    'flex',
        flexDirection:'column',
        position:   'fixed',
        top:0, left:0,
        height:     '100vh',
        zIndex:     100,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflow:   'hidden',
        boxShadow:  '4px 0 24px rgba(0,0,0,0.12)',
      }}>

        {/* Gold accent line at top */}
        <div style={{
          height:     '2px',
          background: 'linear-gradient(90deg, #b8960c, #d4af37, #b8960c)',
          backgroundSize:'200% auto',
          animation:  'goldShimmer 3s linear infinite',
        }}/>

        {/* Logo */}
        <div style={{
          padding:      '18px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display:      'flex',
          alignItems:   'center',
          gap:          '12px',
          minHeight:    '70px',
        }}>
          <div style={{
            width:          '34px',
            height:         '34px',
            borderRadius:   '10px',
            background:     'linear-gradient(135deg, #1e40af, #3b82f6)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '16px',
            flexShrink:     0,
            boxShadow:      '0 4px 12px rgba(30,64,175,0.4)',
          }}>
            🏥
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <p style={{
                color:'#ffffff', fontWeight:'700',
                fontSize:'15px', margin:0,
                letterSpacing:'-0.3px',
              }}>
                ClinicalAI
              </p>
              <p style={{
                color:'rgba(255,255,255,0.35)', fontSize:'9px',
                margin:0, letterSpacing:'1.5px', textTransform:'uppercase',
              }}>
                Early Warning System
              </p>
            </div>
          )}
        </div>

        {/* User Card */}
        {!collapsed && (
          <div style={{
            margin:     '12px',
            padding:    '12px',
            background: 'rgba(255,255,255,0.04)',
            border:     '1px solid rgba(255,255,255,0.08)',
            borderRadius:'var(--radius-md)',
            animation:  'fadeIn 0.4s ease',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{
                width:'36px', height:'36px', borderRadius:'50%',
                background:`linear-gradient(135deg, ${roleConfig.color}, ${roleConfig.color}aa)`,
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', fontSize:'12px', fontWeight:'700', flexShrink:0,
                boxShadow:`0 2px 8px ${roleConfig.color}40`,
              }}>
                {user?.avatar}
              </div>
              <div style={{ overflow:'hidden' }}>
                <p style={{
                  margin:0, fontSize:'12px', fontWeight:'600',
                  color:'#ffffff', whiteSpace:'nowrap',
                  overflow:'hidden', textOverflow:'ellipsis',
                }}>
                  {user?.name}
                </p>
                <p style={{
                  margin:0, fontSize:'9px', fontWeight:'700',
                  color: roleConfig.color === '#0c1445' ? '#d4af37' : roleConfig.color,
                  textTransform:'uppercase', letterSpacing:'0.8px',
                }}>
                  {roleConfig.label}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ height:'1px', background:'rgba(255,255,255,0.05)', margin:'0 12px' }}/>

        {/* Nav */}
        <nav style={{ flex:1, padding:'8px', overflowY:'auto', marginTop:'4px' }}>
          {!collapsed && (
            <p style={{
              fontSize:'9px', fontWeight:'700', color:'rgba(255,255,255,0.25)',
              textTransform:'uppercase', letterSpacing:'1.5px',
              padding:'8px 12px 4px', margin:0,
            }}>
              Navigation
            </p>
          )}
          {navItems.map((item, i) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  width:         '100%',
                  display:       'flex',
                  alignItems:    'center',
                  gap:           '10px',
                  padding:       '9px 12px',
                  justifyContent:collapsed ? 'center' : 'flex-start',
                  borderRadius:  'var(--radius-sm)',
                  border:        'none',
                  background:    isActive
                    ? 'rgba(255,255,255,0.1)'
                    : 'transparent',
                  color:         isActive
                    ? '#ffffff'
                    : 'rgba(255,255,255,0.45)',
                  cursor:        'pointer',
                  marginBottom:  '1px',
                  transition:    'all 0.2s ease',
                  borderLeft:    isActive
                    ? '2px solid #d4af37'
                    : '2px solid transparent',
                  animation:     `slideRight 0.3s ease ${i*0.04}s both`,
                  position:      'relative',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                  }
                }}
              >
                <span style={{
                  fontSize:'14px', minWidth:'18px', textAlign:'center',
                  color: isActive ? '#d4af37' : 'inherit',
                }}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span style={{
                    fontSize:'13px',
                    fontWeight: isActive ? '600' : '400',
                    letterSpacing:'0.1px',
                  }}>
                    {item.label}
                  </span>
                )}
                {item.id === 'alerts' && alertCount > 0 && !collapsed && (
                  <span style={{
                    marginLeft:   'auto',
                    background:   'linear-gradient(135deg, #991b1b, #dc2626)',
                    color:        'white',
                    borderRadius: '10px',
                    padding:      '1px 7px',
                    fontSize:     '10px',
                    fontWeight:   '700',
                    animation:    'alertBlink 1.5s infinite',
                  }}>
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'8px 8px 12px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          {!collapsed && (
            <button
              onClick={logout}
              style={{
                width:'100%', padding:'9px 12px', marginBottom:'6px',
                background:'rgba(220,38,38,0.08)',
                border:'1px solid rgba(220,38,38,0.15)',
                borderRadius:'var(--radius-sm)',
                color:'#fca5a5', cursor:'pointer',
                fontSize:'12px', fontWeight:'600',
                display:'flex', alignItems:'center', gap:'8px',
                transition:'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(220,38,38,0.15)';
                e.currentTarget.style.color = '#f87171';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(220,38,38,0.08)';
                e.currentTarget.style.color = '#fca5a5';
              }}
            >
              ⊗ Sign Out
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width:'100%', padding:'8px',
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:'var(--radius-sm)',
              color:'rgba(255,255,255,0.3)', cursor:'pointer',
              fontSize:'11px', transition:'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            {collapsed ? '→' : '← Collapse'}
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{
        marginLeft:    collapsed ? '64px' : '240px',
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        minHeight:     '100vh',
        transition:    'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* Top Bar */}
        <div style={{
          background:    'rgba(255,255,255,0.95)',
          backdropFilter:'blur(20px)',
          borderBottom:  '1px solid var(--border)',
          padding:       '0 28px',
          height:        '64px',
          display:       'flex',
          justifyContent:'space-between',
          alignItems:    'center',
          position:      'sticky',
          top:0, zIndex:50,
          boxShadow:     '0 1px 0 var(--border), var(--shadow-xs)',
        }}>
          <div>
            <h2 style={{
              fontSize:'15px', fontWeight:'700',
              color:'var(--text)', margin:0, letterSpacing:'-0.2px',
            }}>
              {navItems.find(n => n.id === activePage)?.label || 'Dashboard'}
            </h2>
            <p style={{ fontSize:'11px', color:'var(--text-muted)', margin:'1px 0 0' }}>
              {new Date().toLocaleDateString('en-US', {
                weekday:'long', year:'numeric',
                month:'long', day:'numeric',
              })}
            </p>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            {/* Live */}
            <div style={{
              display:'flex', alignItems:'center', gap:'6px',
              background:'#ecfdf5', border:'1px solid #a7f3d0',
              borderRadius:'20px', padding:'5px 12px',
            }}>
              <div style={{
                width:'7px', height:'7px', borderRadius:'50%',
                background:'#10b981',
                boxShadow:'0 0 0 2px rgba(16,185,129,0.2)',
              }} className="animate-pulse"/>
              <span style={{ color:'#065f46', fontSize:'11px', fontWeight:'700', letterSpacing:'0.5px' }}>
                LIVE
              </span>
            </div>

            {/* User */}
            <div style={{
              display:'flex', alignItems:'center', gap:'10px',
              background:'var(--bg-soft)', border:'1px solid var(--border)',
              borderRadius:'20px', padding:'6px 14px 6px 8px',
              boxShadow:'var(--shadow-xs)',
            }}>
              <div style={{
                width:'30px', height:'30px', borderRadius:'50%',
                background:`linear-gradient(135deg, ${roleConfig.color}, ${roleConfig.color}bb)`,
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', fontSize:'11px', fontWeight:'700',
                boxShadow:`0 2px 6px ${roleConfig.color}30`,
              }}>
                {user?.avatar}
              </div>
              <div>
                <p style={{ margin:0, fontSize:'12px', fontWeight:'600', color:'var(--text)' }}>
                  {user?.name}
                </p>
                <p style={{
                  margin:0, fontSize:'10px', color:roleConfig.color,
                  fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px',
                }}>
                  {roleConfig.label}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, padding:'28px', overflowY:'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;