"""
Empirical Physics-Informed Photochemical Ground-Level Ozone (O3) Surrogate Model.
Estimates ground-level O3 dynamics as a function of solar radiation, 2m temperature,
NOx precursor availability, previous O3 concentration, and boundary layer dilution.

Label: PROTOTYPE/DERIVED (Empirical Photochemical O3 Surrogate)
(Explicitly non-mechanistic: No claim of RACM/CB05 chemical kinetic ODE solving)
"""

import math
from typing import Dict, Any

def predict_step_ozone(
    prev_o3: float,
    solar_rad: float,
    temp_2m: float,
    pbl_height: float,
    nox_proxy: float = 50.0,
    wind_speed: float = 2.5
) -> Dict[str, Any]:
    """
    Stepwise empirical photochemical estimation of O3 concentration (ug/m3).
    
    Mechanisms represented:
    1. Daytime Photolysis: NO2 + hnu -> NO + O; O + O2 -> O3 (driven by solar radiation & temp).
    2. Nocturnal Titration: NO + O3 -> NO2 + O2 (O3 drops sharply at night in high-NOx urban environments).
    3. Boundary Layer Dilution: Expanding daytime PBL entrains cleaner free-tropospheric air.
    4. Persistent Memory: Auto-regressive retention of previous hour concentration.
    """
    pbl_safe = max(50.0, float(pbl_height))
    rad_safe = max(0.0, float(solar_rad))
    temp_safe = float(temp_2m)

    # 1. Photochemical Generation Potential
    # Active primarily when solar radiation > 20 W/m2 and temp > 15 C
    if rad_safe > 20.0:
        # Thermal activation factor (kinetics accelerate at higher temps)
        temp_factor = max(0.5, 1.0 + 0.04 * (temp_safe - 22.0))
        # Radiation driving term (normalized to peak ~800 W/m2)
        rad_term = (rad_safe / 600.0) ** 0.85
        # NOx precursor catalytic efficiency (optimal at moderate NOx, saturated/inhibited at very high NOx)
        nox_factor = (nox_proxy / 40.0) / (1.0 + (nox_proxy / 80.0) ** 2)
        
        photo_formation = 28.0 * rad_term * temp_factor * nox_factor
    else:
        photo_formation = 0.0

    # 2. Nocturnal / Chemical Titration Loss
    if rad_safe < 20.0:
        # Strong titration in high NOx urban regime at night
        titration_loss = (nox_proxy / 35.0) * (12.0 / (1.0 + 0.005 * pbl_safe))
    else:
        titration_loss = 2.0  # minimal daytime surface deposition

    # 3. Dynamic persistence update
    # Autoregressive component (O3 lifetime is hours)
    alpha = 0.72
    new_o3 = alpha * prev_o3 + (1.0 - alpha) * (18.0 + photo_formation) - titration_loss

    # Boundary layer dilution adjustment
    dilution_factor = 1.0 - min(0.20, max(0.0, (pbl_safe - 500.0) / 4000.0))
    new_o3 = new_o3 * dilution_factor

    # Bound to physical limits (Delhi typically ranges 8 ug/m3 at night to 140+ ug/m3 in afternoon)
    final_o3 = max(6.0, min(220.0, new_o3))
    final_o3 = round(final_o3, 1)

    is_daytime_peak = rad_safe > 250.0 and final_o3 > 50.0

    return {
        "o3_conc_ugm3": final_o3,
        "photo_formation_rate": round(photo_formation, 2),
        "titration_loss_rate": round(titration_loss, 2),
        "is_photochemically_active": rad_safe > 20.0,
        "is_daytime_peak": is_daytime_peak
    }
