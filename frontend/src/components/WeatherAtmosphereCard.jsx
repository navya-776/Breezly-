import React from 'react';
import { Thermometer, Droplets, Wind, Layers, Sun, Activity, Compass } from 'lucide-react';
import { getWindCompassDirection } from '../utils/formatters';

export default function WeatherAtmosphereCard({ currentForecast }) {
  if (!currentForecast) return null;

  const met = currentForecast.meteorology || {};
  const vt = currentForecast.ventilation_trapping || {};

  const windDirName = getWindCompassDirection(met.wind_direction_10m);
  const vi = vt.ventilation_index ?? 0;
  const trappingScore = vt.trapping_score ?? 0;
  const trappingCategory = vt.trapping_category ?? 'Moderate';
  const trappingRisk = vt.trapping_risk_level ?? 'MODERATE';
  const isNocturnal = vt.is_nocturnal_stable;

  let trappingColor = '#facc15';
  let trappingBg = 'rgba(234, 179, 8, 0.15)';
  if (trappingRisk === 'CRITICAL') {
    trappingColor = '#ef4444';
    trappingBg = 'rgba(239, 68, 68, 0.15)';
  } else if (trappingRisk === 'HIGH') {
    trappingColor = '#f97316';
    trappingBg = 'rgba(249, 115, 22, 0.15)';
  } else if (trappingRisk === 'LOW') {
    trappingColor = '#10b981';
    trappingBg = 'rgba(16, 185, 129, 0.15)';
  }

  return (
    <div className="breezly-card weather-met-card">
      <div className="card-top-bar">
        <div className="card-heading">
          <Activity style={{ width: '0.9rem', height: '0.9rem', color: '#06b6d4' }} />
          Weather & Atmospheric Dispersion
        </div>
        <span className="badge-provenance badge-live">NWP Layer</span>
      </div>

      {/* Row 1: Weather 4-Grid */}
      <div className="weather-row-4">
        <div className="mini-weather-cell">
          <div className="mini-cell-label">
            <Thermometer style={{ width: '0.75rem', height: '0.75rem', color: '#f59e0b' }} />
            Temperature
          </div>
          <div className="mini-cell-value">{met.temperature_2m ?? '--'}°C</div>
        </div>

        <div className="mini-weather-cell">
          <div className="mini-cell-label">
            <Droplets style={{ width: '0.75rem', height: '0.75rem', color: '#38bdf8' }} />
            Humidity
          </div>
          <div className="mini-cell-value">{met.relative_humidity_2m ?? '--'}%</div>
        </div>

        <div className="mini-weather-cell">
          <div className="mini-cell-label">
            <Wind style={{ width: '0.75rem', height: '0.75rem', color: '#2dd4bf' }} />
            Wind Speed
          </div>
          <div className="mini-cell-value">{met.wind_speed_10m ?? '--'} m/s</div>
        </div>

        <div className="mini-weather-cell">
          <div className="mini-cell-label">
            <Compass style={{ width: '0.75rem', height: '0.75rem', color: '#a855f7' }} />
            Wind Direction
          </div>
          <div className="mini-cell-value" style={{ fontSize: '0.95rem' }}>
            {met.wind_direction_10m ?? 305}° ({windDirName})
          </div>
        </div>
      </div>

      {/* Row 2: Atmospheric Indices 3-Grid */}
      <div className="atm-indices-row">
        {/* Coupled PBL Height */}
        <div className="atm-index-box">
          <div style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Layers style={{ width: '0.75rem', height: '0.75rem', color: '#818cf8' }} />
            PBL Height
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-display)', margin: '0.2rem 0' }}>
            {met.pbl_height_coupled ?? '--'} <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>m</span>
          </div>
          <div style={{ fontSize: '0.625rem', color: '#64748b' }}>
            Mixing Depth
          </div>
        </div>

        {/* Ventilation Index */}
        <div className="atm-index-box">
          <div style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 600 }}>
            Ventilation Index
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-display)', margin: '0.2rem 0' }}>
            {vi} <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>m²/s</span>
          </div>
          <div style={{ fontSize: '0.625rem', color: '#64748b' }}>
            PBLH × Wind Speed
          </div>
        </div>

        {/* Effective Solar Radiation */}
        <div className="atm-index-box">
          <div style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Sun style={{ width: '0.75rem', height: '0.75rem', color: '#facc15' }} />
            Solar Radiation
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#facc15', fontFamily: 'var(--font-display)', margin: '0.2rem 0' }}>
            {met.solar_radiation_effective ?? 0} <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>W/m²</span>
          </div>
          <div style={{ fontSize: '0.625rem', color: isNocturnal ? '#f87171' : '#34d399' }}>
            {isNocturnal ? 'Nocturnal Inversion' : 'Convective Active'}
          </div>
        </div>
      </div>
    </div>
  );
}
