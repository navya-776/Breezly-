import React from 'react';
import { CloudFog, Flame, SunMedium } from 'lucide-react';

export default function WhyIsAirLikeThis({
  currentForecast,
  plumeRiskData
}) {
  const windSpeed = currentForecast?.meteorology?.wind_speed_ms ?? 2.5;
  const windDirDeg = currentForecast?.meteorology?.wind_direction_deg ?? 315;
  const solarRad = currentForecast?.meteorology?.solar_radiation ?? 0;
  const pblh = currentForecast?.meteorology?.pbl_height_coupled ?? 400;
  const trappingScore = currentForecast?.ventilation_trapping?.trapping_score ?? 60;
  const plumeIndex = currentForecast?.plume_attribution?.plume_impact_index ?? 20;
  const pm25 = currentForecast?.pm25 ?? 150;
  const fireCount = plumeRiskData?.active_fire_count ?? plumeRiskData?.hotspots?.length ?? 120;

  // 1. Dynamic Explanation: Pollution Trapped
  let trappingTitle = 'Atmospheric Trapping';
  let trappingMsg = '';
  let trappingBadge = 'Moderate Trapping';
  let trappingBadgeColor = '#eab308';

  if (trappingScore >= 70 || pblh < 350 || windSpeed < 2.0) {
    trappingTitle = 'High Trapping In Effect';
    trappingBadge = 'Strong Inversion';
    trappingBadgeColor = '#ef4444';
    trappingMsg = `Calm surface winds (${windSpeed.toFixed(1)} m/s) and a shallow air layer (${Math.round(pblh)} m) are compressing pollution tightly near ground level.`;
  } else if (trappingScore <= 35 || pblh > 900) {
    trappingTitle = 'Active Dilution & Mixing';
    trappingBadge = 'Good Dispersion';
    trappingBadgeColor = '#10b981';
    trappingMsg = `Stronger vertical air mixing (reaching ${Math.round(pblh)} m) and favorable wind flow (${windSpeed.toFixed(1)} m/s) are actively dispersing contaminants.`;
  } else {
    trappingTitle = 'Moderate Trapping';
    trappingBadge = 'Moderate';
    trappingBadgeColor = '#eab308';
    trappingMsg = `Moderate mixing layer (${Math.round(pblh)} m) is allowing gradual dispersion, though local emissions continue to accumulate.`;
  }

  // 2. Dynamic Explanation: Stubble Burning
  let plumeTitle = 'Regional Crop Smoke';
  let plumeMsg = '';
  let plumeBadge = 'Low Inflow';
  let plumeBadgeColor = '#10b981';

  // Check if wind is from NW direction (270 to 360 or 0 to 20)
  const isNWWind = (windDirDeg >= 270 && windDirDeg <= 360) || (windDirDeg >= 0 && windDirDeg <= 25);

  if (plumeIndex >= 25) {
    plumeTitle = 'Significant Smoke Transport';
    plumeBadge = 'High Plume Influx';
    plumeBadgeColor = '#ef4444';
    plumeMsg = `Northwesterly winds are steering dense smoke from ${fireCount} active agricultural fires in Punjab & Haryana directly into Delhi NCR.`;
  } else if (plumeIndex >= 10 || (isNWWind && fireCount > 0)) {
    plumeTitle = 'Moderate Smoke Inflow';
    plumeBadge = 'Moderate Smoke';
    plumeBadgeColor = '#f97316';
    plumeMsg = `Prevailing winds are carrying a moderate stream of biomass burning smoke from upwind farm fires into the capital region.`;
  } else {
    plumeTitle = 'Minimal Fire Inflow';
    plumeBadge = 'Favorable Winds';
    plumeBadgeColor = '#10b981';
    plumeMsg = `Wind direction is currently deflecting regional crop fire plumes away from the central Delhi NCR breathing zone.`;
  }

  // 3. Dynamic Explanation: Weather & Sunlight Effect
  let weatherTitle = 'Sunlight & Weather Effect';
  let weatherMsg = '';
  let weatherBadge = 'Night Cooling';
  let weatherBadgeColor = '#818cf8';

  if (solarRad > 150) {
    if (pm25 > 200) {
      weatherTitle = 'Smog Dimming Sunlight';
      weatherBadge = 'Smog Feedback';
      weatherBadgeColor = '#f97316';
      weatherMsg = `Dense particulate haze is blocking solar radiation, cooling the ground and slowing the natural midday air cleanup.`;
    } else {
      weatherTitle = 'Solar Air Warming';
      weatherBadge = 'Solar Heating';
      weatherBadgeColor = '#10b981';
      weatherMsg = `Direct solar heating is warming the ground, causing air to rise and creating natural upward ventilation.`;
    }
  } else {
    weatherTitle = 'Nighttime Stable Air';
    weatherBadge = 'Nocturnal Cooling';
    weatherBadgeColor = '#6366f1';
    weatherMsg = `Absence of sunlight and surface radiative cooling have formed a cool, stable ground layer that prevents vertical air circulation.`;
  }

  return (
    <div className="why-air-section">
      <div className="section-header-row">
        <h3 className="section-title">Why is the Air Like This?</h3>
        <span className="section-subtitle">Real-time breakdown of current air conditions</span>
      </div>

      <div className="why-air-grid">
        {/* Card 1: Trapping */}
        <div className="why-card">
          <div className="why-card-top">
            <div className="why-icon-box" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <CloudFog className="w-5 h-5" />
            </div>
            <span
              className="why-badge"
              style={{ backgroundColor: `${trappingBadgeColor}20`, color: trappingBadgeColor, borderColor: `${trappingBadgeColor}60` }}
            >
              {trappingBadge}
            </span>
          </div>
          <h4 className="why-card-title">{trappingTitle}</h4>
          <p className="why-card-text">{trappingMsg}</p>
        </div>

        {/* Card 2: Stubble Burning */}
        <div className="why-card">
          <div className="why-card-top">
            <div className="why-icon-box" style={{ backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
              <Flame className="w-5 h-5" />
            </div>
            <span
              className="why-badge"
              style={{ backgroundColor: `${plumeBadgeColor}20`, color: plumeBadgeColor, borderColor: `${plumeBadgeColor}60` }}
            >
              {plumeBadge}
            </span>
          </div>
          <h4 className="why-card-title">{plumeTitle}</h4>
          <p className="why-card-text">{plumeMsg}</p>
        </div>

        {/* Card 3: Weather Effect */}
        <div className="why-card">
          <div className="why-card-top">
            <div className="why-icon-box" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <SunMedium className="w-5 h-5" />
            </div>
            <span
              className="why-badge"
              style={{ backgroundColor: `${weatherBadgeColor}20`, color: weatherBadgeColor, borderColor: `${weatherBadgeColor}60` }}
            >
              {weatherBadge}
            </span>
          </div>
          <h4 className="why-card-title">{weatherTitle}</h4>
          <p className="why-card-text">{weatherMsg}</p>
        </div>
      </div>
    </div>
  );
}
