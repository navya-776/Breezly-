import React from 'react';
import { HelpCircle, Info } from 'lucide-react';

export default function AttributionCard({ currentForecast }) {
  if (!currentForecast) return null;

  const { attribution_categories, plume_risk, ventilation_trapping } = currentForecast;
  const biomass = attribution_categories?.biomass_plume_impact || 'MODERATE';
  const trapping = attribution_categories?.atmospheric_trapping || 'HIGH';
  const urban = attribution_categories?.local_urban_load || 'MODERATE';

  const getStyle = (level) => {
    switch (level) {
      case 'CRITICAL':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.35)' };
      case 'HIGH':
        return { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.35)' };
      case 'MODERATE':
        return { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.35)' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.35)' };
    }
  };

  return (
    <div className="breezly-card">
      <div className="card-top-bar">
        <div className="card-heading">
          <HelpCircle style={{ width: '0.9rem', height: '0.9rem', color: '#06b6d4' }} />
          Model-Derived Source Attribution
        </div>
        <span className="badge-provenance badge-prototype">Attribution Scores</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', margin: '0.35rem 0' }}>
        <div style={{ background: 'var(--bg-subcard)', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.625rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Biomass Burning</span>
          <span style={{ padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.6875rem', fontWeight: 800, width: 'fit-content', ...getStyle(biomass) }}>
            {biomass}
          </span>
        </div>

        <div style={{ background: 'var(--bg-subcard)', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.625rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Atmospheric Trapping</span>
          <span style={{ padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.6875rem', fontWeight: 800, width: 'fit-content', ...getStyle(trapping) }}>
            {trapping}
          </span>
        </div>

        <div style={{ background: 'var(--bg-subcard)', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.625rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Local Urban Base</span>
          <span style={{ padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.6875rem', fontWeight: 800, width: 'fit-content', ...getStyle(urban) }}>
            {urban}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.65rem', color: '#64748b', marginTop: '0.25rem' }}>
        <Info style={{ width: '0.75rem', height: '0.75rem', color: '#38bdf8', shrink: 0 }} />
        <span>Model-derived attribution based on plume impact, ventilation/trapping and local emission terms.</span>
      </div>
    </div>
  );
}
