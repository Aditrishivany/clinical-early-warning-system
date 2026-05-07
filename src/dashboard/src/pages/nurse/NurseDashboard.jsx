import { useState, useEffect } from 'react';
import { Heart, Bell, Monitor, ClipboardList, Users, AlertTriangle, BarChart2, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats, getHighRiskPatients, getActiveAlerts } from '../../services/api';
import PatientMonitorCard from '../../components/PatientMonitorCard';

const QUICK_ACTIONS = [
  { label: 'Enter Vitals',   Icon: Heart,          page: 'vitals',   color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
  { label: 'View Alerts',    Icon: Bell,            page: 'alerts',   color: '#dc2626', bg: '#fff5f5', border: '#fecaca' },
  { label: 'Live Monitor',   Icon: Monitor,         page: 'monitor',  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { label: 'Shift Handover', Icon: ClipboardList,   page: 'handover', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
];

const NurseDashboard = ({ onNavigate, onSelectPatient }) => {
  const { user }                  = useAuth();
  const [patients, setPatients]   = useState([]);
  const [stats,    setStats]      = useState(null);
  const [alerts,   setAlerts]     = useState([]);
  const [time,     setTime]       = useState(new Date());

  useEffect(() => {
    fetchData();
    const dataId  = setInterval(fetchData, 15_000);
    const clockId = setInterval(() => setTime(new Date()), 1_000);
    return () => { clearInterval(dataId); clearInterval(clockId); };
  }, []);

  const fetchData = async () => {
    try {
      const [p, s, a] = await Promise.all([
        getHighRiskPatients(),
        getDashboardStats(),
        getActiveAlerts(),
      ]);
      setPatients(p.patients || []);
      setStats(s);
      setAlerts(a.alerts   || []);
    } catch (err) { console.error(err); }
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');

  const STAT_ROW = [
    { label: 'Patients in Ward', value: stats?.total_patients ?? 0, color: '#059669', Icon: Users         },
    { label: 'Need Attention',   value: stats?.high_risk      ?? 0, color: '#dc2626', Icon: AlertTriangle  },
    { label: 'Active Alerts',    value: stats?.active_alerts  ?? 0, color: '#7c3aed', Icon: Bell           },
    { label: 'Vitals Recorded',  value: stats?.total_readings ?? 0, color: '#0891b2', Icon: BarChart2      },
  ];

  return (
    <div className="animate-fade">

      {/* ── Nurse Header Banner ── */}
      <div style={{
        background:     'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
        borderRadius:   'var(--r-xl)',
        padding:        '22px 28px',
        marginBottom:   '20px',
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        position:       'relative',
        overflow:       'hidden',
        color:          'white',
      }}>
        <div style={{
          position: 'absolute', right: '-40px', top: '-40px',
          width: '160px', height: '160px', borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.07)', pointerEvents: 'none',
        }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Heart size={16} color="white" />
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>{user?.name}</h2>
          </div>
          <p style={{ margin: 0, opacity: 0.75, fontSize: '13px' }}>
            Ward: {user?.ward} · Shift: {user?.shift}
          </p>
        </div>

        <div style={{ textAlign: 'right', position: 'relative' }}>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>
            {time.toLocaleTimeString()}
          </p>
          {criticalAlerts.length > 0 && (
            <div style={{
              background: 'rgba(220,38,38,0.85)',
              borderRadius: '8px',
              padding: '4px 12px',
              marginTop: '6px',
              fontSize: '11px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <AlertTriangle size={12} />
              {criticalAlerts.length} CRITICAL ALERT{criticalAlerts.length > 1 ? 'S' : ''}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.label}
            onClick={() => onNavigate(action.page)}
            style={{
              flex: 1, padding: '16px',
              background: action.bg,
              border: `1px solid ${action.border}`,
              borderRadius: 'var(--r-md)',
              cursor: 'pointer', textAlign: 'center',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: `${action.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 8px',
            }}>
              <action.Icon size={17} color={action.color} />
            </div>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: action.color }}>
              {action.label}
            </p>
          </button>
        ))}
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {STAT_ROW.map(s => (
          <div key={s.label} className="card" style={{ padding: '16px', flex: 1, borderLeft: `4px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {s.label}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: '800', color: s.color }}>
                  {s.value}
                </p>
              </div>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: `${s.color}12`, border: `1px solid ${s.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <s.Icon size={16} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Critical Alert Banner ── */}
      {criticalAlerts.length > 0 && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5',
          borderRadius: 'var(--r-md)', padding: '16px', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <AlertTriangle size={16} color="#dc2626" />
            <h3 style={{ margin: 0, color: '#dc2626', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Critical Alerts — Immediate Action Required
            </h3>
          </div>
          {criticalAlerts.slice(0, 3).map((alert, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 'var(--r-sm)',
              padding: '10px 12px', marginBottom: '6px',
              border: '1px solid #fecaca',
            }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#dc2626' }}>
                Patient: {alert.patient_id} — {alert.type}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>{alert.message}</p>
              {alert.action && (
                <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>
                  Action: {alert.action}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Patient Monitor Cards ── */}
      <div className="card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: '#eff6ff', border: '1px solid #bfdbfe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Monitor size={14} color="var(--blue)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>Ward Patients — Live Status</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Updates every 15 seconds</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <div className="status-dot live" style={{ display: 'inline-block' }} />
          </div>
        </div>

        {patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '44px', color: 'var(--text-muted)' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
            }}>
              <Activity size={20} color="var(--blue)" />
            </div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', margin: '0 0 4px' }}>No patients monitored yet</p>
            <p style={{ fontSize: '12px', margin: 0 }}>Run: python scripts/simulate_realtime.py</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '12px',
          }}>
            {patients.map((p, i) => (
              <PatientMonitorCard
                key={i}
                patient={p}
                onClick={() => onSelectPatient(p.patient_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NurseDashboard;
