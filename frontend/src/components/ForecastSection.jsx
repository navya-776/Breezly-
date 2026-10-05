import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function ForecastSection({
  forecastRecords = [],
  currentHour = 0,
  stationName
}) {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'AQI', 'PM25', 'O3'

  if (!forecastRecords || forecastRecords.length === 0) {
    return <div className="card">Loading 72-hour forecast data...</div>;
  }

  const chartData = forecastRecords.map((r) => ({
    hour: `+${r.hour_offset}h`,
    hour_num: r.hour_offset,
    aqi: r.aqi,
    pm25: r.pm25,
    o3: r.o3,
    pbl_coupled: r.meteorology?.pbl_height_coupled ?? 300,
    vi: r.ventilation_trapping?.ventilation_index ?? 500
  }));

  return (
    <div className="card chart-section">
      <div className="card-header">
        <div>
          <div className="card-title">
            <TrendingUp style={{ width: '1rem', height: '1rem', color: '#818cf8' }} />
            72-Hour Coupled Air Quality Forecast
          </div>
          <div className="card-subtitle">
            Continuous multi-horizon trajectory for {stationName || 'Selected Station'}
          </div>
        </div>

        {/* Toggle Buttons */}
        <div className="chart-toggles">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`chart-toggle-btn ${activeTab === 'ALL' ? 'active' : ''}`}
          >
            All Metrics
          </button>
          <button
            onClick={() => setActiveTab('AQI')}
            className={`chart-toggle-btn ${activeTab === 'AQI' ? 'active' : ''}`}
          >
            AQI
          </button>
          <button
            onClick={() => setActiveTab('PM25')}
            className={`chart-toggle-btn ${activeTab === 'PM25' ? 'active' : ''}`}
          >
            PM2.5
          </button>
          <button
            onClick={() => setActiveTab('O3')}
            className={`chart-toggle-btn ${activeTab === 'O3' ? 'active' : ''}`}
          >
            Ground O3
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="chart-wrapper">
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
            <XAxis dataKey="hour" stroke="#64748b" fontSize={11} interval={5} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0d1526',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <ReferenceLine x={`+${currentHour}h`} stroke="#6366f1" strokeWidth={2} strokeDasharray="3 3" label={{ value: 'Current', fill: '#818cf8', fontSize: 10 }} />

            {(activeTab === 'ALL' || activeTab === 'AQI') && (
              <Area
                type="monotone"
                dataKey="aqi"
                name="Overall INAQI"
                stroke="#ef4444"
                fill="url(#aqiGrad)"
                strokeWidth={2.5}
                dot={false}
              />
            )}
            {(activeTab === 'ALL' || activeTab === 'PM25') && (
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
            {(activeTab === 'ALL' || activeTab === 'O3') && (
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
