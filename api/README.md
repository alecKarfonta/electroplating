# STL Analysis API

A comprehensive REST API for STL file analysis and manipulation, providing endpoints for mesh analysis, validation, manipulation, and cost estimation.

## Structure

```
api/
├── core/                 # Core API components
│   ├── __init__.py      # Core module exports
│   ├── models.py        # Pydantic models for request/response schemas
│   ├── session_manager.py # Session management and file handling
│   └── stl_tools.py     # STL file processing and analysis tools
├── utils/               # Utility scripts and helpers
│   ├── __init__.py      # Utils module
│   ├── client_example.py # Example client usage
│   └── run_api.py       # API server runner script
├── tests/               # Test suite
│   ├── __init__.py      # Tests module
│   └── test_api.py      # API endpoint tests
├── __init__.py          # Main API package exports
├── main.py              # FastAPI application and route definitions
└── README.md            # This file
```

## Core Components

### Models (`core/models.py`)
Pydantic models defining the API's request and response schemas:
- `APIResponse`: Generic response wrapper
- `FileUploadResponse`: File upload response
- `SessionInfo`: Session information
- `MeshInfo`: Basic mesh information
- `MeshStatistics`: Comprehensive mesh statistics
- `ValidationResult`: Mesh validation results
- `ResinCostEstimate`: Cost estimation results
- Request models for scaling, translation, and cost estimation

### Session Manager (`core/session_manager.py`)
Handles file uploads, session creation, and cleanup:
- Session-based file management
- Automatic cleanup of expired sessions
- STL tools instance management

### STL Tools (`core/stl_tools.py`)
Core STL file processing and analysis:
- Mesh loading and validation
- Statistics calculation (volume, surface area, etc.)
- Mesh manipulation (scaling, translation)
- Cost estimation
- Export functionality

## API Endpoints

### File Management
- `POST /upload` - Upload STL file and create session
- `GET /sessions` - List all active sessions
- `GET /sessions/{session_id}` - Get session information
- `DELETE /sessions/{session_id}` - Delete session

### Analysis
- `GET /sessions/{session_id}/info` - Basic mesh information
- `GET /sessions/{session_id}/analysis` - Comprehensive mesh statistics
- `GET /sessions/{session_id}/validation` - Mesh validation results
- `GET /sessions/{session_id}/convex-hull-volume` - Convex hull volume

### Manipulation
- `POST /sessions/{session_id}/scale` - Scale mesh
- `POST /sessions/{session_id}/translate` - Translate mesh

### Cost Estimation
- `POST /sessions/{session_id}/cost` - Estimate resin cost

### Export
- `POST /sessions/{session_id}/export` - Export statistics

### System
- `GET /` - API information and health check
- `GET /stats` - API usage statistics

## Usage

### Running the API
```bash
# Using uvicorn directly
uvicorn api.main:app --host 0.0.0.0 --port 8116

# Using the utility script
python -m api.utils.run_api

# Using Docker
docker build -t stl-api .
docker run -p 8116:8116 stl-api
```

### Client Example
See `utils/client_example.py` for a comprehensive example of how to interact with the API.

### Testing
Run the test suite:
```bash
python -m pytest api/tests/
```

## Dependencies

The API requires the following Python packages (see `requirements.txt`):
- FastAPI for the web framework
- uvicorn for ASGI server
- numpy-stl for STL file processing
- scipy for scientific computations
- pydantic for data validation
- python-multipart for file uploads
- aiofiles for async file operations

## Configuration

The API uses environment variables for configuration:
- `PYTHONPATH`: Set to `/app` in Docker
- Session timeout and cleanup intervals are configurable in `session_manager.py`

## Security

- Non-root user execution in Docker
- CORS middleware for cross-origin requests
- Input validation using Pydantic models
- Session-based file management with automatic cleanup 