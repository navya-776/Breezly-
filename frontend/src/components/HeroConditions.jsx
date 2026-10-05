import React from 'react';
import { getAqiMeta, calculateTrend, getWindCompassDirection } from '../utils/formatters';
import { Thermometer, Wind, Droplets, Activity } from 'lucide-react';

export default function HeroConditions({
  currentForecast,
  prevForecast,
  stationName = 'Delhi NCR'
}) {
  const aqi = currentForecast?.aqi ?? 250;
  const pm25 = currentForecast?.pm25 ?? 120;
  const prevPm25 = prevForecast?.pm25 ?? null;
  const temp = currentForecast?.meteorology?.temperature_2m ?? currentForecast?.meteorology?.temperature_c ?? 22;
  const humidity = currentForecast?.meteorology?.relative_humidity_2m ?? currentForecast?.meteorology?.humidity_pct ?? 60;
  const windSpeed = currentForecast?.meteorology?.wind_speed_10m ?? currentForecast?.meteorology?.wind_speed_ms ?? 2.5;
  const windDirDeg = currentForecast?.meteorology?.wind_direction_10m ?? currentForecast?.meteorology?.wind_direction_deg ?? 315;
  const windDir = getWindCompassDirection(windDirDeg);

  const aqiMeta = getAqiMeta(aqi);
  const pm25Trend = calculateTrend(pm25, prevPm25);

  // Simple, health advisory in plain language
  const getHealthAdvisory = (aqiVal) => {
    if (aqiVal <= 50) return 'Air quality is Good. Great time for outdoor activities.';
    if (aqiVal <= 100) return 'Air quality is Satisfactory. Minor breathing discomfort for unusually sensitive people.';
    if (aqiVal <= 200) return 'Air quality is Moderate. People with respiratory conditions should limit prolonged outdoor exertion.';
    if (aqiVal <= 300) return 'Air quality is Poor. Breathing discomfort likely for most people on prolonged exposure.';
    if (aqiVal <= 400) return 'Air quality is Very Poor. Significant respiratory illness risk on prolonged exposure. Avoid strenuous outdoor activities.';
    return 'Air quality is Severe. Severe respiratory impact. Stay indoors and use air purification if possible.';
  };

  const aqiPercentage = Math.min(100, Math.max(0, (aqi / 500) * 100));

  return (
    <div
      className="hero-aqi-card"
      style={{
        '--hero-accent': aqiMeta.color,
        '--hero-bg-glow': aqiMeta.bg
      }}
    >
      <div className="hero-top-row">
        <div>
          <span className="hero-region-label">MONITORING LOCATION</span>
          <h2 className="hero-station-title">{stationName}</h2>
        </div>
        <div
          className="hero-category-pill"
          style={{
            backgroundColor: aqiMeta.bg,
            color: aqiMeta.color,
            borderColor: aqiMeta.color
          }}
        >
          <span className="hero-status-dot" style={{ backgroundColor: aqiMeta.color }} />
          {aqiMeta.category}
        </div>
      </div>

      <div className="hero-main-content">
        {/* Main AQI Number Display */}
        <div className="hero-aqi-display">
          <div className="hero-aqi-number" style={{ color: aqiMeta.color }}>
            {aqi}
          </div>
          <div className="hero-aqi-label">
            <span>AQI</span>
            <span className="hero-aqi-scale">/ 500</span>
          </div>
        </div>

        {/* AQI Progress Meter Bar */}
        <div className="hero-meter-wrapper">
          <div className="hero-meter-track">
            <div
              className="hero-meter-fill"
              style={{
                width: `${aqiPercentage}%`,
                backgroundColor: aqiMeta.color,
                boxShadow: `0 0 12px ${aqiMeta.color}`
              }}
            />
          </div>
          <div className="hero-meter-labels">
            <span>Good (0)</span>
            <span>Moderate (100-200)</span>
            <span>Very Poor (300-400)</span>
            <span>Severe (500)</span>
          </div>
        </div>

        {/* 4 Essential Sub-Metrics */}
        <div className="hero-submetrics-grid">
          {/* PM2.5 */}
          <div className="hero-submetric-item">
            <div className="submetric-header">
              <Activity className="w-4 h-4 text-rose-400" />
              <span className="submetric-title">PM2.5</span>
            </div>
            <div className="submetric-val-group">
              <span className="submetric-val">{pm25}</span>
              <span className="submetric-unit">µg/m³</span>
              {pm25Trend && (
                <span className="submetric-trend" style={{ color: pm25Trend.color }}>
                  {pm25Trend.text}
                </span>
              )}
            </div>
          </div>

          {/* Temperature */}
          <div className="hero-submetric-item">
            <div className="submetric-header">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <span className="submetric-title">Temperature</span>
            </div>
            <div className="submetric-val-group">
              <span className="submetric-val">{temp}°C</span>
            </div>
          </div>

          {/* Wind */}
          <div className="hero-submetric-item">
            <div className="submetric-header">
              <Wind className="w-4 h-4 text-cyan-400" />
              <span className="submetric-title">Wind</span>
            </div>
            <div className="submetric-val-group">
              <span className="submetric-val">{windSpeed} <span className="submetric-unit">m/s</span></span>
              <span className="submetric-direction-badge">{windDir}</span>
            </div>
          </div>

          {/* Humidity */}
          <div className="hero-submetric-item">
            <div className="submetric-header">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span className="submetric-title">Humidity</span>
            </div>
            <div className="submetric-val-group">
              <span className="submetric-val">{humidity}%</span>
            </div>
          </div>
        </div>

        {/* Health Advisory */}
        <div className="hero-advisory-bar">
          <span className="hero-advisory-icon">💡</span>
          <span className="hero-advisory-text">{getHealthAdvisory(aqi)}</span>
        </div>
      </div>
    </div>
  );
}
