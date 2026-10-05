"""
Delhi NCR Monitoring Station Management Service.
Provides geographical coordinates, baseline emissions, and station profiles.
"""

from typing import List, Dict, Any, Optional
from config import STATIONS

def get_all_stations() -> List[Dict[str, Any]]:
    """Returns the full list of Delhi NCR monitoring stations."""
    return STATIONS

def get_station_by_id(station_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single station profile by its ID (supporting site_XXX and legacy aliases)."""
    if not station_id:
        return None
    for s in STATIONS:
        if s.get("id") == station_id or s.get("station_id") == station_id:
            return s
            
    # Legacy alias mapping
    alias_map = {
        "DEL_ANAND_VIHAR": "site_301",
        "DEL_PUNJABI_BAGH": "site_125",
        "DEL_DWARKA_SEC8": "site_1422",
        "DEL_IGI_AIRPORT": "site_106",
        "DEL_RK_PURAM": "site_124",
        "DEL_LODHI_ROAD": "site_109",
        "NOIDA_SEC62": "site_114",
        "GURUGRAM_VIKAS_SADAN": "site_115",
        "GHAZIABAD_VASUNDHARA": "site_301",
        "FARIDABAD_SEC16A": "site_1428"
    }
    target_id = alias_map.get(station_id)
    if target_id:
        for s in STATIONS:
            if s.get("id") == target_id or s.get("station_id") == target_id:
                return s
    return None

