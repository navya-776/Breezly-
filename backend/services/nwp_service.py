"""
NWP Service Module.
Re-exports methods from weather_service for backward compatibility.
"""

from services.weather_service import (
    fetch_nwp_forecast,
    generate_synthetic_nwp_series,
    clear_weather_cache
)

__all__ = ["fetch_nwp_forecast", "generate_synthetic_nwp_series", "clear_weather_cache"]
