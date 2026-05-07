// File: src/dashboard/src/pages/AlertsPage.jsx
import { useState, useEffect } from 'react';
import { getActiveAlerts } from '../services/api';

const AlertsPage = () => {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await getActiveAlerts();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = alerts.filter(a => {
    if (filter === 'all')      return true;
    if (filter === 'critical') return a.severity === 'CRITICAL';
    if (filter === 'warning')  return a.severity === 'WARNING';
    return true;
  });

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const warningCount  = alerts.filter(a => a.severity === 'WARNING').length;

  return (
    <div className="animate-fade">

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Alerts', value: alerts.length,  color: '#6b7280', icon: '🔔' },
          { label: 'Critical',     value: criticalCount,  color: '#dc2626', icon: '🚨' },
          { label: 'Warnings',     value: warningCount,   color: '#d97706', icon: '⚠️' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{
            padding: '16px 24px', flex: 1,
            borderLeft: `4px solid ${stat.color}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                  {stat.label}
                </p>
                <p style={{
                  margin: '4px 0 0 0', fontSize: '32px',
                  fontWeight: '700', color: stat.color,
                }}>
                  {stat.value}
                </p>
              </div>
              <span style={{ fontSize: '32px' }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { id: 'all',      label: 'All Alerts'   },
          { id: 'critical', label: '🚨 Critical'  },
          { id: 'warning',  label: '⚠️ Warnings'  },
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            style={{
              padding:         '6px 16px',
              backgroundColor: filter === btn.id ? '#1e3a5f' : 'white',
              color:           filter === btn.id ? 'white'   : '#374151',
              border:          '1px solid #e5e7eb',
              borderRadius:    '8px',
              cursor:          'pointer',
              fontSize:        '13px',
              fontWeight:      '500',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>⏳ Loading alerts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ fontSize: '48px' }}>✅</p>
            <p style={{ color: '#6b7280' }}>No active alerts</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                {['Severity','Patient','Type','Alert','Action Required','Time'].map(h => (
                  <th key={h} style={{
                    padding:      '12px 16px',
                    textAlign:    'left',
                    fontSize:     '12px',
                    fontWeight:   '600',
                    color:        '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((alert, i) => {
                const isCrit = alert.severity === 'CRITICAL';
                return (
                  <tr key={i} style={{
                    backgroundColor: isCrit ? '#fff5f5' : i % 2 === 0 ? 'white' : '#fafafa',
                    borderBottom:    '1px solid #f3f4f6',
                  }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        backgroundColor: isCrit ? '#fee2e2' : '#fef3c7',
                        color:           isCrit ? '#dc2626' : '#d97706',
                        padding:         '3px 10px',
                        borderRadius:    '12px',
                        fontSize:        '11px',
                        fontWeight:      '700',
                      }}>
                        {isCrit ? '🚨' : '⚠️'} {alert.severity}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600' }}>
                      {alert.patient_id}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>
                      {alert.type}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#374151', maxWidth: '250px' }}>
                      {alert.message}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: isCrit ? '#dc2626' : '#d97706', fontWeight: '500' }}>
                      → {alert.action}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '11px', color: '#9ca3af' }}>
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;