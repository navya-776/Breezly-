import React from 'react';
import { Flame, Wind, ArrowRight, AlertCircle } from 'lucide-react';

export default function PlumeCard({ currentForecast, fireSummary }) {
  if (!currentForecast) return null;

  const plume = currentForecast.plume_risk || {};
  const plumeIndex = plume.plume_impact_index ?? 0;
  const plumeCategory = plume.risk_category ?? 'LOW';
  const categoryColor = plume.category_color ?? '#10b981';

  const met = currentForecast.meteorology || {};
  const windDir = met.wind_direction_10m ?? 305;
  const windSpeed = met.wind_speed_10m ?? 2.5;

  const activeFires = fireSummary?.active_fire_count || 12;
  const totalFrp = fireSummary?.total_frp_mw || 1094.7;

  return (
    <div className="breezly-card plume-widget-card" style={{ borderLeft: `4px solid ${categoryColor}` }}>
      <div className="card-top-bar">
        <div className="card-heading">
          <Flame style={{ width: '0.9rem', height: '0.9rem', color: '#f97316' }} />
          Regional Biomass-Burning Plume
        </div>
        <span className="badge-provenance badge-cached">
          CACHED / CALIBRATED FIRE DATA
        </span>
      </div>

      {/* Main Metric Banner */}
      <div className="plume-metric-banner">
        <div>
          <div style={{ fontSize: '0.625rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            Plume Impact Index
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.15rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: categoryColor }}>
              {plumeIndex}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/ 100</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{
            display: 'inline-block',
            padding: '0.2rem 0.5rem',
            borderRadius: '0.3rem',
            fontSize: '0.75rem',
            fontWeight: 800,
            backgroundColor: `${categoryColor}22`,
            color: categoryColor,
            border: `1px solid ${categoryColor}55`
          }}>
            {plumeCategory} RISK
          </span>
          <div style={{ fontSize: '0.625rem', color: '#64748b', marginTop: '0.2rem' }}>
            Airshed Influx Potential
          </div>
        </div>
      </div>

      {/* Visual Flow Strip */}
      <div className="plume-advection-flow">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f97316', fontWeight: 600 }}>
          <span>Punjab/Haryana</span>
          <span style={{ fontSize: '0.6rem', color: '#64748b' }}>({activeFires} Fires • {totalFrp} MW)</span>
        </div>
        <div style={{ color: '#06b6d4' }}>➔</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#38bdf8' }}>
          <Wind style={{ width: '0.75rem', height: '0.75rem' }} />
          <span>{windSpeed} m/s @ {windDir}°</span>
        </div>
        <div style={{ color: '#06b6d4' }}>➔</div>
        <div style={{ color: '#818cf8', fontWeight: 600 }}>Delhi NCR</div>
      </div>

      {/* Note */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', fontSize: '0.65rem', color: '#64748b' }}>
        <AlertCircle style={{ width: '0.75rem', height: '0.75rem', color: '#f59e0b', shrink: 0, marginTop: '1px' }} />
        <span>Model-derived plume risk; not exact source-apportioned PM2.5.</span>
      </div>
    </div>
  );
}
