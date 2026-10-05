import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TimeController from './components/TimeController';
import HeroConditions from './components/HeroConditions';
import SpatialMap from './components/SpatialMap';
import WhyIsAirLikeThis from './components/WhyIsAirLikeThis';
import WeatherConditions from './components/WeatherConditions';
import ForecastOutlookChart from './components/ForecastOutlookChart';
import ForecastSummaryCards from './components/ForecastSummaryCards';
import ActionableInsight from './components/ActionableInsight';
import TechnicalDetailsAccordion from './components/TechnicalDetailsAccordion';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [plumeRiskData, setPlumeRiskData] = useState(null);
  const [selectedStationId, setSelectedStationId] = useState('DEL_ANAND_VIHAR');
  
  // ONE Centralized Selected Forecast Hour State (0 to 71)
  const [selectedHour, setSelectedHour] = useState(0);

  // Theme Management (Dark Mode / Light Mode with localStorage and system preference)
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('breezly-theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch (e) {
      // fallback
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('breezly-theme', theme);
    } catch (e) {
      // fallback
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Fetch forecast and plume data from backend
  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const refreshParam = forceRefresh ? '?refresh=true' : '';
      const [forecastRes, plumeRes] = await Promise.all([
        fetch(`/api/forecast/72h${refreshParam}`),
        fetch(`/api/plume-risk${refreshParam}`)
      ]);

      if (!forecastRes.ok || !plumeRes.ok) {
        throw new Error('Failed to retrieve forecast data from backend.');
      }

      const forecastJson = await forecastRes.json();
      const plumeJson = await plumeRes.json();

      setForecastData(forecastJson);
      setPlumeRiskData(plumeJson);

      if (forecastJson.stations?.length > 0 && !selectedStationId) {
        setSelectedStationId(forecastJson.stations[0].station_id || forecastJson.stations[0].id);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error connecting to forecasting server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stations = forecastData?.stations || [];
  const activeStation = stations.find(
    (s) => (s.station_id || s.id) === selectedStationId
  ) || stations[0];

  // Derive Centralized Hourly Records
  const hourlyForecast = activeStation?.hourly_forecast || [];
  const currentForecast = hourlyForecast[selectedHour] || hourlyForecast[0] || null;
  const prevForecast = selectedHour > 0 ? (hourlyForecast[selectedHour - 1] || null) : null;

  return (
    <div className="breezly-dashboard">
      {/* 1. HEADER */}
      <Header
        stations={stations}
        selectedStationId={selectedStationId}
        onSelectStation={(id) => setSelectedStationId(id)}
        onRefresh={() => fetchData(true)}
        loading={loading}
        currentForecast={currentForecast}
        selectedHour={selectedHour}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Backend connection notice if any */}
      {error && (
        <div className="connection-error-banner">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>Connection Notice:</strong> {error}. Ensure FastAPI backend is active on port 8000.
          </span>
        </div>
      )}

      {/* 2. FORECAST TIME SELECTOR (Global Controller) */}
      <TimeController
        selectedHour={selectedHour}
        onHourChange={(hr) => setSelectedHour(hr)}
        maxHours={forecastData?.forecast_horizon_hours || 72}
        currentForecast={currentForecast}
      />

      {/* 3. CURRENT AIR QUALITY HERO */}
      <HeroConditions
        currentForecast={currentForecast}
        prevForecast={prevForecast}
        stationName={activeStation?.station_name || activeStation?.name || 'Delhi NCR'}
      />

      {/* 4. DELHI NCR MAP */}
      <SpatialMap
        stations={stations}
        allStationForecasts={stations}
        selectedHour={selectedHour}
        selectedStationId={selectedStationId}
        onSelectStation={(id) => setSelectedStationId(id)}
        fireHotspots={plumeRiskData?.hotspots || []}
        currentForecast={currentForecast}
        plumeRiskData={plumeRiskData}
      />

      {/* 5. "WHY IS THE AIR LIKE THIS?" (3 Simple Dynamic Cards) */}
      <WhyIsAirLikeThis
        currentForecast={currentForecast}
        plumeRiskData={plumeRiskData}
      />

      {/* 6. WEATHER CONDITIONS */}
      <WeatherConditions
        currentForecast={currentForecast}
      />

      {/* 7. 72-HOUR OUTLOOK CHART */}
      <ForecastOutlookChart
        forecastRecords={hourlyForecast}
        selectedHour={selectedHour}
        onSelectHour={(hr) => setSelectedHour(hr)}
        stationName={activeStation?.station_name || activeStation?.name}
        theme={theme}
      />


      {/* 8. SIMPLE FORECAST SUMMARY */}
      <ForecastSummaryCards
        forecastRecords={hourlyForecast}
        selectedHour={selectedHour}
        onSelectHour={(hr) => setSelectedHour(hr)}
      />

      {/* 9. ACTIONABLE INSIGHT */}
      <ActionableInsight
        currentForecast={currentForecast}
        selectedHour={selectedHour}
      />

      {/* 10. TECHNICAL DETAILS (COLLAPSED ACCORDION) */}
      <TechnicalDetailsAccordion
        currentForecast={currentForecast}
        provenance={forecastData?.provenance}
        selectedHour={selectedHour}
      />
    </div>
  );
}
