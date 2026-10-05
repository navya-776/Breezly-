import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function FeedbackCard({ currentForecast, selectedHour = 0 }) {
  if (!currentForecast) return null;

  const fb = currentForecast.coupled_feedback || {};
  const met = currentForecast.meteorology || {};

  const pblSuppression = fb.pbl_suppression_pct ?? 0;
  const pmAmplification = fb.feedback_amplification_ugm3 ?? 0;

  return (
    <div className="breezly-card feedback-widget-card">
      <div className="card-top-bar">
        <div className="card-heading">
          <Sparkles style={{ width: '0.9rem', height: '0.9rem', color: '#818cf8' }} />
          Aerosol–Meteorology Feedback
        </div>
        <span className="badge-provenance badge-prototype">
          Coupled Surrogate
        </span>
      </div>

      {/* Visual Mechanism Flow Strip */}
      <div className="feedback-flow-strip">
        <div className="feedback-flow-pill" style={{ color: '#fb7185' }}>PM2.5 ↑</div>
        <div style={{ color: '#6366f1' }}>➔</div>
        <div className="feedback-flow-pill" style={{ color: '#facc15' }}>Solar Rad ↓</div>
        <div style={{ color: '#6366f1' }}>➔</div>
        <div className="feedback-flow-pill" style={{ color: '#fb923c' }}>Surface Heat ↓</div>
        <div style={{ color: '#6366f1' }}>➔</div>
        <div className="feedback-flow-pill" style={{ color: '#818cf8' }}>PBL Height ↓</div>
        <div style={{ color: '#6366f1' }}>➔</div>
        <div className="feedback-flow-pill" style={{ color: '#ef4444' }}>Trapping ↑</div>
      </div>

      {/* Delta Metrics Row */}
      <div className="feedback-deltas-row">
        <div className="delta-stat-cell">
          <div style={{ fontSize: '0.625rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            PBL Suppression
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-display)', margin: '0.15rem 0' }}>
            -{pblSuppression}%
          </div>
          <div style={{ fontSize: '0.625rem', color: '#64748b' }}>
            At hour +{selectedHour}h
          </div>
        </div>

        <div className="delta-stat-cell">
          <div style={{ fontSize: '0.625rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            PM2.5 Amplification
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fb7185', fontFamily: 'var(--font-display)', margin: '0.15rem 0' }}>
            +{pmAmplification} <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>µg/m³</span>
          </div>
          <div style={{ fontSize: '0.625rem', color: '#64748b' }}>
            Trapped mass vs uncoupled
          </div>
        </div>

        <div className="delta-stat-cell">
          <div style={{ fontSize: '0.625rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            Coupling Mode
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-display)', margin: '0.3rem 0' }}>
            COUPLED vs UNCOUPLED
          </div>
          <div style={{ fontSize: '0.625rem', color: '#64748b' }}>
            Stepwise recurrence (t → t+1)
          </div>
        </div>
      </div>
    </div>
  );
}
