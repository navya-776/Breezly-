"""
FastAPI Backend Application for Coupled 72-Hour Delhi NCR AQI Forecasting System.
Exposes REST endpoints for live/cached meteorology, satellite fire hotspots,
real-time multi-pollutant observations, kinematic plume risk, and two-way coupled 72h forecasts.
"""

from fastapi import FastAPI, Query, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
import datetime
import asyncio
from typing import Optional, Dict, Any, List

from config import STATIONS, DELHI_NCR_BBOX
from services.weather_service import fetch_nwp_forecast, clear_weather_cache
from services.air_quality_service import (
    fetch_station_air_quality,
    fetch_all_stations_air_quality,
    clear_aq_cache
)
from services.fire_service import fetch_active_fires
from services.station_service import get_all_stations, get_station_by_id
from services.historical_weather_service import get_data_status, ensure_historical_data_ready
from models.plume_dispersion import calculate_plume_risk_series
from models.coupled_forecaster import run_coupled_station_forecast

app = FastAPI(
    title="Coupled Delhi NCR AQI Forecasting System",
    description="72-hour physics-informed coupled meteorology-air quality forecasting system with two-way aerosol feedback and regional biomass plume dispersion initialized by atmospheric data.",
    version="2.0.0"
)

# Enable CORS for frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)


@app.on_event("startup")
async def startup_event():
    """Ensure station-level historical weather and CPCB pollution datasets are loaded."""
    try:
        ensure_historical_data_ready()
    except Exception as e:
        print(f"[Startup Warning] Historical data initialization: {e}")


@app.get("/api/health")
async def health_check():
    """Health check endpoint indicating service availability, data sources, and timestamps."""
    now_utc = datetime.datetime.now(datetime.timezone.utc).isoformat() + "Z"
    return {
        "status": "healthy",
        "system": "Coupled Delhi NCR 72h AQI Forecaster",
        "mode": "Physics-informed coupled surrogate",
        "server_time_utc": now_utc,
        "services": {
            "historical_weather": {
                "source": "Open-Meteo Historical Weather API",
                "data_type": "historical_reanalysis",
                "provenance": "ERA5/CERRA Reanalysis Archive"
            },
            "pollution_data": {
                "source": "CPCB CAAQM via XKDR India Air Quality Database",
                "data_type": "historical_observation",
                "provenance": "CPCB Continuous Ambient Air Quality Monitoring"
            },
            "weather": {
                "source": "Open-Meteo NWP",
                "data_type": "WEATHER NWP",
                "provenance": "LIVE NWP DATA"
            },
            "air_quality": {
                "source": "Open-Meteo / Copernicus CAMS",
                "data_type": "MODELLED AIR QUALITY",
                "provenance": "LIVE MODEL DATA"
            },
            "satellite_fires": {
                "source": "NASA FIRMS (Calibrated Distribution / VIIRS Hotspots)",
                "data_type": "SATELLITE DERIVED",
                "provenance": "CALIBRATED SATELLITE DISTRIBUTION"
            },
            "forecasting_core": {
                "source": "Breezly Coupled Model",
                "data_type": "COUPLED FORECAST",
                "provenance": "Physics-informed coupled surrogate (Two-Way Aerosol-Radiation-PBL Feedback)"
            }
        }
    }


@app.get("/api/data-status")
async def data_status():
    """
    Returns the integration status of station-level historical weather and CPCB pollution datasets.
    """
    return get_data_status()



@app.get("/api/stations")
async def list_stations():
    """Returns the list of Delhi NCR monitoring stations with geographical coordinates and types."""
    return {
        "provenance": "CPCB Delhi NCR Monitoring Geometries",
        "count": len(STATIONS),
        "region_bbox": DELHI_NCR_BBOX,
        "stations": get_all_stations()
    }


@app.get("/api/observations/current")
async def get_current_observations(
    station_id: Optional[str] = Query(None, description="Optional station ID filter (e.g., DEL_ANAND_VIHAR)"),
    refresh: bool = Query(False, description="Force cache refresh")
):
    """
    Retrieves the latest available real atmospheric observations for Delhi NCR stations.
    Includes PM2.5, PM10, O3, NO2, SO2, CO, temperature, humidity, wind, and calculated current AQI.
    """
    if station_id:
        st = get_station_by_id(station_id)
        if not st:
            raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found")
        
        aq_task = fetch_station_air_quality(st["id"], st["lat"], st["lon"], force_refresh=refresh)
        wx_task = fetch_nwp_forecast(st["lat"], st["lon"], hours=24, force_refresh=refresh)
        aq_data, wx_data = await asyncio.gather(aq_task, wx_task)

        return {
            "station_id": st["id"],
            "station_name": st["name"],
            "coordinates": {"lat": st["lat"], "lon": st["lon"]},
            "air_quality": aq_data,
            "weather": {
                "source": wx_data.get("source", "Open-Meteo NWP"),
                "provenance": wx_data.get("provenance", "LIVE NWP DATA"),
                "retrieved_at": wx_data.get("retrieved_at"),
                "current": wx_data.get("current", {})
            }
        }
    
    # Fetch all stations concurrently
    aq_dict = await fetch_all_stations_air_quality(force_refresh=refresh)
    # Regional central weather
    wx_data = await fetch_nwp_forecast(DELHI_NCR_BBOX["center_lat"], DELHI_NCR_BBOX["center_lon"], hours=24, force_refresh=refresh)
    
    results = []
    for st in STATIONS:
        st_aq = aq_dict.get(st["id"], {})
        results.append({
            "station_id": st["id"],
            "station_name": st["name"],
            "station_type": st["type"],
            "coordinates": {"lat": st["lat"], "lon": st["lon"]},
            "air_quality": st_aq,
            "weather": {
                "source": wx_data.get("source", "Open-Meteo NWP"),
                "provenance": wx_data.get("provenance", "LIVE NWP DATA"),
                "retrieved_at": wx_data.get("retrieved_at"),
                "current": wx_data.get("current", {})
            }
        })

    return {
        "provenance": {
            "air_quality": "LIVE MODEL DATA (Open-Meteo / Copernicus CAMS)",
            "weather": wx_data.get("provenance", "LIVE NWP DATA")
        },
        "retrieved_at": datetime.datetime.now(datetime.timezone.utc).isoformat() + "Z",
        "station_count": len(results),
        "stations": results
    }


@app.get("/api/plume-risk")
async def get_plume_risk(
    hours: int = Query(72, ge=12, le=96),
    refresh: bool = Query(False, description="Force cache refresh")
):
    """
    Returns active fire hotspot coordinates across Punjab/Haryana and computes
    the 72-hour forward kinematic plume dispersion risk towards Delhi NCR.
    """
    fires_data = await fetch_active_fires()
    nwp_data = await fetch_nwp_forecast(
        DELHI_NCR_BBOX["center_lat"],
        DELHI_NCR_BBOX["center_lon"],
        hours=hours,
        force_refresh=refresh
    )
    
    plume_series = calculate_plume_risk_series(
        hotspots=fires_data["hotspots"],
        wind_speeds=nwp_data["wind_speed_10m"],
        wind_dirs=nwp_data["wind_direction_10m"],
        receptor_lat=DELHI_NCR_BBOX["center_lat"],
        receptor_lon=DELHI_NCR_BBOX["center_lon"],
        hours=hours
    )

    return {
        "provenance": {
            "satellite_fires": fires_data["provenance"],
            "meteorology": nwp_data["provenance"],
            "plume_model": "PROTOTYPE/DERIVED (Kinematic Advection & Dispersion Risk Index)"
        },
        "region": "Punjab & Haryana to Delhi NCR Smoke Corridor",
        "active_fire_count": fires_data["active_fire_count"],
        "total_frp_mw": fires_data["total_frp_mw"],
        "hotspots": fires_data["hotspots"],
        "hourly_plume_risk": plume_series
    }


@app.get("/api/forecast/72h")
async def get_72h_forecast(
    station_id: Optional[str] = Query(None, description="Optional station ID filter (e.g., DEL_ANAND_VIHAR)"),
    refresh: bool = Query(False, description="Force cache refresh")
):
    """
    Generates dynamic 72-hour stepwise coupled forecast for Delhi NCR stations.
    Initialized from latest available real atmospheric observations.
    Includes meteorology, atmospheric trapping proxy, empirical O3 surrogate,
    two-way aerosol-PBL feedback diagnostics, and qualitative source attribution.
    """
    # 1. Fetch NWP meteorology, satellite fires, and live air quality concurrently
    nwp_task = fetch_nwp_forecast(DELHI_NCR_BBOX["center_lat"], DELHI_NCR_BBOX["center_lon"], hours=72, force_refresh=refresh)
    fires_task = fetch_active_fires()
    aq_task = fetch_all_stations_air_quality(force_refresh=refresh)

    nwp_data, fires_data, aq_dict = await asyncio.gather(nwp_task, fires_task, aq_task)

    # 2. Compute regional plume risk time-series
    plume_series = calculate_plume_risk_series(
        hotspots=fires_data["hotspots"],
        wind_speeds=nwp_data["wind_speed_10m"],
        wind_dirs=nwp_data["wind_direction_10m"],
        receptor_lat=DELHI_NCR_BBOX["center_lat"],
        receptor_lon=DELHI_NCR_BBOX["center_lon"],
        hours=72
    )

    # 3. Filter stations
    target_stations = STATIONS
    if station_id:
        target = get_station_by_id(station_id)
        if not target:
            raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found")
        target_stations = [target]

    # 4. Run coupled 72h forecast per station initialized from real observation
    station_forecasts = []
    for st in target_stations:
        initial_obs = aq_dict.get(st["id"], {})
        st_forecast = run_coupled_station_forecast(
            station=st,
            initial_obs=initial_obs,
            nwp_data=nwp_data,
            plume_risk_series=plume_series,
            hours=72
        )
        station_forecasts.append(st_forecast)

    now_utc = datetime.datetime.now(datetime.timezone.utc).isoformat() + "Z"

    return {
        "provenance": {
            "initial_observations": "CPCB CAAQM (Historical Observation) / Copernicus CAMS",
            "meteorology": nwp_data.get("provenance", "Open-Meteo Reanalysis/NWP"),
            "biomass_fires": fires_data["provenance"],
            "forecasting_core": "Physics-informed coupled surrogate (Two-Way Aerosol-Radiation-PBL Feedback)"
        },
        "generated_at_utc": now_utc,
        "forecast_horizon_hours": 72,
        "region": "Delhi National Capital Region (NCR)",
        "station_count": len(station_forecasts),
        "active_fire_count": fires_data["active_fire_count"],
        "stations": station_forecasts
    }


@app.post("/api/refresh")
async def refresh_all_data():
    """
    Clears in-memory caches and re-fetches latest live weather and air quality data.
    """
    clear_aq_cache()
    clear_weather_cache()
    
    # Warm up caches immediately
    nwp_task = fetch_nwp_forecast(DELHI_NCR_BBOX["center_lat"], DELHI_NCR_BBOX["center_lon"], hours=72, force_refresh=True)
    aq_task = fetch_all_stations_air_quality(force_refresh=True)
    await asyncio.gather(nwp_task, aq_task)

    return {
        "status": "success",
        "message": "Caches cleared and latest live data ingested successfully.",
        "refreshed_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat() + "Z"
    }


@app.get("/api/diagnostics/feedback")
async def get_feedback_diagnostics(
    station_id: str = Query("DEL_ANAND_VIHAR"),
    refresh: bool = Query(False)
):
    """
    Returns side-by-side scientific comparison of Uncoupled vs. Coupled forecasts
    to evaluate the impact of aerosol-PBL-radiation feedback suppression.
    """
    target = get_station_by_id(station_id) or STATIONS[0]
    nwp_data = await fetch_nwp_forecast(target["lat"], target["lon"], hours=72, force_refresh=refresh)
    fires_data = await fetch_active_fires()
    initial_obs = await fetch_station_air_quality(target["id"], target["lat"], target["lon"], force_refresh=refresh)
    
    plume_series = calculate_plume_risk_series(
        hotspots=fires_data["hotspots"],
        wind_speeds=nwp_data["wind_speed_10m"],
        wind_dirs=nwp_data["wind_direction_10m"],
        receptor_lat=target["lat"],
        receptor_lon=target["lon"],
        hours=72
    )

    result = run_coupled_station_forecast(
        station=target,
        initial_obs=initial_obs,
        nwp_data=nwp_data,
        plume_risk_series=plume_series,
        hours=72
    )

    return {
        "provenance": "PROTOTYPE/DERIVED (Aerosol Feedback Diagnostic Comparator)",
        "station": target,
        "diagnostics": result["feedback_diagnostics"]
    }
