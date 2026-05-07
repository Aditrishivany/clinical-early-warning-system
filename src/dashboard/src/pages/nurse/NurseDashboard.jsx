// File: src/dashboard/src/pages/nurse/NurseDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats, getHighRiskPatients, getActiveAlerts } from '../../services/api';
import PatientMonitorCard from '../../components/PatientMonitorCard';

const NurseDashboard = ({ onNavigate, onSelectPatient }) => {
  const { user }           = useAuth();
  const [patients, setPatients] = useState([]);
  const [stats,    setStats]    = useState(null);
  const [alerts,   setAlerts]   = useState([]);
  const [time,     setTime]     = useState(new Date());

  useEffect(() => {
    fetchData();
    const dataInt  = setInterval(fetchData, 15000);
    const clockInt = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(dataInt); clearInterval(clockInt); };
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

  return (
    <div className="animate-fade">

      {/* Nurse Header */}
      <div style={{
        background:    'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
        borderRadius:  '16px',
        padding:       '20px 24px',
        marginBottom:  '20px',
        display:       'flex',
        justifyContent:'space-between',
        alignItems:    'center',
        color:         'white',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
            {user?.name} 👩‍⚕️
          </h2>
          <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '13px' }}>
            Ward: {user?.ward} | Shift: {user?.shift}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', fontFamily: 'monospace' }}>
            {time.toLocaleTimeString()}
          </p>
          {alerts.filter(a => a.severity === 'CRITICAL').length > 0 && (
            <div style={{
              backgroundColor: '#dc2626',
              borderRadius:    '8px',
              padding:         '4px 12px',
              marginTop:       '6px',
              animation:       'pulse 1s infinite',
            }}>
              🚨 {alerts.filter(a => a.severity === 'CRITICAL').length} CRITICAL ALERTS
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Enter Vitals',    icon: '❤️',  page: 'vitals',   color: '#059669', bg: '#f0fdf4' },
          { label: 'View Alerts',     icon: '🚨',  page: 'alerts',   color: '#dc2626', bg: '#fff5f5' },
          { label: 'Live Monitor',    icon: '📡',  page: 'monitor',  color: '#2563eb', bg: '#eff6ff' },
          { label: 'Shift Handover',  icon: '📝',  page: 'handover', color: '#7c3aed', bg: '#f5f3ff' },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => onNavigate(action.page)}
            style={{
              flex:            1,
              padding:         '16px',
              backgroundColor: action.bg,
              border:          `1px solid ${action.color}30`,
              borderRadius:    '12px',
              cursor:          'pointer',
              textAlign:       'center',
              transition:      'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <p style={{ fontSize: '28px', margin: '0 0 6px 0' }}>{action.icon}</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: action.color }}>
              {action.label}
            </p>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Patients in Ward', value: stats?.total_patients ?? 0, color: '#059669', icon: '👥' },
          { label: 'Need Attention',   value: stats?.high_risk      ?? 0, color: '#dc2626', icon: '🔴' },
          { label: 'Active Alerts',    value: stats?.active_alerts  ?? 0, color: '#7c3aed', icon: '🚨' },
          { label: 'Vitals Recorded',  value: stats?.total_readings ?? 0, color: '#0891b2', icon: '📊' },
        ].map(s => (
          <div key={s.label} className="card" style={{
            padding: '16px', flex: 1, borderLeft: `4px solid ${s.color}`,
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

      {/* Critical Alerts Banner */}
      {alerts.filter(a => a.severity === 'CRITICAL').length > 0 && (
        <div style={{
          backgroundColor: '#fee2e2',
          border:          '1px solid #fca5a5',
          borderRadius:    '12px',
          padding:         '16px',
          marginBottom:    '20px',
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#dc2626', fontSize: '14px', fontWeight: '700' }}>
            🚨 CRITICAL ALERTS — IMMEDIATE ACTION REQUIRED
          </h3>
          {alerts.filter(a => a.severity === 'CRITICAL').slice(0, 3).map((alert, i) => (
            <div key={i} style={{
              backgroundColor: 'white', borderRadius: '8px',
              padding: '10px 12px', marginBottom: '6px',
              border: '1px solid #fecaca',
            }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#dc2626' }}>
                Patient: {alert.patient_id} — {alert.type}
              </p>
              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#374151' }}>
                {alert.message}
              </p>
              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>
                ⚡ Action: {alert.action}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Patient Cards */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600' }}>
          📡 Ward Patients — Live Status
        </h3>
        {patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            <p style={{ fontSize: '32px' }}>🏥</p>
            <p>No patients monitored yet</p>
            <p style={{ fontSize: '12px' }}>Run: python scripts/simulate_realtime.py</p>
          </div>
        ) : (
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap:                 '12px',
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