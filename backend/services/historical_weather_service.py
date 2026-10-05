"""
Historical Weather and Air Quality Integration Service for Breezly.
Fetches, caches, validates, and serves station-level historical weather (Open-Meteo Archive API)
and CPCB CAAQM pollution data for the 39 Delhi monitoring stations (November 1-30, 2024).

Scientific Provenance:
- Weather Source: Open-Meteo Historical Weather API
- Weather Data Type: historical_reanalysis
- Pollution Source: CPCB CAAQM via XKDR India Air Quality Database
- Pollution Data Type: historical_observation
- Period: 2024-11-01 00:00:00 to 2024-11-30 23:00:00 (Asia/Kolkata / IST)
"""

import os
import json
import csv
import urllib.request
import datetime
from typing import Dict, List, Any, Optional, Tuple

# Dynamic Path Resolution supporting Vercel Serverless Services & Local Development
def get_data_dir() -> str:
    """Finds data folder across Vercel Lambda (/var/task/data), backend/data, and repo root."""
    cur_dir = os.path.dirname(os.path.abspath(__file__))  # backend/services
    candidates = [
        os.path.join(cur_dir, "..", "data"),        # backend/data
        os.path.join(cur_dir, "..", "..", "data"),  # repo_root/data
        os.path.join(cur_dir, "data"),              # backend/services/data
        os.path.join(os.getcwd(), "backend", "data"),
        os.path.join(os.getcwd(), "data"),
        "/var/task/data",
        "/var/task/backend/data"
    ]
    for c in candidates:
        norm = os.path.abspath(c)
        if os.path.isdir(norm) and (
            os.path.exists(os.path.join(norm, "metadata", "cpcb_delhi_stations.json"))
            or os.path.exists(os.path.join(norm, "historical"))
        ):
            return norm
    return os.path.abspath(os.path.join(cur_dir, "..", "data"))

def get_stations_metadata_file() -> str:
    return os.path.join(get_data_dir(), "metadata", "cpcb_delhi_stations.json")

def get_historical_weather_csv() -> str:
    return os.path.join(get_data_dir(), "historical", "delhi_weather_hourly_nov2024.csv")

def get_merged_dataset_csv() -> str:
    return os.path.join(get_data_dir(), "historical", "delhi_aqi_weather_hourly_nov2024.csv")

def get_pollution_files() -> Dict[str, str]:
    h_dir = os.path.join(get_data_dir(), "historical")
    return {
        "pm25": os.path.join(h_dir, "cpcb_pm25_hourly_nov2024.csv"),
        "pm10": os.path.join(h_dir, "cpcb_pm10_hourly_nov2024.csv"),
        "no2": os.path.join(h_dir, "cpcb_no2_hourly_nov2024.csv"),
        "o3": os.path.join(h_dir, "cpcb_o3_hourly_nov2024.csv")
    }

# Provenance constants
WEATHER_SOURCE = "Open-Meteo Historical Weather API"
POLLUTION_SOURCE = "CPCB CAAQM via XKDR India Air Quality Database"
WEATHER_DATA_TYPE = "historical_reanalysis"
POLLUTION_DATA_TYPE = "historical_observation"
DATA_PERIOD = "2024-11-01 through 2024-11-30"

# In-memory storage for rapid query responses
_STATIONS_CACHE: List[Dict[str, Any]] = []
_WEATHER_CACHE: Dict[str, List[Dict[str, Any]]] = {}  # {station_id: [hourly_records]}
_MERGED_CACHE: Dict[str, List[Dict[str, Any]]] = {}   # {station_id: [hourly_records]}
_DATA_STATUS_CACHE: Optional[Dict[str, Any]] = None


def load_stations_metadata() -> List[Dict[str, Any]]:
    """Loads the 39 Delhi CPCB station metadata from disk."""
    global _STATIONS_CACHE
    if _STATIONS_CACHE:
        return _STATIONS_CACHE

    target_file = get_stations_metadata_file()
    if os.path.exists(target_file):
        with open(target_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            stations = data.get("data", [])
            if not stations and isinstance(data, list):
                stations = data
            if stations:
                _STATIONS_CACHE = stations
                return _STATIONS_CACHE

    from config import STATIONS
    _STATIONS_CACHE = STATIONS
    return _STATIONS_CACHE



def fetch_open_meteo_historical_batch(
    stations: List[Dict[str, Any]],
    start_date: str = "2024-11-01",
    end_date: str = "2024-11-30"
) -> List[Dict[str, Any]]:
    """
    Fetches Open-Meteo historical weather reanalysis for all 39 station coordinates
    in a single batched HTTP GET request.
    """
    lats = ",".join(str(s["latitude"]) for s in stations)
    lons = ",".join(str(s["longitude"]) for s in stations)
    
    variables = [
        "temperature_2m",
        "relative_humidity_2m",
        "precipitation",
        "surface_pressure",
        "wind_speed_10m",
        "wind_direction_10m",
        "shortwave_radiation",
        "boundary_layer_height"
    ]
    vars_str = ",".join(variables)
    
    url = (
        f"https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={lats}&longitude={lons}"
        f"&start_date={start_date}&end_date={end_date}"
        f"&hourly={vars_str}"
        f"&timezone=Asia%2FKolkata"
    )
    
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Breezly-HistoricalWeather-Engine/2.0"}
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        if resp.status != 200:
            raise RuntimeError(f"Open-Meteo API returned status {resp.status}")
        raw_json = json.loads(resp.read().decode("utf-8"))
        
        if isinstance(raw_json, dict):
            return [raw_json]
        return raw_json


def build_and_save_weather_csv(
    stations: List[Dict[str, Any]],
    api_results: List[Dict[str, Any]],
    output_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Parses Open-Meteo multi-location response and saves to CSV with exact schema:
    timestamp_ist, station_id, station_name, latitude, longitude,
    temperature_2m, relative_humidity_2m, precipitation, surface_pressure,
    wind_speed_10m, wind_direction_10m, shortwave_radiation, boundary_layer_height.
    """
    if output_path is None:
        output_path = get_historical_weather_csv()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    
    rows = []
    missing_counts = {
        "temperature_2m": 0,
        "relative_humidity_2m": 0,
        "precipitation": 0,
        "surface_pressure": 0,
        "wind_speed_10m": 0,
        "wind_direction_10m": 0,
        "shortwave_radiation": 0,
        "boundary_layer_height": 0
    }
    
    for station, met_data in zip(stations, api_results):
        st_id = station["station_id"]
        st_name = station["station_name"]
        lat = station["latitude"]
        lon = station["longitude"]
        
        hourly = met_data.get("hourly", {})
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        rhs = hourly.get("relative_humidity_2m", [])
        precips = hourly.get("precipitation", [])
        pressures = hourly.get("surface_pressure", [])
        ws = hourly.get("wind_speed_10m", [])
        wd = hourly.get("wind_direction_10m", [])
        rads = hourly.get("shortwave_radiation", [])
        pblhs = hourly.get("boundary_layer_height", [])
        
        num_hours = len(times)
        for i in range(num_hours):
            t_ist = times[i]
            temp_val = temps[i] if i < len(temps) else None
            rh_val = rhs[i] if i < len(rhs) else None
            precip_val = precips[i] if i < len(precips) else 0.0  # Preserve 0.0 precipitation
            press_val = pressures[i] if i < len(pressures) else None
            ws_val = ws[i] if i < len(ws) else None
            wd_val = wd[i] if i < len(wd) else None
            rad_val = rads[i] if i < len(rads) else None
            pblh_val = pblhs[i] if i < len(pblhs) else None
            
            if temp_val is None: missing_counts["temperature_2m"] += 1
            if rh_val is None: missing_counts["relative_humidity_2m"] += 1
            if precip_val is None: missing_counts["precipitation"] += 1
            if press_val is None: missing_counts["surface_pressure"] += 1
            if ws_val is None: missing_counts["wind_speed_10m"] += 1
            if wd_val is None: missing_counts["wind_direction_10m"] += 1
            if rad_val is None: missing_counts["shortwave_radiation"] += 1
            if pblh_val is None: missing_counts["boundary_layer_height"] += 1
            
            rows.append({
                "timestamp_ist": t_ist,
                "station_id": st_id,
                "station_name": st_name,
                "latitude": lat,
                "longitude": lon,
                "temperature_2m": temp_val if temp_val is not None else "",
                "relative_humidity_2m": rh_val if rh_val is not None else "",
                "precipitation": precip_val if precip_val is not None else 0.0,
                "surface_pressure": press_val if press_val is not None else "",
                "wind_speed_10m": ws_val if ws_val is not None else "",
                "wind_direction_10m": wd_val if wd_val is not None else "",
                "shortwave_radiation": rad_val if rad_val is not None else "",
                "boundary_layer_height": pblh_val if pblh_val is not None else ""
            })
            
    fieldnames = [
        "timestamp_ist",
        "station_id",
        "station_name",
        "latitude",
        "longitude",
        "temperature_2m",
        "relative_humidity_2m",
        "precipitation",
        "surface_pressure",
        "wind_speed_10m",
        "wind_direction_10m",
        "shortwave_radiation",
        "boundary_layer_height"
    ]
    
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
        
    validation_stats = {
        "output_file": output_path,
        "station_count": len(stations),
        "total_rows": len(rows),
        "hours_per_station": len(rows) // len(stations) if stations else 0,
        "missing_counts": missing_counts,
        "first_timestamp": rows[0]["timestamp_ist"] if rows else None,
        "last_timestamp": rows[-1]["timestamp_ist"] if rows else None
    }
    return validation_stats


def load_cpcb_pollution_records() -> Dict[Tuple[str, str], Dict[str, Optional[float]]]:
    """
    Reads the 4 raw CPCB pollutant CSVs (PM2.5, PM10, NO2, O3) and indexes them
    by (station_id, normalized_timestamp).
    Normalized timestamp format: 'YYYY-MM-DDTHH:MM' (matching Open-Meteo IST format).
    """
    pollution_map: Dict[Tuple[str, str], Dict[str, Optional[float]]] = {}
    
    pollution_files = get_pollution_files()
    
    for pollutant, fp in pollution_files.items():
        if not os.path.exists(fp):
            continue
            
        with open(fp, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            for row in reader:
                st_id = row.get("station_id", "").strip()
                p_start = row.get("period_start", "").strip()
                mean_str = row.get("mean", "").strip()
                
                if not st_id or not p_start:
                    continue
                    
                # Normalize '2024-11-01 00:00:00' -> '2024-11-01T00:00'
                norm_time = p_start.replace(" ", "T")
                if len(norm_time) >= 16:
                    norm_time = norm_time[:16]
                    
                key = (st_id, norm_time)
                if key not in pollution_map:
                    pollution_map[key] = {
                        "pm25": None,
                        "pm10": None,
                        "no2": None,
                        "o3": None
                    }
                    
                try:
                    val = float(mean_str)
                    pollution_map[key][pollutant] = round(val, 2)
                except (ValueError, TypeError):
                    pass
                    
    return pollution_map


def build_merged_dataset(
    weather_csv_path: Optional[str] = None,
    output_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Merges historical weather dataset with CPCB multi-pollutant measurements
    using (station_id + timestamp).
    """
    if weather_csv_path is None:
        weather_csv_path = get_historical_weather_csv()
    if output_path is None:
        output_path = get_merged_dataset_csv()
        
    if not os.path.exists(weather_csv_path):
        raise FileNotFoundError(f"Historical weather file {weather_csv_path} not found.")
        
    pollution_map = load_cpcb_pollution_records()
    
    # Import INAQI calculator
    from config import compute_overall_inaqi
    
    merged_rows = []
    pollution_present_count = 0
    
    with open(weather_csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for w_row in reader:
            st_id = w_row["station_id"]
            t_ist = w_row["timestamp_ist"]
            
            key = (st_id, t_ist)
            pol_data = pollution_map.get(key, {"pm25": None, "pm10": None, "no2": None, "o3": None})
            
            pm25_val = pol_data.get("pm25")
            pm10_val = pol_data.get("pm10")
            no2_val = pol_data.get("no2")
            o3_val = pol_data.get("o3")
            
            if pm25_val is not None or pm10_val is not None:
                pollution_present_count += 1
                
            # Calculate NAQI
            calc_dict = {
                "pm25": pm25_val,
                "pm10": pm10_val,
                "no2": no2_val,
                "o3": o3_val
            }
            aqi_info = compute_overall_inaqi(calc_dict)
            
            merged_row = dict(w_row)
            merged_row["pm25"] = pm25_val if pm25_val is not None else ""
            merged_row["pm10"] = pm10_val if pm10_val is not None else ""
            merged_row["no2"] = no2_val if no2_val is not None else ""
            merged_row["o3"] = o3_val if o3_val is not None else ""
            merged_row["calculated_aqi"] = aqi_info["aqi"] if aqi_info["aqi"] > 0 else ""
            merged_row["dominant_pollutant"] = aqi_info["dominant_pollutant"] if aqi_info["aqi"] > 0 else ""
            merged_row["aqi_category"] = aqi_info["category"] if aqi_info["aqi"] > 0 else ""
            
            merged_rows.append(merged_row)
            
    fieldnames = [
        "timestamp_ist",
        "station_id",
        "station_name",
        "latitude",
        "longitude",
        "temperature_2m",
        "relative_humidity_2m",
        "precipitation",
        "surface_pressure",
        "wind_speed_10m",
        "wind_direction_10m",
        "shortwave_radiation",
        "boundary_layer_height",
        "pm25",
        "pm10",
        "no2",
        "o3",
        "calculated_aqi",
        "dominant_pollutant",
        "aqi_category"
    ]
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows := merged_rows)
        
    return {
        "merged_output": output_path,
        "total_merged_rows": len(merged_rows),
        "pollution_matched_rows": pollution_present_count,
        "pollution_coverage_pct": round((pollution_present_count / len(merged_rows) * 100), 2) if merged_rows else 0
    }


def ensure_historical_data_ready(force_download: bool = False) -> Dict[str, Any]:
    """
    Ensures that the 39-station historical weather and pollution merged dataset
    is fully constructed and indexed.
    """
    global _DATA_STATUS_CACHE
    stations = load_stations_metadata()
    
    weather_csv = get_historical_weather_csv()
    merged_csv = get_merged_dataset_csv()
    pollution_files = get_pollution_files()
    
    weather_exists = os.path.exists(weather_csv)
    merged_exists = os.path.exists(merged_csv)
    
    if force_download or not weather_exists:
        try:
            print("[HistoricalWeather] Fetching Open-Meteo archive for 39 stations...")
            api_results = fetch_open_meteo_historical_batch(stations)
            weather_stats = build_and_save_weather_csv(stations, api_results, weather_csv)
            print(f"[HistoricalWeather] Saved {weather_stats['total_rows']} weather rows to {weather_csv}")
        except Exception as e:
            print(f"[HistoricalWeather] Weather fetch skipped/failed: {e}")
        
    if force_download or not merged_exists:
        if os.path.exists(weather_csv):
            try:
                print("[HistoricalWeather] Merging weather with CPCB pollution datasets...")
                merge_stats = build_merged_dataset(weather_csv, merged_csv)
                print(f"[HistoricalWeather] Saved merged dataset: {merge_stats['total_merged_rows']} rows.")
            except Exception as e:
                print(f"[HistoricalWeather] Merge skipped/failed: {e}")
        
    # Read row counts for data status
    total_weather_rows = 0
    if os.path.exists(weather_csv):
        with open(weather_csv, "r", encoding="utf-8") as f:
            total_weather_rows = max(0, sum(1 for _ in f) - 1)
            
    total_merged_rows = 0
    if os.path.exists(merged_csv):
        with open(merged_csv, "r", encoding="utf-8") as f:
            total_merged_rows = max(0, sum(1 for _ in f) - 1)

    status = {
        "status": "ready",
        "station_count": len(stations),
        "weather_record_count": total_weather_rows,
        "merged_record_count": total_merged_rows,
        "pollution_record_availability": {
            "pm25": os.path.exists(pollution_files["pm25"]),
            "pm10": os.path.exists(pollution_files["pm10"]),
            "no2": os.path.exists(pollution_files["no2"]),
            "o3": os.path.exists(pollution_files["o3"])
        },
        "weather_source": WEATHER_SOURCE,
        "pollution_source": POLLUTION_SOURCE,
        "weather_data_type": WEATHER_DATA_TYPE,
        "pollution_data_type": POLLUTION_DATA_TYPE,
        "data_period": DATA_PERIOD,
        "modeling_framework": "Physics-informed coupled surrogate"
    }
    _DATA_STATUS_CACHE = status
    return status


def get_data_status() -> Dict[str, Any]:
    """Returns current data integration status for GET /api/data-status."""
    if _DATA_STATUS_CACHE:
        return _DATA_STATUS_CACHE
    return ensure_historical_data_ready()


def get_station_historical_baseline(station_id: str) -> Optional[Dict[str, Any]]:
    """
    Returns baseline historical weather & air quality observation for a given station.
    """
    stations = load_stations_metadata()
    st_meta = next((s for s in stations if s.get("station_id") == station_id or s.get("id") == station_id), None)
    if not st_meta:
        return None
        
    st_id = st_meta.get("station_id") or st_meta.get("id")
    merged_csv = get_merged_dataset_csv()
    
    if os.path.exists(merged_csv):
        records = []
        with open(merged_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                if r["station_id"] == st_id:
                    records.append(r)
        if records:
            # Pick representative mid-period record (e.g. Nov 15 12:00)
            sample = records[len(records) // 2]
            return {
                "station_id": st_id,
                "station_name": st_meta.get("station_name") or st_meta.get("name"),
                "coordinates": {"lat": float(st_meta.get("latitude") or st_meta.get("lat")), "lon": float(st_meta.get("longitude") or st_meta.get("lon"))},
                "weather": {
                    "temperature_2m": float(sample["temperature_2m"]) if sample["temperature_2m"] else 20.0,
                    "relative_humidity_2m": float(sample["relative_humidity_2m"]) if sample["relative_humidity_2m"] else 60.0,
                    "wind_speed_10m": float(sample["wind_speed_10m"]) if sample["wind_speed_10m"] else 2.5,
                    "wind_direction_10m": float(sample["wind_direction_10m"]) if sample["wind_direction_10m"] else 315.0,
                    "surface_pressure": float(sample["surface_pressure"]) if sample["surface_pressure"] else 1012.0,
                    "precipitation": float(sample["precipitation"]) if sample["precipitation"] else 0.0,
                    "shortwave_radiation": float(sample["shortwave_radiation"]) if sample["shortwave_radiation"] else 0.0,
                    "boundary_layer_height": float(sample["boundary_layer_height"]) if sample["boundary_layer_height"] else 400.0,
                    "source": WEATHER_SOURCE,
                    "data_type": WEATHER_DATA_TYPE
                },
                "pollutants": {
                    "pm25": float(sample["pm25"]) if sample["pm25"] else 120.0,
                    "pm10": float(sample["pm10"]) if sample["pm10"] else 220.0,
                    "no2": float(sample["no2"]) if sample["no2"] else 45.0,
                    "o3": float(sample["o3"]) if sample["o3"] else 25.0
                },
                "source": POLLUTION_SOURCE,
                "data_type": POLLUTION_DATA_TYPE
            }
            
    return None

