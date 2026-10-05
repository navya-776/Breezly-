import React from 'react';
import { Activity, Satellite, Sparkles, Clock } from 'lucide-react';

export default function ProvenanceFooter({ provenance = {} }) {
  const isLiveNwp = provenance?.meteorology?.includes('LIVE');

  return (
    <footer className="breezly-footer">
      <div>
        <strong style={{ color: '#f8fafc' }}>BREEZLY</strong> • Delhi NCR Coupled Atmospheric & Air Quality Intelligence
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        <span className={`badge-provenance ${isLiveNwp ? 'badge-live' : 'badge-cached'}`}>
          <Activity style={{ width: '0.65rem', height: '0.65rem' }} />
          {isLiveNwp ? 'LIVE NWP' : 'CACHED NWP'}
        </span>
        <span className="badge-provenance badge-cached">
          <Satellite style={{ width: '0.65rem', height: '0.65rem' }} />
          CALIBRATED FIRE HOTSPOTS
        </span>
        <span className="badge-provenance badge-prototype">
          <Sparkles style={{ width: '0.65rem', height: '0.65rem' }} />
          SURROGATE COUPLED MODEL
        </span>
        <span className="badge-provenance badge-forecast">
          <Clock style={{ width: '0.65rem', height: '0.65rem' }} />
          72H STEPWISE FORECAST
        </span>
      </div>
    </footer>
  );
}
