// File: src/dashboard/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { getDashboardStats, getHighRiskPatients } from '../services/api';
import StatsCard     from '../components/StatsCard';
import AlertPanel    from '../components/AlertPanel';
import PatientForm   from '../components/PatientForm';
import ClinicalQA    from '../components/ClinicalQA';
import RiskBadge     from '../components/RiskBadge';
import AgentReport   from '../components/AgentReport';
import PatientDetail from '../pages/PatientDetail';

const Dashboard = () => {
  const [stats,          setStats]          = useState(null);
  const [highRisk,       setHighRisk]       = useState([]);
  const [lastUpdated,    setLastUpdated]    = useState(null);
  const [latestReport,   setLatestReport]   = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, highRiskData] = await Promise.all([
        getDashboardStats(),
        getHighRiskPatients(),
      ]);
      setStats(statsData);
      setHighRisk(highRiskData.patients || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch:', err);
    }
  };

  const handleAnalysisComplete = (report) => {
    setLatestReport(report);
    setTimeout(fetchData, 1000);
  };

  // Show Patient Detail Page
  if (selectedPatient) {
    return (
      <PatientDetail
        patientId={selectedPatient}
        onBack={() => setSelectedPatient(null)}
      />
    );
  }

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
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
            🏥 Clinical Early Warning System
          </h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
            AI-Powered Patient Monitoring & Triage
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            backgroundColor: '#22c55e', padding: '4px 12px',
            borderRadius: '20px', fontSize: '12px', fontWeight: '600',
            marginBottom: '4px', display: 'inline-block',
          }}>
            ● LIVE
          </div>
          <p style={{ margin: 0, fontSize: '11px', opacity: 0.7 }}>
            Updated: {lastUpdated || 'Loading...'}
          </p>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: '16px',
          marginBottom: '24px', flexWrap: 'wrap',
        }}>
          <StatsCard title="Total Patients" value={stats?.total_patients ?? '—'} icon="👥" color="#2563eb" subtitle="Registered" />
          <StatsCard title="High Risk"      value={stats?.high_risk      ?? '—'} icon="🔴" color="#dc2626" subtitle="Immediate attention" />
          <StatsCard title="Medium Risk"    value={stats?.medium_risk    ?? '—'} icon="🟡" color="#d97706" subtitle="Monitor closely" />
          <StatsCard title="Low Risk"       value={stats?.low_risk       ?? '—'} icon="🟢" color="#16a34a" subtitle="Routine monitoring" />
          <StatsCard title="Active Alerts"  value={stats?.active_alerts  ?? '—'} icon="🚨" color="#7c3aed" subtitle="Unresolved" />
        </div>

        {/* Row 1: Form + Alerts */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '16px', marginBottom: '16px',
        }}>
          <PatientForm onAnalysisComplete={handleAnalysisComplete} />
          <AlertPanel />
        </div>

        {/* Row 2: Agent Report (shows after analysis) */}
        {latestReport && (
          <div style={{ marginBottom: '16px' }}>
            <AgentReport report={latestReport} />
          </div>
        )}

        {/* Row 3: High Risk Table */}
        {highRisk.length > 0 && (
          <div style={{
            backgroundColor: 'white', borderRadius: '12px',
            padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '16px',
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              🔴 High Risk Patients
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['Patient ID','Risk Level','Confidence','NEWS2','Predicted At','Action'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', textAlign: 'left',
                      fontSize: '12px', fontWeight: '600',
                      color: '#6b7280', borderBottom: '1px solid #e5e7eb',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {highRisk.map((p, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: i % 2 === 0 ? 'white' : '#fafafa',
                  }}>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '600' }}>
                      {p.patient_id}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <RiskBadge label={p.risk_label} />
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                      {p.confidence}%
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '600' }}>
                      {p.news2_score}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b7280' }}>
                      {new Date(p.predicted_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <button
                        onClick={() => setSelectedPatient(p.patient_id)}
                        style={{
                          backgroundColor: '#eff6ff', color: '#2563eb',
                          border: '1px solid #bfdbfe', borderRadius: '6px',
                          padding: '4px 10px', fontSize: '12px',
                          cursor: 'pointer', fontWeight: '500',
                        }}
                      >
                        View History →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Row 4: Clinical Q&A */}
        <ClinicalQA />

      </div>
    </div>
  );
};

export default Dashboard;