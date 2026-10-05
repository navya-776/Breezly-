import React, { useEffect, useState } from 'react';
import { Play, Pause, Sun, Moon, RotateCcw } from 'lucide-react';
import { formatLiveCurrentTime, formatForecastDate } from '../utils/formatters';

const QUICK_INTERVALS = [
  { label: 'NOW', hour: 0 },
  { label: '+6h', hour: 6 },
  { label: '+12h', hour: 12 },
  { label: '+24h', hour: 24 },
  { label: '+48h', hour: 48 },
  { label: '+72h', hour: 71 }
];

export default function TimeController({
  selectedHour = 0,
  onHourChange,
  maxHours = 72,
  currentForecast
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveTimeStr, setLiveTimeStr] = useState(formatLiveCurrentTime());

  // Update live clock every 60 seconds for hour 0 (NOW)
  useEffect(() => {
    setLiveTimeStr(formatLiveCurrentTime());
    const intervalId = setInterval(() => {
      setLiveTimeStr(formatLiveCurrentTime());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Auto-play animation
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        onHourChange((prev) => {
          if (prev >= maxHours - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, maxHours, onHourChange]);

  const dateStr = selectedHour === 0
    ? liveTimeStr
    : formatForecastDate(currentForecast?.timestamp, selectedHour);
  const isDaytime = (currentForecast?.meteorology?.solar_radiation ?? 0) > 10;

  return (
    <div className="time-controller-card">
      <div className="time-controller-header">
        {/* Quick Jump Buttons */}
        <div className="quick-jump-group">
          {QUICK_INTERVALS.map((item) => {
            const isMatch = selectedHour === item.hour;
            return (
              <button
                key={item.label}
                onClick={() => {
                  setIsPlaying(false);
                  onHourChange(item.hour);
                }}
                className={`quick-time-btn ${isMatch ? 'active' : ''}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Current Time Display & Play Control */}
        <div className="time-display-group">
          <div className="time-indicator-pill">
            {isDaytime ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-300 shrink-0" />
            )}
            <span className="time-indicator-label">
              <strong>{selectedHour === 0 ? 'NOW' : `+${selectedHour}h`}</strong>
              <span className="time-separator">•</span>
              <span>{dateStr}</span>
            </span>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`play-btn ${isPlaying ? 'playing' : ''}`}
            title={isPlaying ? 'Pause forecast timeline' : 'Play 72-hour forecast animation'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Play 72h</span>
              </>
            )}
          </button>

          {selectedHour > 0 && (
            <button
              onClick={() => {
                setIsPlaying(false);
                onHourChange(0);
              }}
              className="reset-time-btn"
              title="Reset to current time (NOW)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Draggable Slider */}
      <div className="timeline-slider-container">
        <input
          type="range"
          min="0"
          max={maxHours - 1}
          value={selectedHour}
          onChange={(e) => {
            setIsPlaying(false);
            onHourChange(Number(e.target.value));
          }}
          className="timeline-slider"
          aria-label="Forecast hour slider"
        />

        {/* Hour Scale Ticks */}
        <div className="timeline-ticks">
          <span>NOW</span>
          <span>+12h</span>
          <span>+24h</span>
          <span>+36h</span>
          <span>+48h</span>
          <span>+60h</span>
          <span>+72h</span>
        </div>
      </div>
    </div>
  );
}
