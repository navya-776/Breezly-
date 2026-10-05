import React from 'react';
import { getAqiMeta } from '../utils/formatters';

export default function TimelineOverviewStrip({
  forecastRecords = [],
  selectedHour = 0,
  onSelectHour
}) {
  if (!forecastRecords || forecastRecords.length === 0) return null;

  const keyCheckpoints = [
    { label: 'NOW', hour: 0 },
    { label: '+12H', hour: 12 },
    { label: '+24H (D1)', hour: 24 },
    { label: '+36H', hour: 36 },
    { label: '+48H (D2)', hour: 48 },
    { label: '+60H', hour: 60 },
    { label: '+72H (D3)', hour: 71 }
  ];

  return (
    <div className="breezly-card timeline-strip-card">
      <div className="card-top-bar" style={{ marginBottom: '0.25rem' }}>
        <div className="card-heading" style={{ fontSize: '0.75rem' }}>
          72-Hour Pollution Evolution Strip
        </div>
        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
          Click any interval to jump
        </span>
      </div>

      <div className="strip-points-row">
        {keyCheckpoints.map((pt) => {
          const record = forecastRecords[pt.hour] || forecastRecords[0];
          const aqi = record?.aqi ?? 200;
          const meta = getAqiMeta(aqi);
          const isActive = Math.abs(selectedHour - pt.hour) <= 3;

          return (
            <button
              key={pt.label}
              onClick={() => onSelectHour(pt.hour)}
              className={`strip-point-btn ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isActive ? '#818cf8' : '#94a3b8' }}>
                {pt.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.1rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: meta.color }}></span>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: meta.color }}>
                  {aqi}
                </span>
              </div>
              <span style={{ fontSize: '0.6rem', color: '#64748b' }}>
                {meta.category}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
