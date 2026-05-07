import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Clock, HeartPulse, ShieldAlert } from 'lucide-react';
import { getActiveAlerts, getDashboardStats, getHighRiskPatients } from '../../services/api';

const ShiftHandover = () => {
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    Promise.all([getDashboardStats(), getHighRiskPatients(), getActiveAlerts()])
      .then(([s, h, a]) => {
        setStats(s);
        setPatients(h.patients || []);
        setAlerts(a.alerts || []);
      })
      .catch(console.error);
  }, []);

  const watchList = useMemo(
    () => patients.filter((p) => p.risk_level >= 1).slice(0, 8),
    [patients],
  );

  return (
    <div className="animate-fade" style={{ display: 'grid', gap: '16px' }}>
      <section className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ClipboardList size={20} color="var(--blue)" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Shift Handover</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>
          <span className="badge badge-low">LIVE</span>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          ['Patients', stats?.total_patients, HeartPulse, '#1e40af'],
          ['High Risk', stats?.high_risk, ShieldAlert, '#dc2626'],
          ['Medium Risk', stats?.medium_risk, Clock, '#d97706'],
          ['Active Alerts', stats?.active_alerts, ShieldAlert, '#7c3aed'],
        ].map(([label, value, Icon, color]) => (
          <div key={label} className="card" style={{ padding: '18px', borderTop: `3px solid ${color}` }}>
            <Icon size={18} color={color} />
            <p className="label" style={{ margin: '10px 0 6px' }}>{label}</p>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 800, color }}>{value ?? '-'}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        <section className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800 }}>Watch List</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {watchList.map((p) => (
              <div key={`${p.patient_id}-${p.predicted_at}`} style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: '12px',
                padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
              }}>
                <strong style={{ fontSize: '13px' }}>{p.patient_id}</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>NEWS2 {p.news2_score}</span>
                <span className={p.risk_level === 2 ? 'badge badge-high' : 'badge badge-medium'}>{p.risk_label}</span>
              </div>
            ))}
            {watchList.length === 0 && (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>No elevated-risk patients in the current list.</p>
            )}
          </div>
        </section>

        <section className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800 }}>Open Alerts</h3>
          <div style={{ display: 'grid', gap: '10px', maxHeight: '360px', overflow: 'auto' }}>
            {alerts.slice(0, 10).map((alert) => (
              <div key={alert.id} style={{
                padding: '12px', borderRadius: 'var(--r-sm)',
                border: `1px solid ${alert.severity === 'CRITICAL' ? '#fecaca' : '#fde68a'}`,
                background: alert.severity === 'CRITICAL' ? '#fef2f2' : '#fffbeb',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '12px' }}>{alert.patient_id}</strong>
                  <span style={{ fontSize: '11px', fontWeight: 800 }}>{alert.severity}</span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{alert.message}</p>
              </div>
            ))}
            {alerts.length === 0 && (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>No open alerts.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ShiftHandover;
