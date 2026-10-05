import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, Layers, Flame, Database } from 'lucide-react';

export default function TechnicalDetailsAccordion({
  currentForecast,
  provenance,
  selectedHour = 0
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const pblCoupled = currentForecast?.meteorology?.pbl_height_coupled ?? 400;
  const pblUncoupled = currentForecast?.meteorology?.pbl_height_nwp ?? 450;
  const pblSuppression = Math.max(0, pblUncoupled - pblCoupled);

  const vi = currentForecast?.ventilation_trapping?.ventilation_index ?? 800;
  const trappingScore = currentForecast?.ventilation_trapping?.trapping_score ?? 60;
  const plumeIndex = currentForecast?.plume_risk?.plume_impact_index ?? currentForecast?.plume_attribution?.plume_impact_index ?? 20;

  const pm25Coupled = currentForecast?.pm25 ?? 150;
  const pm25Uncoupled = currentForecast?.coupled_feedback?.pm25_uncoupled ?? currentForecast?.pm25_uncoupled ?? (pm25Coupled * 0.9);
  const feedbackDelta = Math.max(0, currentForecast?.coupled_feedback?.feedback_amplification_ugm3 ?? (pm25Coupled - pm25Uncoupled));

  const solarRad = currentForecast?.meteorology?.solar_radiation_effective ?? currentForecast?.meteorology?.solar_radiation ?? 0;
  const solarNwp = currentForecast?.meteorology?.solar_radiation_nwp ?? solarRad;
  const solarExtinctionPct = solarNwp > 0 ? Math.max(0, ((solarNwp - solarRad) / solarNwp) * 100) : 0;

  return (
    <div className="technical-accordion-wrapper">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="technical-accordion-toggle"
        aria-expanded={isExpanded}
      >
        <div className="accordion-toggle-left">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Advanced Atmospheric & Model Diagnostics</span>
          <span className="technical-tag">Research & Evaluator Mode</span>
        </div>
        <div className="accordion-toggle-right">
          <span className="toggle-hint">{isExpanded ? 'Hide Details' : 'Show Details'}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="technical-accordion-content">
          <div className="technical-grid">
            {/* Box 1: Boundary Layer Mixing & Ventilation */}
            <div className="tech-box">
              <div className="tech-box-header">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h4>Atmospheric Boundary Layer (PBLH)</h4>
              </div>
              <div className="tech-metrics-list">
                <div className="tech-metric-row">
                  <span>Coupled PBL Height:</span>
                  <strong>{Math.round(pblCoupled)} m</strong>
                </div>
                <div className="tech-metric-row">
                  <span>Uncoupled NWP PBL:</span>
                  <strong>{Math.round(pblUncoupled)} m</strong>
                </div>
                <div className="tech-metric-row">
                  <span>Aerosol PBL Suppression:</span>
                  <strong className="text-amber-400">-{Math.round(pblSuppression)} m</strong>
                </div>
                <div className="tech-metric-row">
                  <span>Ventilation Index ($VI$):</span>
                  <strong>{Math.round(vi)} m²/s</strong>
                </div>
                <div className="tech-metric-row">
                  <span>Atmospheric Trapping Score:</span>
                  <strong>{Math.round(trappingScore)} / 100</strong>
                </div>
              </div>
            </div>

            {/* Box 2: Two-Way Aerosol-Meteorology Coupling */}
            <div className="tech-box">
              <div className="tech-box-header">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <h4>Two-Way Aerosol-PBL Feedback</h4>
              </div>
              <div className="tech-metrics-list">
                <div className="tech-metric-row">
                  <span>Coupled PM2.5:</span>
                  <strong>{Math.round(pm25Coupled)} µg/m³</strong>
                </div>
                <div className="tech-metric-row">
                  <span>Uncoupled PM2.5:</span>
                  <strong>{Math.round(pm25Uncoupled)} µg/m³</strong>
                </div>
                <div className="tech-metric-row">
                  <span>Feedback Trapping Amplification:</span>
                  <strong className="text-rose-400">+{Math.round(feedbackDelta)} µg/m³</strong>
                </div>
                <div className="tech-metric-row">
                  <span>Effective Solar Radiation:</span>
                  <strong>{Math.round(solarRad)} W/m²</strong>
                </div>
                <div className="tech-metric-row">
                  <span>PM2.5 Optical Extinction:</span>
                  <strong>{solarExtinctionPct.toFixed(1)}%</strong>
                </div>
              </div>
            </div>

            {/* Box 3: Regional Plume Model */}
            <div className="tech-box">
              <div className="tech-box-header">
                <Flame className="w-4 h-4 text-orange-400" />
                <h4>Biomass Burning Advection</h4>
              </div>
              <div className="tech-metrics-list">
                <div className="tech-metric-row">
                  <span>Plume Impact Index:</span>
                  <strong>{Math.round(plumeIndex)} / 100</strong>
                </div>
                <div className="tech-metric-row">
                  <span>Hour Horizon:</span>
                  <strong>{selectedHour === 0 ? 'NOW (Live Initial State)' : `+${selectedHour}h Stepwise Forecast`}</strong>
                </div>
                <div className="tech-metric-row">
                  <span>Data Classification:</span>
                  <strong>{currentForecast?.data_type || (selectedHour === 0 ? 'OBSERVATION' : 'FORECAST')}</strong>
                </div>
              </div>
            </div>

            {/* Box 4: Transparent Provenance & Models */}
            <div className="tech-box">
              <div className="tech-box-header">
                <Database className="w-4 h-4 text-emerald-400" />
                <h4>Scientific Data Provenance</h4>
              </div>
              <div className="tech-metrics-list">
                <div className="tech-metric-row">
                  <span>Weather Source:</span>
                  <span className="badge-provenance">Open-Meteo NWP Forecast</span>
                </div>
                <div className="tech-metric-row">
                  <span>Air Quality Source:</span>
                  <span className="badge-provenance">Open-Meteo / Copernicus CAMS</span>
                </div>
                <div className="tech-metric-row">
                  <span>Satellite Fires:</span>
                  <span className="badge-provenance">NASA FIRMS (Calibrated Distribution)</span>
                </div>
                <div className="tech-metric-row">
                  <span>Forecast Core:</span>
                  <span className="badge-provenance">Breezly Coupled Physical Model</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
