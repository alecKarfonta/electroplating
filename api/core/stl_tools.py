#!/usr/bin/env python3
"""
STL Tools - A comprehensive toolkit for STL file manipulation and analysis

This module provides a class-based interface for working with STL files,
including surface area calculation, volume calculation, mesh analysis,
and various utility functions.

Requirements:
- numpy-stl: pip install numpy-stl
- numpy: pip install numpy
- scipy: pip install scipy (for advanced features)

Usage:
    from api.stl import STLTools
    
    stl_tools = STLTools()
    stl_tools.load_file("model.stl")
    area = stl_tools.calculate_surface_area()
    volume = stl_tools.calculate_volume()
"""

import sys
import numpy as np
from stl import mesh
import argparse
import os
import json
from typing import Dict, List, Tuple, Optional, Union
import warnings

try:
    from scipy.spatial import ConvexHull
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    warnings.warn("scipy not available. Some advanced features will be disabled.")

class STLTools:
    """
    A comprehensive toolkit for STL file manipulation and analysis.
    
    This class provides methods for:
    - Loading and validating STL files
    - Calculating surface area and volume
    - Analyzing mesh properties (bounding box, center of mass, etc.)
    - Mesh validation and repair suggestions
    - File format conversion and export
    - Statistical analysis of mesh properties
    """
    
    def __init__(self):
        """Initialize the STL tools instance."""
        self.mesh = None
        self.file_path = None
        self._cached_surface_area = None
        self._cached_volume = None
        self._cached_bounds = None
        self._cached_center_of_mass = None
        
    def load_file(self, file_path: str) -> bool:
        """
        Load an STL file into the instance.
        
        Args:
            file_path: Path to the STL file
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File '{file_path}' not found.")
        
        try:
            self.mesh = mesh.Mesh.from_file(file_path)
            self.file_path = file_path
            self._clear_cache()
            return True
        except Exception as e:
            raise ValueError(f"Error loading STL file: {e}")
    
    def _clear_cache(self):
        """Clear all cached calculations."""
        self._cached_surface_area = None
        self._cached_volume = None
        self._cached_bounds = None
        self._cached_center_of_mass = None
    
    def _ensure_mesh_loaded(self):
        """Ensure a mesh is loaded before performing operations."""
        if self.mesh is None:
            raise ValueError("No mesh loaded. Call load_file() first.")
    
    def calculate_surface_area(self) -> float:
        """
        Calculate the total surface area of the mesh.
        
        Returns:
            float: Total surface area
        """
        self._ensure_mesh_loaded()
        
        if self._cached_surface_area is not None:
            return self._cached_surface_area
        
        total_area = 0.0
        for triangle in self.mesh.vectors:
            area = self._calculate_triangle_area(triangle)
            total_area += area
        
        self._cached_surface_area = total_area
        return total_area
    
    def _calculate_triangle_area(self, vertices: np.ndarray) -> float:
        """
        Calculate the area of a triangle using cross product method.
        
        Args:
            vertices: Array of shape (3, 3) containing triangle vertices
            
        Returns:
            float: Area of the triangle
        """
        v0, v1, v2 = vertices
        edge1 = v1 - v0
        edge2 = v2 - v0
        cross_product = np.cross(edge1, edge2)
        return 0.5 * np.linalg.norm(cross_product)
    
    def calculate_volume(self) -> float:
        """
        Calculate the volume of the mesh using the divergence theorem.
        
        Returns:
            float: Volume of the mesh
        """
        self._ensure_mesh_loaded()
        
        if self._cached_volume is not None:
            return self._cached_volume
        
        volume = 0.0
        for triangle in self.mesh.vectors:
            v0, v1, v2 = triangle
            # Volume contribution from this triangle
            vol = np.dot(v0, np.cross(v1, v2)) / 6.0
            volume += vol
        
        self._cached_volume = abs(volume)
        return self._cached_volume
    
    def get_bounding_box(self) -> Dict[str, np.ndarray]:
        """
        Get the bounding box of the mesh.
        
        Returns:
            dict: Dictionary with 'min', 'max', and 'dimensions' keys
        """
        self._ensure_mesh_loaded()
        
        if self._cached_bounds is not None:
            return self._cached_bounds
        
        all_vertices = self.mesh.vectors.reshape(-1, 3)
        min_coords = np.min(all_vertices, axis=0)
        max_coords = np.max(all_vertices, axis=0)
        dimensions = max_coords - min_coords
        
        bounds = {
            'min': min_coords,
            'max': max_coords,
            'dimensions': dimensions
        }
        
        self._cached_bounds = bounds
        return bounds
    
    def get_center_of_mass(self) -> np.ndarray:
        """
        Calculate the center of mass of the mesh.
        
        Returns:
            np.ndarray: Center of mass coordinates [x, y, z]
        """
        self._ensure_mesh_loaded()
        
        if self._cached_center_of_mass is not None:
            return self._cached_center_of_mass
        
        all_vertices = self.mesh.vectors.reshape(-1, 3)
        center = np.mean(all_vertices, axis=0)
        
        self._cached_center_of_mass = center
        return center
    
    def get_mesh_statistics(self) -> Dict:
        """
        Get comprehensive statistics about the mesh.
        
        Returns:
            dict: Dictionary containing various mesh statistics
        """
        self._ensure_mesh_loaded()
        
        bounds = self.get_bounding_box()
        center = self.get_center_of_mass()
        surface_area = self.calculate_surface_area()
        volume = self.calculate_volume()
        
        # Calculate triangle statistics
        triangles = self.mesh.vectors
        areas = [self._calculate_triangle_area(tri) for tri in triangles]
        
        # Calculate edge lengths
        edges = []
        for tri in triangles:
            edges.extend([
                np.linalg.norm(tri[1] - tri[0]),
                np.linalg.norm(tri[2] - tri[1]),
                np.linalg.norm(tri[0] - tri[2])
            ])
        
        stats = {
            'triangle_count': len(triangles),
            'vertex_count': len(triangles) * 3,
            'surface_area': surface_area,
            'volume': volume,
            'center_of_mass': center.tolist(),
            'bounding_box': {
                'min': bounds['min'].tolist(),
                'max': bounds['max'].tolist(),
                'dimensions': bounds['dimensions'].tolist()
            },
            'triangle_areas': {
                'min': min(areas),
                'max': max(areas),
                'mean': np.mean(areas),
                'std': np.std(areas)
            },
            'edge_lengths': {
                'min': min(edges),
                'max': max(edges),
                'mean': np.mean(edges),
                'std': np.std(edges)
            },
            'aspect_ratio': self._calculate_aspect_ratio(bounds['dimensions']),
            'surface_area_to_volume_ratio': surface_area / volume if volume > 0 else None
        }
        
        return stats
    
    def _calculate_aspect_ratio(self, dimensions: np.ndarray) -> Optional[float]:
        """Calculate the aspect ratio of the bounding box."""
        sorted_dims = np.sort(dimensions)
        return sorted_dims[2] / sorted_dims[0] if sorted_dims[0] > 0 else None
    
    def validate_mesh(self) -> Dict[str, Union[bool, List, str]]:
        """
        Validate the mesh for common issues.
        
        Returns:
            dict: Validation results with issues found
        """
        self._ensure_mesh_loaded()
        
        issues = []
        warnings = []
        
        # Check for degenerate triangles
        degenerate_triangles = []
        for i, triangle in enumerate(self.mesh.vectors):
            area = self._calculate_triangle_area(triangle)
            if area < 1e-10:  # Very small area threshold
                degenerate_triangles.append(i)
        
        if degenerate_triangles:
            issues.append(f"Found {len(degenerate_triangles)} degenerate triangles")
        
        # Check for non-manifold edges (simplified check)
        # This is a basic check - more sophisticated analysis would require
        # building edge connectivity data structures
        
        # Check bounding box
        bounds = self.get_bounding_box()
        if np.any(bounds['dimensions'] < 1e-6):
            warnings.append("Mesh has very small dimensions in one or more axes")
        
        # Check volume
        volume = self.calculate_volume()
        if volume < 1e-10:
            warnings.append("Mesh has very small or zero volume")
        
        return {
            'is_valid': len(issues) == 0,
            'issues': issues,
            'warnings': warnings,
            'degenerate_triangles': degenerate_triangles
        }
    
    def get_convex_hull_volume(self) -> Optional[float]:
        """
        Calculate the volume of the convex hull of the mesh.
        Requires scipy.
        
        Returns:
            float: Volume of convex hull, or None if scipy not available
        """
        if not SCIPY_AVAILABLE:
            return None
        
        self._ensure_mesh_loaded()
        
        all_vertices = self.mesh.vectors.reshape(-1, 3)
        hull = ConvexHull(all_vertices)
        return hull.volume
    
    def export_statistics(self, output_file: str, format: str = 'json') -> bool:
        """
        Export mesh statistics to a file.
        
        Args:
            output_file: Path to output file
            format: Output format ('json' or 'txt')
            
        Returns:
            bool: True if successful
        """
        try:
            stats = self.get_mesh_statistics()
            
            if format.lower() == 'json':
                # Convert numpy types to Python native types for JSON serialization
                def convert_numpy_types(obj):
                    if isinstance(obj, np.ndarray):
                        return obj.tolist()
                    elif isinstance(obj, np.integer):
                        return int(obj)
                    elif isinstance(obj, np.floating):
                        return float(obj)
                    elif isinstance(obj, dict):
                        return {key: convert_numpy_types(value) for key, value in obj.items()}
                    elif isinstance(obj, list):
                        return [convert_numpy_types(item) for item in obj]
                    else:
                        return obj
                
                json_stats = convert_numpy_types(stats)
                with open(output_file, 'w') as f:
                    json.dump(json_stats, f, indent=2)
            elif format.lower() == 'txt':
                with open(output_file, 'w') as f:
                    f.write("STL Mesh Statistics\n")
                    f.write("==================\n\n")
                    f.write(f"File: {self.file_path}\n")
                    f.write(f"Triangle Count: {stats['triangle_count']:,}\n")
                    f.write(f"Vertex Count: {stats['vertex_count']:,}\n")
                    f.write(f"Surface Area: {stats['surface_area']:.6f}\n")
                    f.write(f"Volume: {stats['volume']:.6f}\n")
                    f.write(f"Center of Mass: {stats['center_of_mass']}\n")
                    f.write(f"Aspect Ratio: {stats['aspect_ratio']:.3f}\n")
                    f.write(f"SA/V Ratio: {stats['surface_area_to_volume_ratio']:.3f}\n")
            else:
                raise ValueError(f"Unsupported format: {format}")
            
            return True
        except Exception as e:
            print(f"Error exporting statistics: {e}")
            return False
    
    def scale_mesh(self, scale_factor: Union[float, List[float]]) -> bool:
        """
        Scale the mesh by a factor.
        
        Args:
            scale_factor: Scaling factor(s). Can be a single float or list of 3 floats for x,y,z
            
        Returns:
            bool: True if successful
        """
        self._ensure_mesh_loaded()
        
        try:
            if isinstance(scale_factor, (int, float)):
                scale_factor = [scale_factor] * 3
            elif len(scale_factor) != 3:
                raise ValueError("Scale factor must be a single number or list of 3 numbers")
            
            scale_matrix = np.array(scale_factor)
            self.mesh.vectors *= scale_matrix
            self._clear_cache()
            return True
        except Exception as e:
            print(f"Error scaling mesh: {e}")
            return False
    
    def translate_mesh(self, translation: List[float]) -> bool:
        """
        Translate the mesh by a vector.
        
        Args:
            translation: Translation vector [x, y, z]
            
        Returns:
            bool: True if successful
        """
        self._ensure_mesh_loaded()
        
        try:
            if len(translation) != 3:
                raise ValueError("Translation must be a list of 3 numbers")
            
            translation_vector = np.array(translation)
            self.mesh.vectors += translation_vector
            self._clear_cache()
            return True
        except Exception as e:
            print(f"Error translating mesh: {e}")
            return False
    
    def save_mesh(self, output_path: str) -> bool:
        """
        Save the current mesh to a file.
        
        Args:
            output_path: Path to save the mesh
            
        Returns:
            bool: True if successful
        """
        self._ensure_mesh_loaded()
        
        try:
            self.mesh.save(output_path)
            return True
        except Exception as e:
            print(f"Error saving mesh: {e}")
            return False
    
    def get_mesh_info(self) -> Dict:
        """
        Get basic information about the loaded mesh.
        
        Returns:
            dict: Basic mesh information
        """
        self._ensure_mesh_loaded()
        
        bounds = self.get_bounding_box()
        return {
            'file_path': self.file_path,
            'triangle_count': len(self.mesh.vectors),
            'bounding_box': bounds,
            'center_of_mass': self.get_center_of_mass().tolist(),
            'surface_area': self.calculate_surface_area(),
            'volume': self.calculate_volume()
        }

    def estimate_resin_cost(self, resin_density_g_cm3: float, resin_price_per_kg: float, volume_unit: str = 'mm3') -> dict:
        """
        Estimate the cost of resin required to print the mesh.

        Args:
            resin_density_g_cm3: Density of the resin in grams per cubic centimeter (g/cm³)
            resin_price_per_kg: Price of the resin in currency per kilogram
            volume_unit: The unit of the mesh volume ('mm3' or 'cm3'). Default is 'mm3'.

        Returns:
            dict: Breakdown of volume, mass, and cost
        """
        self._ensure_mesh_loaded()
        volume_mm3 = self.calculate_volume()
        if volume_unit == 'mm3':
            volume_cm3 = volume_mm3 / 1000.0
        elif volume_unit == 'cm3':
            volume_cm3 = volume_mm3
        else:
            raise ValueError("volume_unit must be 'mm3' or 'cm3'")
        mass_g = volume_cm3 * resin_density_g_cm3
        mass_kg = mass_g / 1000.0
        cost = mass_kg * resin_price_per_kg
        return {
            'volume_mm3': volume_mm3,
            'volume_cm3': volume_cm3,
            'mass_g': mass_g,
            'mass_kg': mass_kg,
            'cost': cost
        }

    def calculate_electroplating_parameters(self, 
                                          current_density_min: float = 0.07, 
                                          current_density_max: float = 0.1,
                                          plating_thickness_microns: float = 20.0,
                                          metal_density_g_cm3: float = 8.96,  # Copper
                                          current_efficiency: float = 0.95,
                                          voltage: float = 3.0) -> dict:
        """
        Calculate comprehensive electroplating parameters for the 3D printed object.

        Args:
            current_density_min: Minimum current density in amps per square inch (default: 0.1)
            current_density_max: Maximum current density in amps per square inch (default: 0.1)
            plating_thickness_microns: Desired plating thickness in microns (default: 20.0)
            metal_density_g_cm3: Density of plating metal in g/cm³ (default: 8.96 for copper)
            current_efficiency: Current efficiency as decimal (default: 0.95)
            voltage: Operating voltage in volts (default: 3.0)

        Returns:
            dict: Comprehensive electroplating parameters and calculations
        """
        self._ensure_mesh_loaded()
        
        # Get surface area in mm² and convert to square inches
        surface_area_mm2 = self.calculate_surface_area()
        surface_area_in2 = surface_area_mm2 / 645.16  # Convert mm² to in²
        
        # Calculate current requirements
        current_min = surface_area_in2 * current_density_min
        current_max = surface_area_in2 * current_density_max
        current_recommended = (current_min + current_max) / 2
        
        # Calculate plating time based on thickness and plating rate
        plating_thickness_inches = plating_thickness_microns / 25400
        
        # Calculate realistic plating rate based on Faraday's law and empirical data
        # Formula: Rate = (Current Density × Current Efficiency × Atomic Weight) / (n × F × Density)
        # For practical use, we use empirically validated rates based on current density
        current_density_avg = (current_density_min + current_density_max) / 2
        
        # Realistic plating rates based on industry standards (µm/min at stated current densities)
        # These rates account for typical solution conditions and current efficiency
        if current_density_avg <= 0.05:  # Low current density
            base_rate_microns_per_min = 0.15 + (current_density_avg * 2.0)
        elif current_density_avg <= 0.1:  # Standard current density
            base_rate_microns_per_min = 0.25 + (current_density_avg * 1.5)
        else:  # High current density
            base_rate_microns_per_min = 0.4 + (current_density_avg * 1.0)
        
        # Apply current efficiency
        actual_rate_microns_per_min = base_rate_microns_per_min * current_efficiency
        
        # Convert to inches per minute for calculation
        actual_plating_rate = actual_rate_microns_per_min / 25400
        
        # Calculate plating time using the formula: time = thickness / rate
        plating_time_minutes = plating_thickness_inches / actual_plating_rate
        plating_time_hours = plating_time_minutes / 60
        
        # Calculate metal mass required
        surface_area_cm2 = surface_area_mm2 / 100  # Convert mm² to cm²
        plating_thickness_cm = plating_thickness_microns / 10000  # Convert microns to cm
        metal_volume_cm3 = surface_area_cm2 * plating_thickness_cm
        metal_mass_g = metal_volume_cm3 * metal_density_g_cm3
        
        # Calculate power requirements
        power_watts = current_recommended * voltage
        
        # Calculate energy consumption
        energy_wh = power_watts * plating_time_hours
        
        # Calculate cost estimates (assuming $0.12/kWh and $50/kg for plating solution)
        electricity_cost = energy_wh * 0.12 / 1000  # Convert Wh to kWh
        solution_cost = metal_mass_g * 0.05  # Rough estimate: $50/kg = $0.05/g
        
        # Calculate surface finish considerations
        surface_roughness_factor = self._calculate_surface_roughness_factor()
        
        # Calculate coverage efficiency (accounts for complex geometry)
        coverage_efficiency = self._calculate_coverage_efficiency()
        
        # Adjust calculations for coverage efficiency
        adjusted_metal_mass_g = metal_mass_g / coverage_efficiency
        
        return {
            'surface_area': {
                'mm2': surface_area_mm2,
                'cm2': surface_area_cm2,
                'in2': surface_area_in2
            },
            'current_requirements': {
                'min_amps': current_min,
                'max_amps': current_max,
                'recommended_amps': current_recommended,
                'current_density_range': {
                    'min': current_density_min,
                    'max': current_density_max,
                    'recommended': current_recommended / surface_area_in2
                }
            },
            'plating_parameters': {
                'thickness_microns': plating_thickness_microns,
                'thickness_inches': plating_thickness_inches,
                'plating_time_minutes': plating_time_minutes,
                'plating_time_hours': plating_time_hours,
                'plating_rate_inches_per_min': actual_plating_rate
            },
            'material_requirements': {
                'metal_mass_g': adjusted_metal_mass_g,
                'metal_mass_kg': adjusted_metal_mass_g / 1000,
                'metal_volume_cm3': metal_volume_cm3,
                'metal_density_g_cm3': metal_density_g_cm3
            },
            'power_requirements': {
                'voltage': voltage,
                'power_watts': power_watts,
                'energy_wh': energy_wh,
                'energy_kwh': energy_wh / 1000
            },
            'cost_estimates': {
                'electricity_cost': electricity_cost,
                'solution_cost': solution_cost,
                'total_cost': electricity_cost + solution_cost
            },
            'quality_factors': {
                'surface_roughness_factor': surface_roughness_factor,
                'coverage_efficiency': coverage_efficiency,
                'current_efficiency': current_efficiency
            },
            'recommendations': {
                'current_setting': f"{current_recommended:.2f} A",
                'voltage_setting': f"{voltage:.1f} V",
                'time_setting': f"{plating_time_minutes:.0f} minutes ({plating_time_hours:.0f} hours)",
                'surface_preparation': "Sand to 400-600 grit for best adhesion",
                'solution_temperature': "45-55°C for optimal plating rate",
                'agitation': "Moderate agitation recommended for uniform coverage"
            }
        }

    def _calculate_surface_roughness_factor(self) -> float:
        """
        Calculate a factor that accounts for surface roughness affecting plating quality.
        
        Returns:
            float: Surface roughness factor (1.0 = smooth, >1.0 = rough)
        """
        self._ensure_mesh_loaded()
        
        # Analyze triangle areas to estimate surface roughness
        triangles = self.mesh.vectors
        areas = [self._calculate_triangle_area(tri) for tri in triangles]
        
        # Calculate coefficient of variation of triangle areas
        mean_area = np.mean(areas)
        std_area = np.std(areas)
        cv = std_area / mean_area if mean_area > 0 else 0
        
        # Convert to roughness factor (1.0 = smooth, 1.5 = rough)
        roughness_factor = 1.0 + (cv * 0.5)
        return min(roughness_factor, 1.5)  # Cap at 1.5

    def _calculate_coverage_efficiency(self) -> float:
        """
        Calculate coverage efficiency based on mesh complexity.
        
        Returns:
            float: Coverage efficiency (0.7-1.0, where 1.0 = perfect coverage)
        """
        self._ensure_mesh_loaded()
        
        # Analyze mesh complexity using aspect ratio and surface area to volume ratio
        bounds = self.get_bounding_box()
        aspect_ratio = self._calculate_aspect_ratio(bounds['dimensions'])
        sa_v_ratio = self.calculate_surface_area() / self.calculate_volume() if self.calculate_volume() > 0 else 0
        
        # Handle case where aspect_ratio is None (division by zero case)
        if aspect_ratio is None:
            aspect_ratio = 1.0  # Default to 1.0 for very thin objects
        
        # Complex shapes (high aspect ratio, high SA/V ratio) have lower coverage efficiency
        aspect_factor = min(aspect_ratio / 10.0, 1.0)  # Normalize aspect ratio
        sa_v_factor = min(sa_v_ratio / 10.0, 1.0)  # Normalize SA/V ratio
        
        # Calculate efficiency (0.7 = complex, 1.0 = simple)
        efficiency = 1.0 - (aspect_factor * 0.15) - (sa_v_factor * 0.15)
        return max(efficiency, 0.7)  # Minimum 70% efficiency

    def get_electroplating_recommendations(self, metal_type: str = 'copper') -> dict:
        """
        Get specific recommendations for different plating metals.
        
        Args:
            metal_type: Type of metal for plating ('nickel', 'copper', 'chrome', 'gold', 'silver')
            
        Returns:
            dict: Metal-specific recommendations
        """
        metal_properties = {
            'nickel': {
                'density_g_cm3': 8.9,
                'current_density_min': 0.07,
                'current_density_max': 0.1,
                'voltage': 6.0,
                'plating_rate_microns_per_min': 0.4,  # Realistic rate: ~0.4 µm/min at 0.085 A/in²
                'solution_cost_per_kg': 50.0,
                'color': 'Silver-gray',
                'hardness': 'Hard',
                'corrosion_resistance': 'Excellent',
                'typical_thickness_microns': 25.0
            },
            'copper': {
                'density_g_cm3': 8.96,
                'current_density_min': 0.07,
                'current_density_max': 0.1,
                'voltage': 3.0,
                'plating_rate_microns_per_min': 0.45,  # Realistic rate: ~0.45 µm/min at 0.085 A/in²
                'solution_cost_per_kg': 30.0,
                'color': 'Reddish-brown',
                'hardness': 'Soft',
                'corrosion_resistance': 'Good',
                'typical_thickness_microns': 20.0
            },
            'chrome': {
                'density_g_cm3': 7.19,
                'current_density_min': 0.1,
                'current_density_max': 0.15,
                'voltage': 12.0,
                'plating_rate_microns_per_min': 0.25,  # Realistic rate: ~0.25 µm/min at 0.125 A/in²
                'solution_cost_per_kg': 80.0,
                'color': 'Bright silver',
                'hardness': 'Very hard',
                'corrosion_resistance': 'Excellent',
                'typical_thickness_microns': 15.0
            },
            'gold': {
                'density_g_cm3': 19.32,
                'current_density_min': 0.02,
                'current_density_max': 0.05,
                'voltage': 3.0,
                'plating_rate_microns_per_min': 0.15,  # Realistic rate: ~0.15 µm/min at 0.035 A/in²
                'solution_cost_per_kg': 2000.0,
                'color': 'Yellow',
                'hardness': 'Soft',
                'corrosion_resistance': 'Excellent',
                'typical_thickness_microns': 5.0
            },
            'silver': {
                'density_g_cm3': 10.49,
                'current_density_min': 0.03,
                'current_density_max': 0.06,
                'voltage': 2.0,
                'plating_rate_microns_per_min': 0.2,  # Realistic rate: ~0.2 µm/min at 0.045 A/in²
                'solution_cost_per_kg': 500.0,
                'color': 'Bright silver',
                'hardness': 'Soft',  
                'corrosion_resistance': 'Good',
                'typical_thickness_microns': 10.0
            }
        }
        
        if metal_type.lower() not in metal_properties:
            raise ValueError(f"Unsupported metal type: {metal_type}")
        
        props = metal_properties[metal_type.lower()]
        
        # Calculate parameters using metal-specific properties
        plating_params = self.calculate_electroplating_parameters(
            current_density_min=props['current_density_min'],
            current_density_max=props['current_density_max'],
            plating_thickness_microns=props['typical_thickness_microns'],
            metal_density_g_cm3=props['density_g_cm3'],
            voltage=props['voltage']
        )
        
        # Add metal-specific recommendations
        recommendations = {
            'metal_properties': props,
            'calculated_parameters': plating_params,
            'metal_specific_tips': {
                'nickel': [
                    "Use bright nickel for decorative finish",
                    "Consider semi-bright nickel for better adhesion",
                    "Maintain pH between 3.5-4.5",
                    "Temperature: 45-55°C",
                    "Plating time calculated based on thickness and current density"
                ],
                'copper': [
                    "Excellent base layer for other metals",
                    "Use cyanide-free solutions for safety",
                    "Maintain pH between 8.5-9.5",
                    "Temperature: 25-35°C",
                    "Plating time calculated based on thickness and current density"
                ],
                'chrome': [
                    "Requires bright nickel underlayer",
                    "Use hexavalent chrome for decorative finish",
                    "Maintain temperature: 45-55°C",
                    "High current efficiency required",
                    "Plating time calculated based on thickness and current density"
                ],
                'gold': [
                    "Use bright gold for decorative finish",
                    "Consider flash gold for cost savings",
                    "Maintain pH between 4.0-5.0",
                    "Temperature: 25-35°C",
                    "Plating time calculated based on thickness and current density"
                ],
                'silver': [
                    "Excellent conductivity",
                    "Use bright silver for decorative finish",
                    "Maintain pH between 8.0-9.0",
                    "Temperature: 25-35°C",
                    "Plating time calculated based on thickness and current density"
                ]
            }
        }
        
        return recommendations

# Legacy function for backward compatibility
def calculate_surface_area(stl_mesh):
    """Legacy function for backward compatibility."""
    calculator = STLTools()
    calculator.mesh = stl_mesh
    return calculator.calculate_surface_area()

def load_stl_file(file_path):
    """Legacy function for backward compatibility."""
    calculator = STLTools()
    if calculator.load_file(file_path):
        return calculator.mesh
    return None

def main():
    """Command-line interface for the STL tools."""
    parser = argparse.ArgumentParser(
        description="STL Tools - Comprehensive STL file analysis and manipulation"
    )
    parser.add_argument(
        "stl_file",
        help="Path to the STL file"
    )
    parser.add_argument(
        "--action",
        choices=['analyze', 'validate', 'export', 'scale', 'translate'],
        default='analyze',
        help="Action to perform (default: analyze)"
    )
    parser.add_argument(
        "--output",
        help="Output file for export action"
    )
    parser.add_argument(
        "--scale",
        type=float,
        nargs='+',
        help="Scale factor(s) for scale action"
    )
    parser.add_argument(
        "--translate",
        type=float,
        nargs=3,
        help="Translation vector [x, y, z] for translate action"
    )
    parser.add_argument(
        "--format",
        choices=['json', 'txt'],
        default='json',
        help="Output format for export (default: json)"
    )
    parser.add_argument(
        "--save",
        help="Save modified mesh to file"
    )
    
    args = parser.parse_args()
    
    # Initialize STL tools
    stl_tools = STLTools()
    
    try:
        # Load the file
        stl_tools.load_file(args.stl_file)
        
        if args.action == 'analyze':
            stats = stl_tools.get_mesh_statistics()
            print(json.dumps(stats, indent=2))
            
        elif args.action == 'validate':
            validation = stl_tools.validate_mesh()
            print(json.dumps(validation, indent=2))
            
        elif args.action == 'export':
            if not args.output:
                print("Error: --output required for export action")
                sys.exit(1)
            success = stl_tools.export_statistics(args.output, args.format)
            if success:
                print(f"Statistics exported to {args.output}")
            else:
                print("Export failed")
                
        elif args.action == 'scale':
            if not args.scale:
                print("Error: --scale required for scale action")
                sys.exit(1)
            success = stl_tools.scale_mesh(args.scale)
            if success:
                print("Mesh scaled successfully")
                if args.save:
                    stl_tools.save_mesh(args.save)
                    print(f"Scaled mesh saved to {args.save}")
            else:
                print("Scaling failed")
                
        elif args.action == 'translate':
            if not args.translate:
                print("Error: --translate required for translate action")
                sys.exit(1)
            success = stl_tools.translate_mesh(args.translate)
            if success:
                print("Mesh translated successfully")
                if args.save:
                    stl_tools.save_mesh(args.save)
                    print(f"Translated mesh saved to {args.save}")
            else:
                print("Translation failed")
                
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()