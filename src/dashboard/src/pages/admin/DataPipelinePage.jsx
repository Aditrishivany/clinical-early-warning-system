import { Activity, CheckCircle2, Cloud, Database, GitBranch, Layers, Server } from 'lucide-react';

const stages = [
  {
    name: 'Raw',
    path: 'src/data/lakehouse/raw/vitals',
    records: '10,000',
    detail: 'Monitor feed snapshot',
    Icon: Database,
  },
  {
    name: 'Staged',
    path: 'src/data/lakehouse/staged/vitals',
    records: '10,000',
    detail: 'Typed and deduplicated',
    Icon: GitBranch,
  },
  {
    name: 'Curated',
    path: 'src/data/lakehouse/curated/patient_risk',
    records: '10,000',
    detail: 'NEWS2 and model features',
    Icon: Layers,
  },
];

const azureServices = [
  { name: 'Azure Data Factory', role: 'Orchestration', Icon: Cloud },
  { name: 'Databricks or Fabric', role: 'Transform', Icon: Server },
  { name: 'Azure SQL', role: 'Serving store', Icon: Database },
  { name: 'Power BI', role: 'Published analytics', Icon: Activity },
];

const DataPipelinePage = () => (
  <div className="animate-fade" style={{ display: 'grid', gap: '16px' }}>
    <section className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>Data Pipeline</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Raw to staged to curated clinical data flow
          </p>
        </div>
        <span className="badge badge-low">EXECUTABLE</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {stages.map((stage, index) => (
          <div key={stage.name} style={{
            border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '18px',
            position: 'relative', background: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: '#eff6ff', border: '1px solid #bfdbfe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <stage.Icon size={18} color="var(--blue)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>{stage.name}</h3>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{stage.detail}</p>
              </div>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: 800, color: '#1e40af' }}>{stage.records}</p>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{stage.path}</p>
            {index < stages.length - 1 && (
              <div style={{
                position: 'absolute', right: '-18px', top: '50%', transform: 'translateY(-50%)',
                width: '22px', height: '2px', background: '#bfdbfe', zIndex: 2,
              }} />
            )}
          </div>
        ))}
      </div>
    </section>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <section className="card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800 }}>Azure Services</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {azureServices.map((service) => (
            <div key={service.name} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px', border: '1px solid #a7f3d0', borderRadius: 'var(--r-sm)', background: '#ecfdf5',
            }}>
              <service.Icon size={16} color="#059669" />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 800 }}>{service.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{service.role}</p>
              </div>
              <CheckCircle2 size={16} color="#059669" />
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800 }}>Generated Artifacts</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {[
            'pipeline_manifest.json',
            'patient_vitals_raw.parquet',
            'patient_vitals_staged.parquet',
            'patient_risk_curated.parquet',
          ].map((artifact) => (
            <div key={artifact} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>{artifact}</span>
              <span className="badge badge-low">READY</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);

export default DataPipelinePage;
