import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { Activity, RefreshCw, GitCommit, Sparkles, TrendingUp } from 'lucide-react';

export default function FeedbackDiagnostic({ forecastRecords = [], currentHour = 0 }) {
  if (!forecastRecords || forecastRecords.length === 0) return null;

  // Prepare chart data (sample every 2-3 hours for clean rendering)
  const chartData = forecastRecords.map((r, idx) => ({
    hour: `+${r.hour_offset}h`,
    hour_num: r.hour_offset,
    pm25_coupled: r.pm25,
    pm25_uncoupled: r.coupled_feedback?.pm25_uncoupled ?? r.pm25,
    pbl_nwp: r.meteorology?.pbl_height_nwp ?? 400,
    pbl_coupled: r.meteorology?.pbl_height_coupled ?? 300,
    pbl_drop_pct: r.coupled_feedback?.pbl_suppression_pct ?? 0,
    amplification: r.coupled_feedback?.feedback_amplification_ugm3 ?? 0,
    o3: r.o3
  }));

  const currentFeedback = forecastRecords[currentHour]?.coupled_feedback || {};

  return (
    <div className="glass-panel p-4 mt-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-100 font-display">
            Two-Way Aerosol-PBL-Radiation Feedback Diagnostic
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-provenance badge-prototype">
            Parameterized Surrogate Coupling
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Demonstrates the positive feedback loop: High aerosol loading (PM2.5) scatters solar radiation $\to$ reduces ground heating $\to$ suppresses PBL height $\to$ traps higher pollutant concentrations.
      </p>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase">PBL Suppression at +{currentHour}h</span>
          <div className="text-xl font-bold text-indigo-400 mt-0.5">
            -{currentFeedback.pbl_suppression_pct ?? 0}%
          </div>
          <span className="text-[10px] text-slate-400">Due to optical extinction & surface cooling</span>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase">Feedback PM2.5 Amplification</span>
          <div className="text-xl font-bold text-rose-400 mt-0.5">
            +{currentFeedback.feedback_amplification_ugm3 ?? 0} µg/m³
          </div>
          <span className="text-[10px] text-slate-400">Additional trapped mass vs uncoupled run</span>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase">Scientific Coupling Mechanism</span>
          <div className="text-xs font-semibold text-slate-200 mt-1">
            Iterative Surrogate Model
          </div>
          <span className="text-[10px] text-slate-400">Stepwise recurrence (t → t+1)</span>
        </div>
      </div>

      {/* Chart 1: PM2.5 Coupled vs Uncoupled Forecast */}
      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 mb-4">
        <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
          <span>72-Hour PM2.5 Trajectory: Coupled vs Uncoupled</span>
          <span className="text-[10px] text-slate-400 font-mono">Units: µg/m³</span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={10} interval={6} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Line 
                type="monotone" 
                dataKey="pm25_coupled" 
                name="Coupled PM2.5 (With Feedback)" 
                stroke="#f43f5e" 
                strokeWidth={2.5} 
                dot={false} 
              />
              <Line 
                type="monotone" 
                dataKey="pm25_uncoupled" 
                name="Uncoupled PM2.5 (No Feedback)" 
                stroke="#94a3b8" 
                strokeWidth={1.5} 
                strokeDasharray="4 4" 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Boundary Layer Height Suppression (NWP vs Coupled) */}
      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
          <span>72-Hour Boundary Layer (PBL) Height & Suppression</span>
          <span className="text-[10px] text-slate-400 font-mono">Units: Meters (m)</span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={10} interval={6} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Area 
                type="monotone" 
                dataKey="pbl_nwp" 
                name="Raw NWP PBL Height" 
                stroke="#6366f1" 
                fill="#6366f120" 
                strokeWidth={1.5} 
              />
              <Area 
                type="monotone" 
                dataKey="pbl_coupled" 
                name="Aerosol-Suppressed Coupled PBL Height" 
                stroke="#38bdf8" 
                fill="#38bdf840" 
                strokeWidth={2} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
