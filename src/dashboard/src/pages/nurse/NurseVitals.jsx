// File: src/dashboard/src/pages/nurse/NurseVitals.jsx
import { useState } from 'react';
import { analyzePatient } from '../../services/api';
import AgentReport from '../../components/AgentReport';

const NurseVitals = () => {
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);
  const [saved,   setSaved]   = useState(false);

  const [form, setForm] = useState({
    patient_id: '', age: '', gender: 'M', ward: 'ICU',
    heart_rate: '', systolic_bp: '', diastolic_bp: '',
    temperature: '', respiratory_rate: '', spo2: '',
    consciousness: 0, urine_output: '', glucose: '',
    pain_score: 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: ['patient_id','gender','ward'].includes(name)
        ? value : Number(value)
    }));
  };

  const handleSubmit = async () => {
    if (!form.patient_id) {
      setError('Patient ID is required');
      return;
    }
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await response.json();
      setResult(data.report);
      setSaved(true);
    } catch (err) {
      setError('Failed to submit. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'patient_id',       label: 'Patient ID *',        type: 'text',   required: true },
    { name: 'age',              label: 'Age',                  type: 'number' },
    { name: 'heart_rate',       label: 'Heart Rate (bpm)',     type: 'number', normal: '60-100' },
    { name: 'systolic_bp',      label: 'Systolic BP (mmHg)',   type: 'number', normal: '90-140' },
    { name: 'diastolic_bp',     label: 'Diastolic BP (mmHg)',  type: 'number', normal: '60-90' },
    { name: 'temperature',      label: 'Temperature (°C)',     type: 'number', normal: '36.1-37.5', step: '0.1' },
    { name: 'respiratory_rate', label: 'Respiratory Rate /min',type: 'number', normal: '12-20' },
    { name: 'spo2',             label: 'SpO2 (%)',             type: 'number', normal: '95-100' },
    { name: 'urine_output',     label: 'Urine Output (ml/hr)', type: 'number', normal: '>30' },
    { name: 'glucose',          label: 'Glucose (mmol/L)',     type: 'number', normal: '4-7' },
  ];

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '16px' }}>

        {/* Form */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700' }}>
            ❤️ Record Patient Vitals
          </h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#6b7280' }}>
            Enter observations to trigger AI clinical assessment
          </p>

          {/* Ward + Gender */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
                Ward
              </label>
              <select
                name="ward"
                value={form.ward}
                onChange={handleChange}
                style={{
                  width: '100%', padding: '8px 12px',
                  border: '1px solid #e5e7eb', borderRadius: '8px',
                  fontSize: '13px', backgroundColor: 'white',
                }}
              >
                {['ICU','HDU','Emergency','General'].map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
                Gender
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                style={{
                  width: '100%', padding: '8px 12px',
                  border: '1px solid #e5e7eb', borderRadius: '8px',
                  fontSize: '13px', backgroundColor: 'white',
                }}
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
          </div>

          {/* Vital Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {fields.map(field => (
              <div key={field.name}>
                <label style={{
                  fontSize: '12px', fontWeight: '600',
                  color: '#374151', display: 'block', marginBottom: '4px',
                }}>
                  {field.label}
                  {field.normal && (
                    <span style={{ fontWeight: '400', color: '#9ca3af', marginLeft: '4px' }}>
                      (Normal: {field.normal})
                    </span>
                  )}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  step={field.step || '1'}
                  style={{
                    width:        '100%',
                    padding:      '8px 12px',
                    border:       '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize:     '13px',
                    boxSizing:    'border-box',
                    outline:      'none',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            ))}
          </div>

          {/* Consciousness */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>
              Consciousness Level (AVPU)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: 0, label: 'A - Alert' },
                { value: 1, label: 'V - Voice' },
                { value: 2, label: 'P - Pain'  },
                { value: 3, label: 'U - Unresponsive' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(prev => ({ ...prev, consciousness: opt.value }))}
                  style={{
                    flex:            1,
                    padding:         '8px 4px',
                    backgroundColor: form.consciousness === opt.value
                      ? (opt.value === 0 ? '#16a34a' : opt.value === 1 ? '#d97706' : '#dc2626')
                      : '#f9fafb',
                    color:           form.consciousness === opt.value ? 'white' : '#374151',
                    border:          '1px solid #e5e7eb',
                    borderRadius:    '8px',
                    cursor:          'pointer',
                    fontSize:        '11px',
                    fontWeight:      '600',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pain Score */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>
              Pain Score: {form.pain_score}/10
            </label>
            <input
              type="range" min="0" max="10" step="1"
              value={form.pain_score}
              onChange={e => setForm(prev => ({ ...prev, pain_score: Number(e.target.value) }))}
              style={{ width: '100%', accentColor: '#2563eb' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
              <span>No Pain (0)</span>
              <span>Severe (10)</span>
            </div>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee2e2', color: '#dc2626',
              padding: '10px 14px', borderRadius: '8px',
              fontSize: '13px', marginBottom: '12px',
            }}>
              ❌ {error}
            </div>
          )}

          {saved && (
            <div style={{
              backgroundColor: '#dcfce7', color: '#16a34a',
              padding: '10px 14px', borderRadius: '8px',
              fontSize: '13px', marginBottom: '12px',
            }}>
              ✅ Vitals saved & AI analysis complete!
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width:           '100%',
              padding:         '14px',
              backgroundColor: loading ? '#9ca3af' : '#059669',
              color:           'white',
              border:          'none',
              borderRadius:    '10px',
              fontSize:        '14px',
              fontWeight:      '700',
              cursor:          loading ? 'not-allowed' : 'pointer',
              transition:      'all 0.2s',
            }}
          >
            {loading ? '⏳ Analyzing...' : '✅ Submit Vitals & Get AI Assessment'}
          </button>
        </div>

        {/* Result */}
        {result && <AgentReport report={result} />}
      </div>
    </div>
  );
};

export default NurseVitals;