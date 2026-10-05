import React from 'react';
import { AlertTriangle, ShieldCheck, Zap, Info, Eye } from 'lucide-react';

export default function PollutantOverview({ currentRecord, stationName }) {
  if (!currentRecord) {
    return (
      <div className="glass-panel p-4 flex items-center justify-center h-48 text-slate-400">
        Loading pollutant metrics...
      </div>
    );
  }

  const { aqi, aqi_category, aqi_color, pm25, o3, dominant_pollutant } = currentRecord;

  return (
    <div className="glass-panel p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-slate-100 font-display">
            {stationName || 'Delhi NCR Station'} AQI Outlook
          </h2>
        </div>
        <span className="badge-provenance badge-forecast">
          STEPWISE COUPLED
        </span>
      </div>

      {/* Main AQI Gauge Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
        {/* Main Overall AQI */}
        <div 
          className="rounded-xl p-4 flex flex-col justify-between border shadow-lg relative overflow-hidden"
          style={{
            backgroundColor: `${aqi_color}18`,
            borderColor: `${aqi_color}55`
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Overall INAQI
            </span>
            <span 
              className="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white"
              style={{ backgroundColor: aqi_color }}
            >
              {aqi_category}
            </span>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-black font-display text-white tracking-tight">
              {aqi}
            </span>
            <span className="text-xs text-slate-300">
              Sub-Index
            </span>
          </div>

          <div className="text-[11px] text-slate-300 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            Dominant: <strong className="text-white">{dominant_pollutant}</strong>
          </div>
        </div>

        {/* PM2.5 Concentration Card */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              PM2.5 (Fine Aerosols)
            </span>
            <span className="badge-provenance badge-prototype">Aerosol Dynamics</span>
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-display text-rose-400">
              {pm25}
            </span>
            <span className="text-xs text-slate-400 font-mono">µg/m³</span>
          </div>
          <div className="text-[11px] text-slate-400">
            CPCB 24h Safe Std: <span className="text-slate-300 font-medium">60 µg/m³</span>
          </div>
        </div>

        {/* Ground-Level Ozone (O3) Card */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              O3 (Ground-Level)
            </span>
            <span className="badge-provenance badge-prototype">Photochemical</span>
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-display text-yellow-400">
              {o3}
            </span>
            <span className="text-xs text-slate-400 font-mono">µg/m³</span>
          </div>
          <div className="text-[11px] text-slate-400">
            CPCB 8h Safe Std: <span className="text-slate-300 font-medium">100 µg/m³</span>
          </div>
        </div>
      </div>

      {/* Advisory Bar */}
      <div className="bg-slate-950/70 rounded-lg p-2.5 border border-white/5 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          {aqi > 300 ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>
            {aqi > 400
              ? 'Emergency Alert: Severe smog accumulation. Vulnerable groups avoid all outdoor exertion.'
              : aqi > 300
              ? 'Health Advisory: Very Poor air quality. Respiratory discomfort on prolonged exposure.'
              : aqi > 200
              ? 'Poor air quality: Breathing discomfort to people with lung disease.'
              : 'Moderate air quality: Acceptable for most, mild irritation for sensitive individuals.'}
          </span>
        </div>
      </div>
    </div>
  );
}
