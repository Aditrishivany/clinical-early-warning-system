// File: src/dashboard/src/pages/PatientDetail.jsx
import { useState, useEffect } from 'react';
import { getPatientHistory } from '../services/api';
import VitalsChart from '../components/VitalsChart';
import RiskBadge   from '../components/RiskBadge';

const PatientDetail = ({ patientId, onBack }) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vitals');

  useEffect(() => {
    if (patientId) fetchHistory();
  }, [patientId]);

  const fetchHistory = async () => {
    try {
      const data = await getPatientHistory(patientId);
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = ['vitals', 'reports'];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1e3a5f', color: 'white',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <button
          onClick={onBack}
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: 'none', color: 'white',
            padding: '8px 16px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '13px',
          }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
            Patient: {patientId}
          </h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
            Clinical History & Reports
          </p>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '24px' }}>⏳</p>
            <p style={{ color: '#6b7280' }}>Loading patient history...</p>
          </div>
        ) : history ? (
          <>
            {/* Stats */}
            <div style={{
              display: 'flex', gap: '16px',
              marginBottom: '24px', flexWrap: 'wrap',
            }}>
              {[
                { label: 'Total Readings', value: history.total_readings, icon: '📊' },
                { label: 'Total Reports',  value: history.total_reports,  icon: '📋' },
                {
                  label: 'Latest NEWS2',
                  value: history.recent_vitals?.[0]?.news2_score ?? 'N/A',
                  icon: '🏥'
                },
              ].map(stat => (
                <div key={stat.label} style={{
                  backgroundColor: 'white', borderRadius: '12px',
                  padding: '20px', flex: 1, minWidth: '150px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                }}>
                  <p style={{ margin: 0, fontSize: '24px' }}>{stat.icon}</p>
                  <p style={{
                    margin: '8px 0 0 0', fontSize: '28px',
                    fontWeight: '700', color: '#111827',
                  }}>
                    {stat.value}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex', gap: '8px', marginBottom: '16px',
            }}>
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: activeTab === tab ? '#2563eb' : 'white',
                    color: activeTab === tab ? 'white' : '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '500',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab === 'vitals' ? '📊 Vitals Charts' : '📋 Reports'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'vitals' && (
              <VitalsChart history={history.recent_vitals} />
            )}

            {activeTab === 'reports' && (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '12px',
              }}>
                {history.recent_reports?.length === 0 ? (
                  <div style={{
                    backgroundColor: 'white', borderRadius: '12px',
                    padding: '40px', textAlign: 'center',
                  }}>
                    <p style={{ color: '#6b7280' }}>No reports yet</p>
                  </div>
                ) : (
                  history.recent_reports?.map((report, i) => (
                    <div key={i} style={{
                      backgroundColor: 'white', borderRadius: '12px',
                      padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', marginBottom: '8px',
                      }}>
                        <div>
                          <p style={{
                            margin: 0, fontSize: '13px',
                            fontWeight: '600', color: '#111827',
                          }}>
                            {report.report_id}
                          </p>
                          <p style={{
                            margin: '2px 0 0 0',
                            fontSize: '12px', color: '#6b7280',
                          }}>
                            {new Date(report.generated_at).toLocaleString()}
                          </p>
                        </div>
                        <span style={{
                          backgroundColor: report.alert_level === 'CRITICAL'
                            ? '#fee2e2' : '#fef3c7',
                          color: report.alert_level === 'CRITICAL'
                            ? '#dc2626' : '#d97706',
                          padding: '4px 10px', borderRadius: '12px',
                          fontSize: '11px', fontWeight: '600',
                        }}>
                          {report.alert_level}
                        </span>
                      </div>
                      <p style={{
                        margin: 0, fontSize: '12px',
                        color: '#374151', lineHeight: '1.5',
                      }}>
                        {report.summary}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{
            backgroundColor: 'white', borderRadius: '12px',
            padding: '40px', textAlign: 'center',
          }}>
            <p style={{ color: '#6b7280' }}>Patient not found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetail;