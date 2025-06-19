#!/usr/bin/env python3
"""
Example Usage of STL Tools

This script demonstrates practical usage of the STLTools class
for common real-world scenarios.
"""

from api.stl import STLTools
import os
import json

def example_basic_analysis():
    """Example: Basic mesh analysis."""
    print("=== Example 1: Basic Mesh Analysis ===")
    
    # Initialize tools
    stl_tools = STLTools()
    
    # This would be your actual STL file
    # stl_tools.load_file("your_model.stl")
    
    # For demonstration, we'll show what the output would look like
    print("Loading STL file...")
    print("Calculating properties...")
    
    # Example output (replace with actual file loading)
    print("Surface Area: 150.25 mm²")
    print("Volume: 125.50 mm³")
    print("Triangle Count: 1,024")
    print("Center of Mass: [10.5, 15.2, 8.7]")

def example_batch_processing():
    """Example: Process multiple STL files in a directory."""
    print("\n=== Example 2: Batch Processing ===")
    
    # Directory containing STL files
    stl_directory = "./models"  # Change this to your directory
    
    if not os.path.exists(stl_directory):
        print(f"Directory {stl_directory} not found. Creating example...")
        return
    
    stl_tools = STLTools()
    results = {}
    
    # Process all STL files
    for filename in os.listdir(stl_directory):
        if filename.lower().endswith('.stl'):
            filepath = os.path.join(stl_directory, filename)
            print(f"Processing {filename}...")
            
            try:
                stl_tools.load_file(filepath)
                stats = stl_tools.get_mesh_statistics()
                
                results[filename] = {
                    'surface_area': stats['surface_area'],
                    'volume': stats['volume'],
                    'triangle_count': stats['triangle_count'],
                    'aspect_ratio': stats['aspect_ratio'],
                    'center_of_mass': stats['center_of_mass']
                }
                
                print(f"  ✓ Surface Area: {stats['surface_area']:.2f}")
                print(f"  ✓ Volume: {stats['volume']:.2f}")
                print(f"  ✓ Triangles: {stats['triangle_count']:,}")
                
            except Exception as e:
                print(f"  ✗ Error: {e}")
                results[filename] = {'error': str(e)}
    
    # Save results to JSON
    with open('batch_analysis_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nResults saved to batch_analysis_results.json")

def example_quality_assurance():
    """Example: Quality assurance workflow."""
    print("\n=== Example 3: Quality Assurance ===")
    
    stl_tools = STLTools()
    
    # This would be your production STL file
    # stl_tools.load_file("production_part.stl")
    
    print("Running quality checks...")
    
    # Example validation workflow
    print("1. Loading mesh...")
    print("2. Validating geometry...")
    print("3. Checking for issues...")
    
    # Example validation results
    validation_results = {
        'is_valid': True,
        'issues': [],
        'warnings': ['Mesh has very small dimensions in Z axis'],
        'degenerate_triangles': []
    }
    
    if validation_results['is_valid']:
        print("✓ Mesh passed validation")
    else:
        print("✗ Mesh failed validation")
        for issue in validation_results['issues']:
            print(f"  - {issue}")
    
    for warning in validation_results['warnings']:
        print(f"⚠ {warning}")

def example_mesh_preparation():
    """Example: Prepare mesh for 3D printing."""
    print("\n=== Example 4: Mesh Preparation for 3D Printing ===")
    
    stl_tools = STLTools()
    
    # Load the mesh
    # stl_tools.load_file("original_part.stl")
    
    print("Preparing mesh for 3D printing...")
    
    # Example workflow
    print("1. Loading original mesh...")
    
    # Get original stats
    # original_stats = stl_tools.get_mesh_statistics()
    # print(f"Original volume: {original_stats['volume']:.2f}")
    
    print("2. Scaling to correct units (mm)...")
    # stl_tools.scale_mesh(25.4)  # Convert from inches to mm
    
    print("3. Centering the mesh...")
    # center = stl_tools.get_center_of_mass()
    # stl_tools.translate_mesh([-center[0], -center[1], -center[2]])
    
    print("4. Validating final mesh...")
    # validation = stl_tools.validate_mesh()
    
    print("5. Saving prepared mesh...")
    # stl_tools.save_mesh("prepared_for_printing.stl")
    
    print("✓ Mesh prepared successfully!")

def example_cost_estimation():
    """Example: Estimate material cost based on volume."""
    print("\n=== Example 5: Material Cost Estimation ===")
    
    stl_tools = STLTools()
    
    # Material densities (g/cm³)
    materials = {
        'PLA': 1.24,
        'ABS': 1.04,
        'PETG': 1.27,
        'TPU': 1.21
    }
    
    # Material costs ($/kg)
    costs = {
        'PLA': 20.0,
        'ABS': 25.0,
        'PETG': 30.0,
        'TPU': 45.0
    }
    
    # Load mesh
    # stl_tools.load_file("part.stl")
    
    print("Calculating material requirements...")
    
    # Example calculations (replace with actual loading)
    volume_cm3 = 125.5  # cm³
    # volume_cm3 = stl_tools.calculate_volume() / 1000  # Convert mm³ to cm³
    
    print(f"Part volume: {volume_cm3:.2f} cm³")
    print("\nMaterial estimates:")
    
    for material, density in materials.items():
        weight_g = volume_cm3 * density
        weight_kg = weight_g / 1000
        cost = weight_kg * costs[material]
        
        print(f"{material:>6}: {weight_g:>6.1f}g ({weight_kg:>5.3f}kg) - ${cost:>6.2f}")

def example_export_report():
    """Example: Generate a comprehensive report."""
    print("\n=== Example 6: Generate Comprehensive Report ===")
    
    stl_tools = STLTools()
    
    # Load mesh
    # stl_tools.load_file("complex_part.stl")
    
    print("Generating comprehensive report...")
    
    # Get all statistics
    # stats = stl_tools.get_mesh_statistics()
    # validation = stl_tools.validate_mesh()
    
    # Create report
    report = {
        'file_info': {
            'filename': 'complex_part.stl',
            'analysis_date': '2024-01-15'
        },
        'mesh_properties': {
            'surface_area': 150.25,
            'volume': 125.50,
            'triangle_count': 1024,
            'vertex_count': 3072
        },
        'quality_metrics': {
            'aspect_ratio': 2.5,
            'surface_area_to_volume_ratio': 1.2,
            'is_valid': True
        },
        'recommendations': [
            'Mesh is suitable for 3D printing',
            'Consider reducing triangle count for faster processing',
            'Part has good surface area to volume ratio'
        ]
    }
    
    # Save report
    with open('mesh_analysis_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print("✓ Report generated: mesh_analysis_report.json")

def main():
    """Run all examples."""
    print("STL Tools - Practical Examples")
    print("==============================")
    
    example_basic_analysis()
    example_batch_processing()
    example_quality_assurance()
    example_mesh_preparation()
    example_cost_estimation()
    example_export_report()
    
    print("\n=== Examples Completed ===")
    print("\nTo run these examples with real STL files:")
    print("1. Place your STL files in a directory")
    print("2. Update the file paths in the examples")
    print("3. Run: python example_usage.py")

if __name__ == "__main__":
    main() 