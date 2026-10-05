import asyncio
from config import STATIONS, FEEDBACK_PARAMS
from services.weather_service import fetch_nwp_forecast, generate_synthetic_nwp_series
from services.air_quality_service import fetch_all_stations_air_quality
from services.fire_service import fetch_active_fires
from models.plume_dispersion import calculate_plume_risk_series
from models.coupled_forecaster import run_coupled_station_forecast

async def run_eval():
    nwp_data = await fetch_nwp_forecast(28.6139, 77.2090, hours=72)
    fires_data = await fetch_active_fires()
    aq_dict = await fetch_all_stations_air_quality()

    plume_series = calculate_plume_risk_series(
        hotspots=fires_data["hotspots"],
        wind_speeds=nwp_data["wind_speed_10m"],
        wind_dirs=nwp_data["wind_direction_10m"],
        hours=72
    )

    print(f"Total stations evaluated: {len(STATIONS)}")

    for st in STATIONS:
        initial_obs = aq_dict.get(st["id"], {})
        res = run_coupled_station_forecast(st, initial_obs, nwp_data, plume_series, hours=72)
        forecast = res["hourly_forecast"]
        pm25s = [h["pm25"] for h in forecast]
        o3s = [h["o3"] for h in forecast]
        aqis = [h["aqi"] for h in forecast]
        plumes = [h["plume_risk"]["plume_impact_index"] for h in forecast]
        trappings = [h["ventilation_trapping"]["trapping_score"] for h in forecast]
        pbls = [h["meteorology"]["pbl_height_coupled"] for h in forecast]
        
        print("---------------------------------------------")
        print(f"Station: {st['name']} ({st['id']})")
        print(f"1. Initial PM2.5 (Observed): {pm25s[0]}")
        print(f"2. Min Forecast PM2.5: {min(pm25s)}")
        print(f"3. Max Forecast PM2.5: {max(pm25s)}")
        print(f"4. Final PM2.5 (h=71): {pm25s[-1]}")
        print(f"5. Initial O3 (Observed): {o3s[0]}")
        print(f"6. Min Forecast O3: {min(o3s)}")
        print(f"7. Max Forecast O3: {max(o3s)}")
        print(f"8. Final O3 (h=71): {o3s[-1]}")
        print(f"9. Initial AQI: {aqis[0]}")
        print(f"10. Max AQI: {max(aqis)}")
        print(f"11. Final AQI: {aqis[-1]}")
        print(f"12. Max Plume Impact Index: {max(plumes)}")
        print(f"13. Max Trapping Score: {max(trappings)}")
        print(f"14. Min PBLH_coupled: {min(pbls)}, Max PBLH_coupled: {max(pbls)}")

if __name__ == "__main__":
    asyncio.run(run_eval())
