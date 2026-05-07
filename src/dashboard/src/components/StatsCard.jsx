// File: src/dashboard/src/components/StatsCard.jsx

const StatsCard = ({ title, value, icon, color, subtitle }) => (
  <div className="card" style={{
    padding:    '20px 24px',
    flex:        1,
    minWidth:   '150px',
    borderTop:  `2px solid ${color}`,
    position:   'relative',
    overflow:   'hidden',
    transition: 'all 0.3s ease',
  }}>
    <div style={{
      position:      'absolute',
      top:           '-20px',
      right:         '-20px',
      width:         '80px',
      height:        '80px',
      borderRadius:  '50%',
      background:    `${color}12`,
      filter:        'blur(20px)',
      pointerEvents: 'none',
    }}/>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <p style={{
          margin:0, fontSize:'10px', color:'var(--text-muted)',
          fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px',
        }}>
          {title}
        </p>
        <p style={{
          margin:'6px 0 4px', fontSize:'32px',
          fontWeight:'800', color, lineHeight:1,
          letterSpacing:'-1px',
        }}>
          {value ?? '—'}
        </p>
        {subtitle && (
          <p style={{ margin:0, fontSize:'11px', color:'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      <span style={{ fontSize:'26px', opacity:0.7 }}>{icon}</span>
    </div>
  </div>
);

export default StatsCard;