// Layout.jsx — sidebar + topbar with Lucide icons

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Monitor, Bell, BarChart2,
  Database, FileText, Activity, Brain, ClipboardList,
  Home, Heart, LogOut, ChevronLeft, ChevronRight,
  AlertTriangle, Shield,
} from 'lucide-react';

// ── Navigation config ─────────────────────────────────────────────────────────
const NAV = {
  admin: [
    { id: 'dashboard', Icon: LayoutDashboard, label: 'Overview'    },
    { id: 'patients',  Icon: Users,           label: 'Patients'    },
    { id: 'monitor',   Icon: Monitor,         label: 'Live Monitor'},
    { id: 'alerts',    Icon: Bell,            label: 'Alerts'      },
    { id: 'analytics', Icon: BarChart2,       label: 'Analytics'   },
    { id: 'pipeline',  Icon: Database,        label: 'Pipeline'    },
  ],
  doctor: [
    { id: 'dashboard', Icon: LayoutDashboard, label: 'My Dashboard'},
    { id: 'patients',  Icon: Users,           label: 'My Patients' },
    { id: 'analyze',   Icon: Brain,           label: 'AI Analysis' },
    { id: 'alerts',    Icon: Bell,            label: 'Alerts'      },
    { id: 'reports',   Icon: FileText,        label: 'Reports'     },
  ],
  nurse: [
    { id: 'dashboard', Icon: LayoutDashboard, label: 'Ward Overview'},
    { id: 'monitor',   Icon: Monitor,         label: 'Live Vitals'  },
    { id: 'vitals',    Icon: Activity,        label: 'Enter Vitals' },
    { id: 'alerts',    Icon: Bell,            label: 'Alerts'       },
    { id: 'handover',  Icon: ClipboardList,   label: 'Handover'     },
  ],
  patient: [
    { id: 'dashboard', Icon: Home,    label: 'My Health'  },
    { id: 'vitals',    Icon: Heart,   label: 'My Vitals'  },
    { id: 'reports',   Icon: FileText,label: 'My Reports' },
  ],
};

const ROLE_META = {
  admin:   { color: '#7C3AED', label: 'Administrator', abbr: 'ADM' },
  doctor:  { color: '#2563EB', label: 'Physician',     abbr: 'DOC' },
  nurse:   { color: '#059669', label: 'Nurse',         abbr: 'NRS' },
  patient: { color: '#0891B2', label: 'Patient',       abbr: 'PAT' },
};

// ── Sidebar nav item ──────────────────────────────────────────────────────────
const NavItem = ({ item, isActive, alertCount, collapsed, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const showAlert = item.id === 'alerts' && alertCount > 0;

  const bg = isActive
    ? 'rgba(255,255,255,0.10)'
    : hovered
    ? 'rgba(255,255,255,0.05)'
    : 'transparent';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? item.label : undefined}
      style={{
        width:         '100%',
        display:       'flex',
        alignItems:    'center',
        gap:           '10px',
        padding:       collapsed ? '10px' : '9px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius:  '8px',
        border:        'none',
        borderLeft:    `2px solid ${isActive ? '#3B82F6' : 'transparent'}`,
        background:    bg,
        color:         isActive ? '#F1F5F9' : hovered ? '#CBD5E1' : '#64748B',
        cursor:        'pointer',
        marginBottom:  '1px',
        transition:    'all 0.15s ease',
        position:      'relative',
        flexShrink:    0,
      }}
    >
      <item.Icon
        size={16}
        strokeWidth={isActive ? 2.2 : 1.8}
        style={{ flexShrink: 0, color: isActive ? '#60A5FA' : 'inherit' }}
      />

      {!collapsed && (
        <span style={{
          fontSize:    '13px',
          fontWeight:  isActive ? '600' : '400',
          letterSpacing: '0.1px',
          flex: 1,
          textAlign: 'left',
        }}>
          {item.label}
        </span>
      )}

      {showAlert && !collapsed && (
        <span style={{
          background:   '#EF4444',
          color:        'white',
          borderRadius: '10px',
          padding:      '1px 7px',
          fontSize:     '10px',
          fontWeight:   '700',
          minWidth:     '20px',
          textAlign:    'center',
          flexShrink:   0,
        }} className="animate-alert">
          {alertCount > 99 ? '99+' : alertCount}
        </span>
      )}

      {showAlert && collapsed && (
        <div style={{
          position:     'absolute',
          top:          '4px',
          right:        '4px',
          width:        '8px',
          height:       '8px',
          borderRadius: '50%',
          background:   '#EF4444',
        }} className="animate-alert" />
      )}
    </button>
  );
};


// ── Main Layout component ─────────────────────────────────────────────────────
const Layout = ({ children, activePage, onNavigate, alertCount = 0 }) => {
  const { user, logout }    = useAuth();
  const [collapsed, setColl] = useState(false);

  const navItems   = NAV[user?.role]      || [];
  const roleMeta   = ROLE_META[user?.role] || ROLE_META.admin;
  const initials   = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'U';
  const activeLabel = navItems.find(n => n.id === activePage)?.label || 'Dashboard';

  const sideW = collapsed ? 64 : 236;

  return (
    <div style={{
      display:    'flex',
      minHeight:  '100vh',
      background: 'var(--bg)',
      fontFamily: 'inherit',
    }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width:         sideW,
        minWidth:      sideW,
        background:    'linear-gradient(180deg, #0B1120 0%, #0F172A 60%, #0B1120 100%)',
        display:       'flex',
        flexDirection: 'column',
        position:      'fixed',
        top:           0,
        left:          0,
        height:        '100vh',
        zIndex:        100,
        transition:    'width 0.28s cubic-bezier(0.4,0,0.2,1)',
        overflow:      'hidden',
        boxShadow:     '2px 0 20px rgba(0,0,0,0.2)',
        flexShrink:    0,
      }}>

        {/* Top accent line */}
        <div style={{
          height:     '2px',
          background: 'linear-gradient(90deg, transparent, #3B82F6, #0EA5E9, transparent)',
          flexShrink: 0,
        }} />

        {/* Logo */}
        <div style={{
          padding:      collapsed ? '16px 0' : '16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display:      'flex',
          alignItems:   'center',
          gap:          '10px',
          minHeight:    '68px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexShrink:   0,
        }}>
          <div style={{
            width:          '34px',
            height:         '34px',
            borderRadius:   '10px',
            background:     'linear-gradient(135deg, #1D4ED8, #3B82F6)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
            boxShadow:      '0 4px 12px rgba(59,130,246,0.35)',
          }}>
            <Shield size={18} color="white" strokeWidth={2.2} />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <p style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '14px', margin: 0, letterSpacing: '-0.2px' }}>
                ClinicalAI
              </p>
              <p style={{ color: '#334155', fontSize: '9px', margin: 0, letterSpacing: '1.2px', textTransform: 'uppercase', fontWeight: '600' }}>
                Early Warning
              </p>
            </div>
          )}
        </div>

        {/* User card */}
        {!collapsed && (
          <div style={{
            margin:       '10px 10px 0',
            padding:      '10px 12px',
            background:   'rgba(255,255,255,0.03)',
            border:       '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            flexShrink:   0,
          }} className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width:          '32px',
                height:         '32px',
                borderRadius:   '50%',
                background:     `linear-gradient(135deg, ${roleMeta.color}, ${roleMeta.color}BB)`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                color:          'white',
                fontSize:       '11px',
                fontWeight:     '700',
                flexShrink:     0,
                boxShadow:      `0 2px 8px ${roleMeta.color}40`,
              }}>
                {initials}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name}
                </p>
                <p style={{ margin: 0, fontSize: '9px', fontWeight: '700', color: roleMeta.color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {roleMeta.label}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', margin: '10px 10px 4px', flexShrink: 0 }} />

        {/* Nav label */}
        {!collapsed && (
          <p style={{
            fontSize: '9px', fontWeight: '700', color: '#1E3A5F',
            textTransform: 'uppercase', letterSpacing: '1.2px',
            padding: '4px 22px 2px', margin: 0, flexShrink: 0,
          }}>
            Navigation
          </p>
        )}

        {/* Nav items */}
        <nav style={{
          flex:      1,
          padding:   collapsed ? '4px 8px' : '4px 10px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activePage === item.id}
              alertCount={alertCount}
              collapsed={collapsed}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </nav>

        {/* Bottom actions */}
        <div style={{
          padding:    '8px 10px 12px',
          borderTop:  '1px solid rgba(255,255,255,0.04)',
          flexShrink: 0,
          display:    'flex',
          flexDirection: 'column',
          gap:        '4px',
        }}>
          {!collapsed && (
            <button
              onClick={logout}
              style={{
                width:        '100%',
                padding:      '8px 12px',
                background:   'rgba(239,68,68,0.07)',
                border:       '1px solid rgba(239,68,68,0.15)',
                borderRadius: '8px',
                color:        '#FDA4AF',
                cursor:       'pointer',
                fontSize:     '12px',
                fontWeight:   '600',
                display:      'flex',
                alignItems:   'center',
                gap:          '8px',
                transition:   'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)'; e.currentTarget.style.color = '#FCA5A5'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; e.currentTarget.style.color = '#FDA4AF';  }}
            >
              <LogOut size={14} strokeWidth={2} />
              Sign Out
            </button>
          )}

          <button
            onClick={() => setColl(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              width:        '100%',
              padding:      '8px',
              background:   'rgba(255,255,255,0.03)',
              border:       '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              color:        '#334155',
              cursor:       'pointer',
              fontSize:     '11px',
              display:      'flex',
              alignItems:   'center',
              justifyContent: collapsed ? 'center' : 'center',
              gap:          '6px',
              transition:   'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            {collapsed
              ? <ChevronRight size={14} color="#475569" />
              : <><ChevronLeft size={14} color="#475569" /><span style={{color:'#475569'}}>Collapse</span></>
            }
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{
        marginLeft:    sideW,
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        minHeight:     '100vh',
        minWidth:      0,
        transition:    'margin-left 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* Top bar */}
        <header style={{
          background:     'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom:   '1px solid var(--border)',
          padding:        '0 28px',
          height:         '60px',
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          position:       'sticky',
          top:            0,
          zIndex:         50,
          boxShadow:      '0 1px 0 var(--border), var(--shadow-xs)',
          flexShrink:     0,
        }}>
          {/* Left: page title */}
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', margin: 0, letterSpacing: '-0.2px' }}>
              {activeLabel}
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '1px 0 0' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Right: status + user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Live indicator */}
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '6px',
              background:   'var(--success-bg)',
              border:       '1px solid var(--success-border)',
              borderRadius: 'var(--r-full)',
              padding:      '4px 12px',
            }}>
              <div className="status-dot live" />
              <span style={{ color: 'var(--success)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>
                LIVE
              </span>
            </div>

            {/* Alerts bell */}
            {alertCount > 0 && (
              <div style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '5px',
                background:   'var(--danger-bg)',
                border:       '1px solid var(--danger-border)',
                borderRadius: 'var(--r-full)',
                padding:      '4px 10px',
                cursor:       'pointer',
              }}
              onClick={() => onNavigate('alerts')}
              >
                <AlertTriangle size={12} color="var(--danger)" strokeWidth={2.5} />
                <span style={{ color: 'var(--danger)', fontSize: '11px', fontWeight: '700' }}>
                  {alertCount} Alert{alertCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* User chip */}
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              background:   'var(--bg-soft)',
              border:       '1px solid var(--border)',
              borderRadius: 'var(--r-full)',
              padding:      '5px 14px 5px 6px',
              boxShadow:    'var(--shadow-xs)',
            }}>
              <div style={{
                width:          '28px',
                height:         '28px',
                borderRadius:   '50%',
                background:     `linear-gradient(135deg, ${roleMeta.color}, ${roleMeta.color}BB)`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                color:          'white',
                fontSize:       '10px',
                fontWeight:     '700',
              }}>
                {initials}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>{user?.name}</p>
                <p style={{ margin: 0, fontSize: '9px', color: roleMeta.color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {roleMeta.label}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px', overflowY: 'auto', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
