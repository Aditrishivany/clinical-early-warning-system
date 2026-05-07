import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart2, Database, FileBarChart, TrendingUp } from 'lucide-react';
import { getActiveAlerts, getDashboardStats, getHighRiskPatients, getModelInfo } from '../../services/api';

const Panel = ({ title, Icon, children }) => (
  <section className="card" style={{ padding: '22px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '8px',
        background: '#eff6ff', border: '1px solid #bfdbfe',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color="var(--blue)" />
      </div>
      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
    </div>
    {children}
  </section>
);

const Metric = ({ label, value, tone = '#1e40af' }) => (
  <div style={{
    padding: '16px', borderRadius: 'var(--r-md)',
    border: '1px solid var(--border)', background: 'var(--white)',
  }}>
    <p className="label" style={{ marginBottom: '8px' }}>{label}</p>
    <p style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: tone }}>{value ?? '-'}</p>
  </div>
);

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [model, setModel] = useState(null);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getHighRiskPatients(),
      getActiveAlerts(),
      getModelInfo(),
    ])
      .then(([s, h, a, m]) => {
        setStats(s);
        setPatients(h.patients || []);
        setAlerts(a.alerts || []);
        setModel(m);
      })
      .catch(console.error);
  }, []);

  const wardRows = useMemo(() => {
    const buckets = {};
    patients.forEach((p) => {
      const ward = p.ward || 'Clinical';
      buckets[ward] = buckets[ward] || { ward, high: 0, medium: 0, low: 0 };
      if (p.risk_level === 2) buckets[ward].high += 1;
      else if (p.risk_level === 1) buckets[ward].medium += 1;
      else buckets[ward].low += 1;
    });
    return Object.values(buckets);
  }, [patients]);

  return (
    <div className="animate-fade" style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))', gap: '12px' }}>
        <Metric label="Total Patients" value={stats?.total_patients} />
        <Metric label="High Risk" value={stats?.high_risk} tone="#dc2626" />
        <Metric label="Active Alerts" value={stats?.active_alerts} tone="#d97706" />
        <Metric label="Model Accuracy" value={model?.accuracy ? `${(model.accuracy * 100).toFixed(1)}%` : '-'} tone="#059669" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '16px' }}>
        <Panel title="Risk Distribution" Icon={BarChart2}>
          <div style={{ display: 'grid', gap: '10px' }}>
            {wardRows.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>No risk records available.</p>
            ) : wardRows.map((row) => {
              const total = Math.max(row.high + row.medium + row.low, 1);
              return (
                <div key={row.ward}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    <span>{row.ward}</span>
                    <span>{total} patients</span>
                  </div>
                  <div style={{ display: 'flex', height: '12px', borderRadius: '999px', overflow: 'hidden', background: '#f1f5f9' }}>
                    <div style={{ width: `${(row.high / total) * 100}%`, background: '#dc2626' }} />
                    <div style={{ width: `${(row.medium / total) * 100}%`, background: '#d97706' }} />
                    <div style={{ width: `${(row.low / total) * 100}%`, background: '#059669' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Power BI Dataset" Icon={FileBarChart}>
          <div style={{ display: 'grid', gap: '10px' }}>
            {['dim_patient.csv', 'fact_vitals.csv', 'fact_patient_risk.csv'].map((name) => (
              <div key={name} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
              }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>{name}</span>
                <span className="badge badge-low">READY</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Panel title="Latest Model Outputs" Icon={TrendingUp}>
          <div style={{ display: 'grid', gap: '8px', maxHeight: '280px', overflow: 'auto' }}>
            {patients.slice(0, 8).map((p) => (
              <div key={`${p.patient_id}-${p.predicted_at}`} style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', alignItems: 'center',
                padding: '11px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
              }}>
                <strong style={{ fontSize: '12px' }}>{p.patient_id}</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>NEWS2 {p.news2_score}</span>
                <span className={`badge ${p.risk_level === 2 ? 'badge-high' : p.risk_level === 1 ? 'badge-medium' : 'badge-low'}`}>
                  {p.risk_label}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Alert Trend Inputs" Icon={AlertTriangle}>
          <div style={{ display: 'grid', gap: '8px', maxHeight: '280px', overflow: 'auto' }}>
            {alerts.slice(0, 8).map((alert) => (
              <div key={alert.id} style={{
                padding: '11px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                borderLeft: `3px solid ${alert.severity === 'CRITICAL' ? '#dc2626' : '#d97706'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <strong style={{ fontSize: '12px' }}>{alert.patient_id}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{alert.severity}</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{alert.message}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
