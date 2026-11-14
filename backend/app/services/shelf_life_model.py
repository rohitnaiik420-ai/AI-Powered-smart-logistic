import math
from typing import Dict, Any, Tuple

"""
Arrhenius Shelf-Life Kinetic Model for Cold-Chain Perishable Logistics
Mathematical Foundation:
k = k_ref * exp( - (Ea / R) * (1/T - 1/T_ref) )
Where:
- k: Quality degradation rate at current temperature T (Kelvin)
- k_ref: Baseline degradation rate at reference ideal temperature T_ref (e.g. 4°C / 277.15 K)
- Ea: Apparent Activation Energy (J/mol) for biochemical spoilage
- R: Universal Gas Constant = 8.314 J/(mol·K)
- T: Absolute temperature in Kelvin
"""

R_GAS_CONSTANT = 8.314 # J / (mol * K)

# Empirical food kinetic parameters (Ea in J/mol, base shelf life at reference ideal temp in hours)
FOOD_PARAMETERS = {
    "Dairy Products": {
        "Ea": 65000.0,
        "T_ref_celsius": 4.0,
        "ideal_min_c": 1.0,
        "ideal_max_c": 5.0,
        "nominal_shelf_life_h": 168.0, # 7 days
    },
    "Fresh Seafood": {
        "Ea": 85000.0,
        "T_ref_celsius": 1.0,
        "ideal_min_c": 0.0,
        "ideal_max_c": 3.0,
        "nominal_shelf_life_h": 96.0, # 4 days
    },
    "Chilled Meat": {
        "Ea": 72000.0,
        "T_ref_celsius": 2.0,
        "ideal_min_c": 0.0,
        "ideal_max_c": 4.0,
        "nominal_shelf_life_h": 144.0, # 6 days
    },
    "Fresh Fruits & Vegetables": {
        "Ea": 52000.0,
        "T_ref_celsius": 6.0,
        "ideal_min_c": 4.0,
        "ideal_max_c": 8.0,
        "nominal_shelf_life_h": 240.0, # 10 days
    },
    "Vaccines & Pharmaceuticals": {
        "Ea": 95000.0,
        "T_ref_celsius": 4.0,
        "ideal_min_c": 2.0,
        "ideal_max_c": 8.0,
        "nominal_shelf_life_h": 720.0, # 30 days
    },
    "General Cargo / Standard": {
        "Ea": 30000.0,
        "T_ref_celsius": 20.0,
        "ideal_min_c": 15.0,
        "ideal_max_c": 25.0,
        "nominal_shelf_life_h": 2160.0, # 90 days
    }
}

class ArrheniusShelfLifePredictor:
    @staticmethod
    def calculate_acceleration_factor(cargo_type: str, current_temp_celsius: float) -> float:
        """
        Calculates how many times faster the cargo is degrading compared to ideal storage.
        """
        params = FOOD_PARAMETERS.get(cargo_type, FOOD_PARAMETERS["Dairy Products"])
        T_ref_k = params["T_ref_celsius"] + 273.15
        T_curr_k = max(0.1, current_temp_celsius + 273.15)
        Ea = params["Ea"]

        # If temperature is below or equal to T_ref, degradation factor is ~1.0
        if current_temp_celsius <= params["T_ref_celsius"]:
            return 1.0

        # Arrhenius factor
        exponent = -(Ea / R_GAS_CONSTANT) * ((1.0 / T_curr_k) - (1.0 / T_ref_k))
        # Prevent numerical overflow
        acceleration_factor = math.exp(min(15.0, exponent))
        return max(1.0, acceleration_factor)

    @staticmethod
    def update_shelf_life(
        cargo_type: str,
        current_remaining_hours: float,
        current_temp_celsius: float,
        time_elapsed_hours: float
    ) -> Tuple[float, float, str]:
        """
        Deducts effective shelf-life hours based on temperature exposure.
        Returns: (new_remaining_hours, acceleration_factor, condition_assessment)
        """
        acc_factor = ArrheniusShelfLifePredictor.calculate_acceleration_factor(cargo_type, current_temp_celsius)
        effective_hours_lost = time_elapsed_hours * acc_factor
        new_remaining = max(0.0, current_remaining_hours - effective_hours_lost)

        params = FOOD_PARAMETERS.get(cargo_type, FOOD_PARAMETERS["Dairy Products"])
        
        if current_temp_celsius > params["ideal_max_c"]:
            excursion = current_temp_celsius - params["ideal_max_c"]
            if excursion > 5.0:
                assessment = f"CRITICAL THERMAL EXCURSION: +{excursion:.1f}°C above ceiling. Spoilage rate is {acc_factor:.1f}x baseline!"
            else:
                assessment = f"MODERATE TEMPERATURE DRIFT: +{excursion:.1f}°C. Spoilage accelerated by {acc_factor:.1f}x."
        elif current_temp_celsius < params["ideal_min_c"]:
            assessment = f"CHILLING/FREEZE RISK: {current_temp_celsius:.1f}°C is below optimal {params['ideal_min_c']}°C."
        else:
            assessment = f"OPTIMAL COLD-CHAIN: Normal decay profile ({acc_factor:.2f}x baseline)."

        return round(new_remaining, 2), round(acc_factor, 2), assessment
