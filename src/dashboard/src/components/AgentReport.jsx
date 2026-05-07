import { Zap, FlaskConical, Pill, BarChart2, AlertTriangle, Stethoscope, Brain } from 'lucide-react';

const Section = ({ title, Icon, items, color = '#2563eb' }) => {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <Icon size={13} color={color} />
        <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          {title}
        </p>
      </div>
      {items.map((item, i) => (
        <p key={i} style={{
          margin: '0 0 4px', fontSize: '12px',
          color: 'var(--text-secondary)', paddingLeft: '10px',
          borderLeft: `2px solid ${color}`, lineHeight: '1.5',
        }}>
          {item}
        </p>
      ))}
    </div>
  );
};

const AgentReport = ({ report }) => {
  if (!report) return null;

  const { prediction, triage, warnings, insights } = report;

  const RISK_COLOR = { High: '#dc2626', Medium: '#d97706', Low: '#059669' };
  const riskColor  = RISK_COLOR[prediction?.risk_label] || '#6b7280';

  return (
    <div className="card" style={{ padding: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: '#eff6ff', border: '1px solid #bfdbfe',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={16} color="var(--blue)" />
        </div>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>
          AI Clinical Report
        </h2>
      </div>

      {/* Risk header */}
      <div style={{
        background: riskColor, borderRadius: 'var(--r-md)',
        padding: '16px 20px', marginBottom: '14px', color: 'white',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risk Assessment</p>
            <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>
              {prediction?.risk_label} Risk
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '11px', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confidence</p>
            <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: '800' }}>{prediction?.confidence}%</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '11px', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>NEWS2</p>
            <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: '800' }}>{prediction?.news2_score}</p>
          </div>
        </div>
      </div>

      {/* Sepsis alert */}
      {warnings?.sepsis_alert && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5',
          borderRadius: 'var(--r-sm)', padding: '12px',
          marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start',
        }}>
          <AlertTriangle size={14} color="#dc2626" style={{ marginTop: '1px', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>
            {warnings.sepsis_alert}
          </p>
        </div>
      )}

      {/* Triage */}
      {triage && (
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: 'var(--r-sm)', padding: '14px', marginBottom: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Stethoscope size={13} color="var(--blue)" />
            <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Triage Decision
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Priority',   value: triage.priority_label },
              { label: 'Time',       value: triage.time_to_seen   },
              { label: 'Location',   value: triage.location       },
              { label: 'Color Code', value: triage.color_code     },
            ].map(item => (
              <div key={item.label}>
                <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {item.label}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clinical warnings */}
      {warnings?.warnings?.length > 0 && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 'var(--r-sm)', padding: '14px', marginBottom: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <AlertTriangle size={13} color="#d97706" />
            <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Clinical Warnings ({warnings.warnings.length})
            </p>
          </div>
          {warnings.warnings.map((w, i) => (
            <div key={i} style={{
              marginBottom: '6px', paddingBottom: '6px',
              borderBottom: i < warnings.warnings.length - 1 ? '1px solid #fde68a' : 'none',
            }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>
                {w.vital}: {w.value} (Normal: {w.normal})
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#92400e' }}>
                {w.action}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {insights && (
        <div>
          <Section title="Immediate Actions" Icon={Zap}           items={insights.immediate_actions} color="#dc2626" />
          <Section title="Investigations"    Icon={FlaskConical}  items={insights.investigations}    color="#7c3aed" />
          <Section title="Treatments"        Icon={Pill}          items={insights.treatments}        color="#2563eb" />
          <Section title="Monitoring Plan"   Icon={BarChart2}     items={insights.monitoring_plan}   color="#059669" />
        </div>
      )}

      {/* Summary */}
      {report.executive_summary && (
        <div style={{
          background: 'var(--bg)', borderRadius: 'var(--r-sm)',
          padding: '12px', marginTop: '4px', border: '1px solid var(--border)',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Executive Summary
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {report.executive_summary}
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentReport;
