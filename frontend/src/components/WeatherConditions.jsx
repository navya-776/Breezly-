import React from 'react';
import { Thermometer, Droplets, Wind, Compass, Sun, Moon } from 'lucide-react';
import { getWindCompassDirection } from '../utils/formatters';

export default function WeatherConditions({ currentForecast }) {
  const temp = currentForecast?.meteorology?.temperature_2m ?? currentForecast?.meteorology?.temperature_c ?? 22;
  const humidity = currentForecast?.meteorology?.relative_humidity_2m ?? currentForecast?.meteorology?.humidity_pct ?? 60;
  const windSpeed = currentForecast?.meteorology?.wind_speed_10m ?? currentForecast?.meteorology?.wind_speed_ms ?? 2.5;
  const windDirDeg = currentForecast?.meteorology?.wind_direction_10m ?? currentForecast?.meteorology?.wind_direction_deg ?? 315;
  const solarRad = currentForecast?.meteorology?.solar_radiation_effective ?? currentForecast?.meteorology?.solar_radiation_nwp ?? currentForecast?.meteorology?.solar_radiation ?? 0;
  const compassDir = getWindCompassDirection(windDirDeg);

  const isSunlit = solarRad > 10;

  return (
    <div className="weather-section-card">
      <div className="section-header-row">
        <h3 className="section-title">Weather Conditions</h3>
        <span className="section-subtitle">Local meteorology driving dispersion</span>
      </div>

      <div className="weather-metrics-row">
        {/* Temperature */}
        <div className="weather-metric-box">
          <div className="weather-box-header">
            <Thermometer className="w-4 h-4 text-amber-400" />
            <span className="weather-box-label">Temperature</span>
          </div>
          <div className="weather-box-value-row">
            <span className="weather-box-val">{Math.round(temp)}°C</span>
            <span className="weather-box-desc">{temp > 30 ? 'Warm' : temp < 18 ? 'Cool' : 'Mild'}</span>
          </div>
        </div>

        {/* Humidity */}
        <div className="weather-metric-box">
          <div className="weather-box-header">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="weather-box-label">Humidity</span>
          </div>
          <div className="weather-box-value-row">
            <span className="weather-box-val">{Math.round(humidity)}%</span>
            <span className="weather-box-desc">{humidity > 70 ? 'Moist / Foggy' : humidity < 40 ? 'Dry' : 'Moderate'}</span>
          </div>
        </div>

        {/* Wind Speed & Direction */}
        <div className="weather-metric-box">
          <div className="weather-box-header">
            <Wind className="w-4 h-4 text-cyan-400" />
            <span className="weather-box-label">Wind</span>
          </div>
          <div className="weather-box-value-row">
            <span className="weather-box-val">{windSpeed.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>m/s</span></span>
            <span className="weather-compass-badge">
              <Compass className="w-3 h-3" style={{ transform: `rotate(${windDirDeg}deg)` }} />
              {compassDir} ({Math.round(windDirDeg)}°)
            </span>
          </div>
        </div>

        {/* Sunlight / Day Phase */}
        <div className="weather-metric-box">
          <div className="weather-box-header">
            {isSunlit ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-300" />
            )}
            <span className="weather-box-label">Solar Heating</span>
          </div>
          <div className="weather-box-value-row">
            <span className="weather-box-val">{Math.round(solarRad)} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>W/m²</span></span>
            <span className="weather-box-desc">{isSunlit ? 'Active Heating' : 'Night Calm'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
