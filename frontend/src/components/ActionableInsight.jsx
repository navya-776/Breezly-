import React from 'react';
import { Sparkles, AlertCircle, CheckCircle, Flame } from 'lucide-react';
import { getAqiMeta } from '../utils/formatters';

export default function ActionableInsight({ currentForecast, selectedHour = 0 }) {
  const aqi = currentForecast?.aqi ?? 250;
  const pm25 = currentForecast?.pm25 ?? 150;
  const windSpeed = currentForecast?.meteorology?.wind_speed_ms ?? 2.5;
  const pblh = currentForecast?.meteorology?.pbl_height_coupled ?? 400;
  const trappingScore = currentForecast?.ventilation_trapping?.trapping_score ?? 60;
  const plumeIndex = currentForecast?.plume_attribution?.plume_impact_index ?? 20;
  const meta = getAqiMeta(aqi);

  // Dynamic Rule-Based Insight Generator
  let insightText = '';
  let icon = <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />;

  if (plumeIndex >= 25) {
    icon = <Flame className="w-5 h-5 text-orange-400 shrink-0" />;
    insightText = `Regional agricultural smoke plume is aligned with prevailing northwesterly winds, contributing significantly to elevated PM2.5 levels across Delhi NCR.`;
  } else if (trappingScore >= 70 || (pblh < 350 && windSpeed < 2.0)) {
    icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
    insightText = `Strong atmospheric trapping and calm ground winds (${windSpeed.toFixed(1)} m/s) are compressing emissions close to the surface, maintaining ${meta.category} air quality.`;
  } else if (pblh > 800 && windSpeed >= 3.0) {
    icon = <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
    insightText = `Active boundary-layer thermal mixing (reaching ${Math.round(pblh)} m) and moderate winds are promoting pollutant dilution.`;
  } else if (aqi > 300) {
    icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
    insightText = `Persistent low-ventilation conditions are causing local urban emissions and background haze to accumulate across the NCR basin.`;
  } else {
    icon = <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />;
    insightText = `Atmospheric dispersion conditions remain moderate with steady surface winds and seasonal boundary layer growth.`;
  }

  return (
    <div className="actionable-insight-card">
      <div className="insight-icon-container">
        {icon}
      </div>
      <div className="insight-content">
        <div className="insight-header">
          <span className="insight-tag">KEY ATMOSPHERIC TAKEAWAY</span>
          <span className="insight-hour">Forecast Hour +{selectedHour}</span>
        </div>
        <p className="insight-body">
          {insightText}
        </p>
      </div>
    </div>
  );
}
