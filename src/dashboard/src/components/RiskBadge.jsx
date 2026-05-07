// File: src/dashboard/src/components/RiskBadge.jsx

const RiskBadge = ({ level, label, size = 'normal' }) => {
  const config = {
    High:   { bg:'rgba(239,68,68,0.15)',  text:'#f87171', border:'rgba(239,68,68,0.3)',  dot:'#ef4444' },
    Medium: { bg:'rgba(245,158,11,0.15)', text:'#fbbf24', border:'rgba(245,158,11,0.3)', dot:'#f59e0b' },
    Low:    { bg:'rgba(16,185,129,0.15)', text:'#34d399', border:'rgba(16,185,129,0.3)', dot:'#10b981' },
  };

  const c   = config[label] || config.Low;
  const pad = size === 'large' ? '6px 14px' : '3px 10px';
  const fs  = size === 'large' ? '13px' : '11px';

  return (
    <span style={{
      backgroundColor: c.bg,
      color:           c.text,
      border:          `1px solid ${c.border}`,
      borderRadius:    '20px',
      padding:         pad,
      fontSize:        fs,
      fontWeight:      '700',
      display:         'inline-flex',
      alignItems:      'center',
      gap:             '5px',
      letterSpacing:   '0.3px',
    }}>
      <span style={{
        width:           '6px',
        height:          '6px',
        borderRadius:    '50%',
        backgroundColor: c.dot,
        boxShadow:       `0 0 6px ${c.dot}`,
        display:         'inline-block',
        flexShrink:      0,
      }}/>
      {label || 'Unknown'} Risk
    </span>
  );
};

export default RiskBadge;