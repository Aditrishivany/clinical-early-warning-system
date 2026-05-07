import { useState, useEffect } from 'react';
import { Heart, FileText, BarChart2, AlertTriangle, Activity, User, Stethoscope, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPatientHistory } from '../../services/api';
import VitalsChart from '../../components/VitalsChart';
import RiskBadge   from '../../components/RiskBadge';

const TABS = [
  { id: 'overview', label: 'Overview',   Icon: BarChart2  },
  { id: 'vitals',   label: 'My Vitals',  Icon: Heart      },
  { id: 'reports',  label: 'My Reports', Icon: FileText   },
];

const getRiskFromNews2 = (score) => {
  if (!score) return 'Low';
  if (score >= 7) return 'High';
  if (score >= 5) return 'Medium';
  return 'Low';
};

const PatientHome = ({ onNavigate }) => {
  const { user }                    = useAuth();
  const [history,   setHistory]     = useState(null);
  const [loading,   setLoading]     = useState(true);
  const [activeTab, setActiveTab]   = useState('overview');

  useEffect(() => {
    fetchHistory();
    const id = setInterval(fetchHistory, 30_000);
    return () => clearInterval(id);
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

  const latestVital  = history?.recent_vitals?.[0];
  const latestReport = history?.recent_reports?.[0];

  return (
    <div className="animate-fade">

      {/* ── Patient Welcome Banner ── */}
      <div style={{
        background:    'linear-gradient(135deg, #0c4a6e 0%, #0891b2 100%)',
        borderRadius:  'var(--r-xl)',
        padding:       '26px 30px',
        marginBottom:  '20px',
        color:         'white',
        position:      'relative',
        overflow:      'hidden',
      }}>
        <div style={{
          position: 'absolute', right: '-40px', top: '-40px',
          width: '160px', height: '160px', borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.07)', pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <User size={16} color="white" />
              </div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Hello, {user?.name}</h2>
            </div>
            <p style={{ margin: '0 0 14px', opacity: 0.75, fontSize: '13px' }}>
              Ward: {user?.ward} · Doctor: {user?.doctor}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'Age',        value: `${user?.age} yrs` },
                { label: 'Gender',     value: user?.gender === 'M' ? 'Male' : 'Female' },
                { label: 'Blood Type', value: user?.blood_type },
              ].map(info => (
                <div key={info.label} style={{
                  background: 'rgba(255,255,255,0.14)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  backdropFilter: 'blur(4px)',
                }}>
                  <p style={{ margin: 0, fontSize: '9px', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{info.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '600' }}>{info.value}</p>
                </div>
              ))}
            </div>
          </div>

          {latestVital && (
            <div style={{
              background: 'rgba(255,255,255,0.14)',
              borderRadius: '14px',
              padding: '16px 20px',
              textAlign: 'center',
              backdropFilter: 'blur(4px)',
              flexShrink: 0,
            }}>
              <p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>Current Status</p>
              <p style={{ margin: '4px 0', fontSize: '34px', fontWeight: '800', lineHeight: 1 }}>
                {latestVital.news2_score}
              </p>
              <p style={{ margin: '0 0 8px', fontSize: '11px', opacity: 0.8 }}>NEWS2 Score</p>
              <RiskBadge label={getRiskFromNews2(latestVital.news2_score)} />
            </div>
          )}
        </div>
      </div>

      {/* ── Allergy Warning ── */}
      {user?.allergies?.length > 0 && (
        <div style={{
          background: '#fef3c7', border: '1px solid #fcd34d',
          borderRadius: 'var(--r-md)', padding: '12px 16px',
          marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <AlertTriangle size={15} color="#92400e" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#92400e' }}>Known Allergies</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#78350f' }}>{user.allergies.join(', ')}</p>
          </div>
        </div>
      )}

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
              borderRadius: 'var(--r-md)',
              cursor:       'pointer',
              fontSize:     '13px', fontWeight: '600',
              display:      'flex', alignItems: 'center', gap: '6px',
              transition:   'all 0.15s ease',
              fontFamily:   'inherit',
            }}
          >
            <tab.Icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {loading ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{
            width: '36px', height: '36px', margin: '0 auto 16px',
            border: '3px solid var(--border)', borderTopColor: 'var(--blue)',
            borderRadius: '50%',
          }} className="animate-spin" />
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading your health data…</p>
        </div>
      ) : (
        <>
          {/* Overview */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

                {/* Latest Vitals */}
                <div className="card" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Heart size={15} color="var(--danger)" />
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>Latest Vital Signs</h3>
                  </div>
                  {latestVital ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[
                        { label: 'Heart Rate',     value: `${latestVital.heart_rate} bpm`,               normal: '60–100',      ok: latestVital.heart_rate >= 60 && latestVital.heart_rate <= 100 },
                        { label: 'Blood Pressure', value: `${latestVital.systolic_bp}/${latestVital.diastolic_bp}`, normal: '90–140/60–90', ok: latestVital.systolic_bp >= 90 && latestVital.systolic_bp <= 140 },
                        { label: 'SpO2',           value: `${latestVital.spo2}%`,                        normal: '≥ 95%',       ok: latestVital.spo2 >= 95 },
                        { label: 'Temperature',    value: `${latestVital.temperature}°C`,                normal: '36.1–37.5°C', ok: latestVital.temperature >= 36.1 && latestVital.temperature <= 37.5 },
                        { label: 'Resp Rate',      value: `${latestVital.respiratory_rate}/min`,          normal: '12–20',       ok: latestVital.respiratory_rate >= 12 && latestVital.respiratory_rate <= 20 },
                        { label: 'NEWS2 Score',    value: latestVital.news2_score,                       normal: '0–4',         ok: latestVital.news2_score <= 4 },
                      ].map(vital => (
                        <div key={vital.label} style={{
                          background:   vital.ok ? '#f0fdf4' : '#fff5f5',
                          borderRadius: 'var(--r-sm)',
                          padding:      '10px 12px',
                          border:       `1px solid ${vital.ok ? '#86efac' : '#fecaca'}`,
                        }}>
                          <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            {vital.label}
                          </p>
                          <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: '700', color: vital.ok ? '#16a34a' : '#dc2626' }}>
                            {vital.value}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: '9px', color: 'var(--text-muted)' }}>
                            Normal: {vital.normal}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px', fontSize: '13px' }}>No vitals recorded yet</p>
                  )}
                </div>

                {/* Latest Assessment */}
                <div className="card" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <FileText size={15} color="var(--blue)" />
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>Latest Assessment</h3>
                  </div>
                  {latestReport ? (
                    <div>
                      <div style={{
                        background: latestReport.alert_level === 'CRITICAL' ? '#fee2e2' : '#f0fdf4',
                        borderRadius: 'var(--r-md)',
                        padding: '14px',
                        marginBottom: '14px',
                        textAlign: 'center',
                      }}>
                        <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Alert Level</p>
                        <p style={{
                          margin: '6px 0',
                          fontSize: '20px',
                          fontWeight: '800',
                          color: latestReport.alert_level === 'CRITICAL' ? '#dc2626' : '#16a34a',
                        }}>
                          {latestReport.alert_level}
                        </p>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 10px' }}>
                        {latestReport.summary}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                        {new Date(latestReport.generated_at).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px', fontSize: '13px' }}>No assessments yet</p>
                  )}
                </div>
              </div>

              {/* Care Team */}
              <div className="card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Stethoscope size={15} color="var(--blue)" />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>My Care Team</h3>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { role: 'Attending Doctor', name: user?.doctor,              Icon: Stethoscope, color: '#2563eb' },
                    { role: 'Ward',             name: user?.ward,                Icon: Activity,    color: '#059669' },
                    { role: 'Hospital',         name: 'City General Hospital',   Icon: Building2,   color: '#7c3aed' },
                  ].map(member => (
                    <div key={member.role} style={{
                      flex: 1,
                      background: 'var(--bg)',
                      borderRadius: 'var(--r-md)',
                      padding: '16px',
                      textAlign: 'center',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: `${member.color}12`, border: `1px solid ${member.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 10px',
                      }}>
                        <member.Icon size={17} color={member.color} />
                      </div>
                      <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        {member.role}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
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
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Heart size={15} color="var(--danger)" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>My Vitals History</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 18px' }}>
                {history?.total_readings} readings recorded
              </p>
              <VitalsChart history={history?.recent_vitals || []} />
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <FileText size={15} color="var(--blue)" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>My Health Reports</h3>
              </div>
              {!history?.recent_reports?.length ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px', fontSize: '13px' }}>No reports yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {history.recent_reports.map((report, i) => (
                    <div key={i} style={{
                      padding: '14px 16px',
                      background: report.alert_level === 'CRITICAL' ? '#fff5f5' : 'var(--bg)',
                      borderRadius: 'var(--r-md)',
                      border: `1px solid ${report.alert_level === 'CRITICAL' ? '#fecaca' : 'var(--border)'}`,
                      borderLeft: `3px solid ${report.alert_level === 'CRITICAL' ? '#dc2626' : '#16a34a'}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: '700',
                          color: report.alert_level === 'CRITICAL' ? '#dc2626' : '#16a34a',
                          background: report.alert_level === 'CRITICAL' ? '#fee2e2' : '#dcfce7',
                          padding: '2px 8px', borderRadius: '8px',
                        }}>
                          {report.alert_level}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(report.generated_at).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
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
