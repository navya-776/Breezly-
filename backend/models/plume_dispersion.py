"""
Regional Biomass-Burning Plume Transport & Dispersion Risk Model.
Calculates upstream-to-Delhi transport alignment, arrival delay, and dispersion decay
to generate a prototype Regional Plume Impact Index (0-100).

Label: PROTOTYPE/DERIVED (Kinematic Plume Risk Model)
"""

import math
from typing import List, Dict, Any
from config import FEEDBACK_PARAMS, DELHI_NCR_BBOX

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two GPS coordinates in kilometers."""
    r = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return 2.0 * r * math.asin(math.sqrt(max(0.0, min(1.0, a))))

def compute_bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes initial compass bearing from (lat1, lon1) towards (lat2, lon2) in degrees."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dlambda = math.radians(lon2 - lon1)
    y = math.sin(dlambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlambda)
    bearing = math.degrees(math.atan2(y, x))
    return (bearing + 360.0) % 360.0

def calculate_plume_risk_series(
    hotspots: List[Dict[str, Any]],
    wind_speeds: List[float],
    wind_dirs: List[float],
    receptor_lat: float = DELHI_NCR_BBOX["center_lat"],
    receptor_lon: float = DELHI_NCR_BBOX["center_lon"],
    hours: int = 72
) -> List[Dict[str, Any]]:
    """
    Simulates hourly transport of upstream active fire plumes towards the Delhi NCR receptor.
    
    For each fire hotspot:
    1. Computes source-to-receptor trajectory vector and distance.
    2. Compares wind direction (towards which wind blows = (wind_dir + 180) % 360) against receptor bearing.
    3. Evaluates angular Gaussian dispersion spread: exp(-theta^2 / (2 * sigma^2)).
    4. Computes arrival time window based on transport speed.
    5. Weights by Fire Radiative Power (FRP).
    """
    sigma_rad = FEEDBACK_PARAMS["plume_dispersion_sigma_angle"]
    results = []

    # Pre-calculate fire geometries relative to receptor
    fire_geom = []
    for f in hotspots:
        dist_km = haversine_distance_km(f["lat"], f["lon"], receptor_lat, receptor_lon)
        # Bearing from fire to receptor
        bearing_to_delhi = compute_bearing_deg(f["lat"], f["lon"], receptor_lat, receptor_lon)
        fire_geom.append({
            "fire": f,
            "dist_km": dist_km,
            "bearing_deg": bearing_to_delhi,
            "frp": f.get("frp", 50.0)
        })

    # Rolling plume buffer to account for multi-hour transport delay
    plume_memory_flux = 0.0

    for h in range(hours):
        ws = wind_speeds[h] if h < len(wind_speeds) else 2.5
        wd = wind_dirs[h] if h < len(wind_dirs) else 310.0

        # Meteorological wind is direction blowing FROM.
        # Wind blowing TO is (wd + 180) % 360
        wind_towards_deg = (wd + 180.0) % 360.0

        instant_step_flux = 0.0
        active_transport_count = 0

        for fg in fire_geom:
            frp = fg["frp"]
            dist_km = fg["dist_km"]
            bearing = fg["bearing_deg"]

            # Angular deviation between wind direction and Delhi bearing
            angle_diff_deg = abs(wind_towards_deg - bearing)
            if angle_diff_deg > 180.0:
                angle_diff_deg = 360.0 - angle_diff_deg

            angle_diff_rad = math.radians(angle_diff_deg)

            # Plume dispersion envelope (Gaussian angular decay)
            angular_factor = math.exp(- (angle_diff_rad ** 2) / (2.0 * sigma_rad ** 2))

            # Transport velocity (km/h)
            v_kmh = max(3.0, ws * 3.6)
            travel_time_hours = dist_km / v_kmh

            # Temporal arrival weighting (bell curve centered around travel time)
            # Upstream burning is sustained, but peak arrivals correspond to transit time
            time_attenuation = 1.0 / (1.0 + 0.03 * travel_time_hours)
            
            # Distance decay
            dist_decay = 1.0 / math.sqrt(dist_km / 100.0)

            # Contribution to instant flux
            fire_flux = (frp / 100.0) * angular_factor * time_attenuation * dist_decay
            instant_step_flux += fire_flux

            if angular_factor > 0.4:
                active_transport_count += 1

        # Smooth advection memory (plumes linger and accumulate in the regional airshed)
        plume_memory_flux = 0.75 * plume_memory_flux + 0.25 * instant_step_flux

        # Normalize to Plume Impact Index (0 to 100)
        # 100 represents severe regional biomass plume intrusion
        plume_index = min(100.0, max(0.0, plume_memory_flux * 28.0))
        plume_index = round(plume_index, 1)

        # Categorize
        if plume_index < 20.0:
            category = "LOW"
            color = "#10b981"
            desc = "Minimal upstream biomass plume influence on Delhi airshed"
        elif plume_index < 45.0:
            category = "MODERATE"
            color = "#eab308"
            desc = "Moderate regional plume advection under prevailing winds"
        elif plume_index < 75.0:
            category = "HIGH"
            color = "#f97316"
            desc = "Significant stubble burning plume influx transported from Punjab/Haryana"
        else:
            category = "CRITICAL"
            color = "#ef4444"
            desc = "Severe regional smoke plume corridor aligned directly with Delhi NCR"

        results.append({
            "hour_offset": h,
            "plume_impact_index": plume_index,
            "risk_category": category,
            "category_color": color,
            "description": desc,
            "active_aligned_fires": active_transport_count,
            "wind_towards_deg": round(wind_towards_deg, 1)
        })

    return results
