// File: src/dashboard/src/components/PatientForm.jsx
import { useState } from 'react';
import { analyzePatient } from '../services/api';
import RiskBadge from './RiskBadge';

const PatientForm = ({ onAnalysisComplete }) => {
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);

  const [form, setForm] = useState({
    patient_id: 'PT1001', age: 72, gender: 'M', ward: 'ICU',
    heart_rate: 128, systolic_bp: 85, diastolic_bp: 55,
    temperature: 39.2, respiratory_rate: 28, spo2: 89,
    consciousness: 1, urine_output: 12, glucose: 11.5,
    pain_score: 7,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: ['patient_id','gender','ward'].includes(name)
        ? value
        : Number(value)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzePatient(form);
      setResult(data.report);
      if (onAnalysisComplete) onAnalysisComplete(data.report);
    } catch (err) {
      console.error('PatientForm analyze:', err);
      setError(`Failed to analyze: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '8px 10px',
    border: '1px solid #e5e7eb', borderRadius: '6px',
    fontSize: '13px', boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: '12px', fontWeight: '500',
    color: '#374151', marginBottom: '4px', display: 'block',
  };

  const fieldGroups = [
    {
      title: '👤 Patient Info',
      fields: [
        { name: 'patient_id', label: 'Patient ID', type: 'text' },
        { name: 'age',        label: 'Age',        type: 'number' },
        { name: 'gender',     label: 'Gender (M/F)', type: 'text' },
        { name: 'ward',       label: 'Ward',       type: 'text' },
      ]
    },
    {
      title: '❤️ Vital Signs',
      fields: [
        { name: 'heart_rate',       label: 'Heart Rate (bpm)',   type: 'number' },
        { name: 'systolic_bp',      label: 'Systolic BP (mmHg)', type: 'number' },
        { name: 'diastolic_bp',     label: 'Diastolic BP',       type: 'number' },
        { name: 'temperature',      label: 'Temperature (°C)',   type: 'number' },
        { name: 'respiratory_rate', label: 'Resp Rate (/min)',   type: 'number' },
        { name: 'spo2',             label: 'SpO2 (%)',           type: 'number' },
        { name: 'consciousness',    label: 'Consciousness (0-3)', type: 'number' },
        { name: 'urine_output',     label: 'Urine Output (ml/h)', type: 'number' },
        { name: 'glucose',          label: 'Glucose (mmol/L)',   type: 'number' },
        { name: 'pain_score',       label: 'Pain Score (0-10)',  type: 'number' },
      ]
    }
  ];

  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '12px',
      padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
        🏥 Patient Analysis
      </h2>

      {fieldGroups.map(group => (
        <div key={group.title} style={{ marginBottom: '16px' }}>
          <p style={{
            fontSize: '13px', fontWeight: '600',
            color: '#6b7280', margin: '0 0 10px 0',
          }}>
            {group.title}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
          }}>
            {group.fields.map(field => (
              <div key={field.name}>
                <label style={labelStyle}>{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  style={inputStyle}
                  step={field.name === 'temperature' ? '0.1' : '1'}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width:           '100%',
          padding:         '12px',
          backgroundColor: loading ? '#9ca3af' : '#2563eb',
          color:           'white',
          border:          'none',
          borderRadius:    '8px',
          fontSize:        '14px',
          fontWeight:      '600',
          cursor:          loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '⏳ Analyzing...' : '🔍 Analyze Patient'}
      </button>

      {error && (
        <div style={{
          marginTop: '12px', padding: '12px',
          backgroundColor: '#fee2e2', borderRadius: '8px',
          color: '#dc2626', fontSize: '13px',
        }}>
          ❌ {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop: '16px', padding: '16px',
          backgroundColor: '#f9fafb', borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '12px',
          }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
              Analysis Result
            </h3>
            <RiskBadge
              label={result.prediction?.risk_label}
              size="large"
            />
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px', marginBottom: '12px',
          }}>
            {[
              { label: 'Confidence', value: `${result.prediction?.confidence}%` },
              { label: 'NEWS2 Score', value: result.prediction?.news2_score },
              { label: 'Alert Level', value: result.alert_level },
            ].map(item => (
              <div key={item.label} style={{
                backgroundColor: 'white', padding: '10px',
                borderRadius: '8px', textAlign: 'center',
                border: '1px solid #e5e7eb',
              }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>
                  {item.label}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '700' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {result.triage && (
            <div style={{
              backgroundColor: '#eff6ff', padding: '10px',
              borderRadius: '8px', marginBottom: '8px',
            }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#1d4ed8' }}>
                🏥 Triage: {result.triage.priority_label}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#374151' }}>
                {result.triage.time_to_seen} → {result.triage.location}
              </p>
            </div>
          )}

          {result.warnings?.sepsis_alert && (
            <div style={{
              backgroundColor: '#fee2e2', padding: '10px',
              borderRadius: '8px', marginBottom: '8px',
            }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#dc2626' }}>
                {result.warnings.sepsis_alert}
              </p>
            </div>
          )}

          {result.insights?.immediate_actions?.length > 0 && (
            <div>
              <p style={{
                margin: '0 0 6px 0', fontSize: '12px',
                fontWeight: '600', color: '#374151',
              }}>
                Immediate Actions:
              </p>
              {result.insights.immediate_actions.map((action, i) => (
                <p key={i} style={{
                  margin: '0 0 4px 0', fontSize: '12px', color: '#374151',
                }}>
                  → {action}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientForm;