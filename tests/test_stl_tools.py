#!/usr/bin/env python3
"""
Test script for STL Tools

This script demonstrates the various features of the STLTools class.
It creates a simple test cube and shows how to use the different methods.
"""

import numpy as np
from stl import mesh
from api.stl import STLTools
import tempfile
import os

def create_test_cube():
    """Create a simple test cube STL file."""
    # Create a simple cube
    vertices = np.array([
        [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],  # bottom face
        [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]   # top face
    ])
    
    # Define the 12 triangles of the cube
    faces = np.array([
        [0, 3, 1], [1, 3, 2],  # bottom face
        [0, 4, 7], [0, 7, 3],  # left face
        [1, 2, 6], [1, 6, 5],  # right face
        [2, 3, 7], [2, 7, 6],  # front face
        [0, 1, 5], [0, 5, 4],  # back face
        [4, 5, 6], [4, 6, 7]   # top face
    ])
    
    # Create the mesh
    cube = mesh.Mesh(np.zeros(faces.shape[0], dtype=mesh.Mesh.dtype))
    for i, face in enumerate(faces):
        for j in range(3):
            cube.vectors[i][j] = vertices[face[j]]
    
    return cube

def test_basic_functionality():
    """Test basic STL tools functionality."""
    print("=== Testing Basic Functionality ===")
    
    # Create a test cube
    cube = create_test_cube()
    
    # Save it to a temporary file
    with tempfile.NamedTemporaryFile(suffix='.stl', delete=False) as tmp_file:
        cube.save(tmp_file.name)
        tmp_filename = tmp_file.name
    
    try:
        # Initialize STL tools
        stl_tools = STLTools()
        
        # Load the file
        print(f"Loading test cube from {tmp_filename}")
        stl_tools.load_file(tmp_filename)
        
        # Test basic calculations
        surface_area = stl_tools.calculate_surface_area()
        volume = stl_tools.calculate_volume()
        center = stl_tools.get_center_of_mass()
        bounds = stl_tools.get_bounding_box()
        
        print(f"Surface Area: {surface_area:.6f}")
        print(f"Volume: {volume:.6f}")
        print(f"Center of Mass: {center}")
        print(f"Bounding Box: {bounds}")
        
        # Test mesh statistics
        stats = stl_tools.get_mesh_statistics()
        print(f"Triangle Count: {stats['triangle_count']}")
        print(f"Vertex Count: {stats['vertex_count']}")
        print(f"Aspect Ratio: {stats['aspect_ratio']:.3f}")
        print(f"SA/V Ratio: {stats['surface_area_to_volume_ratio']:.3f}")
        
    finally:
        # Clean up
        os.unlink(tmp_filename)

def test_validation():
    """Test mesh validation functionality."""
    print("\n=== Testing Mesh Validation ===")
    
    # Create a test cube
    cube = create_test_cube()
    
    # Save it to a temporary file
    with tempfile.NamedTemporaryFile(suffix='.stl', delete=False) as tmp_file:
        cube.save(tmp_file.name)
        tmp_filename = tmp_file.name
    
    try:
        stl_tools = STLTools()
        stl_tools.load_file(tmp_filename)
        
        # Test validation
        validation = stl_tools.validate_mesh()
        print(f"Mesh Valid: {validation['is_valid']}")
        if validation['issues']:
            print(f"Issues: {validation['issues']}")
        if validation['warnings']:
            print(f"Warnings: {validation['warnings']}")
        
    finally:
        os.unlink(tmp_filename)

def test_manipulation():
    """Test mesh manipulation functionality."""
    print("\n=== Testing Mesh Manipulation ===")
    
    # Create a test cube
    cube = create_test_cube()
    
    # Save it to a temporary file
    with tempfile.NamedTemporaryFile(suffix='.stl', delete=False) as tmp_file:
        cube.save(tmp_file.name)
        tmp_filename = tmp_file.name
    
    try:
        stl_tools = STLTools()
        stl_tools.load_file(tmp_filename)
        
        # Get original stats
        original_stats = stl_tools.get_mesh_statistics()
        print(f"Original Volume: {original_stats['volume']:.6f}")
        print(f"Original Surface Area: {original_stats['surface_area']:.6f}")
        
        # Test scaling
        print("\nScaling mesh by 2x...")
        stl_tools.scale_mesh(2.0)
        scaled_stats = stl_tools.get_mesh_statistics()
        print(f"Scaled Volume: {scaled_stats['volume']:.6f}")
        print(f"Scaled Surface Area: {scaled_stats['surface_area']:.6f}")
        
        # Test translation
        print("\nTranslating mesh by [1, 1, 1]...")
        stl_tools.translate_mesh([1, 1, 1])
        translated_stats = stl_tools.get_mesh_statistics()
        print(f"Translated Center: {translated_stats['center_of_mass']}")
        
        # Save modified mesh
        with tempfile.NamedTemporaryFile(suffix='.stl', delete=False) as tmp_file2:
            modified_filename = tmp_file2.name
        
        try:
            stl_tools.save_mesh(modified_filename)
            print(f"Modified mesh saved to {modified_filename}")
            
            # Verify the saved file
            stl_tools2 = STLTools()
            stl_tools2.load_file(modified_filename)
            saved_stats = stl_tools2.get_mesh_statistics()
            print(f"Saved mesh volume: {saved_stats['volume']:.6f}")
            
        finally:
            os.unlink(modified_filename)
        
    finally:
        os.unlink(tmp_filename)

def test_export():
    """Test export functionality."""
    print("\n=== Testing Export Functionality ===")
    
    # Create a test cube
    cube = create_test_cube()
    
    # Save it to a temporary file
    with tempfile.NamedTemporaryFile(suffix='.stl', delete=False) as tmp_file:
        cube.save(tmp_file.name)
        tmp_filename = tmp_file.name
    
    try:
        stl_tools = STLTools()
        stl_tools.load_file(tmp_filename)
        
        # Test JSON export
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tmp_json:
            json_filename = tmp_json.name
        
        try:
            success = stl_tools.export_statistics(json_filename, 'json')
            print(f"JSON export successful: {success}")
            
            # Read and display part of the exported JSON
            with open(json_filename, 'r') as f:
                content = f.read()
                print(f"Exported JSON (first 200 chars): {content[:200]}...")
                
        finally:
            os.unlink(json_filename)
        
        # Test text export
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as tmp_txt:
            txt_filename = tmp_txt.name
        
        try:
            success = stl_tools.export_statistics(txt_filename, 'txt')
            print(f"Text export successful: {success}")
            
            # Read and display the exported text
            with open(txt_filename, 'r') as f:
                content = f.read()
                print("Exported text:")
                print(content)
                
        finally:
            os.unlink(txt_filename)
        
    finally:
        os.unlink(tmp_filename)

def test_advanced_features():
    """Test advanced features like convex hull."""
    print("\n=== Testing Advanced Features ===")
    
    # Create a test cube
    cube = create_test_cube()
    
    # Save it to a temporary file
    with tempfile.NamedTemporaryFile(suffix='.stl', delete=False) as tmp_file:
        cube.save(tmp_file.name)
        tmp_filename = tmp_file.name
    
    try:
        stl_tools = STLTools()
        stl_tools.load_file(tmp_filename)
        
        # Test convex hull volume
        hull_volume = stl_tools.get_convex_hull_volume()
        if hull_volume is not None:
            print(f"Convex Hull Volume: {hull_volume:.6f}")
        else:
            print("Convex hull calculation not available (scipy required)")
        
        # Test detailed statistics
        stats = stl_tools.get_mesh_statistics()
        print(f"Triangle Area Statistics:")
        print(f"  Min: {stats['triangle_areas']['min']:.6f}")
        print(f"  Max: {stats['triangle_areas']['max']:.6f}")
        print(f"  Mean: {stats['triangle_areas']['mean']:.6f}")
        print(f"  Std: {stats['triangle_areas']['std']:.6f}")
        
        print(f"Edge Length Statistics:")
        print(f"  Min: {stats['edge_lengths']['min']:.6f}")
        print(f"  Max: {stats['edge_lengths']['max']:.6f}")
        print(f"  Mean: {stats['edge_lengths']['mean']:.6f}")
        print(f"  Std: {stats['edge_lengths']['std']:.6f}")
        
    finally:
        os.unlink(tmp_filename)

def main():
    """Run all tests."""
    print("STL Tools Test Suite")
    print("===================")
    
    try:
        test_basic_functionality()
        test_validation()
        test_manipulation()
        test_export()
        test_advanced_features()
        
        print("\n=== All Tests Completed Successfully ===")
        
    except Exception as e:
        print(f"\nTest failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 