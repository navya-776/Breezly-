import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { formatLiveCurrentTime, formatForecastDate } from '../utils/formatters';

export default function TimelineScrubber({
  currentHour = 0,
  onHourChange,
  maxHours = 72,
  currentRecord
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveTimeStr, setLiveTimeStr] = useState(formatLiveCurrentTime());

  useEffect(() => {
    setLiveTimeStr(formatLiveCurrentTime());
    const intervalId = setInterval(() => {
      setLiveTimeStr(formatLiveCurrentTime());
    }, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Playback timer
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        onHourChange((prev) => (prev >= maxHours - 1 ? 0 : prev + 1));
      }, 700);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, maxHours, onHourChange]);

  const timestampString = currentHour === 0
    ? liveTimeStr
    : formatForecastDate(currentRecord?.timestamp, currentHour);

  return (
    <div className="timeline-card">
      <div className="timeline-top">
        {/* Controls */}
        <div className="timeline-controls">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`btn-playback ${isPlaying ? 'playing' : ''}`}
          >
            {isPlaying ? (
              <>
                <Pause style={{ width: '0.85rem', height: '0.85rem' }} />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play style={{ width: '0.85rem', height: '0.85rem', fill: '#ffffff' }} />
                <span>PLAY 72H OUTLOOK</span>
              </>
            )}
          </button>

          <button
            onClick={() => onHourChange(0)}
            className="btn-icon"
            title="Reset to Hour 0"
          >
            <RotateCcw style={{ width: '0.9rem', height: '0.9rem' }} />
          </button>
        </div>

        {/* Formatted Date Badge */}
        <div className="timeline-badge-time">
          <Clock style={{ width: '0.8rem', height: '0.8rem', display: 'inline', marginRight: '0.35rem' }} />
          {timestampString}
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min="0"
        max={maxHours - 1}
        value={currentHour}
        onChange={(e) => onHourChange(Number(e.target.value))}
        className="timeline-slider"
      />

      {/* Ticks */}
      <div className="timeline-ticks">
        <span style={{ fontWeight: currentHour === 0 ? 800 : 500, color: currentHour === 0 ? '#818cf8' : undefined }}>
          NOW (+0h)
        </span>
        <span>+12h</span>
        <span style={{ fontWeight: currentHour >= 23 && currentHour <= 25 ? 800 : 500 }}>
          +24h (Day 1)
        </span>
        <span>+36h</span>
        <span style={{ fontWeight: currentHour >= 47 && currentHour <= 49 ? 800 : 500 }}>
          +48h (Day 2)
        </span>
        <span>+60h</span>
        <span>+72h (Day 3)</span>
      </div>
    </div>
  );
}
