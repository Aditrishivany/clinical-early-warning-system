import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertCircle, Activity } from 'lucide-react';
import { getActiveAlerts } from '../services/api';

const AlertsPage = () => {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 15_000);
    return () => clearInterval(id);
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await getActiveAlerts();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('fetchAlerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const warningCount  = alerts.filter(a => a.severity === 'WARNING').length;

  const filtered = filter === 'critical'
    ? alerts.filter(a => a.severity === 'CRITICAL')
    : filter === 'warning'
    ? alerts.filter(a => a.severity === 'WARNING')
    : alerts;

  const STATS = [
    { label: 'Total Alerts', value: alerts.length,  color: '#6B7280', Icon: Bell          },
    { label: 'Critical',     value: criticalCount,  color: '#DC2626', Icon: AlertTriangle  },
    { label: 'Warnings',     value: warningCount,   color: '#D97706', Icon: AlertCircle    },
  ];

  const FILTERS = [
    { id: 'all',      label: 'All Alerts' },
    { id: 'critical', label: 'Critical'   },
    { id: 'warning',  label: 'Warnings'   },
  ];

  return (
    <div className="animate-fade">

      {/* ── Stats ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {STATS.map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 22px', flex: 1, borderLeft: `4px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {s.label}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '32px', fontWeight: '800', color: s.color }}>
                  {s.value}
                </p>
              </div>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: `${s.color}12`, border: `1px solid ${s.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <s.Icon size={17} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {FILTERS.map(btn => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            style={{
              padding: '7px 18px',
              background:   filter === btn.id ? 'var(--blue)'   : 'var(--white)',
              color:        filter === btn.id ? 'white'         : 'var(--text-secondary)',
              border:       `1px solid ${filter === btn.id ? 'var(--blue)' : 'var(--border)'}`,
              borderRadius: 'var(--r-md)',
              cursor:       'pointer', fontSize: '13px', fontWeight: '600',
              transition:   'all 0.15s ease', fontFamily: 'inherit',
            }}
          >
            {btn.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className="status-dot live" />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
            Auto-refreshes every 15s
          </span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{
              width: '32px', height: '32px', margin: '0 auto 14px',
              border: '3px solid var(--border)', borderTopColor: 'var(--blue)',
              borderRadius: '50%',
            }} className="animate-spin" />
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Loading alerts…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: '#ecfdf5', border: '1px solid #a7f3d0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}>
              <Activity size={22} color="#059669" />
            </div>
            <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)', margin: '0 0 4px' }}>No active alerts</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>All patients are stable</p>
          </div>
        ) : (
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                {['Severity', 'Patient', 'Type', 'Alert', 'Action Required', 'Time'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
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
                    background: isCrit ? '#fff5f5' : i % 2 === 0 ? 'var(--white)' : 'var(--bg)',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.15s',
                  }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        background: isCrit ? '#fee2e2' : '#fef3c7',
                        color:      isCrit ? '#dc2626' : '#d97706',
                        padding: '3px 10px', borderRadius: '12px',
                        fontSize: '11px', fontWeight: '700',
                      }}>
                        {isCrit
                          ? <AlertTriangle size={11} />
                          : <AlertCircle  size={11} />
                        }
                        {alert.severity}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                      {alert.patient_id}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {alert.type}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                      {alert.message}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: isCrit ? '#dc2626' : '#d97706', fontWeight: '500' }}>
                      {alert.action}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)' }}>
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
