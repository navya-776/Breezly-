import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function ForecastChart({
  forecastRecords = [],
  selectedHour = 0,
  stationName
}) {
  const [activeMetric, setActiveMetric] = useState('ALL'); // 'ALL', 'AQI', 'PM25', 'O3'

  if (!forecastRecords || forecastRecords.length === 0) {
    return <div className="breezly-card">Loading 72h forecast chart...</div>;
  }

  const chartData = forecastRecords.map((r) => ({
    hour: `+${r.hour_offset}h`,
    hour_num: r.hour_offset,
    aqi: r.aqi,
    pm25: r.pm25,
    o3: r.o3
  }));

  return (
    <div className="breezly-card forecast-chart-card" style={{ height: '390px' }}>
      <div className="card-top-bar">
        <div className="card-heading">
          <TrendingUp style={{ width: '0.9rem', height: '0.9rem', color: '#818cf8' }} />
          72-Hour Coupled Air Quality Trajectory
        </div>

        {/* Toggles */}
        <div className="chart-toggles-row">
          <button
            onClick={() => setActiveMetric('ALL')}
            className={`chart-tab-btn ${activeMetric === 'ALL' ? 'active' : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setActiveMetric('AQI')}
            className={`chart-tab-btn ${activeMetric === 'AQI' ? 'active' : ''}`}
          >
            AQI
          </button>
          <button
            onClick={() => setActiveMetric('PM25')}
            className={`chart-tab-btn ${activeMetric === 'PM25' ? 'active' : ''}`}
          >
            PM2.5
          </button>
          <button
            onClick={() => setActiveMetric('O3')}
            className={`chart-tab-btn ${activeMetric === 'O3' ? 'active' : ''}`}
          >
            Ground O3
          </button>
        </div>
      </div>

      <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
        Continuous coupled forecast • Selected hour: <strong style={{ color: '#818cf8' }}>+{selectedHour}h</strong>
      </div>

      {/* Chart Canvas */}
      <div className="chart-container-box" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="pmGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="o3Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#eab308" stopOpacity={0.0} />
              </linearGradient>
            </defs>
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
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />

            {/* Vertical Marker for Selected Hour */}
            <ReferenceLine
              x={`+${selectedHour}h`}
              stroke="#6366f1"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              label={{ value: `+${selectedHour}h`, fill: '#a5b4fc', fontSize: 10, position: 'top' }}
            />

            {(activeMetric === 'ALL' || activeMetric === 'AQI') && (
              <Area
                type="monotone"
                dataKey="aqi"
                name="AQI"
                stroke="#ef4444"
                fill="url(#aqiGrad)"
                strokeWidth={2.5}
                dot={false}
              />
            )}
            {(activeMetric === 'ALL' || activeMetric === 'PM25') && (
              <Area
                type="monotone"
                dataKey="pm25"
                name="PM2.5 (µg/m³)"
                stroke="#f43f5e"
                fill="url(#pmGrad)"
                strokeWidth={2}
                dot={false}
              />
            )}
            {(activeMetric === 'ALL' || activeMetric === 'O3') && (
              <Area
                type="monotone"
                dataKey="o3"
                name="Ground O3 (µg/m³)"
                stroke="#eab308"
                fill="url(#o3Grad)"
                strokeWidth={1.8}
                dot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
