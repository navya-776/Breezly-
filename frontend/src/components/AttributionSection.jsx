import React from 'react';
import { HelpCircle, Layers, Flame, Truck, Info } from 'lucide-react';

export default function AttributionSection({ currentRecord }) {
  if (!currentRecord) return null;

  const { attribution_categories, plume_risk, ventilation_trapping } = currentRecord;
  const biomass = attribution_categories?.biomass_plume_impact || 'MODERATE';
  const trapping = attribution_categories?.atmospheric_trapping || 'HIGH';
  const urban = attribution_categories?.local_urban_load || 'MODERATE';

  const getBadgeStyle = (level) => {
    switch (level) {
      case 'CRITICAL':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)' };
      case 'HIGH':
        return { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.4)' };
      case 'MODERATE':
        return { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.4)' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' };
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <HelpCircle style={{ width: '1rem', height: '1rem', color: '#06b6d4' }} />
          Model-Derived Source Attribution
        </div>
        <span className="badge-provenance badge-prototype">
          Attribution Scores
        </span>
      </div>

      <div className="card-subtitle">
        Decomposition into regional plume transport, atmospheric trapping, and local urban baseline
      </div>

      {/* 3 Compact Attribution Cards */}
      <div className="attribution-grid">
        {/* 1. Regional Biomass */}
        <div className="attribution-subcard">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Regional Biomass Burning
            </span>
            <Flame style={{ width: '0.85rem', height: '0.85rem', color: '#f97316' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
            <span style={{
              padding: '0.2rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              ...getBadgeStyle(biomass)
            }}>
              {biomass}
            </span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
              Index: {plume_risk?.plume_impact_index ?? 0}/100
            </span>
          </div>
        </div>

        {/* 2. Atmospheric Trapping */}
        <div className="attribution-subcard">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Atmospheric Trapping
            </span>
            <Layers style={{ width: '0.85rem', height: '0.85rem', color: '#818cf8' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
            <span style={{
              padding: '0.2rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              ...getBadgeStyle(trapping)
            }}>
              {trapping}
            </span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
              VI: {ventilation_trapping?.ventilation_index ?? 0} m²/s
            </span>
          </div>
        </div>

        {/* 3. Local Urban Base */}
        <div className="attribution-subcard">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Local Urban Base
            </span>
            <Truck style={{ width: '0.85rem', height: '0.85rem', color: '#38bdf8' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
            <span style={{
              padding: '0.2rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              ...getBadgeStyle(urban)
            }}>
              {urban}
            </span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
              Traffic & Dust
            </span>
          </div>
        </div>
      </div>

      {/* Concise Attribution Explanation */}
      <div style={{ padding: '0.625rem 0.75rem', background: 'rgba(10, 15, 28, 0.7)', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Info style={{ width: '0.85rem', height: '0.85rem', color: '#38bdf8', shrink: 0 }} />
        <span>
          Model-derived attribution based on plume impact, ventilation/trapping and local emission terms.
        </span>
      </div>
    </div>
  );
}
