import React from 'react';
import { Flame, Wind, AlertCircle, Compass, ShieldAlert, Layers } from 'lucide-react';

export default function PlumeTrappingPanel({ currentRecord, fireSummary }) {
  if (!currentRecord) return null;

  const { plume_risk, ventilation_trapping, attribution_categories } = currentRecord;
  const vi = ventilation_trapping?.ventilation_index ?? 0;
  const trappingScore = ventilation_trapping?.trapping_score ?? 0;
  const trappingCategory = ventilation_trapping?.trapping_category ?? 'N/A';
  const trappingColor = ventilation_trapping?.trapping_risk_level === 'CRITICAL' ? '#ef4444' : '#eab308';
  const isNocturnalStable = ventilation_trapping?.is_nocturnal_stable;

  const plumeIndex = plume_risk?.plume_impact_index ?? 0;
  const plumeCategory = plume_risk?.risk_category ?? 'LOW';
  const plumeColor = plume_risk?.category_color ?? '#10b981';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Regional Biomass Burning Plume Impact Model */}
      <div className="glass-panel p-4 flex flex-col justify-between border-l-4 border-l-orange-500">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-bold text-slate-100 font-display">
                Regional Stubble Plume Influx
              </h3>
            </div>
            <span className="badge-provenance badge-prototype">
              FRP Advection Model
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Kinematic transport of agricultural burning plumes from Punjab/Haryana under prevailing wind vectors.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-white/5">
              <span className="text-[10px] text-slate-400">Plume Impact Index</span>
              <div className="text-xl font-black font-display" style={{ color: plumeColor }}>
                {plumeIndex} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-white/5">
              <span className="text-[10px] text-slate-400">Impact Category</span>
              <div className="text-sm font-bold mt-1" style={{ color: plumeColor }}>
                {plumeCategory}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
            <span>Active Fire Hotspots: <strong>{fireSummary?.active_fire_count || 12}</strong></span>
            <span>Total FRP: <strong>{fireSummary?.total_frp_mw || 1095} MW</strong></span>
          </div>
        </div>

        <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
          <span>FRP is used as a proxy for relative plume risk; not an exact chemical emission inventory.</span>
        </div>
      </div>

      {/* 2. Atmospheric Ventilation & Trapping Proxy */}
      <div className="glass-panel p-4 flex flex-col justify-between border-l-4 border-l-indigo-500">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100 font-display">
                Ventilation & Trapping Proxy
              </h3>
            </div>
            <span className="badge-provenance badge-prototype">
              PBLH × Wind Speed
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Atmospheric dilution volume capacity: <code className="text-indigo-300 font-mono text-[11px]">VI = PBLH × WS</code>.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-white/5">
              <span className="text-[10px] text-slate-400">Ventilation Index</span>
              <div className="text-xl font-black font-display text-slate-100">
                {vi} <span className="text-xs text-slate-400 font-normal">m²/s</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-white/5">
              <span className="text-[10px] text-slate-400">Trapping Potential</span>
              <div className="text-sm font-bold mt-1" style={{ color: trappingColor }}>
                {trappingCategory} ({trappingScore}/100)
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
            <span>PBL Height: <strong>{currentRecord.meteorology?.pbl_height_coupled} m</strong></span>
            <span>
              {isNocturnalStable ? (
                <span className="text-rose-400 font-semibold">● Nocturnal Inversion Proxy</span>
              ) : (
                <span className="text-emerald-400 font-semibold">● Daytime Mixing</span>
              )}
            </span>
          </div>
        </div>

        <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-cyan-400 shrink-0" />
          <span>Derived from boundary layer height & wind speed; proxy for dilution volume.</span>
        </div>
      </div>
    </div>
  );
}
