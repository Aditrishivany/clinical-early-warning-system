// App.jsx — root with error boundary, auth restoration, role-based routing

import { useState, useEffect, Component } from 'react';
import './styles.css';
import ChatBot       from './components/ChatBot';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getActiveAlerts }       from './services/api';

import LoginPage      from './pages/LoginPage';
import Layout         from './components/Layout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import DataPipelinePage from './pages/admin/DataPipelinePage';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import NurseDashboard  from './pages/nurse/NurseDashboard';
import NurseVitals     from './pages/nurse/NurseVitals';
import ShiftHandover   from './pages/nurse/ShiftHandover';
import PatientHome     from './pages/patient/PatientHome';
import PatientAsk      from './pages/patient/PatientAsk';
import LiveMonitor     from './pages/LiveMonitor';
import AlertsPage      from './pages/AlertsPage';
import PatientDetail   from './pages/PatientDetail';
import ClinicalQA      from './components/ClinicalQA';
import PatientForm     from './components/PatientForm';
import AgentReport     from './components/AgentReport';


// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ClinicalAI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight:      '100vh',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          background:     'var(--bg)',
          padding:        '40px',
          textAlign:      'center',
        }}>
          <div style={{
            background:    'var(--white)',
            border:        '1px solid var(--border)',
            borderRadius:  'var(--r-xl)',
            padding:       '48px',
            maxWidth:      '480px',
            boxShadow:     'var(--shadow-lg)',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: '24px',
            }}>
              ⚠
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              An unexpected error occurred. Please refresh the page.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


// ── Loading screen ────────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'var(--bg)',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '44px', height: '44px',
        border: '3px solid var(--border)',
        borderTopColor: 'var(--blue)',
        borderRadius: '50%',
        margin: '0 auto 16px',
      }} className="animate-spin" />
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
        Loading ClinicalAI…
      </p>
    </div>
  </div>
);


// ── Main app content ──────────────────────────────────────────────────────────
function AppContent() {
  const { user, loading }        = useAuth();
  const [page,       setPage]    = useState('dashboard');
  const [alertCount, setAlerts]  = useState(0);
  const [selectedPt, setPt]      = useState(null);
  const [lastReport, setReport]  = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetch = () =>
      getActiveAlerts()
        .then(d => setAlerts(d.total || 0))
        .catch(() => {});
    fetch();
    const id = setInterval(fetch, 30_000);
    return () => clearInterval(id);
  }, [user]);

  if (loading)  return <LoadingScreen />;
  if (!user)    return <LoginPage />;

  const navigate = (p) => { setPage(p); setPt(null); };

  // Patient detail overrides normal page
  if (selectedPt) {
    return (
      <Layout activePage={page} onNavigate={navigate} alertCount={alertCount}>
        <PatientDetail patientId={selectedPt} onBack={() => setPt(null)} />
      </Layout>
    );
  }

  const renderPage = () => {
    if (user.role === 'admin') {
      switch (page) {
        case 'dashboard': return <AdminDashboard onNavigate={navigate} />;
        case 'patients':
        case 'monitor':   return <LiveMonitor onSelectPatient={setPt} />;
        case 'alerts':    return <AlertsPage />;
        case 'analytics': return <AnalyticsDashboard />;
        case 'pipeline':  return <DataPipelinePage />;
        default:          return <AdminDashboard onNavigate={navigate} />;
      }
    }

    if (user.role === 'doctor') {
      switch (page) {
        case 'dashboard': return <DoctorDashboard onNavigate={navigate} onSelectPatient={setPt} />;
        case 'patients':  return <LiveMonitor onSelectPatient={setPt} />;
        case 'analyze':   return (
          <div style={{ display: 'grid', gridTemplateColumns: lastReport ? '1fr 1fr' : '600px', gap: '20px' }}>
            <PatientForm onAnalysisComplete={setReport} />
            {lastReport && <AgentReport report={lastReport} />}
          </div>
        );
        case 'alerts':    return <AlertsPage />;
        case 'reports':   return <LiveMonitor onSelectPatient={setPt} />;
        case 'qa':        return <div style={{ maxWidth: '800px' }}><ClinicalQA /></div>;
        default:          return <DoctorDashboard onNavigate={navigate} onSelectPatient={setPt} />;
      }
    }

    if (user.role === 'nurse') {
      switch (page) {
        case 'dashboard': return <NurseDashboard onNavigate={navigate} onSelectPatient={setPt} />;
        case 'monitor':   return <LiveMonitor onSelectPatient={setPt} />;
        case 'vitals':    return <NurseVitals />;
        case 'alerts':    return <AlertsPage />;
        case 'handover':  return <ShiftHandover />;
        default:          return <NurseDashboard onNavigate={navigate} onSelectPatient={setPt} />;
      }
    }

    if (user.role === 'patient') {
      switch (page) {
        case 'dashboard':
        case 'vitals':
        case 'reports':  return <PatientHome onNavigate={navigate} />;
        case 'ask':      return <PatientAsk />;
        default:         return <PatientHome onNavigate={navigate} />;
      }
    }

    return <ComingSoon icon="🔍" title="Page Not Found" desc="This page doesn't exist" />;
  };

  return (
    <Layout activePage={page} onNavigate={navigate} alertCount={alertCount}>
      {renderPage()}
      <ChatBot />
    </Layout>
  );
}

// ── Coming Soon placeholder ───────────────────────────────────────────────────
const ComingSoon = ({ icon, title, desc }) => (
  <div className="card animate-fade" style={{
    padding: '64px 40px', textAlign: 'center', maxWidth: '480px', margin: '0 auto',
  }}>
    <div style={{ fontSize: '48px', marginBottom: '16px', lineHeight: 1 }}>{icon}</div>
    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>
      {title}
    </h3>
    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{desc}</p>
  </div>
);


// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
