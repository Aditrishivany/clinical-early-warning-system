import { useState, useEffect } from 'react';
import { Users, AlertTriangle, Activity, BarChart2, Bell, Cpu, Database, Wifi, Settings } from 'lucide-react';
import { getDashboardStats, getHighRiskPatients, getActiveAlerts } from '../../services/api';

const StatCard = ({ title, value, Icon, color, subtitle, delay = 0 }) => (
  <div className="card animate-fade" style={{
    padding: '22px 24px', flex: 1, minWidth: '140px',
    borderTop: `3px solid ${color}`,
    animationDelay: `${delay}s`,
    position: 'relative', overflow: 'hidden',
    cursor: 'default',
  }}>
    <div style={{
      position: 'absolute', top: 0, right: 0,
      width: '80px', height: '80px',
      background: `radial-gradient(circle at top right, ${color}10, transparent)`,
      pointerEvents: 'none',
    }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p className="label" style={{ marginBottom: '8px' }}>{title}</p>
        <p style={{ fontSize: '30px', fontWeight: '800', letterSpacing: '-1px', color, margin: 0 }}>{value ?? '—'}</p>
        {subtitle && (
          <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{
        width: '42px', height: '42px', borderRadius: '12px',
        background: `${color}12`, border: `1px solid ${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={18} color={color} strokeWidth={2} />
      </div>
    </div>
  </div>
);

const SYSTEM_SERVICES = [
  { name: 'ML Model',     status: 'Online',  ok: true,  Icon: Cpu      },
  { name: 'AI Agents',    status: 'Online',  ok: true,  Icon: Activity },
  { name: 'RAG System',   status: 'Online',  ok: true,  Icon: BarChart2},
  { name: 'Database',     status: 'Online',  ok: true,  Icon: Database },
  { name: 'API Server',   status: 'Online',  ok: true,  Icon: Wifi     },
  { name: 'Azure SQL',    status: 'Ready',   ok: true,  Icon: Database },
  { name: 'Azure OpenAI', status: 'Ready',   ok: true,  Icon: Cpu      },
  { name: 'Data Factory', status: 'Ready',   ok: true,  Icon: Settings },
];

const AdminDashboard = ({ onNavigate }) => {
  const [stats,    setStats]    = useState(null);
  const [highRisk, setHighRisk] = useState([]);
  const [alerts,   setAlerts]   = useState([]);
  const [time,     setTime]     = useState(new Date());

  useEffect(() => {
    fetchAll();
    const d = setInterval(fetchAll, 30_000);
    const c = setInterval(() => setTime(new Date()), 1_000);
    return () => { clearInterval(d); clearInterval(c); };
  }, []);

  const fetchAll = async () => {
    try {
      const [s, h, a] = await Promise.all([
        getDashboardStats(),
        getHighRiskPatients(),
        getActiveAlerts(),
      ]);
      setStats(s);
      setHighRisk(h.patients || []);
      setAlerts(a.alerts   || []);
    } catch (err) { console.error(err); }
  };

  const hour     = time.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="animate-fade">

      {/* ── Hero Banner ── */}
      <div style={{
        background:     'linear-gradient(135deg, #0c1445 0%, #1e3a8a 60%, #1e40af 100%)',
        borderRadius:   'var(--r-xl)',
        padding:        '28px 36px',
        marginBottom:   '24px',
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        position:       'relative',
        overflow:       'hidden',
        boxShadow:      '0 8px 32px rgba(12,20,69,0.2)',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37 30%, #d4af37 70%, transparent)',
        }} />
        <div style={{
          position: 'absolute', right: '-60px', top: '-60px',
          width: '220px', height: '220px', borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <p style={{ margin: '0 0 2px', fontSize: '12px', color: 'rgba(212,175,55,0.85)', fontWeight: '600', letterSpacing: '0.5px' }}>
            {greeting} · City General Hospital
          </p>
          <h2 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>
            Clinical Overview
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
            Real-time patient monitoring & AI early warning
          </p>
        </div>

        <div style={{ textAlign: 'right', position: 'relative' }}>
          <p style={{
            margin: 0, fontSize: '36px', fontWeight: '800',
            color: '#fff', letterSpacing: '-2px', fontVariantNumeric: 'tabular-nums',
          }}>
            {time.toLocaleTimeString()}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ── Stat Row ── */}
      <div className="stagger-children animate-fade" style={{ display: 'flex', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <StatCard title="Total Patients"  value={stats?.total_patients}  Icon={Users}         color="#1e40af" subtitle="Currently monitored" delay={0.05} />
        <StatCard title="High Risk"       value={stats?.high_risk}       Icon={AlertTriangle}  color="#dc2626" subtitle="Immediate attention"  delay={0.10} />
        <StatCard title="Medium Risk"     value={stats?.medium_risk}     Icon={Activity}       color="#d97706" subtitle="Elevated monitoring"  delay={0.15} />
        <StatCard title="Low Risk"        value={stats?.low_risk}        Icon={Activity}       color="#059669" subtitle="Stable condition"     delay={0.20} />
        <StatCard title="Active Alerts"   value={stats?.active_alerts}   Icon={Bell}           color="#7c3aed" subtitle="Require action"      delay={0.25} />
        <StatCard title="Vitals Recorded" value={stats?.total_readings}  Icon={BarChart2}      color="#0891b2" subtitle="Total readings"      delay={0.30} />
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px', marginBottom: '16px' }}>

        {/* High Risk Patients */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>High Risk Patients</h3>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Requires immediate clinical attention</p>
            </div>
            <button
              onClick={() => onNavigate('patients')}
              style={{
                padding: '6px 14px', fontSize: '12px', fontWeight: '600',
                background: 'var(--blue-soft)', color: 'var(--blue)',
                border: '1px solid #bfdbfe', borderRadius: '20px',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--blue-soft)'}
            >
              View All →
            </button>
          </div>

          {highRisk.filter(p => p.risk_level === 2).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: '#ecfdf5', border: '1px solid #a7f3d0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <Activity size={20} color="#059669" />
              </div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', margin: '0 0 4px' }}>All patients stable</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>No high risk patients at this time</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {highRisk.filter(p => p.risk_level === 2).map((p, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center',
                  padding: '14px 16px',
                  background: '#fff5f5', border: '1px solid #fecaca',
                  borderRadius: 'var(--r-md)', gap: '14px',
                  transition: 'all 0.2s ease', cursor: 'pointer',
                  animation: `fadeUp 0.3s ease ${i * 0.06}s both`,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '800', fontSize: '13px', flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
                  }}>
                    {p.patient_id?.slice(-3)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>{p.patient_id}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                      NEWS2 Score: {p.news2_score} · Confidence: {p.confidence}%
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-high">HIGH RISK</span>
                    <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(p.predicted_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Alerts */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>Active Alerts</h3>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Unresolved notifications</p>
            </div>
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '20px', padding: '3px 10px',
              fontSize: '12px', fontWeight: '700', color: '#dc2626',
            }}>
              {alerts.length}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
            {alerts.slice(0, 10).map((alert, i) => {
              const isCrit = alert.severity === 'CRITICAL';
              return (
                <div key={i} style={{
                  padding: '11px 13px',
                  background: isCrit ? '#fef2f2' : '#fffbeb',
                  border: `1px solid ${isCrit ? '#fecaca' : '#fde68a'}`,
                  borderRadius: 'var(--r-sm)',
                  borderLeft: `3px solid ${isCrit ? '#dc2626' : '#d97706'}`,
                  animation: `fadeUp 0.3s ease ${i * 0.04}s both`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: isCrit ? '#991b1b' : '#92400e' }}>
                      {isCrit ? 'CRITICAL' : 'WARNING'} · {alert.patient_id}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {alert.message?.slice(0, 60)}{alert.message?.length > 60 ? '…' : ''}
                  </p>
                </div>
              );
            })}
            {alerts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: '#ecfdf5', border: '1px solid #a7f3d0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px',
                }}>
                  <Activity size={18} color="#059669" />
                </div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', margin: 0 }}>
                  No active alerts
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── System Status ── */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: '#eff6ff', border: '1px solid #bfdbfe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Cpu size={15} color="var(--blue)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>System Status</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>All core services operational</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {SYSTEM_SERVICES.map((sys, i) => (
            <div key={sys.name} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 14px',
              background: sys.ok ? '#ecfdf5' : '#fffbeb',
              border:  `1px solid ${sys.ok ? '#a7f3d0' : '#fde68a'}`,
              borderRadius: 'var(--r-sm)',
              animation: `fadeUp 0.3s ease ${i * 0.04}s both`,
            }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                background: sys.ok ? '#d1fae5' : '#fef3c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <sys.Icon size={14} color={sys.ok ? '#059669' : '#d97706'} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{sys.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: sys.ok ? '#059669' : '#d97706',
                  }} />
                  <p style={{ margin: 0, fontSize: '10px', color: sys.ok ? '#059669' : '#d97706', fontWeight: '700' }}>
                    {sys.status}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
