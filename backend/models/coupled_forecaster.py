"""
Stepwise 72-Hour Coupled Forecasting Engine with Two-Way Aerosol-Radiation-PBL Feedback.
Initializes from latest available real atmospheric observations and iteratively simulates
future hourly PM2.5, O3, and AQI across Delhi NCR stations.

Scientific Provenance:
- Initial Conditions: CPCB CAAQM Historical Observation / Open-Meteo Air Quality
- NWP/Historical Meteorology: Open-Meteo
- Forecasting Core: Physics-informed coupled surrogate (Two-Way Aerosol Feedback)
"""

import math
from typing import Dict, List, Any, Optional
import datetime
from config import FEEDBACK_PARAMS, compute_overall_inaqi, compute_sub_aqi, get_aqi_category
from models.atmospheric_trapping import compute_trapping_metrics
from models.ozone_surrogate import predict_step_ozone


def run_coupled_station_forecast(
    station: Dict[str, Any],
    initial_obs: Dict[str, Any],
    nwp_data: Dict[str, Any],
    plume_risk_series: List[Dict[str, Any]],
    hours: int = 72
) -> Dict[str, Any]:
    """
    Simulates a 72-hour coupled forecast for a single monitoring station initialized from
    the latest available real atmospheric observations.
    
    The workflow:
    LATEST AVAILABLE OBSERVATION (from initial_obs)
            ↓
    INITIAL CONDITION (Hour 0 = observed baseline)
            ↓
    COUPLED FORECAST (Hours 1..71 step-by-step physical feedback simulation)
            ↓
    72-HOUR FORECAST TIME SERIES
    """
    timestamps = nwp_data["timestamps"]
    temps = nwp_data["temperature_2m"]
    rhs = nwp_data["relative_humidity_2m"]
    wss = nwp_data["wind_speed_10m"]
    wds = nwp_data["wind_direction_10m"]
    rads = nwp_data["solar_radiation"]
    pbl_nwps = nwp_data["boundary_layer_height"]
    pressures = nwp_data.get("surface_pressure", [1012.0] * hours)

    # 1. Extract Initial Conditions from real observation
    pollutants = initial_obs.get("pollutants", {})
    init_pm25 = float(pollutants.get("pm25", 50.0))
    init_o3 = float(pollutants.get("o3", 30.0))
    init_no2 = float(pollutants.get("no2", 40.0))
    init_pm10 = float(pollutants.get("pm10", 100.0))
    traffic_weight = float(station.get("local_traffic_factor", 1.0))

    curr_pm25 = init_pm25
    curr_o3 = init_o3
    curr_nox = init_no2
    uncoupled_pm25 = init_pm25

    hourly_records = []
    feedback_diagnostics = []

    max_suppression = FEEDBACK_PARAMS["max_pbl_suppression"]
    pm_scale = FEEDBACK_PARAMS["pm25_extinction_scale"]
    rad_k = FEEDBACK_PARAMS["radiation_extinction_coeff"]

    for h in range(hours):
        t_stamp = timestamps[h] if h < len(timestamps) else f"H+{h}"
        t_val = temps[h] if h < len(temps) else 22.0
        rh_val = rhs[h] if h < len(rhs) else 60.0
        ws_val = wss[h] if h < len(wss) else 2.5
        wd_val = wds[h] if h < len(wds) else 310.0
        rad_val = rads[h] if h < len(rads) else 0.0
        pbl_raw = pbl_nwps[h] if h < len(pbl_nwps) else 400.0
        press_val = pressures[h] if h < len(pressures) else 1012.0

        plume_step = plume_risk_series[h] if h < len(plume_risk_series) else {"plume_impact_index": 20.0, "risk_category": "LOW"}
        plume_idx = plume_step["plume_impact_index"]

        # -------------------------------------------------------------
        # 1. Two-Way Aerosol Feedback Surrogate Calculation
        # -------------------------------------------------------------
        aerosol_loading_ratio = min(2.5, curr_pm25 / pm_scale)
        pbl_suppression_fraction = max_suppression * (aerosol_loading_ratio / (1.0 + aerosol_loading_ratio))
        
        pbl_coupled = pbl_raw * (1.0 - pbl_suppression_fraction)
        pbl_coupled = max(80.0, round(pbl_coupled, 1))

        # Attenuate solar radiation reaching surface due to aerosol optical depth proxy
        solar_rad_effective = rad_val * math.exp(-rad_k * curr_pm25)
        solar_rad_effective = max(0.0, round(solar_rad_effective, 1))

        # -------------------------------------------------------------
        # 2. Atmospheric Trapping & Ventilation Metrics
        # -------------------------------------------------------------
        trapping_coupled = compute_trapping_metrics(pbl_coupled, ws_val, solar_rad_effective, t_val)
        trapping_uncoupled = compute_trapping_metrics(pbl_raw, ws_val, rad_val, t_val)

        trapping_factor = trapping_coupled["trapping_score"] / 100.0
        ventilation_idx = trapping_coupled["ventilation_index_m2s"]

        # -------------------------------------------------------------
        # 3. Dynamic Local Emission & Urban Diurnal Curve
        # -------------------------------------------------------------
        local_hour = (h + 6) % 24  # Approximate local IST hour
        if 8 <= local_hour <= 11 or 18 <= local_hour <= 21:
            rush_hour_mult = 1.35
        elif 12 <= local_hour <= 17:
            rush_hour_mult = 1.05
        else:
            rush_hour_mult = 0.70

        base_emission_rate = FEEDBACK_PARAMS["base_urban_emission_mg_m2_h"]
        local_emission_flux = base_emission_rate * traffic_weight * rush_hour_mult

        # -------------------------------------------------------------
        # 4. Hourly State Evaluation
        # -------------------------------------------------------------
        if h == 0:
            # HOUR 0 represents the CURRENT INITIAL OBSERVATION
            step_pm25 = round(init_pm25, 1)
            step_o3 = round(init_o3, 1)
            step_data_type = "OBSERVATION / INITIAL CONDITION"
            step_provenance = initial_obs.get("provenance", "LIVE MODEL DATA")
            step_is_forecast = False
        else:
            # FUTURE HOURS (1..71) are generated by the Coupled Forward Model
            # A. Local Primary Emission Increment:
            H_eff = max(80.0, pbl_coupled)
            H_raw = max(80.0, pbl_raw)
            delta_local_coupled = (local_emission_flux * 1000.0 / H_eff) * (1.0 + 0.80 * trapping_factor)
            delta_local_uncoupled = (local_emission_flux * 1000.0 / H_raw) * (1.0 + 0.80 * (trapping_uncoupled["trapping_score"] / 100.0))

            # B. Regional Biomass Burning Plume Inflow:
            plume_scale = FEEDBACK_PARAMS["plume_influx_scaling"]
            delta_plume_coupled = (plume_idx * plume_scale) * (300.0 / H_eff) * (1.0 + 0.40 * trapping_factor)
            delta_plume_uncoupled = (plume_idx * plume_scale) * (300.0 / H_raw) * (1.0 + 0.40 * (trapping_uncoupled["trapping_score"] / 100.0))

            # C. Advective Ventilation Clearance Rate:
            airshed_L = FEEDBACK_PARAMS["airshed_length_scale_m"]
            k_advect_coupled = (ws_val * 3600.0) / airshed_L
            k_loss_coupled = min(0.40, max(0.05, k_advect_coupled + 0.02))
            k_loss_uncoupled = min(0.40, max(0.05, k_advect_coupled + 0.02))

            # D. Clean Background Concentration:
            c_bg = FEEDBACK_PARAMS["clean_background_pm25"]

            # E. Discrete Difference Step (Coupled):
            delta_pm = delta_local_coupled + delta_plume_coupled - k_loss_coupled * (curr_pm25 - c_bg)
            curr_pm25 = max(15.0, round(curr_pm25 + delta_pm, 1))

            # F. Parallel Uncoupled PM2.5:
            delta_uncoupled = delta_local_uncoupled + delta_plume_uncoupled - k_loss_uncoupled * (uncoupled_pm25 - c_bg)
            uncoupled_pm25 = max(15.0, round(uncoupled_pm25 + delta_uncoupled, 1))

            # G. Empirical Photochemical Ground-Level Ozone:
            o3_result = predict_step_ozone(
                prev_o3=curr_o3,
                solar_rad=solar_rad_effective,
                temp_2m=t_val,
                pbl_height=pbl_coupled,
                nox_proxy=curr_nox * rush_hour_mult,
                wind_speed=ws_val
            )
            curr_o3 = o3_result["o3_conc_ugm3"]

            step_pm25 = curr_pm25
            step_o3 = curr_o3
            step_data_type = "FORECAST"
            step_provenance = "Physics-informed coupled surrogate"
            step_is_forecast = True

        # Compute AQI for current step
        aqi_dict = compute_overall_inaqi({
            "pm25": step_pm25,
            "o3": step_o3
        })
        overall_aqi = aqi_dict["aqi"]
        aqi_category = aqi_dict["category"]
        aqi_color = aqi_dict["color"]
        dominant_pol = aqi_dict["dominant_pollutant"]

        # Qualitative source attribution categories derived directly from model terms
        if plume_idx >= 60.0:
            biomass_attr = "HIGH"
        elif plume_idx >= 30.0:
            biomass_attr = "MODERATE"
        else:
            biomass_attr = "LOW"

        if trapping_factor >= 0.70:
            trapping_attr = "CRITICAL"
        elif trapping_factor >= 0.40:
            trapping_attr = "HIGH"
        else:
            trapping_attr = "MODERATE"

        if rush_hour_mult >= 1.20 and traffic_weight >= 1.20:
            urban_attr = "HIGH"
        else:
            urban_attr = "MODERATE"

        feedback_pbl_drop_pct = round(((pbl_raw - pbl_coupled) / pbl_raw) * 100.0, 1)

        hourly_records.append({
            "hour_offset": h,
            "timestamp": t_stamp,
            "is_forecast": step_is_forecast,
            "data_type": step_data_type,
            "provenance": step_provenance,
            "pm25": step_pm25,
            "o3": step_o3,
            "aqi": overall_aqi,
            "aqi_category": aqi_category,
            "aqi_color": aqi_color,
            "dominant_pollutant": dominant_pol,
            "meteorology": {
                "temperature_2m": t_val,
                "relative_humidity_2m": rh_val,
                "wind_speed_10m": ws_val,
                "wind_direction_10m": wd_val,
                "solar_radiation_nwp": rad_val,
                "solar_radiation_effective": solar_rad_effective,
                "pbl_height_nwp": round(pbl_raw, 1),
                "pbl_height_coupled": pbl_coupled,
                "surface_pressure": press_val
            },
            "ventilation_trapping": {
                "ventilation_index": ventilation_idx,
                "trapping_score": trapping_coupled["trapping_score"],
                "trapping_category": trapping_coupled["trapping_category"],
                "trapping_risk_level": trapping_coupled["trapping_risk_level"],
                "is_nocturnal_stable": trapping_coupled["is_nocturnal_stable"]
            },
            "plume_risk": {
                "plume_impact_index": plume_idx,
                "risk_category": plume_step["risk_category"],
                "category_color": plume_step.get("category_color", "#eab308")
            },
            "coupled_feedback": {
                "pbl_suppression_pct": feedback_pbl_drop_pct,
                "pm25_uncoupled": uncoupled_pm25,
                "pm25_coupled": step_pm25,
                "feedback_amplification_ugm3": round(step_pm25 - uncoupled_pm25, 1)
            },
            "attribution_categories": {
                "biomass_plume_impact": biomass_attr,
                "atmospheric_trapping": trapping_attr,
                "local_urban_load": urban_attr
            }
        })

        feedback_diagnostics.append({
            "hour_offset": h,
            "pbl_nwp": round(pbl_raw, 1),
            "pbl_coupled": pbl_coupled,
            "pm25_uncoupled": uncoupled_pm25,
            "pm25_coupled": step_pm25,
            "feedback_delta_pm": round(step_pm25 - uncoupled_pm25, 1)
        })

    return {
        "station_id": station["id"],
        "station_name": station["name"],
        "station_type": station["type"],
        "coordinates": {"lat": station["lat"], "lon": station["lon"]},
        "current_observation": {
            "source": initial_obs.get("source", "Open-Meteo / Copernicus CAMS"),
            "data_type": initial_obs.get("data_type", "MODELLED AIR QUALITY"),
            "provenance": initial_obs.get("provenance", "LIVE MODEL DATA"),
            "retrieved_at": initial_obs.get("retrieved_at"),
            "observed_at": initial_obs.get("observed_at"),
            "current_aqi": initial_obs.get("current_aqi"),
            "aqi_category": initial_obs.get("aqi_category"),
            "aqi_color": initial_obs.get("aqi_color"),
            "dominant_pollutant": initial_obs.get("dominant_pollutant"),
            "pollutants": initial_obs.get("pollutants", {}),
            "weather": nwp_data.get("current", {})
        },
        "forecast_horizon_hours": hours,
        "hourly_forecast": hourly_records,
        "feedback_diagnostics": feedback_diagnostics
    }
