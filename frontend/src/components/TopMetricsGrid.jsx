import React from 'react';
import { Zap, Layers, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { getAqiMeta, calculateTrend } from '../utils/formatters';

export default function TopMetricsGrid({ currentForecast, prevForecast }) {
  if (!currentForecast) {
    return <div className="breezly-card">Loading synchronized metrics...</div>;
  }

  const { aqi, pm25, o3, dominant_pollutant, ventilation_trapping } = currentForecast;
  const aqiMeta = getAqiMeta(aqi);

  // Calculate PM2.5 trend vs previous forecast hour
  const pmTrend = prevForecast ? calculateTrend(pm25, prevForecast.pm25) : null;
  const o3Trend = prevForecast ? calculateTrend(o3, prevForecast.o3) : null;

  const trappingScore = ventilation_trapping?.trapping_score ?? 0;
  const trappingCategory = ventilation_trapping?.trapping_category ?? 'Moderate';
  const trappingRisk = ventilation_trapping?.trapping_risk_level ?? 'MODERATE';
  const vi = ventilation_trapping?.ventilation_index ?? 0;

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
    <div className="top-metrics-grid">
      {/* 1. AQI Card */}
      <div
        className="metric-card-dense"
        style={{
          borderLeft: `4px solid ${aqiMeta.color}`,
          background: `linear-gradient(180deg, ${aqiMeta.bg}, var(--bg-card))`
        }}
      >
        <div className="metric-label-row">
          <span>Air Quality Index</span>
          <Zap style={{ width: '0.85rem', height: '0.85rem', color: aqiMeta.color }} />
        </div>
        <div className="metric-big-val-row">
          <span className="metric-big-val" style={{ color: aqiMeta.color }}>
            {aqi}
          </span>
          <span className="metric-unit-text">INAQI</span>
        </div>
        <div className="metric-status-row">
          <span
            className="metric-badge-tag"
            style={{ backgroundColor: `${aqiMeta.color}22`, color: aqiMeta.color, border: `1px solid ${aqiMeta.color}55` }}
          >
            {aqiMeta.category}
          </span>
          <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
            Dominant: <strong style={{ color: '#f8fafc' }}>{dominant_pollutant || 'PM2.5'}</strong>
          </span>
        </div>
      </div>

      {/* 2. PM2.5 Card */}
      <div className="metric-card-dense" style={{ borderLeft: '4px solid #f43f5e' }}>
        <div className="metric-label-row">
          <span>PM2.5 (Fine Aerosols)</span>
          <span className="badge-provenance badge-prototype">Eulerian Model</span>
        </div>
        <div className="metric-big-val-row">
          <span className="metric-big-val" style={{ color: '#fb7185' }}>
            {pm25}
          </span>
          <span className="metric-unit-text">µg/m³</span>
        </div>
        <div className="metric-status-row">
          <span
            className="metric-badge-tag"
            style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.3)' }}
          >
            {pm25 > 250 ? 'Severe' : pm25 > 120 ? 'Very Poor' : pm25 > 60 ? 'Moderate' : 'Good'}
          </span>
          {pmTrend && (
            <span className="metric-trend-tag" style={{ color: pmTrend.color }}>
              {pmTrend.text} <span style={{ fontSize: '0.625rem', color: '#64748b' }}>vs prev hr</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. Ground-Level O3 Card */}
      <div className="metric-card-dense" style={{ borderLeft: '4px solid #eab308' }}>
        <div className="metric-label-row">
          <span>Ground-Level Ozone (O₃)</span>
          <span className="badge-provenance badge-prototype">Photochemical</span>
        </div>
        <div className="metric-big-val-row">
          <span className="metric-big-val" style={{ color: '#facc15' }}>
            {o3}
          </span>
          <span className="metric-unit-text">µg/m³</span>
        </div>
        <div className="metric-status-row">
          <span
            className="metric-badge-tag"
            style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)' }}
          >
            {o3 > 100 ? 'Elevated' : 'Normal Range'}
          </span>
          {o3Trend && (
            <span className="metric-trend-tag" style={{ color: o3Trend.color }}>
              {o3Trend.text} <span style={{ fontSize: '0.625rem', color: '#64748b' }}>vs prev hr</span>
            </span>
          )}
        </div>
      </div>

      {/* 4. Atmospheric Trapping Proxy Card */}
      <div className="metric-card-dense" style={{ borderLeft: `4px solid ${trappingColor}` }}>
        <div className="metric-label-row">
          <span>Atmospheric Trapping Proxy</span>
          <Layers style={{ width: '0.85rem', height: '0.85rem', color: trappingColor }} />
        </div>
        <div className="metric-big-val-row">
          <span className="metric-big-val" style={{ color: trappingColor }}>
            {trappingScore}
          </span>
          <span className="metric-unit-text">/ 100</span>
        </div>
        <div className="metric-status-row">
          <span
            className="metric-badge-tag"
            style={{ background: trappingBg, color: trappingColor, border: `1px solid ${trappingColor}55` }}
          >
            {trappingCategory}
          </span>
          <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
            VI: {vi} m²/s
          </span>
        </div>
      </div>
    </div>
  );
}
