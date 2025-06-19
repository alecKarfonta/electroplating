#!/usr/bin/env python3
"""
Electroplating Calculation Examples

This script demonstrates the comprehensive electroplating calculation features
added to the STL Analysis API. It shows how to calculate electroplating parameters
for different metals and scenarios.

Usage:
    python example_electroplating.py
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'api'))

from api.core.stl_tools import STLTools

def example_basic_electroplating():
    """Example: Basic electroplating calculations for a sample part."""
    print("\n=== Example 1: Basic Electroplating Calculations ===")
    
    stl_tools = STLTools()
    
    # For demonstration, we'll use a hypothetical surface area
    # In practice, you would load an actual STL file
    print("Note: Using hypothetical surface area for demonstration")
    surface_area_mm2 = 5000  # 50 cm²
    
    # Create a mock mesh with the desired surface area
    # This is just for demonstration - in real usage you'd load an STL file
    print(f"Surface area: {surface_area_mm2} mm² ({surface_area_mm2/100:.1f} cm²)")
    
    # Calculate basic electroplating parameters
    plating_params = stl_tools.calculate_electroplating_parameters(
        current_density_min=0.1,
        current_density_max=0.1,
        plating_thickness_microns=20.0,
        metal_density_g_cm3=8.96,  # Copper
        current_efficiency=0.95,
        voltage=3.0
    )
    
    print("\nElectroplating Parameters:")
    print(f"  Surface Area: {plating_params['surface_area']['in2']:.2f} in²")
    print(f"  Recommended Current: {plating_params['current_requirements']['recommended_amps']:.2f} A")
    print(f"  Current Range: {plating_params['current_requirements']['min_amps']:.2f} - {plating_params['current_requirements']['max_amps']:.2f} A")
    print(f"  Plating Time: {plating_params['plating_parameters']['plating_time_minutes']:.1f} minutes")
    print(f"  Metal Required: {plating_params['material_requirements']['metal_mass_g']:.2f} g")
    print(f"  Power: {plating_params['power_requirements']['power_watts']:.1f} W")
    print(f"  Total Cost: ${plating_params['cost_estimates']['total_cost']:.2f}")
    print(f"  Coverage Efficiency: {plating_params['quality_factors']['coverage_efficiency']*100:.1f}%")


def example_metal_comparison():
    """Example: Compare different plating metals."""
    print("\n=== Example 2: Metal Comparison ===")
    
    stl_tools = STLTools()
    
    metals = ['nickel', 'copper', 'chrome', 'gold', 'silver']
    
    print("Comparing different plating metals for the same part:")
    print(f"{'Metal':<10} {'Current (A)':<12} {'Time (min)':<12} {'Mass (g)':<10} {'Cost ($)':<10}")
    print("-" * 60)
    
    for metal in metals:
        try:
            recommendations = stl_tools.get_electroplating_recommendations(metal)
            params = recommendations['calculated_parameters']
            
            print(f"{metal:<10} {params['current_requirements']['recommended_amps']:<12.2f} "
                  f"{params['plating_parameters']['plating_time_minutes']:<12.1f} "
                  f"{params['material_requirements']['metal_mass_g']:<10.2f} "
                  f"{params['cost_estimates']['total_cost']:<10.2f}")
        except Exception as e:
            print(f"{metal:<10} Error: {e}")


def example_thickness_variation():
    """Example: How plating thickness affects parameters."""
    print("\n=== Example 3: Thickness Variation ===")
    
    stl_tools = STLTools()
    
    thicknesses = [5, 10, 25, 50, 100]  # microns
    
    print("Effect of plating thickness on parameters:")
    print(f"{'Thickness (μm)':<15} {'Time (min)':<12} {'Mass (g)':<10} {'Cost ($)':<10}")
    print("-" * 50)
    
    for thickness in thicknesses:
        try:
            plating_params = stl_tools.calculate_electroplating_parameters(
                plating_thickness_microns=thickness
            )
            
            print(f"{thickness:<15} {plating_params['plating_parameters']['plating_time_minutes']:<12.1f} "
                  f"{plating_params['material_requirements']['metal_mass_g']:<10.2f} "
                  f"{plating_params['cost_estimates']['total_cost']:<10.2f}")
        except Exception as e:
            print(f"{thickness:<15} Error: {e}")


def example_current_density_optimization():
    """Example: Optimizing current density for best results."""
    print("\n=== Example 4: Current Density Optimization ===")
    
    stl_tools = STLTools()
    
    current_densities = [0.05, 0.07, 0.1, 0.15, 0.2]  # A/in²
    
    print("Effect of current density on plating time and quality:")
    print(f"{'Current Density':<15} {'Time (min)':<12} {'Coverage %':<12} {'Surface Factor':<15}")
    print("-" * 60)
    
    for current_density in current_densities:
        try:
            plating_params = stl_tools.calculate_electroplating_parameters(
                current_density_min=current_density,
                current_density_max=current_density + 0.02
            )
            
            print(f"{current_density:<15.2f} {plating_params['plating_parameters']['plating_time_minutes']:<12.1f} "
                  f"{plating_params['quality_factors']['coverage_efficiency']*100:<12.1f} "
                  f"{plating_params['quality_factors']['surface_roughness_factor']:<15.2f}")
        except Exception as e:
            print(f"{current_density:<15.2f} Error: {e}")


def example_nickel_recommendations():
    """Example: Detailed nickel plating recommendations."""
    print("\n=== Example 5: Nickel Plating Recommendations ===")
    
    stl_tools = STLTools()
    
    try:
        recommendations = stl_tools.get_electroplating_recommendations('nickel')
        
        print("Nickel Plating Properties:")
        props = recommendations['metal_properties']
        print(f"  Color: {props['color']}")
        print(f"  Hardness: {props['hardness']}")
        print(f"  Corrosion Resistance: {props['corrosion_resistance']}")
        print(f"  Solution Cost: ${props['solution_cost_per_kg']}/kg")
        print(f"  Typical Thickness: {props['typical_thickness_microns']} μm")
        
        print("\nCalculated Parameters:")
        params = recommendations['calculated_parameters']
        print(f"  Recommended Current: {params['current_requirements']['recommended_amps']:.2f} A")
        print(f"  Plating Time: {params['plating_parameters']['plating_time_minutes']:.1f} minutes")
        print(f"  Metal Required: {params['material_requirements']['metal_mass_g']:.2f} g")
        print(f"  Total Cost: ${params['cost_estimates']['total_cost']:.2f}")
        
        print("\nNickel-Specific Tips:")
        for tip in recommendations['metal_specific_tips']['nickel']:
            print(f"  • {tip}")
            
    except Exception as e:
        print(f"Error getting nickel recommendations: {e}")


def example_cost_analysis():
    """Example: Detailed cost breakdown for different scenarios."""
    print("\n=== Example 6: Cost Analysis ===")
    
    stl_tools = STLTools()
    
    scenarios = [
        {"name": "Thin Nickel", "thickness": 10, "metal": "nickel"},
        {"name": "Standard Nickel", "thickness": 25, "metal": "nickel"},
        {"name": "Thick Nickel", "thickness": 50, "metal": "nickel"},
        {"name": "Gold Flash", "thickness": 5, "metal": "gold"},
        {"name": "Copper Base", "thickness": 20, "metal": "copper"},
    ]
    
    print("Cost comparison for different plating scenarios:")
    print(f"{'Scenario':<15} {'Thickness':<12} {'Metal':<10} {'Material Cost':<15} {'Electricity':<15} {'Total':<10}")
    print("-" * 80)
    
    for scenario in scenarios:
        try:
            if scenario['metal'] == 'nickel':
                plating_params = stl_tools.calculate_electroplating_parameters(
                    plating_thickness_microns=scenario['thickness']
                )
            else:
                recommendations = stl_tools.get_electroplating_recommendations(scenario['metal'])
                # Override thickness
                plating_params = stl_tools.calculate_electroplating_parameters(
                    plating_thickness_microns=scenario['thickness'],
                    metal_density_g_cm3=recommendations['metal_properties']['density_g_cm3'],
                    voltage=recommendations['metal_properties']['voltage']
                )
            
            print(f"{scenario['name']:<15} {scenario['thickness']:<12} {scenario['metal']:<10} "
                  f"${plating_params['cost_estimates']['solution_cost']:<15.2f} "
                  f"${plating_params['cost_estimates']['electricity_cost']:<15.2f} "
                  f"${plating_params['cost_estimates']['total_cost']:<10.2f}")
        except Exception as e:
            print(f"{scenario['name']:<15} Error: {e}")


def main():
    """Run all electroplating examples."""
    print("Electroplating Calculation Examples")
    print("=" * 50)
    
    try:
        example_basic_electroplating()
        example_metal_comparison()
        example_thickness_variation()
        example_current_density_optimization()
        example_nickel_recommendations()
        example_cost_analysis()
        
        print("\n" + "=" * 50)
        print("All examples completed successfully!")
        print("\nKey Features Demonstrated:")
        print("• Current density calculation (0.07-0.1 A/in² range)")
        print("• Plating time estimation based on thickness and current")
        print("• Material requirements calculation")
        print("• Power and energy consumption")
        print("• Cost estimation (electricity + solution)")
        print("• Quality factors (coverage efficiency, surface roughness)")
        print("• Metal-specific recommendations")
        print("• Surface preparation and process tips")
        
    except Exception as e:
        print(f"Error running examples: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 