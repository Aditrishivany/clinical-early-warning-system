// File: src/dashboard/src/pages/doctor/DoctorDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getHighRiskPatients, getDashboardStats, getActiveAlerts } from '../../services/api';
import RiskBadge from '../../components/RiskBadge';

const DoctorDashboard = ({ onNavigate, onSelectPatient }) => {
  const { user }           = useAuth();
  const [patients, setPatients] = useState([]);
  const [stats,    setStats]    = useState(null);
  const [alerts,   setAlerts]   = useState([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
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
      setAlerts(a.alerts || []);
    } catch (err) {
      console.error(err);
    }
  };

  const myAlerts = alerts.filter(a =>
    user?.patients?.includes(a.patient_id)
  );

  return (
    <div className="animate-fade">

      {/* Welcome */}
      <div style={{
        background:   'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        borderRadius: '16px',
        padding:      '20px 24px',
        marginBottom: '20px',
        color:        'white',
        display:      'flex',
        justifyContent:'space-between',
        alignItems:   'center',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
            Welcome, {user?.name} 👨‍⚕️
          </h2>
          <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '13px' }}>
            {user?.specialty} | {user?.hospital}
          </p>
        </div>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius:    '12px',
          padding:         '12px 20px',
          textAlign:       'center',
        }}>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '800' }}>
            {patients.length}
          </p>
          <p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>
            Patients Need Attention
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'My Patients',   value: user?.patients?.length ?? 0, color: '#2563eb', icon: '👥' },
          { label: 'Critical Now',  value: stats?.high_risk ?? 0,        color: '#dc2626', icon: '🔴' },
          { label: 'My Alerts',     value: myAlerts.length,              color: '#7c3aed', icon: '🚨' },
          { label: 'Total Readings',value: stats?.total_readings ?? 0,   color: '#059669', icon: '📊' },
        ].map(s => (
          <div key={s.label} className="card" style={{
            padding: '16px', flex: 1,
            borderLeft: `4px solid ${s.color}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>{s.label}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '28px', fontWeight: '800', color: s.color }}>
                  {s.value}
                </p>
              </div>
              <span style={{ fontSize: '28px' }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Patient List */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '16px',
          }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>
              👥 My Patients
            </h3>
            <button
              onClick={() => onNavigate('analyze')}
              style={{
                backgroundColor: '#2563eb', color: 'white',
                border: 'none', borderRadius: '8px',
                padding: '6px 14px', cursor: 'pointer',
                fontSize: '12px', fontWeight: '600',
              }}
            >
              + New Analysis
            </button>
          </div>

          {patients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
              <p style={{ fontSize: '32px' }}>👥</p>
              <p>No patients yet. Run the simulator!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {patients.map((p, i) => (
                <div
                  key={i}
                  onClick={() => onSelectPatient(p.patient_id)}
                  style={{
                    display:         'flex',
                    alignItems:      'center',
                    padding:         '12px',
                    borderRadius:    '10px',
                    border:          '1px solid #e5e7eb',
                    cursor:          'pointer',
                    transition:      'all 0.15s',
                    gap:             '12px',
                    backgroundColor: 'white',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{
                    width:           '42px',
                    height:          '42px',
                    borderRadius:    '50%',
                    backgroundColor: p.risk_label === 'High' ? '#fee2e2' : '#fef3c7',
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    fontSize:        '18px',
                    flexShrink:      0,
                  }}>
                    {p.risk_label === 'High' ? '🔴' : '🟡'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>
                      {p.patient_id}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                      NEWS2: {p.news2_score} | {new Date(p.predicted_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <RiskBadge label={p.risk_label} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clinical Alerts */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600' }}>
            🚨 Clinical Alerts
          </h3>
          <div style={{
            display: 'flex', flexDirection: 'column',
            gap: '8px', maxHeight: '400px', overflowY: 'auto',
          }}>
            {alerts.slice(0, 8).map((alert, i) => (
              <div key={i} style={{
                padding:         '10px 12px',
                backgroundColor: alert.severity === 'CRITICAL' ? '#fff5f5' : '#fffbeb',
                borderRadius:    '8px',
                border:          `1px solid ${alert.severity === 'CRITICAL' ? '#fecaca' : '#fde68a'}`,
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', marginBottom: '4px',
                }}>
                  <span style={{
                    fontSize:   '12px', fontWeight: '700',
                    color:      alert.severity === 'CRITICAL' ? '#dc2626' : '#d97706',
                  }}>
                    {alert.severity === 'CRITICAL' ? '🚨' : '⚠️'} {alert.patient_id}
                  </span>
                  <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#374151' }}>
                  {alert.message}
                </p>
                <p style={{
                  margin: '4px 0 0 0', fontSize: '11px',
                  color: alert.severity === 'CRITICAL' ? '#dc2626' : '#d97706',
                  fontWeight: '500',
                }}>
                  → {alert.action}
                </p>
              </div>
            ))}
            {alerts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                <p style={{ fontSize: '24px' }}>✅</p>
                <p>No active alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;