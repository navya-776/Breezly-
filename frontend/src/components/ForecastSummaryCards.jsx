import React from 'react';
import { getAqiMeta, formatForecastDate } from '../utils/formatters';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

const SUMMARY_POINTS = [
  { label: 'NOW', hourIndex: 0, sub: 'Current State' },
  { label: '+24H', hourIndex: 24, sub: '24h Horizon' },
  { label: '+48H', hourIndex: 48, sub: '48h Horizon' },
  { label: '+72H', hourIndex: 71, sub: '72h Horizon' }
];

export default function ForecastSummaryCards({
  forecastRecords = [],
  selectedHour = 0,
  onSelectHour
}) {
  const baseAqi = forecastRecords[0]?.aqi ?? 250;

  return (
    <div className="forecast-summary-section">
      <div className="section-header-row">
        <h3 className="section-title">72-Hour Forecast Outlook</h3>
        <span className="section-subtitle">Key milestone forecast horizons</span>
      </div>

      <div className="summary-cards-grid">
        {SUMMARY_POINTS.map((point) => {
          const rec = forecastRecords[point.hourIndex] || forecastRecords[0] || {};
          const aqi = rec.aqi ? Math.round(rec.aqi) : 250;
          const pm25 = rec.pm25 ? Math.round(rec.pm25) : 120;
          const meta = getAqiMeta(aqi);
          const isSelected = selectedHour === point.hourIndex;
          const dateStr = formatForecastDate(rec.timestamp, point.hourIndex);

          // Calculate trend vs base (NOW)
          let trendIcon = <Minus className="w-3.5 h-3.5 text-slate-400" />;
          let trendText = 'Stable';
          let trendColor = '#94a3b8';

          if (point.hourIndex > 0) {
            const diff = aqi - baseAqi;
            if (diff <= -25) {
              trendIcon = <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />;
              trendText = 'Improving';
              trendColor = '#10b981';
            } else if (diff >= 25) {
              trendIcon = <TrendingUp className="w-3.5 h-3.5 text-rose-400" />;
              trendText = 'Deteriorating';
              trendColor = '#ef4444';
            }
          }

          return (
            <div
              key={point.label}
              onClick={() => onSelectHour(point.hourIndex)}
              className={`summary-horizon-card ${isSelected ? 'active-horizon' : ''}`}
              style={{
                '--card-accent': meta.color
              }}
            >
              <div className="horizon-card-top">
                <div>
                  <span className="horizon-tag">{point.label}</span>
                  <span className="horizon-sub">{point.sub}</span>
                </div>
                <div
                  className="horizon-category-badge"
                  style={{ backgroundColor: meta.bg, color: meta.color, borderColor: meta.border }}
                >
                  {meta.category}
                </div>
              </div>

              <div className="horizon-aqi-row">
                <span className="horizon-aqi-number" style={{ color: meta.color }}>
                  {aqi}
                </span>
                <span className="horizon-aqi-unit">AQI</span>
              </div>

              <div className="horizon-meta-row">
                <span className="horizon-pm25">PM2.5: <strong>{pm25} µg/m³</strong></span>
                <span className="horizon-trend-tag" style={{ color: trendColor }}>
                  {trendIcon}
                  <span>{trendText}</span>
                </span>
              </div>

              <div className="horizon-date-row">
                {dateStr}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
