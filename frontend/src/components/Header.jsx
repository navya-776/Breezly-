import React, { useState, useEffect } from 'react';
import { Wind, RefreshCw, MapPin, Clock } from 'lucide-react';
import { formatForecastDate } from '../utils/formatters';

function formatCurrentLiveTime() {
  const d = new Date();
  try {
    const day = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
    const time = d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    let tzLabel = 'IST';
    try {
      const resolvedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (resolvedTz === 'Asia/Kolkata' || resolvedTz === 'Asia/Calcutta' || d.getTimezoneOffset() === -330) {
        tzLabel = 'IST';
      } else {
        const part = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
          .formatToParts(d)
          .find((p) => p.type === 'timeZoneName')?.value;
        tzLabel = part || 'IST';
      }
    } catch {
      tzLabel = 'IST';
    }

    return `${day} • ${time} ${tzLabel}`;
  } catch (e) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-GB', { month: 'short' });
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} • ${hours}:${mins} IST`;
  }
}

export default function Header({
  stations = [],
  selectedStationId,
  onSelectStation,
  onRefresh,
  loading,
  currentForecast,
  selectedHour = 0
}) {
  const [liveTimeStr, setLiveTimeStr] = useState(formatCurrentLiveTime());

  // Update live clock every 60 seconds without full page refresh
  useEffect(() => {
    setLiveTimeStr(formatCurrentLiveTime());
    const intervalId = setInterval(() => {
      setLiveTimeStr(formatCurrentLiveTime());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const displayTimestamp = selectedHour === 0
    ? liveTimeStr
    : formatForecastDate(currentForecast?.timestamp, selectedHour);


  return (
    <header className="breezly-header">
      <div className="brand-group">
        <div className="brand-icon">
          <Wind className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="brand-title">Breezly</h1>
          <p className="brand-subtitle">Delhi NCR Air Quality Forecast</p>
        </div>
      </div>

      <div className="header-actions">
        {/* Station Selector */}
        <div className="station-selector-wrapper">
          <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
          <select
            value={selectedStationId || ''}
            onChange={(e) => onSelectStation(e.target.value)}
            className="station-select"
            aria-label="Select Monitoring Station"
          >
            {stations.map((st) => {
              const id = st.station_id || st.id;
              const name = st.station_name || st.name;
              return (
                <option key={id} value={id}>
                  {name}
                </option>
              );
            })}
          </select>
        </div>

        {/* Forecast Timestamp */}
        <div className="timestamp-pill">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="timestamp-text">
            {selectedHour === 0 ? 'Live: ' : `+${selectedHour}h: `}
            <strong>{timestampStr}</strong>
          </span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="refresh-btn"
          title="Refresh forecast data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
}
