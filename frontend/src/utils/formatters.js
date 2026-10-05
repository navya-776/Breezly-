/**
 * Robust date, AQI, and trend formatting utilities for Breezly.
 * Guarantees zero "Invalid Date" strings.
 */

export function formatForecastDate(timestamp, hourOffset = 0) {
  if (!timestamp) {
    return `Forecast +${hourOffset}h`;
  }

  try {
    let cleanStr = String(timestamp).trim().replace(/\+00:00Z$/, 'Z');
    const d = new Date(cleanStr);
    
    if (isNaN(d.getTime())) {
      return `Forecast +${hourOffset}h`;
    }

    const day = d.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short',
      timeZone: 'Asia/Kolkata' 
    });
    
    const time = d.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false,
      timeZone: 'Asia/Kolkata'
    });

    return `${day} • ${time} IST`;
  } catch (err) {
    return `Forecast +${hourOffset}h`;
  }
}

export function formatShortDate(timestamp, hourOffset = 0) {
  if (!timestamp) return `+${hourOffset}h`;
  try {
    let cleanStr = String(timestamp).trim().replace(/\+00:00Z$/, 'Z');
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return `+${hourOffset}h`;
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
  } catch (e) {
    return `+${hourOffset}h`;
  }
}

export function getAqiMeta(aqiVal) {
  const val = Number(aqiVal) || 0;
  if (val <= 50) {
    return { category: 'Good', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981' };
  } else if (val <= 100) {
    return { category: 'Satisfactory', color: '#84cc16', bg: 'rgba(132, 204, 22, 0.15)', border: '#84cc16' };
  } else if (val <= 200) {
    return { category: 'Moderate', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', border: '#eab308' };
  } else if (val <= 300) {
    return { category: 'Poor', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316' };
  } else if (val <= 400) {
    return { category: 'Very Poor', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444' };
  } else {
    return { category: 'Severe', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.25)', border: '#b91c1c' };
  }
}

export function calculateTrend(currentVal, prevVal) {
  if (prevVal === null || prevVal === undefined || Number(prevVal) === 0) {
    return null;
  }
  const curr = Number(currentVal);
  const prev = Number(prevVal);
  const diff = curr - prev;
  const pct = Math.round((diff / prev) * 100);
  
  if (pct > 0) return { text: `↑ +${pct}%`, color: '#ef4444', isUp: true };
  if (pct < 0) return { text: `↓ ${pct}%`, color: '#10b981', isUp: false };
  return { text: `→ 0%`, color: '#94a3b8', isUp: false };
}

export function getWindCompassDirection(deg) {
  if (deg === null || deg === undefined) return 'NW';
  const val = (deg % 360 + 360) % 360;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(val / 45) % 8;
  return directions[index];
}
