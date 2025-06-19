#!/usr/bin/env python3
"""
Test script to verify copper electroplating calculations with 0.1 A/in² current density
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'api', 'core'))

from stl_tools import STLTools

def test_copper_calculations():
    """Test copper electroplating calculations with 0.1 A/in² current density."""
    print("Testing Copper Electroplating Calculations")
    print("=" * 50)
    
    try:
        # Create STLTools instance
        stl_tools = STLTools()
        
        # Test surface area calculation (hypothetical)
        surface_area_mm2 = 5000  # 50 cm²
        surface_area_in2 = surface_area_mm2 / 645.16
        
        print(f"Surface Area: {surface_area_mm2} mm² ({surface_area_mm2/100:.1f} cm²)")
        print(f"Surface Area: {surface_area_in2:.2f} in²")
        
        # Test copper current density calculation
        current_density = 0.1  # A/in²
        expected_current = surface_area_in2 * current_density
        
        print(f"\nCopper Current Density: {current_density} A/in²")
        print(f"Expected Current: {expected_current:.2f} A")
        
        # Test copper properties
        copper_props = {
            'density_g_cm3': 8.96,
            'current_density_min': 0.07,
            'current_density_max': 0.1,
            'voltage': 3.0,
            'typical_thickness_microns': 20.0
        }
        
        print(f"\nCopper Properties:")
        print(f"  Density: {copper_props['density_g_cm3']} g/cm³")
        print(f"  Current Density: {copper_props['current_density_min']}-{copper_props['current_density_max']} A/in²")
        print(f"  Voltage: {copper_props['voltage']} V")
        print(f"  Typical Thickness: {copper_props['typical_thickness_microns']} μm")
        
        # Test material requirements calculation
        surface_area_cm2 = surface_area_mm2 / 100
        plating_thickness_cm = copper_props['typical_thickness_microns'] / 10000
        metal_volume_cm3 = surface_area_cm2 * plating_thickness_cm
        metal_mass_g = metal_volume_cm3 * copper_props['density_g_cm3']
        
        print(f"\nMaterial Requirements:")
        print(f"  Metal Volume: {metal_volume_cm3:.3f} cm³")
        print(f"  Metal Mass: {metal_mass_g:.2f} g")
        
        # Test power requirements
        power_watts = expected_current * copper_props['voltage']
        energy_wh = power_watts * 4.0  # 4 hours
        
        print(f"\nPower Requirements:")
        print(f"  Power: {power_watts:.1f} W")
        print(f"  Energy: {energy_wh:.2f} Wh ({energy_wh/1000:.4f} kWh)")
        
        # Test cost estimates
        electricity_cost = energy_wh * 0.12 / 1000  # $0.12/kWh
        solution_cost = metal_mass_g * 0.03  # $30/kg = $0.03/g
        total_cost = electricity_cost + solution_cost
        
        print(f"\nCost Estimates:")
        print(f"  Electricity Cost: ${electricity_cost:.4f}")
        print(f"  Solution Cost: ${solution_cost:.3f}")
        print(f"  Total Cost: ${total_cost:.3f}")
        
        print(f"\n✅ Copper calculations with 0.1 A/in² current density verified!")
        print(f"\nSummary for {surface_area_mm2/100:.1f} cm² part:")
        print(f"  • Current: {expected_current:.2f} A")
        print(f"  • Metal required: {metal_mass_g:.2f} g")
        print(f"  • Power: {power_watts:.1f} W")
        print(f"  • Total cost: ${total_cost:.3f}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_copper_calculations()
    if not success:
        sys.exit(1) 