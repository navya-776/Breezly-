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
import { Sparkles, ArrowRight, Layers, Sun, Zap } from 'lucide-react';

export default function FeedbackSection({ forecastRecords = [], currentHour = 0 }) {
  if (!forecastRecords || forecastRecords.length === 0) return null;

  const chartData = forecastRecords.map((r) => ({
    hour: `+${r.hour_offset}h`,
    hour_num: r.hour_offset,
    pm25_coupled: r.pm25,
    pm25_uncoupled: r.coupled_feedback?.pm25_uncoupled ?? r.pm25,
    pbl_nwp: r.meteorology?.pbl_height_nwp ?? 300,
    pbl_coupled: r.meteorology?.pbl_height_coupled ?? 250,
    pbl_suppression: r.coupled_feedback?.pbl_suppression_pct ?? 0,
    pm_amp: r.coupled_feedback?.feedback_amplification_ugm3 ?? 0
  }));

  const currentFeedback = forecastRecords[currentHour]?.coupled_feedback || {};

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <Sparkles style={{ width: '1rem', height: '1rem', color: '#818cf8' }} />
          Two-Way Aerosol–Meteorology Feedback
        </div>
        <span className="badge-provenance badge-prototype">
          Coupled Surrogate Engine
        </span>
      </div>

      <div className="card-subtitle">
        Physical mechanism where high aerosol optical loading modifies boundary layer development and amplifies surface trapping
      </div>

      {/* Visual Mechanism Flow */}
      <div className="feedback-flow">
        <div className="feedback-node" style={{ borderColor: '#f43f5e55' }}>
          <span style={{ color: '#fb7185' }}>PM2.5 ↑</span>
          <span style={{ fontSize: '0.625rem', color: '#94a3b8' }}>Aerosol Load</span>
        </div>
        <div className="feedback-arrow">➔</div>
        <div className="feedback-node" style={{ borderColor: '#eab30855' }}>
          <span style={{ color: '#facc15' }}>Solar Radiation ↓</span>
          <span style={{ fontSize: '0.625rem', color: '#94a3b8' }}>Optical Extinction</span>
        </div>
        <div className="feedback-arrow">➔</div>
        <div className="feedback-node" style={{ borderColor: '#f9731655' }}>
          <span style={{ color: '#fb923c' }}>Surface Heating ↓</span>
          <span style={{ fontSize: '0.625rem', color: '#94a3b8' }}>Thermal Insolation</span>
        </div>
        <div className="feedback-arrow">➔</div>
        <div className="feedback-node" style={{ borderColor: '#818cf855' }}>
          <span style={{ color: '#818cf8' }}>PBL Height ↓</span>
          <span style={{ fontSize: '0.625rem', color: '#94a3b8' }}>Suppressed Mixing</span>
        </div>
        <div className="feedback-arrow">➔</div>
        <div className="feedback-node" style={{ borderColor: '#06b6d455' }}>
          <span style={{ color: '#38bdf8' }}>Ventilation ↓</span>
          <span style={{ fontSize: '0.625rem', color: '#94a3b8' }}>Lower Volume</span>
        </div>
        <div className="feedback-arrow">➔</div>
        <div className="feedback-node" style={{ borderColor: '#dc262655' }}>
          <span style={{ color: '#ef4444' }}>Pollutant Trapping ↑</span>
          <span style={{ fontSize: '0.625rem', color: '#94a3b8' }}>Smog Trap</span>
        </div>
      </div>

      {/* Delta Metrics Row */}
      <div className="feedback-metrics-row">
        <div style={{ background: 'var(--bg-card-subtle)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            PBL Suppression at +{currentHour}h
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-display)', margin: '0.2rem 0' }}>
            -{currentFeedback.pbl_suppression_pct ?? 0}%
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            Boundary layer mixing height contraction
          </div>
        </div>

        <div style={{ background: 'var(--bg-card-subtle)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            Feedback PM2.5 Amplification
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fb7185', fontFamily: 'var(--font-display)', margin: '0.2rem 0' }}>
            +{currentFeedback.feedback_amplification_ugm3 ?? 0} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>µg/m³</span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            Additional trapped mass vs uncoupled model
          </div>
        </div>

        <div style={{ background: 'var(--bg-card-subtle)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            Coupling Mode
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-display)', margin: '0.35rem 0' }}>
            COUPLED vs UNCOUPLED
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            Stepwise recurrence across 72 hours
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div style={{ height: '240px', width: '100%', marginTop: '0.5rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="hour" stroke="#64748b" fontSize={10} interval={5} />
            <YAxis stroke="#64748b" fontSize={10} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0d1526',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '11px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
            <Line
              type="monotone"
              dataKey="pm25_coupled"
              name="Coupled PM2.5 (with Feedback)"
              stroke="#f43f5e"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="pm25_uncoupled"
              name="Uncoupled PM2.5 (no Feedback)"
              stroke="#64748b"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
