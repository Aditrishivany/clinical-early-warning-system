// File: src/dashboard/src/pages/LiveMonitor.jsx
import { useState, useEffect } from 'react';
import { Users, AlertTriangle, Activity, Bell, RefreshCw } from 'lucide-react';
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
    { id: 'all',    label: 'All Patients', color: '#6b7280' },
    { id: 'high',   label: 'High Risk',    color: '#dc2626' },
    { id: 'medium', label: 'Medium Risk',  color: '#d97706' },
    { id: 'low',    label: 'Low Risk',     color: '#16a34a' },
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
          { label: 'Total Monitored', value: stats?.total_patients ?? 0, color: '#2563eb', Icon: Users         },
          { label: 'High Risk',       value: stats?.high_risk      ?? 0, color: '#dc2626', Icon: AlertTriangle  },
          { label: 'Medium Risk',     value: stats?.medium_risk    ?? 0, color: '#d97706', Icon: Activity       },
          { label: 'Low Risk',        value: stats?.low_risk       ?? 0, color: '#16a34a', Icon: Activity       },
          { label: 'Active Alerts',   value: stats?.active_alerts  ?? 0, color: '#7c3aed', Icon: Bell           },
        ].map(stat => (
          <div key={stat.label} className="card" style={{
            padding: '16px 20px', flex: 1, minWidth: '130px',
            borderLeft: `4px solid ${stat.color}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {stat.label}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: '800', color: stat.color }}>
                  {stat.value}
                </p>
              </div>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: `${stat.color}12`, border: `1px solid ${stat.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <stat.Icon size={16} color={stat.color} />
              </div>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <div className="status-dot live" />
          Updated: {lastUpdate || 'Loading…'}
          <button
            onClick={fetchData}
            style={{
              padding: '4px 10px',
              background: '#eff6ff', color: 'var(--blue)',
              border: '1px solid #bfdbfe', borderRadius: '6px',
              cursor: 'pointer', fontSize: '11px', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit',
            }}
          >
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>
      </div>

      {/* Patient Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{
            width: '36px', height: '36px', margin: '0 auto 16px',
            border: '3px solid var(--border)', borderTopColor: 'var(--blue)',
            borderRadius: '50%',
          }} className="animate-spin" />
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Loading patients…</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: '#eff6ff', border: '1px solid #bfdbfe',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <Activity size={22} color="var(--blue)" />
          </div>
          <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)', margin: '0 0 6px' }}>No patients found</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 12px' }}>
            Run the simulator to add patients:
          </p>
          <code style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            padding: '6px 12px', borderRadius: 'var(--r-sm)',
            fontSize: '12px', display: 'inline-block', color: 'var(--text)',
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