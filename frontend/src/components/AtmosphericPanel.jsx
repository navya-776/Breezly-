import React from 'react';
import { Thermometer, Droplets, Wind, Layers, Sun, Activity, Compass } from 'lucide-react';

export default function AtmosphericPanel({ currentRecord }) {
  if (!currentRecord) return null;

  const met = currentRecord.meteorology || {};
  const vt = currentRecord.ventilation_trapping || {};

  const vi = vt.ventilation_index ?? 0;
  const trappingScore = vt.trapping_score ?? 0;
  const trappingCategory = vt.trapping_category ?? 'Moderate';
  const trappingRisk = vt.trapping_risk_level ?? 'MODERATE';
  const isNocturnalStable = vt.is_nocturnal_stable;

  return (
    <div className="card" style={{ height: '100%', justifyContent: 'space-between' }}>
      <div>
        <div className="card-header">
          <div className="card-title">
            <Activity style={{ width: '1rem', height: '1rem', color: '#06b6d4' }} />
            Atmospheric Conditions & Ventilation
          </div>
          <span className="badge-provenance badge-live">NWP Layer</span>
        </div>
        <div className="card-subtitle">
          Boundary layer mixing volume and meteorological dispersion parameters
        </div>

        {/* 2x2 Grid of Met Metrics */}
        <div className="met-grid-4">
          <div className="met-subcard">
            <div className="met-label">
              <Thermometer style={{ width: '0.8rem', height: '0.8rem', color: '#f59e0b' }} />
              2m Temperature
            </div>
            <div className="met-val">{met.temperature_2m ?? '--'} °C</div>
          </div>

          <div className="met-subcard">
            <div className="met-label">
              <Droplets style={{ width: '0.8rem', height: '0.8rem', color: '#38bdf8' }} />
              Relative Humidity
            </div>
            <div className="met-val">{met.relative_humidity_2m ?? '--'} %</div>
          </div>

          <div className="met-subcard">
            <div className="met-label">
              <Wind style={{ width: '0.8rem', height: '0.8rem', color: '#2dd4bf' }} />
              10m Wind Speed
            </div>
            <div className="met-val">{met.wind_speed_10m ?? '--'} m/s</div>
          </div>

          <div className="met-subcard">
            <div className="met-label">
              <Layers style={{ width: '0.8rem', height: '0.8rem', color: '#818cf8' }} />
              Coupled PBL Height
            </div>
            <div className="met-val" style={{ color: '#818cf8' }}>
              {met.pbl_height_coupled ?? '--'} m
            </div>
          </div>
        </div>

        {/* Key Derived Atmospheric Indices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          {/* Ventilation Index */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: 'var(--bg-card-subtle)', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 600 }}>Ventilation Index (VI)</div>
              <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>PBLH × Wind Speed</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
                {vi} <span style={{ fontSize: '0.6875rem', fontWeight: 400, color: '#94a3b8' }}>m²/s</span>
              </div>
            </div>
          </div>

          {/* Trapping Score & Stability Proxy */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: 'var(--bg-card-subtle)', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 600 }}>Trapping Score (Proxy)</div>
              <div style={{ fontSize: '0.6875rem', color: isNocturnalStable ? '#f87171' : '#34d399' }}>
                {isNocturnalStable ? '● Nocturnal Stability Proxy' : '● Daytime Convective Mixing'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                display: 'inline-block',
                padding: '0.2rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: trappingRisk === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                color: trappingRisk === 'CRITICAL' ? '#ef4444' : '#facc15'
              }}>
                {trappingCategory} ({trappingScore}/100)
              </span>
            </div>
          </div>

          {/* Effective Solar Radiation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: 'var(--bg-card-subtle)', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sun style={{ width: '0.85rem', height: '0.85rem', color: '#facc15' }} />
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>Effective Solar Radiation</span>
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
              {met.solar_radiation_effective ?? 0} <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>W/m²</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '0.5rem', fontSize: '0.6875rem', color: '#64748b' }}>
        Ventilation Index quantifies atmospheric dilution volume capacity.
      </div>
    </div>
  );
}
