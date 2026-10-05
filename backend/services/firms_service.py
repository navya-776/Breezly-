"""
FIRMS Service Module.
Re-exports methods from fire_service for backward compatibility.
"""

from services.fire_service import (
    fetch_active_fires,
    CALIBRATED_FIRE_HOTSPOTS
)

__all__ = ["fetch_active_fires", "CALIBRATED_FIRE_HOTSPOTS"]
