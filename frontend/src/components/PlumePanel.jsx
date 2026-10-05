import React from 'react';
import { Flame, Wind, ArrowRight, ArrowDown, AlertCircle } from 'lucide-react';

export default function PlumePanel({ currentRecord, fireSummary }) {
  if (!currentRecord) return null;

  const plume = currentRecord.plume_risk || {};
  const plumeIndex = plume.plume_impact_index ?? 0;
  const plumeCategory = plume.risk_category ?? 'LOW';
  const categoryColor = plume.category_color ?? '#10b981';

  const met = currentRecord.meteorology || {};
  const windDir = met.wind_direction_10m ?? 305;
  const windSpeed = met.wind_speed_10m ?? 2.5;

  const activeFires = fireSummary?.active_fire_count || 12;
  const totalFrp = fireSummary?.total_frp_mw || 1094.7;

  return (
    <div className="card" style={{ borderLeft: `4px solid ${categoryColor}` }}>
      <div className="card-header">
        <div className="card-title">
          <Flame style={{ width: '1rem', height: '1rem', color: '#f97316' }} />
          Regional Biomass-Burning Plume Risk
        </div>
        <span className="badge-provenance badge-cached">
          CACHED / CALIBRATED FIRE DATA
        </span>
      </div>

      <div className="card-subtitle">
        Kinematic smoke plume advection model from Punjab/Haryana agricultural burning belt
      </div>

      {/* Main Metric Banner */}
      <div className="plume-hero-row">
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            Plume Impact Index
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: categoryColor }}>
              {plumeIndex}
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>/ 100</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{
            display: 'inline-block',
            padding: '0.25rem 0.625rem',
            borderRadius: '0.375rem',
            fontSize: '0.8125rem',
            fontWeight: 800,
            backgroundColor: `${categoryColor}22`,
            color: categoryColor,
            border: `1px solid ${categoryColor}55`
          }}>
            {plumeCategory} RISK
          </span>
          <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '0.25rem' }}>
            Airshed Inflow Potential
          </div>
        </div>
      </div>

      {/* Visual Advection Flow */}
      <div className="plume-flow">
        <div className="flow-step">
          <span style={{ color: '#f97316' }}>Punjab / Haryana</span>
          <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>({activeFires} Fires • {totalFrp} MW)</span>
        </div>
        <div className="flow-arrow">➔</div>
        <div className="flow-step">
          <Wind style={{ width: '0.85rem', height: '0.85rem', color: '#38bdf8' }} />
          <span>Wind Transport ({windSpeed} m/s @ {windDir}°)</span>
        </div>
        <div className="flow-arrow">➔</div>
        <div className="flow-step">
          <span style={{ color: '#818cf8' }}>Delhi NCR Airshed</span>
        </div>
      </div>

      {/* Explanatory Note */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.6875rem', color: '#64748b', marginTop: '0.25rem' }}>
        <AlertCircle style={{ width: '0.85rem', height: '0.85rem', color: '#f59e0b', shrink: 0, marginTop: '1px' }} />
        <span>
          Plume Impact Index is a model-derived risk indicator, not exact source-apportioned PM2.5.
        </span>
      </div>
    </div>
  );
}
