import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { formatShortDate, formatForecastDate, getAqiMeta } from '../utils/formatters';
import { TrendingUp, Clock } from 'lucide-react';

export default function ForecastOutlookChart({
  forecastRecords = [],
  selectedHour = 0,
  onSelectHour,
  stationName = 'Delhi NCR'
}) {
  const [metricMode, setMetricMode] = useState('aqi'); // 'aqi' or 'pm25'

  // Prepare chart dataset
  const chartData = forecastRecords.map((rec, index) => {
    return {
      hour: index,
      timestamp: rec.timestamp,
      aqi: Math.round(rec.aqi ?? 0),
      pm25: Math.round(rec.pm25 ?? 0),
      pblh: Math.round(rec.meteorology?.pbl_height_coupled ?? 0),
      windSpeed: Number(rec.meteorology?.wind_speed_ms ?? 0).toFixed(1),
      trapping: Math.round(rec.ventilation_trapping?.trapping_score ?? 0)
    };
  });

  const activeVal = metricMode === 'aqi' 
    ? (chartData[selectedHour]?.aqi ?? 0) 
    : (chartData[selectedHour]?.pm25 ?? 0);

  const activeMeta = getAqiMeta(chartData[selectedHour]?.aqi ?? 0);

  const handleChartClick = (e) => {
    if (e && e.activeTooltipIndex !== undefined && e.activeTooltipIndex !== null) {
      onSelectHour(Number(e.activeTooltipIndex));
    }
  };

  return (
    <div className="forecast-chart-card">
      <div className="forecast-chart-top">
        <div className="forecast-title-group">
          <div className="forecast-title-row">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h3 className="section-title">72-Hour Air Quality Outlook</h3>
          </div>
          <span className="section-subtitle">
            Click anywhere on the curve to jump to that forecast hour
          </span>
        </div>

        {/* Metric Selector Toggle */}
        <div className="metric-toggle-group">
          <button
            onClick={() => setMetricMode('aqi')}
            className={`metric-toggle-btn ${metricMode === 'aqi' ? 'active' : ''}`}
          >
            AQI
          </button>
          <button
            onClick={() => setMetricMode('pm25')}
            className={`metric-toggle-btn ${metricMode === 'pm25' ? 'active' : ''}`}
          >
            PM2.5 (µg/m³)
          </button>
        </div>
      </div>

      {/* Value callout for the currently selected hour */}
      <div className="chart-active-callout">
        <span className="callout-label">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Hour +{selectedHour} ({formatForecastDate(chartData[selectedHour]?.timestamp, selectedHour)}):
        </span>
        <strong className="callout-value" style={{ color: activeMeta.color }}>
          {activeVal} {metricMode === 'pm25' ? 'µg/m³' : 'AQI'} ({activeMeta.category})
        </strong>
      </div>

      {/* Chart Canvas */}
      <div className="chart-canvas-wrapper" style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            onClick={handleChartClick}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="aqiAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeMeta.color} stopOpacity={0.45} />
                <stop offset="95%" stopColor={activeMeta.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="hour"
              tickFormatter={(hr) => {
                const rec = chartData[hr];
                return hr === 0 ? 'NOW' : `+${hr}h`;
              }}
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              interval={11}
            />

            <YAxis
              domain={metricMode === 'aqi' ? [0, 500] : [0, 'auto']}
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                const meta = getAqiMeta(d.aqi);
                return (
                  <div className="custom-chart-tooltip">
                    <div className="tooltip-header">
                      <strong>+{d.hour}h ({formatForecastDate(d.timestamp, d.hour)})</strong>
                    </div>
                    <div className="tooltip-row" style={{ color: meta.color }}>
                      <span>AQI:</span>
                      <strong>{d.aqi} ({meta.category})</strong>
                    </div>
                    <div className="tooltip-row text-rose-300">
                      <span>PM2.5:</span>
                      <strong>{d.pm25} µg/m³</strong>
                    </div>
                    <div className="tooltip-row text-slate-300">
                      <span>Wind:</span>
                      <span>{d.windSpeed} m/s</span>
                    </div>
                    <div className="tooltip-tip">
                      Click to jump to this hour
                    </div>
                  </div>
                );
              }}
            />

            {/* Vertical Marker for Selected Hour */}
            <ReferenceLine
              x={selectedHour}
              stroke="#ffffff"
              strokeDasharray="3 3"
              strokeWidth={2}
              label={{
                value: selectedHour === 0 ? 'NOW' : `+${selectedHour}h`,
                position: 'top',
                fill: '#ffffff',
                fontSize: 11,
                fontWeight: 700
              }}
            />

            {/* AQI Reference Thresholds */}
            {metricMode === 'aqi' && (
              <>
                <ReferenceLine y={200} stroke="#eab308" strokeDasharray="2 2" strokeOpacity={0.4} />
                <ReferenceLine y={300} stroke="#f97316" strokeDasharray="2 2" strokeOpacity={0.4} />
                <ReferenceLine y={400} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.4} />
              </>
            )}

            <Area
              type="monotone"
              dataKey={metricMode}
              stroke={activeMeta.color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#aqiAreaGrad)"
              activeDot={{ r: 6, fill: '#ffffff', stroke: activeMeta.color, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
