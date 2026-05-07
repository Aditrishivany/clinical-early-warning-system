// File: src/dashboard/src/pages/LiveMonitor.jsx
import { useState, useEffect } from 'react';
import { getHighRiskPatients, getDashboardStats } from '../services/api';
import PatientMonitorCard from '../components/PatientMonitorCard';
import PatientDetail      from './PatientDetail';

const LiveMonitor = ({ onSelectPatient }) => {
  const [patients,   setPatients]   = useState([]);
  const [stats,      setStats]      = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [filter,     setFilter]     = useState('all');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [pData, sData] = await Promise.all([
        getHighRiskPatients(),
        getDashboardStats(),
      ]);
      setPatients(pData.patients || []);
      setStats(sData);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (patientId) => {
    if (onSelectPatient) {
      onSelectPatient(patientId);
    } else {
      setSelected(patientId);
    }
  };

  if (selected) {
    return (
      <PatientDetail
        patientId={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  const filterButtons = [
    { id: 'all',    label: 'All Patients',   color: '#6b7280' },
    { id: 'high',   label: '🔴 High Risk',   color: '#dc2626' },
    { id: 'medium', label: '🟡 Medium Risk', color: '#d97706' },
    { id: 'low',    label: '🟢 Low Risk',    color: '#16a34a' },
  ];

  const filteredPatients = patients.filter(p => {
    if (filter === 'all')    return true;
    if (filter === 'high')   return p.risk_label === 'High';
    if (filter === 'medium') return p.risk_label === 'Medium';
    if (filter === 'low')    return p.risk_label === 'Low';
    return true;
  });

  return (
    <div className="animate-fade">

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Monitored', value: stats?.total_patients ?? 0, color: '#2563eb', icon: '👥' },
          { label: 'High Risk',       value: stats?.high_risk      ?? 0, color: '#dc2626', icon: '🔴' },
          { label: 'Medium Risk',     value: stats?.medium_risk    ?? 0, color: '#d97706', icon: '🟡' },
          { label: 'Low Risk',        value: stats?.low_risk       ?? 0, color: '#16a34a', icon: '🟢' },
          { label: 'Active Alerts',   value: stats?.active_alerts  ?? 0, color: '#7c3aed', icon: '🚨' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{
            padding: '16px 20px', flex: 1, minWidth: '130px',
            borderLeft: `4px solid ${stat.color}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>
                  {stat.label}
                </p>
                <p style={{
                  margin: '4px 0 0 0', fontSize: '28px',
                  fontWeight: '700', color: stat.color,
                }}>
                  {stat.value}
                </p>
              </div>
              <span style={{ fontSize: '28px' }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {filterButtons.map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              style={{
                padding:         '6px 14px',
                backgroundColor: filter === btn.id ? btn.color : 'white',
                color:           filter === btn.id ? 'white'   : '#374151',
                border:          `1px solid ${filter === btn.id ? btn.color : '#e5e7eb'}`,
                borderRadius:    '20px',
                cursor:          'pointer',
                fontSize:        '12px',
                fontWeight:      '500',
                transition:      'all 0.2s',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: '#22c55e', animation: 'pulse 2s infinite',
          }}/>
          Updated: {lastUpdate || 'Loading...'}
          <button
            onClick={fetchData}
            style={{
              padding: '4px 10px', backgroundColor: '#eff6ff',
              color: '#2563eb', border: '1px solid #bfdbfe',
              borderRadius: '6px', cursor: 'pointer', fontSize: '11px',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Patient Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ fontSize: '32px' }}>⏳</p>
          <p style={{ color: '#6b7280' }}>Loading patients...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ fontSize: '48px', margin: '0 0 12px 0' }}>🏥</p>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
            No patients found
          </p>
          <p style={{ color: '#6b7280', fontSize: '13px' }}>
            Run the simulator to add patients:
          </p>
          <code style={{
            backgroundColor: '#f3f4f6', padding: '6px 12px',
            borderRadius: '6px', fontSize: '12px', marginTop: '8px',
            display: 'inline-block',
          }}>
            python scripts/simulate_realtime.py
          </code>
        </div>
      ) : (
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap:                 '16px',
        }}>
          {filteredPatients.map((patient, i) => (
            <PatientMonitorCard
              key={i}
              patient={patient}
              onClick={() => handleCardClick(patient.patient_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveMonitor;