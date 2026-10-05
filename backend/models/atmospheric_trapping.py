"""
Atmospheric Ventilation & Trapping Proxy Model.
Calculates the horizontal and vertical atmospheric dispersion capability (Ventilation Index)
and computes a normalized Atmospheric Trapping Proxy.

Label: PROTOTYPE/DERIVED (Ventilation & Atmospheric Trapping Proxy)
"""

import math
from typing import Dict, Any

def compute_trapping_metrics(
    pbl_height: float,
    wind_speed: float,
    solar_radiation: float = 0.0,
    temp_2m: float = 20.0
) -> Dict[str, Any]:
    """
    Computes ventilation capacity and atmospheric trapping potential.
    
    Ventilation Index (VI) = PBL Height (m) * Wind Speed (m/s) [Units: m^2/s]
    - VI > 6000: Excellent dispersion (Clean)
    - 4000 - 6000: Favorable dispersion
    - 2000 - 4000: Moderate / Stagnant transition
    - 1000 - 2000: High Trapping Risk
    - < 1000: Critical Trapping / Severe Smog Trap

    Trapping Score (0 to 100):
    Normalized non-linear index reflecting the inability of the atmosphere to disperse surface pollutants.
    """
    pbl_safe = max(50.0, float(pbl_height))
    ws_safe = max(0.2, float(wind_speed))

    # Ventilation Index (m^2/s)
    vi = round(pbl_safe * ws_safe, 1)

    # Sigmoidal mapping for trapping risk score
    # Critical inflection point at VI ~ 2000 m^2/s
    # Higher score = worse dispersion / stronger trapping
    k = 0.0018
    raw_trapping = 100.0 / (1.0 + math.exp(k * (vi - 1800.0)))

    # Additional nocturnal stability penalty if solar radiation is 0 (nighttime radiation cooling)
    if solar_radiation < 10.0:
        nocturnal_boost = 15.0 * (1.0 - min(1.0, pbl_safe / 400.0))
        trapping_score = min(100.0, raw_trapping + nocturnal_boost)
    else:
        trapping_score = max(0.0, raw_trapping)

    trapping_score = round(trapping_score, 1)

    # Categorization
    if vi >= 4000.0:
        category = "Favorable Dispersion"
        risk_level = "LOW"
        color = "#10b981"
    elif vi >= 2000.0:
        category = "Moderate Dispersion"
        risk_level = "MODERATE"
        color = "#eab308"
    elif vi >= 1000.0:
        category = "High Trapping"
        risk_level = "HIGH"
        color = "#f97316"
    else:
        category = "Critical Trapping"
        risk_level = "CRITICAL"
        color = "#ef4444"

    return {
        "ventilation_index_m2s": vi,
        "trapping_score": trapping_score,
        "trapping_category": category,
        "trapping_risk_level": risk_level,
        "category_color": color,
        "pbl_height_m": round(pbl_safe, 1),
        "wind_speed_ms": round(ws_safe, 2),
        "is_nocturnal_stable": solar_radiation < 10.0 and pbl_safe < 350.0
    }
