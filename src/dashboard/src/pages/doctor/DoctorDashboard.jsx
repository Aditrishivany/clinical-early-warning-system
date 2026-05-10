import { useState, useEffect, useCallback } from 'react';
import { Users, AlertTriangle, Bell, BarChart2, Plus, Activity, Stethoscope } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getHighRiskPatients, getDashboardStats, getActiveAlerts } from '../../services/api';
import RiskBadge from '../../components/RiskBadge';

const RISK_COLOR = { High: '#dc2626', Medium: '#d97706', Low: '#059669' };

const DoctorDashboard = ({ onNavigate, onSelectPatient }) => {
  const { user }                  = useAuth();
  const [patients, setPatients]   = useState([]);
  const [stats,    setStats]      = useState(null);
  const [alerts,   setAlerts]     = useState([]);
  const assignedPatientIds        = user?.assigned_patients || [];

  const fetchData = useCallback(async () => {
    try {
      const [p, s, a] = await Promise.all([
        getHighRiskPatients(),
        getDashboardStats(),
        getActiveAlerts(),
      ]);
      const assigned = user?.assigned_patients || [];
      const scopedPatients = (p.patients || []).filter(patient => assigned.includes(patient.patient_id));
      const scopedAlerts = (a.alerts || []).filter(alert => assigned.includes(alert.patient_id));

      setPatients(scopedPatients);
      setStats(s);
      setAlerts(scopedAlerts);
    } catch (err) { console.error(err); }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData, user]);

  const QUICK_STATS = [
    { label: 'My Patients', value: assignedPatientIds.length, color: '#2563EB', Icon: Users },    
    { label: 'Critical Now',   value: stats?.high_risk      ?? 0,  color: '#DC2626', Icon: AlertTriangle  },
    { label: 'My Alerts',      value: alerts.length,                color: '#7C3AED', Icon: Bell           },
    { label: 'Total Readings', value: stats?.total_readings ?? 0,   color: '#059669', Icon: BarChart2      },
  ];

  return (
    <div className="animate-fade">

      {/* ── Welcome Banner ── */}
      <div style={{
        background:     'linear-gradient(135deg, #1e3a5f 0%, #2563EB 100%)',
        borderRadius:   'var(--r-xl)',
        padding:        '22px 28px',
        marginBottom:   '20px',
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        position:       'relative',
        overflow:       'hidden',
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
              <Stethoscope size={16} color="white" />
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'white' }}>
              Welcome, {user?.name}
            </h2>
          </div>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '13px', color: 'white' }}>
            {user?.specialty} · {user?.hospital}
          </p>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.12)',
          borderRadius: '14px',
          padding: '14px 22px',
          textAlign: 'center',
          backdropFilter: 'blur(4px)',
        }}>
          <p style={{ margin: 0, fontSize: '30px', fontWeight: '800', color: 'white', lineHeight: 1 }}>
            {patients.length}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>
            Need Attention
          </p>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {QUICK_STATS.map(s => (
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

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Patient List */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>My Patients</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>High-risk patients assigned to you</p>
            </div>
            <button
              onClick={() => onNavigate('analyze')}
              className="btn btn-primary"
              style={{ padding: '7px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Plus size={13} />
              New Analysis
            </button>
          </div>

          {patients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: '#eff6ff', border: '1px solid #bfdbfe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <Users size={20} color="var(--blue)" />
              </div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', margin: '0 0 4px' }}>No patients yet</p>
              <p style={{ fontSize: '12px', margin: 0 }}>Run the simulator to populate data</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
              {patients.map((p, i) => {
                const riskColor = RISK_COLOR[p.risk_label] || '#6B7280';
                return (
                  <div
                    key={i}
                    onClick={() => onSelectPatient(p.patient_id)}
                    style={{
                      display: 'flex', alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      gap: '12px',
                      background: 'var(--white)',
                      animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.transform = 'translateX(3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: `${riskColor}15`, border: `1px solid ${riskColor}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: riskColor, fontWeight: '800', fontSize: '13px', flexShrink: 0,
                    }}>
                      {p.patient_id?.slice(-3)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{p.patient_id}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                        NEWS2: {p.news2_score} · {new Date(p.predicted_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <RiskBadge label={p.risk_label} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Clinical Alerts */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>Clinical Alerts</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Unresolved notifications</p>
            </div>
            {alerts.length > 0 && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '20px', padding: '3px 10px',
                fontSize: '12px', fontWeight: '700', color: '#dc2626',
              }}>
                {alerts.length}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
            {alerts.slice(0, 8).map((alert, i) => {
              const isCrit = alert.severity === 'CRITICAL';
              return (
                <div key={i} style={{
                  padding: '11px 13px',
                  background: isCrit ? '#fff5f5' : '#fffbeb',
                  borderRadius: 'var(--r-sm)',
                  border: `1px solid ${isCrit ? '#fecaca' : '#fde68a'}`,
                  borderLeft: `3px solid ${isCrit ? '#dc2626' : '#d97706'}`,
                  animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: isCrit ? '#dc2626' : '#d97706' }}>
                      {isCrit ? 'CRITICAL' : 'WARNING'} · {alert.patient_id}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {alert.message}
                  </p>
                  {alert.action && (
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: isCrit ? '#dc2626' : '#d97706', fontWeight: '600' }}>
                      Action: {alert.action}
                    </p>
                  )}
                </div>
              );
            })}
            {alerts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: '#ecfdf5', border: '1px solid #a7f3d0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
                }}>
                  <Activity size={18} color="#059669" />
                </div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', margin: 0 }}>No active alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
