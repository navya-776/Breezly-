"""
End-to-end API test script for Breezly FastAPI backend.
Calls all endpoints via FastAPI TestClient to verify data integration,
provenance, live timestamps, and forecast progression.
"""

from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("RUNNING API ENDPOINT VERIFICATION TESTS")
    print("==================================================")

    # 1. Health Endpoint
    print("\n--- TEST 1: GET /api/health ---")
    resp = client.get("/api/health")
    assert resp.status_code == 200, f"Health check failed: {resp.status_code}"
    health_data = resp.json()
    print("Status:", health_data["status"])
    print("Server Time:", health_data["server_time_utc"])
    print("Services:", json.dumps(health_data["services"], indent=2))

    # 2. Stations Endpoint
    print("\n--- TEST 2: GET /api/stations ---")
    resp = client.get("/api/stations")
    assert resp.status_code == 200
    st_data = resp.json()
    print(f"Station Count: {st_data['count']}")
    print(f"Sample Station: {st_data['stations'][0]}")

    # 3. Current Observations Endpoint
    print("\n--- TEST 3: GET /api/observations/current ---")
    resp = client.get("/api/observations/current")
    assert resp.status_code == 200
    obs_data = resp.json()
    print("Provenance:", obs_data["provenance"])
    print("Retrieved At:", obs_data["retrieved_at"])
    print("Total Stations with Live Data:", obs_data["station_count"])
    st0_obs = obs_data["stations"][0]
    print(f"\nStation 0: {st0_obs['station_name']} ({st0_obs['station_id']})")
    print(f"  AQ Source:          {st0_obs['air_quality']['source']}")
    print(f"  AQ Provenance:      {st0_obs['air_quality']['provenance']}")
    print(f"  AQ Observed At:     {st0_obs['air_quality']['observed_at']}")
    print(f"  Live PM2.5:         {st0_obs['air_quality']['pollutants']['pm25']} ug/m3")
    print(f"  Live O3:            {st0_obs['air_quality']['pollutants']['o3']} ug/m3")
    print(f"  Live NO2:           {st0_obs['air_quality']['pollutants']['no2']} ug/m3")
    print(f"  Live PM10:          {st0_obs['air_quality']['pollutants']['pm10']} ug/m3")
    print(f"  Current NAQI:       {st0_obs['air_quality']['current_aqi']} ({st0_obs['air_quality']['aqi_category']})")
    print(f"  Dominant Pollutant: {st0_obs['air_quality']['dominant_pollutant']}")
    print(f"  Weather Source:     {st0_obs['weather']['source']}")
    print(f"  Weather Provenance: {st0_obs['weather']['provenance']}")
    print(f"  Weather Values:     Temp={st0_obs['weather']['current']['temperature_2m']} C, RH={st0_obs['weather']['current']['relative_humidity_2m']}%, Wind={st0_obs['weather']['current']['wind_speed_10m']} m/s @ {st0_obs['weather']['current']['wind_direction_10m']} deg")

    # 4. 72-Hour Forecast Endpoint
    print("\n--- TEST 4: GET /api/forecast/72h ---")
    resp = client.get("/api/forecast/72h?station_id=DEL_ANAND_VIHAR")
    assert resp.status_code == 200
    fc_data = resp.json()
    print("Forecast Provenance:", json.dumps(fc_data["provenance"], indent=2))
    print("Generated At:", fc_data["generated_at_utc"])
    print("Station Count:", fc_data["station_count"])
    
    st_fc = fc_data["stations"][0]
    print(f"Station: {st_fc['station_name']}")
    print(f"Current Observation: AQI={st_fc['current_observation']['current_aqi']}, Observed At={st_fc['current_observation']['observed_at']}")
    
    hourly = st_fc["hourly_forecast"]
    print(f"Total Forecast Hours: {len(hourly)}")
    
    h0 = hourly[0]
    h24 = hourly[24]
    h71 = hourly[71]

    print("\n[Hour 0 / NOW]:")
    print(f"  Timestamp:   {h0['timestamp']}")
    print(f"  Data Type:   {h0['data_type']}")
    print(f"  Provenance:  {h0['provenance']}")
    print(f"  PM2.5:       {h0['pm25']} ug/m3")
    print(f"  O3:          {h0['o3']} ug/m3")
    print(f"  AQI:         {h0['aqi']} ({h0['aqi_category']})")
    print(f"  Is Forecast: {h0['is_forecast']}")

    print("\n[Hour 24 / +24h]:")
    print(f"  Timestamp:   {h24['timestamp']}")
    print(f"  Data Type:   {h24['data_type']}")
    print(f"  Provenance:  {h24['provenance']}")
    print(f"  PM2.5:       {h24['pm25']} ug/m3")
    print(f"  O3:          {h24['o3']} ug/m3")
    print(f"  AQI:         {h24['aqi']} ({h24['aqi_category']})")
    print(f"  Is Forecast: {h24['is_forecast']}")

    print("\n[Hour 71 / +71h]:")
    print(f"  Timestamp:   {h71['timestamp']}")
    print(f"  Data Type:   {h71['data_type']}")
    print(f"  Provenance:  {h71['provenance']}")
    print(f"  PM2.5:       {h71['pm25']} ug/m3")
    print(f"  O3:          {h71['o3']} ug/m3")
    print(f"  AQI:         {h71['aqi']} ({h71['aqi_category']})")
    print(f"  Is Forecast: {h71['is_forecast']}")

    # Assert that NOW uses initial condition and +24h / +71h differ according to the coupled model
    assert h0["is_forecast"] is False
    assert h24["is_forecast"] is True
    assert h71["is_forecast"] is True
    assert h0["pm25"] != h24["pm25"]
    assert h24["pm25"] != h71["pm25"]

    # 5. Plume Risk Endpoint
    print("\n--- TEST 5: GET /api/plume-risk ---")
    resp = client.get("/api/plume-risk")
    assert resp.status_code == 200
    plume_data = resp.json()
    print("Plume Provenance:", json.dumps(plume_data["provenance"], indent=2))
    print("Active Fire Clusters:", plume_data["active_fire_count"])
    print("Total FRP:", plume_data["total_frp_mw"], "MW")

    # 6. Diagnostics Feedback Endpoint
    print("\n--- TEST 6: GET /api/diagnostics/feedback ---")
    resp = client.get("/api/diagnostics/feedback?station_id=DEL_ANAND_VIHAR")
    assert resp.status_code == 200
    diag_data = resp.json()
    print("Diagnostics Provenance:", diag_data["provenance"])
    print("Feedback steps count:", len(diag_data["diagnostics"]))

    # 7. Refresh Endpoint
    print("\n--- TEST 7: POST /api/refresh ---")
    resp = client.post("/api/refresh")
    assert resp.status_code == 200
    ref_data = resp.json()
    print("Refresh Response:", ref_data)

    # 8. Historical Data Status Endpoint
    print("\n--- TEST 8: GET /api/data-status ---")
    resp = client.get("/api/data-status")
    assert resp.status_code == 200
    status_data = resp.json()
    print("Data Status:", json.dumps(status_data, indent=2))
    assert status_data["station_count"] == 39
    assert status_data["weather_record_count"] == 28080
    assert status_data["weather_source"] == "Open-Meteo Historical Weather API"
    assert status_data["pollution_source"] == "CPCB CAAQM via XKDR India Air Quality Database"

    print("\n==================================================")
    print("ALL 8 API TEST SUITES COMPLETED WITH 100% SUCCESS")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
