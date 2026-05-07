import { Clock } from 'lucide-react';


const VitalBadge = ({ label, value, unit, warning, critical }) => {
  let color = '#16a34a';
  let bg    = '#dcfce7';

  if (critical && (value <= critical[0] || value >= critical[1])) {
    color = '#dc2626'; bg = '#fee2e2';
  } else if (warning && (value <= warning[0] || value >= warning[1])) {
    color = '#d97706'; bg = '#fef3c7';
  }

  return (
    <div style={{
      backgroundColor: bg,
      borderRadius:    '8px',
      padding:         '8px 10px',
      textAlign:       'center',
      minWidth:        '70px',
    }}>
      <p style={{ margin: 0, fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>
        {label}
      </p>
      <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '700', color }}>
        {typeof value === 'number' ? value.toFixed(1) : value}
      </p>
      <p style={{ margin: 0, fontSize: '9px', color: '#9ca3af' }}>
        {unit}
      </p>
    </div>
  );
};

const PatientMonitorCard = ({ patient, onClick }) => {
  if (!patient) return null;

  const riskConfig = {
    High:   { bg: '#fee2e2', border: '#fca5a5', badge: '#dc2626' },
    Medium: { bg: '#fef3c7', border: '#fcd34d', badge: '#d97706' },
    Low:    { bg: '#f0fdf4', border: '#86efac', badge: '#16a34a' },
  };

  const config = riskConfig[patient.risk_label] || riskConfig.Low;

  return (
    <div
      onClick={onClick}
      className="card"
      style={{
        border:     `1px solid ${config.border}`,
        cursor:     'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        overflow:   'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Header */}
      <div style={{
        backgroundColor: config.badge,
        padding:         '10px 14px',
        display:         'flex',
        justifyContent:  'space-between',
        alignItems:      'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>
            {patient.patient_id}
          </span>
          <span style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white', padding: '2px 8px',
            borderRadius: '10px', fontSize: '10px',
          }}>
            {patient.ward || 'Ward'}
          </span>
        </div>
        <span style={{
          backgroundColor: 'rgba(255,255,255,0.9)',
          color:           config.badge,
          padding:         '2px 8px',
          borderRadius:    '10px',
          fontSize:        '11px',
          fontWeight:      '700',
        }}>
          {patient.risk_label} Risk
        </span>
      </div>

      {/* Vitals */}
      <div style={{
        padding:             '12px',
        display:             'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap:                 '8px',
        backgroundColor:     config.bg,
      }}>
        <VitalBadge label="Heart Rate"  value={patient.heart_rate}        unit="bpm"   warning={[50,100]}  critical={[40,130]} />
        <VitalBadge label="Systolic BP" value={patient.systolic_bp}       unit="mmHg"  warning={[90,140]}  critical={[80,180]} />
        <VitalBadge label="SpO2"        value={patient.spo2}              unit="%"     warning={[92,100]}  critical={[85,100]} />
        <VitalBadge label="Temp"        value={patient.temperature}       unit="°C"    warning={[36,38.3]} critical={[35,39.5]} />
        <VitalBadge label="Resp Rate"   value={patient.respiratory_rate}  unit="/min"  warning={[12,20]}   critical={[8,25]} />
        <VitalBadge label="NEWS2"       value={patient.news2_score}       unit="score" warning={[3,6]}     critical={[7,20]} />
      </div>

      {/* Footer */}
      <div style={{
        padding:        '8px 14px',
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        borderTop:      '1px solid #f3f4f6',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={11} />
          {new Date(patient.predicted_at).toLocaleTimeString()}
        </span>
        <span style={{ fontSize: '11px', color: '#2563eb' }}>
          View Details →
        </span>
      </div>
    </div>
  );
};

export default PatientMonitorCard;