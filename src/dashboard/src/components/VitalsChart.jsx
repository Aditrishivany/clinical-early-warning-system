// File: src/dashboard/src/components/VitalsChart.jsx
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const VitalsChart = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div style={{
        padding: '40px', textAlign: 'center',
        color: '#9ca3af', backgroundColor: '#f9fafb',
        borderRadius: '8px',
      }}>
        <p style={{ fontSize: '24px', margin: 0 }}>📊</p>
        <p style={{ margin: '8px 0 0 0' }}>No history data yet</p>
      </div>
    );
  }

  // Format data for chart
  const chartData = history.map((v, i) => ({
    time:    `Reading ${history.length - i}`,
    hr:      v.heart_rate,
    sbp:     v.systolic_bp,
    spo2:    v.spo2,
    temp:    v.temperature,
    rr:      v.respiratory_rate,
    news2:   v.news2_score,
  })).reverse();

  const charts = [
    {
      title:  '❤️ Heart Rate & Blood Pressure',
      lines:  [
        { key: 'hr',  name: 'Heart Rate',  color: '#ef4444' },
        { key: 'sbp', name: 'Systolic BP', color: '#3b82f6' },
      ],
      domain: [40, 200],
    },
    {
      title:  '🫁 SpO2 & Respiratory Rate',
      lines:  [
        { key: 'spo2', name: 'SpO2 %',    color: '#06b6d4' },
        { key: 'rr',   name: 'Resp Rate', color: '#8b5cf6' },
      ],
      domain: [0, 100],
    },
    {
      title:  '🌡️ Temperature',
      lines:  [
        { key: 'temp', name: 'Temperature °C', color: '#f97316' },
      ],
      domain: [34, 42],
    },
    {
      title:  '📊 NEWS2 Score Trend',
      lines:  [
        { key: 'news2', name: 'NEWS2 Score', color: '#dc2626' },
      ],
      domain: [0, 20],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {charts.map((chart) => (
        <div key={chart.title} style={{
          backgroundColor: 'white',
          borderRadius:    '8px',
          padding:         '16px',
          border:          '1px solid #e5e7eb',
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '600' }}>
            {chart.title}
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                stroke="#9ca3af"
              />
              <YAxis
                domain={chart.domain}
                tick={{ fontSize: 10 }}
                stroke="#9ca3af"
              />
              <Tooltip
                contentStyle={{
                  fontSize:     '12px',
                  borderRadius: '8px',
                  border:       '1px solid #e5e7eb',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {chart.lines.map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
};

export default VitalsChart;