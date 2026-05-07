// File: src/dashboard/src/pages/patient/PatientHome.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPatientHistory } from '../../services/api';
import VitalsChart from '../../components/VitalsChart';
import RiskBadge   from '../../components/RiskBadge';

const PatientHome = ({ onNavigate }) => {
  const { user }           = useAuth();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await getPatientHistory(user.id);
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const latestVital   = history?.recent_vitals?.[0];
  const latestReport  = history?.recent_reports?.[0];

  const getRiskFromNews2 = (score) => {
    if (!score) return 'Low';
    if (score >= 7) return 'High';
    if (score >= 5) return 'Medium';
    return 'Low';
  };

  return (
    <div className="animate-fade">

      {/* Patient Welcome */}
      <div style={{
        background:    'linear-gradient(135deg, #0c4a6e 0%, #0891b2 100%)',
        borderRadius:  '16px',
        padding:       '24px',
        marginBottom:  '20px',
        color:         'white',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>
              Hello, {user?.name} 👋
            </h2>
            <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '13px' }}>
              Ward: {user?.ward} | Doctor: {user?.doctor}
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
              {[
                { label: 'Age',        value: `${user?.age} years` },
                { label: 'Gender',     value: user?.gender === 'M' ? 'Male' : 'Female' },
                { label: 'Blood Type', value: user?.blood_type },
              ].map(info => (
                <div key={info.label} style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius:    '8px',
                  padding:         '6px 12px',
                }}>
                  <p style={{ margin: 0, fontSize: '10px', opacity: 0.7 }}>{info.label}</p>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>{info.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Current Risk */}
          {latestVital && (
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius:    '12px',
              padding:         '16px 20px',
              textAlign:       'center',
            }}>
              <p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>Current Status</p>
              <p style={{ margin: '4px 0', fontSize: '32px', fontWeight: '800' }}>
                {latestVital.news2_score}
              </p>
              <p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>NEWS2 Score</p>
              <div style={{ marginTop: '8px' }}>
                <RiskBadge label={getRiskFromNews2(latestVital.news2_score)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Allergies Warning */}
      {user?.allergies?.length > 0 && (
        <div style={{
          backgroundColor: '#fef3c7',
          border:          '1px solid #fcd34d',
          borderRadius:    '10px',
          padding:         '12px 16px',
          marginBottom:    '16px',
          display:         'flex',
          alignItems:      'center',
          gap:             '10px',
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#92400e' }}>
              Known Allergies
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#78350f' }}>
              {user.allergies.join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { id: 'overview', label: '📊 Overview'      },
          { id: 'vitals',   label: '❤️ My Vitals'     },
          { id: 'reports',  label: '📋 My Reports'    },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding:         '8px 20px',
              backgroundColor: activeTab === tab.id ? '#0891b2' : 'white',
              color:           activeTab === tab.id ? 'white'   : '#374151',
              border:          '1px solid #e5e7eb',
              borderRadius:    '8px',
              cursor:          'pointer',
              fontSize:        '13px',
              fontWeight:      '500',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ fontSize: '32px' }}>⏳</p>
          <p style={{ color: '#6b7280' }}>Loading your health data...</p>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

                {/* Latest Vitals */}
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600' }}>
                    ❤️ Latest Vital Signs
                  </h3>
                  {latestVital ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        { label: 'Heart Rate',    value: `${latestVital.heart_rate} bpm`,    normal: '60-100',  ok: latestVital.heart_rate >= 60 && latestVital.heart_rate <= 100 },
                        { label: 'Blood Pressure',value: `${latestVital.systolic_bp}/${latestVital.diastolic_bp}`, normal: '90-140/60-90', ok: latestVital.systolic_bp >= 90 && latestVital.systolic_bp <= 140 },
                        { label: 'SpO2',          value: `${latestVital.spo2}%`,             normal: '95-100%', ok: latestVital.spo2 >= 95 },
                        { label: 'Temperature',   value: `${latestVital.temperature}°C`,     normal: '36.1-37.5°C', ok: latestVital.temperature >= 36.1 && latestVital.temperature <= 37.5 },
                        { label: 'Resp Rate',     value: `${latestVital.respiratory_rate}/min`, normal: '12-20', ok: latestVital.respiratory_rate >= 12 && latestVital.respiratory_rate <= 20 },
                        { label: 'NEWS2 Score',   value: latestVital.news2_score,             normal: '0-4',    ok: latestVital.news2_score <= 4 },
                      ].map(vital => (
                        <div key={vital.label} style={{
                          backgroundColor: vital.ok ? '#f0fdf4' : '#fff5f5',
                          borderRadius:    '8px',
                          padding:         '10px 12px',
                          border:          `1px solid ${vital.ok ? '#86efac' : '#fecaca'}`,
                        }}>
                          <p style={{ margin: 0, fontSize: '10px', color: '#6b7280' }}>
                            {vital.label}
                          </p>
                          <p style={{
                            margin:     '3px 0 0 0',
                            fontSize:   '16px',
                            fontWeight: '700',
                            color:      vital.ok ? '#16a34a' : '#dc2626',
                          }}>
                            {vital.value}
                          </p>
                          <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#9ca3af' }}>
                            Normal: {vital.normal}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
                      No vitals recorded yet
                    </p>
                  )}
                </div>

                {/* Latest Report Summary */}
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600' }}>
                    📋 Latest Assessment
                  </h3>
                  {latestReport ? (
                    <div>
                      <div style={{
                        backgroundColor: latestReport.alert_level === 'CRITICAL' ? '#fee2e2' : '#f0fdf4',
                        borderRadius:    '10px',
                        padding:         '14px',
                        marginBottom:    '12px',
                        textAlign:       'center',
                      }}>
                        <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>
                          Alert Level
                        </p>
                        <p style={{
                          margin:     '4px 0',
                          fontSize:   '20px',
                          fontWeight: '800',
                          color:      latestReport.alert_level === 'CRITICAL' ? '#dc2626' : '#16a34a',
                        }}>
                          {latestReport.alert_level}
                        </p>
                      </div>
                      <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
                        {latestReport.summary}
                      </p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
                        Assessment time: {new Date(latestReport.generated_at).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
                      No assessments yet
                    </p>
                  )}
                </div>
              </div>

              {/* My Care Team */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600' }}>
                  👨‍⚕️ My Care Team
                </h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { role: 'Attending Doctor', name: user?.doctor, icon: '👨‍⚕️', color: '#2563eb' },
                    { role: 'Ward',             name: user?.ward,   icon: '🏥',   color: '#059669' },
                    { role: 'Hospital',         name: 'City General Hospital', icon: '🏨', color: '#7c3aed' },
                  ].map(member => (
                    <div key={member.role} style={{
                      flex:            1,
                      backgroundColor: '#f9fafb',
                      borderRadius:    '10px',
                      padding:         '14px',
                      textAlign:       'center',
                      border:          '1px solid #e5e7eb',
                    }}>
                      <p style={{ fontSize: '28px', margin: '0 0 6px 0' }}>{member.icon}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>{member.role}</p>
                      <p style={{ margin: '3px 0 0 0', fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                        {member.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Vitals Tab */}
          {activeTab === 'vitals' && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600' }}>
                ❤️ My Vitals History
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                {history?.total_readings} readings recorded
              </p>
              <VitalsChart history={history?.recent_vitals || []} />
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600' }}>
                📋 My Health Reports
              </h3>
              {history?.recent_reports?.length === 0 ? (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '30px' }}>
                  No reports yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {history?.recent_reports?.map((report, i) => (
                    <div key={i} style={{
                      padding:         '14px',
                      backgroundColor: report.alert_level === 'CRITICAL' ? '#fff5f5' : '#f9fafb',
                      borderRadius:    '10px',
                      border:          `1px solid ${report.alert_level === 'CRITICAL' ? '#fecaca' : '#e5e7eb'}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{
                          fontSize:        '12px',
                          fontWeight:      '700',
                          color:           report.alert_level === 'CRITICAL' ? '#dc2626' : '#16a34a',
                          backgroundColor: report.alert_level === 'CRITICAL' ? '#fee2e2' : '#dcfce7',
                          padding:         '2px 8px',
                          borderRadius:    '8px',
                        }}>
                          {report.alert_level}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {new Date(report.generated_at).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#374151', lineHeight: '1.5' }}>
                        {report.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatientHome;