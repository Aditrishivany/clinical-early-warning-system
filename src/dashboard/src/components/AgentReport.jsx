// File: src/dashboard/src/components/AgentReport.jsx

const Section = ({ title, items, color = '#2563eb' }) => {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: '12px' }}>
      <p style={{
        margin: '0 0 6px 0', fontSize: '12px',
        fontWeight: '600', color,
      }}>
        {title}
      </p>
      {items.map((item, i) => (
        <p key={i} style={{
          margin: '0 0 4px 0', fontSize: '12px',
          color: '#374151', paddingLeft: '8px',
          borderLeft: `2px solid ${color}`,
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

  const riskColors = {
    High:   '#dc2626',
    Medium: '#d97706',
    Low:    '#16a34a',
  };

  const riskColor = riskColors[prediction?.risk_label] || '#6b7280';

  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '12px',
      padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
        🤖 AI Clinical Report
      </h2>

      {/* Risk Header */}
      <div style={{
        backgroundColor: riskColor,
        borderRadius: '8px', padding: '16px',
        marginBottom: '16px', color: 'white',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
              Risk Assessment
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700' }}>
              {prediction?.risk_label} Risk
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
              Confidence
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700' }}>
              {prediction?.confidence}%
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
              NEWS2
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700' }}>
              {prediction?.news2_score}
            </p>
          </div>
        </div>
      </div>

      {/* Sepsis Alert */}
      {warnings?.sepsis_alert && (
        <div style={{
          backgroundColor: '#fee2e2', border: '1px solid #fca5a5',
          borderRadius: '8px', padding: '12px', marginBottom: '12px',
        }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>
            {warnings.sepsis_alert}
          </p>
        </div>
      )}

      {/* Triage */}
      {triage && (
        <div style={{
          backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: '8px', padding: '12px', marginBottom: '12px',
        }}>
          <p style={{
            margin: '0 0 6px 0', fontSize: '13px',
            fontWeight: '600', color: '#1d4ed8',
          }}>
            🏥 Triage Decision
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Priority',  value: triage.priority_label },
              { label: 'Time',      value: triage.time_to_seen },
              { label: 'Location',  value: triage.location },
              { label: 'Color Code', value: triage.color_code },
            ].map(item => (
              <div key={item.label}>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>
                  {item.label}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', fontWeight: '600' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings?.warnings?.length > 0 && (
        <div style={{
          backgroundColor: '#fefce8', border: '1px solid #fde68a',
          borderRadius: '8px', padding: '12px', marginBottom: '12px',
        }}>
          <p style={{
            margin: '0 0 8px 0', fontSize: '13px',
            fontWeight: '600', color: '#d97706',
          }}>
            ⚠️ Clinical Warnings ({warnings.warnings.length})
          </p>
          {warnings.warnings.map((w, i) => (
            <div key={i} style={{
              marginBottom: '6px', paddingBottom: '6px',
              borderBottom: i < warnings.warnings.length - 1
                ? '1px solid #fde68a' : 'none',
            }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '600' }}>
                {w.vital}: {w.value} (Normal: {w.normal})
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#92400e' }}>
                → {w.action}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {insights && (
        <div>
          <Section
            title="⚡ Immediate Actions"
            items={insights.immediate_actions}
            color="#dc2626"
          />
          <Section
            title="🔬 Investigations"
            items={insights.investigations}
            color="#7c3aed"
          />
          <Section
            title="💊 Treatments"
            items={insights.treatments}
            color="#2563eb"
          />
          <Section
            title="📊 Monitoring Plan"
            items={insights.monitoring_plan}
            color="#059669"
          />
        </div>
      )}

      {/* Summary */}
      {report.executive_summary && (
        <div style={{
          backgroundColor: '#f9fafb', borderRadius: '8px',
          padding: '12px', marginTop: '12px',
          border: '1px solid #e5e7eb',
        }}>
          <p style={{
            margin: '0 0 4px 0', fontSize: '11px',
            fontWeight: '600', color: '#6b7280',
          }}>
            EXECUTIVE SUMMARY
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#374151' }}>
            {report.executive_summary}
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentReport;