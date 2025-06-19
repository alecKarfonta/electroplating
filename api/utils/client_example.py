"""
STL API Client Example - Demonstrates how to use the STL Analysis API.

This example shows:
- File upload and session management
- Mesh analysis and statistics
- Mesh validation
- Cost estimation
- Export functionality
- Error handling and best practices
"""

import requests
import json
import time
from typing import Dict, Any, Optional
from pathlib import Path


class STLAPIClient:
    """
    Client for interacting with the STL Analysis API.
    
    This client provides a convenient interface for:
    - Uploading STL files
    - Managing sessions
    - Performing mesh analysis
    - Estimating costs
    - Exporting results
    """
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        """
        Initialize the API client.
        
        Args:
            base_url: Base URL of the STL API
        """
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json'
        })
    
    def upload_file(self, file_path: str) -> Dict[str, Any]:
        """
        Upload an STL file and create a session.
        
        Args:
            file_path: Path to the STL file
            
        Returns:
            Upload response with session information
        """
        if not Path(file_path).exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        if not file_path.lower().endswith('.stl'):
            raise ValueError("Only STL files are supported")
        
        with open(file_path, 'rb') as f:
            files = {'file': (Path(file_path).name, f, 'application/octet-stream')}
            response = self.session.post(f"{self.base_url}/upload", files=files)
        
        response.raise_for_status()
        return response.json()
    
    def get_session_info(self, session_id: str) -> Dict[str, Any]:
        """Get information about a session."""
        response = self.session.get(f"{self.base_url}/sessions/{session_id}")
        response.raise_for_status()
        return response.json()
    
    def list_sessions(self) -> Dict[str, Any]:
        """List all active sessions."""
        response = self.session.get(f"{self.base_url}/sessions")
        response.raise_for_status()
        return response.json()
    
    def delete_session(self, session_id: str) -> Dict[str, Any]:
        """Delete a session."""
        response = self.session.delete(f"{self.base_url}/sessions/{session_id}")
        response.raise_for_status()
        return response.json()
    
    def get_mesh_info(self, session_id: str) -> Dict[str, Any]:
        """Get basic mesh information."""
        response = self.session.get(f"{self.base_url}/sessions/{session_id}/info")
        response.raise_for_status()
        return response.json()
    
    def get_mesh_statistics(self, session_id: str) -> Dict[str, Any]:
        """Get comprehensive mesh statistics."""
        response = self.session.get(f"{self.base_url}/sessions/{session_id}/analysis")
        response.raise_for_status()
        return response.json()
    
    def validate_mesh(self, session_id: str) -> Dict[str, Any]:
        """Validate the mesh for issues."""
        response = self.session.get(f"{self.base_url}/sessions/{session_id}/validation")
        response.raise_for_status()
        return response.json()
    
    def scale_mesh(self, session_id: str, scale_factor: float) -> Dict[str, Any]:
        """Scale the mesh by a factor."""
        data = {"scale_factor": scale_factor}
        response = self.session.post(f"{self.base_url}/sessions/{session_id}/scale", json=data, headers={"Content-Type": "application/json"})
        response.raise_for_status()
        return response.json()
    
    def translate_mesh(self, session_id: str, translation: list) -> Dict[str, Any]:
        """Translate the mesh by a vector."""
        data = {"translation": translation}
        response = self.session.post(f"{self.base_url}/sessions/{session_id}/translate", json=data, headers={"Content-Type": "application/json"})
        response.raise_for_status()
        return response.json()
    
    def estimate_cost(self, session_id: str, resin_density: float, resin_price: float, volume_unit: str = "mm3") -> Dict[str, Any]:
        """Estimate resin cost for printing."""
        data = {
            "resin_density_g_cm3": resin_density,
            "resin_price_per_kg": resin_price,
            "volume_unit": volume_unit
        }
        response = self.session.post(f"{self.base_url}/sessions/{session_id}/cost", json=data, headers={"Content-Type": "application/json"})
        response.raise_for_status()
        return response.json()
    
    def export_statistics(self, session_id: str, format: str = "json", output_path: Optional[str] = None) -> str:
        """Export mesh statistics to a file."""
        data = {"format": format}
        response = self.session.post(f"{self.base_url}/sessions/{session_id}/export", json=data, headers={"Content-Type": "application/json"})
        response.raise_for_status()
        
        if output_path:
            with open(output_path, 'wb') as f:
                f.write(response.content)
            return output_path
        else:
            # Save to default location
            filename = f"mesh_statistics.{format}"
            with open(filename, 'wb') as f:
                f.write(response.content)
            return filename
    
    def get_convex_hull_volume(self, session_id: str) -> Dict[str, Any]:
        """Get convex hull volume (requires scipy)."""
        response = self.session.get(f"{self.base_url}/sessions/{session_id}/convex-hull-volume")
        response.raise_for_status()
        return response.json()
    
    def get_api_stats(self) -> Dict[str, Any]:
        """Get API statistics."""
        response = self.session.get(f"{self.base_url}/stats")
        response.raise_for_status()
        return response.json()


def example_usage():
    """Example usage of the STL API client."""
    
    # Initialize client
    client = STLAPIClient("http://localhost:8000")
    
    try:
        print("=== STL API Client Example ===\n")
        
        # Check API status
        print("1. Checking API status...")
        response = client.session.get(f"{client.base_url}/")
        if response.status_code == 200:
            print("✓ API is running")
        else:
            print("✗ API is not responding")
            return
        
        # Upload a sample STL file (you'll need to provide a real file)
        print("\n2. Uploading STL file...")
        try:
            # Replace with path to your STL file
            upload_result = client.upload_file("sample.stl")
            session_id = upload_result['session_id']
            print(f"✓ File uploaded successfully")
            print(f"  Session ID: {session_id}")
            print(f"  Filename: {upload_result['filename']}")
            print(f"  File size: {upload_result['file_size']} bytes")
        except FileNotFoundError:
            print("✗ Sample STL file not found. Please provide a valid STL file path.")
            return
        except Exception as e:
            print(f"✗ Upload failed: {e}")
            return
        
        # Get session information
        print("\n3. Getting session information...")
        session_info = client.get_session_info(session_id)
        print(f"✓ Session info retrieved")
        print(f"  Upload time: {session_info['upload_time']}")
        print(f"  Last accessed: {session_info['last_accessed']}")
        
        # Get basic mesh information
        print("\n4. Getting mesh information...")
        mesh_info = client.get_mesh_info(session_id)
        print(f"✓ Mesh info retrieved")
        print(f"  Triangle count: {mesh_info['triangle_count']:,}")
        print(f"  Surface area: {mesh_info['surface_area']:.2f}")
        print(f"  Volume: {mesh_info['volume']:.2f}")
        print(f"  Center of mass: {mesh_info['center_of_mass']}")
        
        # Get comprehensive statistics
        print("\n5. Getting comprehensive statistics...")
        stats = client.get_mesh_statistics(session_id)
        print(f"✓ Statistics retrieved")
        print(f"  Vertex count: {stats['vertex_count']:,}")
        print(f"  Aspect ratio: {stats['aspect_ratio']:.3f}")
        print(f"  SA/V ratio: {stats['surface_area_to_volume_ratio']:.3f}")
        print(f"  Triangle areas - Min: {stats['triangle_areas']['min']:.6f}, Max: {stats['triangle_areas']['max']:.6f}")
        
        # Validate mesh
        print("\n6. Validating mesh...")
        validation = client.validate_mesh(session_id)
        print(f"✓ Validation completed")
        print(f"  Is valid: {validation['is_valid']}")
        if validation['issues']:
            print(f"  Issues: {', '.join(validation['issues'])}")
        if validation['warnings']:
            print(f"  Warnings: {', '.join(validation['warnings'])}")
        
        # Estimate resin cost
        print("\n7. Estimating resin cost...")
        cost_estimate = client.estimate_cost(
            session_id,
            resin_density=1.1,  # g/cm³
            resin_price=50.0    # $/kg
        )
        print(f"✓ Cost estimation completed")
        print(f"  Volume: {cost_estimate['volume_cm3']:.2f} cm³")
        print(f"  Mass: {cost_estimate['mass_g']:.2f} g ({cost_estimate['mass_kg']:.3f} kg)")
        print(f"  Cost: ${cost_estimate['cost']:.2f}")
        
        # Try convex hull volume (requires scipy)
        print("\n8. Calculating convex hull volume...")
        try:
            hull_result = client.get_convex_hull_volume(session_id)
            if hull_result['success']:
                print(f"✓ Convex hull volume: {hull_result['data']['convex_hull_volume']:.2f}")
            else:
                print(f"✗ {hull_result['message']}")
        except Exception as e:
            print(f"✗ Convex hull calculation failed: {e}")
        
        # Export statistics
        print("\n9. Exporting statistics...")
        try:
            export_file = client.export_statistics(session_id, format="json")
            print(f"✓ Statistics exported to: {export_file}")
        except Exception as e:
            print(f"✗ Export failed: {e}")
        
        # List all sessions
        print("\n10. Listing all sessions...")
        sessions = client.list_sessions()
        print(f"✓ Found {len(sessions)} active sessions")
        for sid, session in sessions.items():
            print(f"  - {sid}: {session['filename']} ({session['file_size']} bytes)")
        
        # Get API statistics
        print("\n11. Getting API statistics...")
        api_stats = client.get_api_stats()
        print(f"✓ API stats retrieved")
        print(f"  Total sessions: {api_stats['sessions']['total_sessions']}")
        print(f"  Cached instances: {api_stats['sessions']['cached_instances']}")
        
        # Clean up - delete session
        print("\n12. Cleaning up...")
        delete_result = client.delete_session(session_id)
        print(f"✓ Session deleted: {delete_result['message']}")
        
        print("\n=== Example completed successfully! ===")
        
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to the API. Make sure it's running on http://localhost:8000")
    except Exception as e:
        print(f"✗ Error during example: {e}")


def advanced_usage_example():
    """Advanced usage example with mesh manipulation."""
    
    client = STLAPIClient("http://localhost:8000")
    
    try:
        print("=== Advanced Usage Example ===\n")
        
        # Upload file
        upload_result = client.upload_file("sample.stl")
        session_id = upload_result['session_id']
        print(f"✓ File uploaded: {upload_result['filename']}")
        
        # Get original mesh info
        original_info = client.get_mesh_info(session_id)
        print(f"Original volume: {original_info['volume']:.2f}")
        
        # Scale the mesh
        print("\nScaling mesh by 2x...")
        scale_result = client.scale_mesh(session_id, 2.0)
        print(f"✓ {scale_result['message']}")
        
        # Get scaled mesh info
        scaled_info = client.get_mesh_info(session_id)
        print(f"Scaled volume: {scaled_info['volume']:.2f}")
        print(f"Volume ratio: {scaled_info['volume'] / original_info['volume']:.2f}")
        
        # Translate the mesh
        print("\nTranslating mesh by [10, 5, 0]...")
        translate_result = client.translate_mesh(session_id, [10, 5, 0])
        print(f"✓ {translate_result['message']}")
        
        # Get final mesh info
        final_info = client.get_mesh_info(session_id)
        print(f"Final center of mass: {final_info['center_of_mass']}")
        
        # Clean up
        client.delete_session(session_id)
        print("\n✓ Session cleaned up")
        
    except Exception as e:
        print(f"✗ Advanced example failed: {e}")


if __name__ == "__main__":
    # Run basic example
    example_usage()
    
    print("\n" + "="*50 + "\n")
    
    # Run advanced example
    advanced_usage_example() 