// File: src/dashboard/src/App.jsx
import { useState, useEffect } from 'react';
import './styles.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { getActiveAlerts }       from './services/api';

// Pages
import LoginPage      from './pages/LoginPage';
import Layout         from './components/Layout';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';

// Doctor
import DoctorDashboard from './pages/doctor/DoctorDashboard';

// Nurse
import NurseDashboard  from './pages/nurse/NurseDashboard';
import NurseVitals     from './pages/nurse/NurseVitals';

// Patient
import PatientHome from './pages/patient/PatientHome';
import PatientAsk  from './pages/patient/PatientAsk';

// Shared
import LiveMonitor   from './pages/LiveMonitor';
import AlertsPage    from './pages/AlertsPage';
import PatientDetail from './pages/PatientDetail';
import ClinicalQA    from './components/ClinicalQA';
import PatientForm   from './components/PatientForm';
import AgentReport   from './components/AgentReport';

// ─────────────────────────────────────────
// MAIN APP (with auth)
// ─────────────────────────────────────────
function AppContent() {
  const { user }             = useAuth();
  const [page,       setPage]       = useState('dashboard');
  const [alertCount, setAlertCount] = useState(0);
  const [selectedPt, setSelectedPt] = useState(null);
  const [lastReport, setLastReport] = useState(null);

  useEffect(() => {
    if (user) {
      fetchAlertCount();
      const interval = setInterval(fetchAlertCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchAlertCount = async () => {
    try {
      const data = await getActiveAlerts();
      setAlertCount(data.total || 0);
    } catch (err) {}
  };

  const handleNavigate = (newPage) => {
    setPage(newPage);
    setSelectedPt(null);
  };

  const handleSelectPatient = (patientId) => {
    setSelectedPt(patientId);
  };

  // Not logged in → show login
  if (!user) return <LoginPage />;

  // Patient detail page (shared across roles)
  if (selectedPt) {
    return (
      <Layout
        activePage={page}
        onNavigate={handleNavigate}
        alertCount={alertCount}
      >
        <PatientDetail
          patientId={selectedPt}
          onBack={() => setSelectedPt(null)}
        />
      </Layout>
    );
  }

  const renderPage = () => {

    // ── ADMIN PAGES ──
    if (user.role === 'admin') {
      switch (page) {
        case 'dashboard': return <AdminDashboard onNavigate={handleNavigate} />;
        case 'patients':  return <LiveMonitor onSelectPatient={handleSelectPatient} />;
        case 'monitor':   return <LiveMonitor onSelectPatient={handleSelectPatient} />;
        case 'alerts':    return <AlertsPage />;
        case 'analytics': return (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '48px' }}>📊</p>
            <h3>Analytics Dashboard</h3>
            <p style={{ color: '#6b7280' }}>
              Connect Power BI here — Coming in next phase!
            </p>
          </div>
        );
        case 'pipeline': return (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '48px' }}>🔄</p>
            <h3>Azure Data Pipeline</h3>
            <p style={{ color: '#6b7280' }}>
              Azure Data Factory integration — Coming in next phase!
            </p>
          </div>
        );
        default: return <AdminDashboard onNavigate={handleNavigate} />;
      }
    }

    // ── DOCTOR PAGES ──
    if (user.role === 'doctor') {
      switch (page) {
        case 'dashboard': return (
          <DoctorDashboard
            onNavigate={handleNavigate}
            onSelectPatient={handleSelectPatient}
          />
        );
        case 'patients': return <LiveMonitor onSelectPatient={handleSelectPatient} />;
        case 'analyze':  return (
          <div style={{ display: 'grid', gridTemplateColumns: lastReport ? '1fr 1fr' : '600px', gap: '16px' }}>
            <PatientForm onAnalysisComplete={(r) => setLastReport(r)} />
            {lastReport && <AgentReport report={lastReport} />}
          </div>
        );
        case 'alerts':  return <AlertsPage />;
        case 'reports': return <LiveMonitor onSelectPatient={handleSelectPatient} />;
        case 'qa':      return <div style={{ maxWidth: '800px' }}><ClinicalQA /></div>;
        default: return (
          <DoctorDashboard
            onNavigate={handleNavigate}
            onSelectPatient={handleSelectPatient}
          />
        );
      }
    }

    // ── NURSE PAGES ──
    if (user.role === 'nurse') {
      switch (page) {
        case 'dashboard': return (
          <NurseDashboard
            onNavigate={handleNavigate}
            onSelectPatient={handleSelectPatient}
          />
        );
        case 'monitor':  return <LiveMonitor onSelectPatient={handleSelectPatient} />;
        case 'vitals':   return <NurseVitals />;
        case 'alerts':   return <AlertsPage />;
        case 'handover': return (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '48px' }}>📝</p>
            <h3>Shift Handover Notes</h3>
            <p style={{ color: '#6b7280' }}>Coming soon!</p>
          </div>
        );
        default: return (
          <NurseDashboard
            onNavigate={handleNavigate}
            onSelectPatient={handleSelectPatient}
          />
        );
      }
    }

    // ── PATIENT PAGES ──
    if (user.role === 'patient') {
      switch (page) {
        case 'dashboard': return <PatientHome onNavigate={handleNavigate} />;
        case 'vitals':    return <PatientHome onNavigate={handleNavigate} />;
        case 'reports':   return <PatientHome onNavigate={handleNavigate} />;
        case 'ask':       return <PatientAsk />;
        default:          return <PatientHome onNavigate={handleNavigate} />;
      }
    }

    return <div>Page not found</div>;
  };

  return (
    <Layout
      activePage={page}
      onNavigate={handleNavigate}
      alertCount={alertCount}
    >
      {renderPage()}
    </Layout>
  );
}

// Wrap with Auth Provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;