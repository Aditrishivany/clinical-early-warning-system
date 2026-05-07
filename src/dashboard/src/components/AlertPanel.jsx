// File: src/dashboard/src/components/AlertPanel.jsx
import { useState, useEffect } from 'react';
import { getActiveAlerts } from '../services/api';

const AlertPanel = () => {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await getActiveAlerts();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const severityStyle = (severity) => {
    if (severity === 'CRITICAL') return {
      bg: '#fee2e2', border: '#fca5a5',
      text: '#dc2626', icon: '🚨'
    };
    return {
      bg: '#fef3c7', border: '#fcd34d',
      text: '#d97706', icon: '⚠️'
    };
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius:    '12px',
      padding:         '20px',
      boxShadow:       '0 1px 3px rgba(0,0,0,0.1)',
      height:          'fit-content',
    }}>
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   '16px',
      }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
          🚨 Active Alerts
        </h2>
        <span style={{
          backgroundColor: '#fee2e2',
          color:           '#dc2626',
          borderRadius:    '12px',
          padding:         '2px 8px',
          fontSize:        '13px',
          fontWeight:      '600',
        }}>
          {alerts.length}
        </span>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af', textAlign: 'center' }}>
          Loading alerts...
        </p>
      ) : alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ fontSize: '24px' }}>✅</p>
          <p style={{ color: '#6b7280', margin: 0 }}>No active alerts</p>
        </div>
      ) : (
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          gap:           '10px',
          maxHeight:     '400px',
          overflowY:     'auto',
        }}>
          {alerts.map((alert) => {
            const s = severityStyle(alert.severity);
            return (
              <div key={alert.id} style={{
                backgroundColor: s.bg,
                border:          `1px solid ${s.border}`,
                borderRadius:    '8px',
                padding:         '12px',
              }}>
                <div style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  marginBottom:   '4px',
                }}>
                  <span style={{
                    fontWeight: '600',
                    color:      s.text,
                    fontSize:   '13px',
                  }}>
                    {s.icon} {alert.patient_id} — {alert.type}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color:    '#6b7280',
                  }}>
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p style={{
                  margin:   0,
                  fontSize: '12px',
                  color:    '#374151',
                }}>
                  {alert.message}
                </p>
                <p style={{
                  margin:     '4px 0 0 0',
                  fontSize:   '11px',
                  color:      s.text,
                  fontWeight: '500',
                }}>
                  → {alert.action}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlertPanel;