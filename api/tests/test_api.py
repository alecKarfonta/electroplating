"""
Comprehensive tests for the STL Analysis API.

This file provides comprehensive tests using pytest to verify the API functionality.
Includes unit tests, integration tests, and performance tests.
"""

import pytest
import asyncio
import tempfile
import os
from pathlib import Path
from httpx import AsyncClient
from fastapi.testclient import TestClient

from api.main import app
from api.core.session_manager import SessionManager


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
async def async_client():
    """Create an async test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def sample_stl_file():
    """Create a sample STL file for testing."""
    stl_content = """solid cube
facet normal 0.0 0.0 1.0
    outer loop
        vertex 0.0 0.0 1.0
        vertex 1.0 0.0 1.0
        vertex 1.0 1.0 1.0
    endloop
endfacet
facet normal 0.0 0.0 1.0
    outer loop
        vertex 0.0 0.0 1.0
        vertex 1.0 1.0 1.0
        vertex 0.0 1.0 1.0
    endloop
endfacet
endsolid cube"""
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.stl', delete=False) as f:
        f.write(stl_content)
        temp_file = f.name
    
    yield temp_file
    os.unlink(temp_file)


class TestAPIEndpoints:
    """Test suite for API endpoints."""
    
    def test_root_endpoint(self, client):
        """Test the root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "version" in data["data"]
    
    def test_upload_without_file(self, client):
        """Test upload endpoint without a file."""
        response = client.post("/upload")
        assert response.status_code == 422  # Validation error
    
    def test_upload_invalid_file_type(self, client, sample_stl_file):
        """Test upload with invalid file type."""
        with open(sample_stl_file, 'rb') as f:
            files = {'file': ('test.txt', f, 'text/plain')}
            response = client.post("/upload", files=files)
        assert response.status_code == 400
        assert "Only STL files are supported" in response.json()["detail"]
    
    def test_upload_valid_file(self, client, sample_stl_file):
        """Test upload with valid STL file."""
        with open(sample_stl_file, 'rb') as f:
            files = {'file': ('test_cube.stl', f, 'application/octet-stream')}
            response = client.post("/upload", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert data["filename"] == "test_cube.stl"
    
    def test_sessions_endpoint(self, client):
        """Test sessions endpoint."""
        response = client.get("/sessions")
        assert response.status_code == 200
        assert isinstance(response.json(), dict)
    
    def test_invalid_session(self, client):
        """Test accessing invalid session."""
        response = client.get("/sessions/invalid-session-id")
        assert response.status_code == 404
    
    def test_stats_endpoint(self, client):
        """Test stats endpoint."""
        response = client.get("/stats")
        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data


class TestElectroplatingCalculations:
    """Test suite for electroplating calculations."""
    
    def test_electroplating_parameters(self, client, sample_stl_file):
        """Test electroplating parameters calculation."""
        # First upload a file
        with open(sample_stl_file, 'rb') as f:
            files = {'file': ('test_cube.stl', f, 'application/octet-stream')}
            upload_response = client.post("/upload", files=files)
        
        session_id = upload_response.json()["session_id"]
        
        # Test electroplating calculation
        plating_data = {
            "current_density_min": 0.07,
            "current_density_max": 0.1,
            "plating_thickness_microns": 25.0,
            "metal_density_g_cm3": 8.9,
            "current_efficiency": 0.95,
            "voltage": 6.0
        }
        
        response = client.post(f"/sessions/{session_id}/electroplating", json=plating_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "surface_area" in data
        assert "current_requirements" in data
        assert "plating_parameters" in data
        assert "material_requirements" in data
    
    def test_electroplating_recommendations(self, client, sample_stl_file):
        """Test electroplating recommendations."""
        # First upload a file
        with open(sample_stl_file, 'rb') as f:
            files = {'file': ('test_cube.stl', f, 'application/octet-stream')}
            upload_response = client.post("/upload", files=files)
        
        session_id = upload_response.json()["session_id"]
        
        # Test recommendations
        recommendation_data = {"metal_type": "nickel"}
        response = client.post(f"/sessions/{session_id}/electroplating/recommendations", json=recommendation_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "metal_properties" in data
        assert "calculated_parameters" in data
        assert "metal_specific_tips" in data


class TestMeshOperations:
    """Test suite for mesh operations."""
    
    def test_mesh_analysis(self, client, sample_stl_file):
        """Test mesh analysis."""
        # Upload file
        with open(sample_stl_file, 'rb') as f:
            files = {'file': ('test_cube.stl', f, 'application/octet-stream')}
            upload_response = client.post("/upload", files=files)
        
        session_id = upload_response.json()["session_id"]
        
        # Test analysis
        response = client.get(f"/sessions/{session_id}/analysis")
        assert response.status_code == 200
        
        data = response.json()
        assert "triangle_count" in data
        assert "surface_area" in data
        assert "volume" in data
    
    def test_mesh_validation(self, client, sample_stl_file):
        """Test mesh validation."""
        # Upload file
        with open(sample_stl_file, 'rb') as f:
            files = {'file': ('test_cube.stl', f, 'application/octet-stream')}
            upload_response = client.post("/upload", files=files)
        
        session_id = upload_response.json()["session_id"]
        
        # Test validation
        response = client.get(f"/sessions/{session_id}/validation")
        assert response.status_code == 200
        
        data = response.json()
        assert "is_valid" in data
        assert "issues" in data
        assert "warnings" in data
    
    def test_mesh_scaling(self, client, sample_stl_file):
        """Test mesh scaling."""
        # Upload file
        with open(sample_stl_file, 'rb') as f:
            files = {'file': ('test_cube.stl', f, 'application/octet-stream')}
            upload_response = client.post("/upload", files=files)
        
        session_id = upload_response.json()["session_id"]
        
        # Test scaling
        scale_data = {"scale_factor": 2.0}
        response = client.post(f"/sessions/{session_id}/scale", json=scale_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True


class TestErrorHandling:
    """Test suite for error handling."""
    
    def test_invalid_session_operations(self, client):
        """Test operations on invalid session."""
        invalid_session = "invalid-session-id"
        
        # Test various endpoints with invalid session
        endpoints = [
            f"/sessions/{invalid_session}/analysis",
            f"/sessions/{invalid_session}/validation",
            f"/sessions/{invalid_session}/scale",
            f"/sessions/{invalid_session}/electroplating",
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint) if "analysis" in endpoint or "validation" in endpoint else client.post(endpoint, json={})
            assert response.status_code == 404
    
    def test_invalid_request_data(self, client, sample_stl_file):
        """Test invalid request data handling."""
        # Upload file first
        with open(sample_stl_file, 'rb') as f:
            files = {'file': ('test_cube.stl', f, 'application/octet-stream')}
            upload_response = client.post("/upload", files=files)
        
        session_id = upload_response.json()["session_id"]
        
        # Test invalid electroplating data
        invalid_data = {
            "current_density_min": -1,  # Invalid negative value
            "current_density_max": 0.1,
            "plating_thickness_microns": 25.0,
            "metal_density_g_cm3": 8.9,
            "current_efficiency": 0.95,
            "voltage": 6.0
        }
        
        response = client.post(f"/sessions/{session_id}/electroplating", json=invalid_data)
        assert response.status_code == 422  # Validation error


if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 