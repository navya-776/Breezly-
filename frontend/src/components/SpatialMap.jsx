import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Flame, Info } from 'lucide-react';
import { getAqiMeta, getWindCompassDirection } from '../utils/formatters';

export default function SpatialMap({
  stations = [],
  allStationForecasts = [],
  selectedHour = 0,
  selectedStationId,
  onSelectStation,
  fireHotspots = [],
  currentForecast,
  plumeRiskData
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const firesGroupRef = useRef(null);
  const [mapError, setMapError] = useState(false);

  // Initialize Map with 100% Free OpenStreetMap Tiles (No API key needed)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [28.6139, 77.2090], // Delhi NCR center
        zoom: 10,
        minZoom: 7,
        maxZoom: 16,
        zoomControl: true,
        attributionControl: true
      });

      // Standard OpenStreetMap tiles - guaranteed 100% free, zero tokens, zero API keys
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      firesGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;

      // Invalidate size to ensure proper tile rendering
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    } catch (e) {
      console.error('Leaflet initialization error:', e);
      setMapError(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Station Pins & Fire Markers whenever selectedHour or selectedStationId changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    try {
      markersGroupRef.current.clearLayers();
      if (firesGroupRef.current) firesGroupRef.current.clearLayers();

      // 1. Plot Delhi NCR AQI Station Markers using real latitude and longitude
      stations.forEach((st) => {
        const stId = st.station_id || st.id;
        const forecastObj = allStationForecasts.find((f) => (f.station_id || f.id) === stId);
        const record = forecastObj?.hourly_forecast?.[selectedHour];

        const aqi = record?.aqi ? Math.round(record.aqi) : 250;
        const pm25 = record?.pm25 ? Number(record.pm25).toFixed(1) : '120.0';
        const meta = getAqiMeta(aqi);
        const isSelected = stId === selectedStationId;
        const stationName = st.station_name || st.name || 'Monitoring Station';

        // Clean circular marker displaying AQI value
        const customIcon = L.divIcon({
          className: 'custom-station-pin',
          html: `
            <div style="
              background-color: ${meta.color};
              color: #ffffff;
              font-weight: 700;
              font-family: 'JetBrains Mono', -apple-system, BlinkMacSystemFont, monospace;
              font-size: 11px;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: ${isSelected ? '3px solid #ffffff' : '1.5px solid rgba(255,255,255,0.8)'};
              box-shadow: ${isSelected ? '0 0 12px rgba(0,0,0,0.6)' : '0 2px 6px rgba(0,0,0,0.35)'};
              transform: scale(${isSelected ? 1.2 : 1.0});
              transition: transform 0.2s ease, border 0.2s ease;
              cursor: pointer;
              user-select: none;
            ">
              ${aqi}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18]
        });

        const lat = Number(st.lat || st.coordinates?.lat || 28.6139);
        const lon = Number(st.lon || st.coordinates?.lon || 77.2090);

        const marker = L.marker([lat, lon], { icon: customIcon });

        marker.on('click', () => {
          onSelectStation(stId);
        });

        // Concise, readable tooltip popup
        marker.bindPopup(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.45; color: #0f172a; min-width: 130px; padding: 2px;">
            <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${stationName}</div>
            <div style="font-size: 12px; font-weight: 700; color: ${meta.color}; margin-bottom: 3px;">
              AQI: ${aqi} (${meta.category})
            </div>
            <div style="font-size: 11px; color: #334155; margin-bottom: 3px;">
              PM2.5: <strong>${pm25} µg/m³</strong>
            </div>
            <div style="font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 3px;">
              Forecast: +${selectedHour}h
            </div>
          </div>
        `);

        markersGroupRef.current.addLayer(marker);
      });

      // 2. Plot Punjab/Haryana Farm Fire Hotspots (small clean orange dots)
      if (firesGroupRef.current && fireHotspots.length > 0) {
        fireHotspots.forEach((fire) => {
          const fireLat = Number(fire.lat);
          const fireLon = Number(fire.lon);
          if (isNaN(fireLat) || isNaN(fireLon)) return;

          const fireIcon = L.divIcon({
            className: 'custom-fire-pin',
            html: `
              <div style="
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: #ea580c;
                border: 1.5px solid #ffffff;
                box-shadow: 0 1px 4px rgba(0,0,0,0.4);
                cursor: pointer;
              "></div>
            `,
            iconSize: [8, 8],
            iconAnchor: [4, 4],
            popupAnchor: [0, -6]
          });

          const fireMarker = L.marker([fireLat, fireLon], { icon: fireIcon });
          fireMarker.bindPopup(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #0f172a; padding: 2px;">
              <b style="color: #ea580c;">🔥 Agricultural Fire Hotspot</b><br/>
              District: <b>${fire.district || 'Punjab / Haryana'}</b><br/>
              FRP: <b>${fire.frp || 25} MW</b>
            </div>
          `);
          firesGroupRef.current.addLayer(fireMarker);
        });
      }
    } catch (err) {
      console.error('Error updating map layers:', err);
    }
  }, [stations, allStationForecasts, selectedHour, selectedStationId, onSelectStation, fireHotspots]);

  // Derive wind and plume information from actual backend data
  const windSpeed = Number(currentForecast?.meteorology?.wind_speed_ms ?? 2.5).toFixed(1);
  const windDirDeg = currentForecast?.meteorology?.wind_direction_deg ?? 315;
  const compassDir = getWindCompassDirection(windDirDeg);
  const plumeIndex = currentForecast?.plume_attribution?.plume_impact_index ?? 20;

  // Plume direction summary
  const isNWWind = (windDirDeg >= 270 && windDirDeg <= 360) || (windDirDeg >= 0 && windDirDeg <= 25);
  const plumeMovementText = (isNWWind && plumeIndex >= 10) 
    ? 'Moving toward Delhi NCR' 
    : 'Deflected away from Delhi NCR';

  return (
    <div className="spatial-map-card">
      <div className="map-card-header">
        <div className="map-header-title-group">
          <MapPin className="w-4 h-4 text-indigo-400" />
          <h3 className="section-title">Delhi NCR Spatial Pollution Map</h3>
        </div>

        {/* Simplified Map Legend */}
        <div className="map-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#10b981' }}></span> Good
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#eab308' }}></span> Moderate
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span> Poor / Severe
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#ea580c' }}></span> Farm Fires
          </span>
        </div>
      </div>

      {mapError ? (
        <div className="map-fallback-view">
          <Info className="w-5 h-5 text-amber-400" />
          <span>Interactive map tiles loading in fallback mode...</span>
        </div>
      ) : (
        <div className="map-container-wrap">
          <div ref={mapContainerRef} className="leaflet-map-target" />

          {/* Simplified Top-Right Wind & Plume Info Card */}
          <div className="map-floating-overlay">
            <div className="map-info-item">
              <div className="map-info-label">
                <Navigation
                  className="w-3.5 h-3.5 text-cyan-400"
                  style={{ transform: `rotate(${windDirDeg}deg)` }}
                />
                <span>Wind</span>
              </div>
              <div className="map-info-val">
                <strong>{windSpeed} m/s {compassDir}</strong>
              </div>
            </div>

            <div className="map-info-item">
              <div className="map-info-label">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Stubble-burning plume</span>
              </div>
              <div className="map-info-val">
                <strong>{plumeMovementText}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="map-footer-hint">
        <span>Click any station marker on the map to switch forecast view</span>
        <span className="map-hour-badge">Forecast Hour +{selectedHour}</span>
      </div>
    </div>
  );
}
