import { useState, useEffect } from 'react';
import { ArrowLeft, BarChart2, FileText, Activity } from 'lucide-react';
import { getPatientHistory } from '../services/api';
import VitalsChart from '../components/VitalsChart';
import RiskBadge   from '../components/RiskBadge';

const TABS = [
  { id: 'vitals',  label: 'Vitals Charts', Icon: BarChart2 },
  { id: 'reports', label: 'Reports',       Icon: FileText  },
];

const PatientDetail = ({ patientId, onBack }) => {
  const [history,  setHistory]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('vitals');

  useEffect(() => {
    if (patientId) fetchHistory();
  }, [patientId]);

  const fetchHistory = async () => {
    try {
      const data = await getPatientHistory(patientId);
      setHistory(data);
    } catch (err) {
      console.error('PatientDetail fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade">

      {/* ── Back Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        marginBottom: '24px',
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px',
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', cursor: 'pointer',
            fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)',
            transition: 'all 0.15s ease', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Patient: {patientId}
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Clinical History & Reports
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{
            width: '36px', height: '36px', margin: '0 auto 16px',
            border: '3px solid var(--border)', borderTopColor: 'var(--blue)',
            borderRadius: '50%',
          }} className="animate-spin" />
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Loading patient history…</p>
        </div>
      ) : history ? (
        <>
          {/* ── Quick Stats ── */}
          <div style={{ display: 'flex', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Readings', value: history.total_readings, Icon: BarChart2, color: '#2563eb' },
              { label: 'Total Reports',  value: history.total_reports,  Icon: FileText,  color: '#7c3aed' },
              { label: 'Latest NEWS2',   value: history.recent_vitals?.[0]?.news2_score ?? 'N/A', Icon: Activity, color: '#059669' },
            ].map(stat => (
              <div key={stat.label} className="card" style={{
                padding: '20px 24px', flex: 1, minWidth: '150px',
                borderTop: `3px solid ${stat.color}`, textAlign: 'center',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: `${stat.color}12`, border: `1px solid ${stat.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px',
                }}>
                  <stat.Icon size={16} color={stat.color} />
                </div>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: stat.color }}>{stat.value}</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ── Tab Bar ── */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 18px',
                  background:   activeTab === tab.id ? 'var(--blue)'   : 'var(--white)',
                  color:        activeTab === tab.id ? 'white'         : 'var(--text-secondary)',
                  border:       `1px solid ${activeTab === tab.id ? 'var(--blue)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-md)', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.15s ease', fontFamily: 'inherit',
                }}
              >
                <tab.Icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Vitals Chart ── */}
          {activeTab === 'vitals' && (
            <VitalsChart history={history.recent_vitals} />
          )}

          {/* ── Reports ── */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!history.recent_reports?.length ? (
                <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>No reports yet</p>
                </div>
              ) : (
                history.recent_reports.map((report, i) => (
                  <div key={i} className="card" style={{
                    padding: '18px 20px',
                    borderLeft: `3px solid ${report.alert_level === 'CRITICAL' ? '#dc2626' : '#d97706'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                          {report.report_id}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(report.generated_at).toLocaleString()}
                        </p>
                      </div>
                      <span style={{
                        background: report.alert_level === 'CRITICAL' ? '#fee2e2' : '#fef3c7',
                        color:      report.alert_level === 'CRITICAL' ? '#dc2626' : '#d97706',
                        padding: '3px 10px', borderRadius: '12px',
                        fontSize: '11px', fontWeight: '700',
                      }}>
                        {report.alert_level}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {report.summary}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Patient not found</p>
        </div>
      )}
    </div>
  );
};

export default PatientDetail;
