"""
Configuration and constants for the Coupled 72-Hour Delhi NCR AQI Forecasting System.
Includes geospatial bounds, station metadata, INAQI standard breakpoints, and physical calibration constants.
"""

from typing import Dict, List, Any

# Bounding boxes
DELHI_NCR_BBOX = {
    "min_lat": 28.20,
    "max_lat": 28.95,
    "min_lon": 76.80,
    "max_lon": 77.55,
    "center_lat": 28.6139,
    "center_lon": 77.2090
}

PUNJAB_HARYANA_FIRE_BBOX = {
    "min_lat": 29.50,
    "max_lat": 32.50,
    "min_lon": 74.00,
    "max_lon": 77.00
}

# Load all 39 CPCB Monitoring Stations across Delhi from canonical metadata
import os
import json

_METADATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "metadata", "cpcb_delhi_stations.json"))

def _init_stations() -> List[Dict[str, Any]]:
    stations_list = []
    if os.path.exists(_METADATA_PATH):
        try:
            with open(_METADATA_PATH, "r", encoding="utf-8") as f:
                raw_data = json.load(f).get("data", [])
                for s in raw_data:
                    st_id = s.get("station_id")
                    st_name = s.get("station_name")
                    lat = float(s.get("latitude"))
                    lon = float(s.get("longitude"))
                    
                    # Local traffic factor based on urban location
                    traffic_factor = 1.40 if "Anand Vihar" in st_name or "Wazirpur" in st_name or "Jahangirpuri" in st_name else (
                        0.85 if "Lodhi Road" in st_name or "Aya Nagar" in st_name else 1.15
                    )
                    
                    stations_list.append({
                        "id": st_id,
                        "station_id": st_id,
                        "name": st_name,
                        "station_name": st_name,
                        "type": "CPCB CAAQM Continuous Station",
                        "lat": lat,
                        "latitude": lat,
                        "lon": lon,
                        "longitude": lon,
                        "local_traffic_factor": traffic_factor,
                        "source": "cpcb_caaqm"
                    })
                return stations_list
        except Exception:
            pass
    return [
        {"id": "site_301", "station_id": "site_301", "name": "Anand Vihar, Delhi - DPCC", "station_name": "Anand Vihar, Delhi - DPCC", "lat": 28.6476, "latitude": 28.6476, "lon": 77.3158, "longitude": 77.3158, "type": "Traffic & Commercial Hub", "local_traffic_factor": 1.45, "source": "cpcb_caaqm"},
        {"id": "site_125", "station_id": "site_125", "name": "Punjabi Bagh, Delhi - DPCC", "station_name": "Punjabi Bagh, Delhi - DPCC", "lat": 28.6740, "latitude": 28.6740, "lon": 77.1310, "longitude": 77.1310, "type": "Residential / Arterial", "local_traffic_factor": 1.25, "source": "cpcb_caaqm"}
    ]

STATIONS: List[Dict[str, Any]] = _init_stations()


# Physical Calibration Parameters (Derived from atmospheric boundary layer & smog box models in the Indo-Gangetic Plain)
FEEDBACK_PARAMS = {
    # Max fractional reduction of PBL height under severe aerosol loading (dimensionless fraction)
    "max_pbl_suppression": 0.35,
    # PM2.5 reference scale (ug/m3) where optical extinction strongly manifests
    "pm25_extinction_scale": 300.0,
    # Shortwave radiation extinction coefficient (AOD proxy exponent: [ug/m3]^-1)
    "radiation_extinction_coeff": 0.0012,
    # Critical Ventilation Index threshold (m2/s) below which dispersion is severely restricted
    "critical_ventilation_index": 1600.0,
    # Upstream stubble plume dispersion spread angle (radians)
    "plume_dispersion_sigma_angle": 0.45,
    # Typical transport distance from core burning belt to Delhi (km)
    "mean_transport_distance_km": 240.0,
    # Urban surface area emission rate base (mg / [m2 * h])
    "base_urban_emission_mg_m2_h": 1.40,
    # Regional stubble plume hourly influx scaling factor ((ug/m3)/h per index point)
    "plume_influx_scaling": 0.22,
    # Regional clean background boundary concentration (ug/m3)
    "clean_background_pm25": 25.0,
    # Effective urban airshed length scale (meters) for advection residence time
    "airshed_length_scale_m": 42000.0
}

# Indian National AQI Breakpoints (CPCB Standard: NAQI)
INAQI_BREAKPOINTS = {
    "pm25": [
        (0.0, 30.0, 0, 50, "Good", "#10b981"),
        (30.1, 60.0, 51, 100, "Satisfactory", "#84cc16"),
        (60.1, 90.0, 101, 200, "Moderate", "#eab308"),
        (90.1, 120.0, 201, 300, "Poor", "#f97316"),
        (120.1, 250.0, 301, 400, "Very Poor", "#ef4444"),
        (250.1, 1000.0, 401, 500, "Severe", "#7f1d1d")
    ],
    "pm10": [
        (0.0, 50.0, 0, 50, "Good", "#10b981"),
        (50.1, 100.0, 51, 100, "Satisfactory", "#84cc16"),
        (100.1, 250.0, 101, 200, "Moderate", "#eab308"),
        (250.1, 350.0, 201, 300, "Poor", "#f97316"),
        (350.1, 430.0, 301, 400, "Very Poor", "#ef4444"),
        (430.1, 1200.0, 401, 500, "Severe", "#7f1d1d")
    ],
    "o3": [
        (0.0, 50.0, 0, 50, "Good", "#10b981"),
        (50.1, 100.0, 51, 100, "Satisfactory", "#84cc16"),
        (100.1, 168.0, 101, 200, "Moderate", "#eab308"),
        (168.1, 208.0, 201, 300, "Poor", "#f97316"),
        (208.1, 748.0, 301, 400, "Very Poor", "#ef4444"),
        (748.1, 1200.0, 401, 500, "Severe", "#7f1d1d")
    ],
    "no2": [
        (0.0, 40.0, 0, 50, "Good", "#10b981"),
        (40.1, 80.0, 51, 100, "Satisfactory", "#84cc16"),
        (80.1, 180.0, 101, 200, "Moderate", "#eab308"),
        (180.1, 280.0, 201, 300, "Poor", "#f97316"),
        (280.1, 400.0, 301, 400, "Very Poor", "#ef4444"),
        (400.1, 1000.0, 401, 500, "Severe", "#7f1d1d")
    ],
    "so2": [
        (0.0, 40.0, 0, 50, "Good", "#10b981"),
        (40.1, 80.0, 51, 100, "Satisfactory", "#84cc16"),
        (80.1, 380.0, 101, 200, "Moderate", "#eab308"),
        (380.1, 800.0, 201, 300, "Poor", "#f97316"),
        (800.1, 1600.0, 301, 400, "Very Poor", "#ef4444"),
        (1600.1, 2500.0, 401, 500, "Severe", "#7f1d1d")
    ],
    "co": [
        (0.0, 1000.0, 0, 50, "Good", "#10b981"),       # 1.0 mg/m3 = 1000 ug/m3
        (1001.0, 2000.0, 51, 100, "Satisfactory", "#84cc16"),
        (2001.0, 10000.0, 101, 200, "Moderate", "#eab308"),
        (10001.0, 17000.0, 201, 300, "Poor", "#f97316"),
        (17001.0, 34000.0, 301, 400, "Very Poor", "#ef4444"),
        (34001.0, 60000.0, 401, 500, "Severe", "#7f1d1d")
    ]
}

def compute_sub_aqi(concentration: float, pollutant: str = "pm25") -> int:
    """Calculates CPCB sub-index for a given pollutant concentration."""
    if concentration is None or concentration < 0:
        return 0
    pollutant_key = pollutant.lower().replace(".", "").replace("_", "")
    breakpoints = INAQI_BREAKPOINTS.get(pollutant_key, INAQI_BREAKPOINTS["pm25"])
    for (c_low, c_high, i_low, i_high, _, _) in breakpoints:
        if c_low <= concentration <= c_high:
            # Linear interpolation formula: Ip = [ (Ihi - Ilow)/(BPhi - BPlow) ] * (Cp - BPlow) + Ilow
            return int(round(((i_high - i_low) / (c_high - c_low)) * (concentration - c_low) + i_low))
    # Exceeds max range -> 500
    return 500

def compute_overall_inaqi(pollutants: Dict[str, float]) -> Dict[str, Any]:
    """
    Computes overall CPCB AQI, sub-indices, and identifies the dominant pollutant.
    Follows Indian National Air Quality Index (NAQI) max operator principle.
    """
    sub_indices: Dict[str, int] = {}
    for key, val in pollutants.items():
        if val is not None and isinstance(val, (int, float)):
            sub_indices[key] = compute_sub_aqi(float(val), key)
    
    if not sub_indices:
        return {
            "aqi": 0,
            "category": "Unknown",
            "color": "#64748b",
            "dominant_pollutant": "None",
            "sub_indices": {}
        }
    
    # Dominant pollutant is the one giving the maximum sub-index
    dominant_key = max(sub_indices, key=sub_indices.get)
    max_aqi = sub_indices[dominant_key]
    category_info = get_aqi_category(max_aqi)

    name_map = {
        "pm25": "PM2.5",
        "pm10": "PM10",
        "o3": "O3",
        "no2": "NO2",
        "so2": "SO2",
        "co": "CO"
    }

    return {
        "aqi": max_aqi,
        "category": category_info["category"],
        "color": category_info["color"],
        "badge": category_info.get("badge", ""),
        "dominant_pollutant": name_map.get(dominant_key.lower().replace(".", "").replace("_", ""), dominant_key.upper()),
        "sub_indices": sub_indices
    }

def get_aqi_category(aqi_val: int) -> Dict[str, str]:
    """Returns category name and color for overall AQI."""
    if aqi_val <= 50:
        return {"category": "Good", "color": "#10b981", "badge": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"}
    elif aqi_val <= 100:
        return {"category": "Satisfactory", "color": "#84cc16", "badge": "bg-lime-500/20 text-lime-300 border-lime-500/30"}
    elif aqi_val <= 200:
        return {"category": "Moderate", "color": "#eab308", "badge": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"}
    elif aqi_val <= 300:
        return {"category": "Poor", "color": "#f97316", "badge": "bg-orange-500/20 text-orange-300 border-orange-500/30"}
    elif aqi_val <= 400:
        return {"category": "Very Poor", "color": "#ef4444", "badge": "bg-red-500/20 text-red-300 border-red-500/30"}
    else:
        return {"category": "Severe", "color": "#7f1d1d", "badge": "bg-rose-950/40 text-rose-300 border-rose-700/50"}

