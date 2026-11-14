import math
from typing import Dict, Any, List
from datetime import datetime, timedelta

"""
Predictive Maintenance Engine
Evaluates vehicle diagnostics telemetry:
- Engine temperature (°C)
- Oil pressure (psi)
- Battery voltage (V)
- Brake wear percentage (%)
- Vibration spectral anomaly index
Computes:
- Composite Fleet Health Score (0-100)
- Remaining Useful Life (RUL in days)
- Active Diagnostic Trouble Codes (DTCs)
- Prescriptive Maintenance Actions
"""

class PredictiveMaintenanceEngine:
    @staticmethod
    def evaluate_telemetry(
        engine_temp: float,
        oil_pressure: float,
        battery_voltage: float,
        brake_wear_percent: float,
        vibration_g: float = 0.1
    ) -> Dict[str, Any]:
        fault_codes = []
        deductions = 0.0
        recommendations = []

        # 1. Engine Thermal Analysis
        if engine_temp > 105.0:
            deductions += 35.0
            fault_codes.append("P0217-ENGINE_COOLANT_OVERTEMP")
            recommendations.append("Immediate inspection of radiator core, thermostat valve, and coolant level.")
        elif engine_temp > 96.0:
            deductions += 15.0
            fault_codes.append("P0128-THERMOSTAT_PERFORMANCE")
            recommendations.append("Schedule radiator flush and thermal sensor calibration within 7 days.")

        # 2. Engine Oil Pressure Analysis
        if oil_pressure < 25.0:
            deductions += 40.0
            fault_codes.append("P0524-ENGINE_OIL_PRESSURE_CRITICAL_LOW")
            recommendations.append("Halt operation immediately. High risk of catastrophic crankshaft or cylinder bearing seizure.")
        elif oil_pressure < 35.0:
            deductions += 15.0
            fault_codes.append("P0521-OIL_PRESSURE_SENSOR_RANGE")
            recommendations.append("Check engine oil viscosity and change oil filter at next terminal stop.")

        # 3. Brake Lining Wear
        if brake_wear_percent > 85.0:
            deductions += 30.0
            fault_codes.append("B1042-BRAKE_PAD_MINIMUM_THICKNESS")
            recommendations.append("Replace front & rear ceramic brake pads and rotor discs immediately.")
        elif brake_wear_percent > 70.0:
            deductions += 12.0
            recommendations.append("Brake pad thickness at 30% remaining life. Pre-order replacement kit.")

        # 4. Battery / Alternator Electrical Health
        if battery_voltage < 22.0 or battery_voltage > 29.0:
            deductions += 20.0
            fault_codes.append("P0562-SYSTEM_VOLTAGE_LOW")
            recommendations.append("Test dual alternator output and inspect 24V battery cell balancing.")

        # 5. Mechanical Vibration Anomaly
        if vibration_g > 1.2:
            deductions += 25.0
            fault_codes.append("M0302-SUSPENSION_AXLE_VIBRATION_EXCESSIVE")
            recommendations.append("Check wheel alignment, universal joints, and propeller shaft balance.")

        # Calculate Health Score
        health_score = max(5.0, min(100.0, 100.0 - deductions))

        # Remaining Useful Life (RUL) regression model:
        # Standard overhaul cycle is 365 days; exponential degradation factor based on health score
        rul_factor = (health_score / 100.0) ** 1.8
        rul_days = int(max(3, 365 * rul_factor))

        if health_score >= 85.0:
            status = "HEALTHY"
            service_urgency = "ROUTINE"
            next_service_days = min(90, rul_days)
        elif health_score >= 65.0:
            status = "NEEDS_ATTENTION"
            service_urgency = "MEDIUM"
            next_service_days = min(30, rul_days)
        elif health_score >= 45.0:
            status = "WARNING"
            service_urgency = "HIGH"
            next_service_days = min(7, rul_days)
        else:
            status = "CRITICAL_MAINTENANCE_REQUIRED"
            service_urgency = "IMMEDIATE"
            next_service_days = 1

        if not recommendations:
            recommendations.append("All mechanical systems operating within standard SAE engineering tolerances.")

        return {
            "health_score": round(health_score, 1),
            "status": status,
            "rul_days": rul_days,
            "fault_codes": ", ".join(fault_codes) if fault_codes else "NONE",
            "service_urgency": service_urgency,
            "next_service_due": (datetime.utcnow() + timedelta(days=next_service_days)).strftime("%Y-%m-%d"),
            "recommendations": recommendations
        }
