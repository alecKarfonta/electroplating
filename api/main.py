"""
STL Analysis API - A comprehensive REST API for STL file analysis and manipulation.

This API provides endpoints for:
- File upload and session management
- Mesh analysis and statistics
- Mesh validation and repair suggestions
- Mesh manipulation (scaling, translation)
- Cost estimation for 3D printing
- Export functionality

The API uses session-based file management to avoid redundant uploads
and provides comprehensive error handling and validation.
"""

import os
import asyncio
from typing import Dict, Any
from datetime import datetime
import logging

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
import uvicorn

from .core import (
    APIResponse, FileUploadResponse, SessionInfo, MeshInfo, MeshStatistics,
    ValidationResult, ResinCostEstimate, ScaleRequest, TranslateRequest,
    ResinCostRequest, ExportRequest, SessionManager, STLTools,
    ElectroplatingRequest, ElectroplatingEstimate, ElectroplatingRecommendationRequest,
    ElectroplatingRecommendations
)
from .core.logger import setup_logging, get_logger, PerformanceLogger
from .core.rate_limiter import get_rate_limiter, rate_limit_decorator

# Setup logging
setup_logging(
    log_level=os.getenv('LOG_LEVEL', 'INFO'),
    log_file=os.getenv('LOG_FILE', './logs/api.log'),
    use_colors=True,
    json_format=False
)

logger = get_logger('FastAPI')

# Initialize FastAPI app
app = FastAPI(
    title="STL Analysis API",
    description="A comprehensive REST API for STL file analysis and manipulation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('ALLOWED_ORIGINS', 'http://localhost:3017,http://localhost:3000').split(','),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Initialize session manager
session_manager = SessionManager()

# Security configuration
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB limit
ALLOWED_EXTENSIONS = {'.stl'}

# Background task for cleanup
async def cleanup_expired_sessions():
    """Background task to clean up expired sessions."""
    while True:
        try:
            with PerformanceLogger(logger, "session cleanup"):
                cleaned = session_manager.cleanup_expired_sessions()
                if cleaned > 0:
                    logger.info(f"Cleaned up {cleaned} expired sessions", sessions_cleaned=cleaned)
        except Exception as e:
            logger.error(f"Error during session cleanup: {e}", error=str(e))
        
        # Run cleanup every 10 minutes
        await asyncio.sleep(600)


@app.on_event("startup")
async def startup_event():
    """Startup event handler."""
    logger.info("Starting STL Analysis API", version="1.0.0")
    # Start background cleanup task
    asyncio.create_task(cleanup_expired_sessions())


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler."""
    logger.info("Shutting down STL Analysis API")
    # Cleanup rate limiter
    rate_limiter = get_rate_limiter()
    await rate_limiter.cleanup()


def get_stl_tools(session_id: str) -> STLTools:
    """
    Dependency to get STLTools instance for a session.
    
    Args:
        session_id: Session identifier
        
    Returns:
        STLTools instance
        
    Raises:
        HTTPException: If session not found or STL tools cannot be loaded
    """
    stl_tools = session_manager.get_stl_tools(session_id)
    if not stl_tools:
        logger.warning(f"Session not found or STL tools could not be loaded", session_id=session_id)
        raise HTTPException(status_code=404, detail="Session not found or STL file could not be loaded")
    return stl_tools


@app.get("/", response_model=APIResponse)
async def root():
    """Root endpoint with API information."""
    logger.info("Root endpoint accessed")
    return APIResponse(
        success=True,
        message="STL Analysis API is running",
        data={
            "version": "1.0.0",
            "docs": "/docs",
            "endpoints": {
                "upload": "/upload",
                "sessions": "/sessions",
                "analysis": "/sessions/{session_id}/analysis",
                "validation": "/sessions/{session_id}/validation",
                "manipulation": "/sessions/{session_id}/scale, /sessions/{session_id}/translate",
                "cost_estimation": "/sessions/{session_id}/cost",
                "electroplating": "/sessions/{session_id}/electroplating",
                "electroplating_recommendations": "/sessions/{session_id}/electroplating/recommendations",
                "export": "/sessions/{session_id}/export"
            }
        }
    )


@app.post("/upload", response_model=FileUploadResponse)
@rate_limit_decorator("upload", "default")
async def upload_stl_file(request: Request, file: UploadFile = File(...)):
    """
    Upload an STL file and create a session.
    
    Args:
        request: FastAPI request object
        file: STL file to upload
        
    Returns:
        FileUploadResponse with session information
    """
    client_ip = request.client.host if request.client else "unknown"
    logger.info(f"File upload request received", filename=file.filename, client_ip=client_ip)
    
    # Validate file type
    if not file.filename.lower().endswith(tuple(ALLOWED_EXTENSIONS)):
        logger.warning(f"Invalid file type attempted", filename=file.filename, client_ip=client_ip)
        raise HTTPException(status_code=400, detail="Only STL files are supported")
    
    # Read file content
    try:
        content = await file.read()
        if len(content) == 0:
            logger.warning(f"Empty file uploaded", filename=file.filename, client_ip=client_ip)
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Validate file size
        if len(content) > MAX_FILE_SIZE:
            logger.warning(f"File size exceeds limit", filename=file.filename, file_size=len(content), 
                          max_size=MAX_FILE_SIZE, client_ip=client_ip)
            raise HTTPException(status_code=400, detail="File size exceeds the allowed limit")
    except Exception as e:
        logger.error(f"Error reading file", filename=file.filename, error=str(e), client_ip=client_ip)
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    # Create session
    try:
        with PerformanceLogger(logger, "session creation"):
            session_id, file_path = await session_manager.create_session(content, file.filename)
        
        logger.info(f"Session created successfully", session_id=session_id, filename=file.filename, 
                   file_size=len(content), client_ip=client_ip)
        
        return FileUploadResponse(
            session_id=session_id,
            filename=file.filename,
            file_size=len(content),
            message="File uploaded successfully"
        )
    except Exception as e:
        logger.error(f"Error creating session", filename=file.filename, error=str(e), client_ip=client_ip)
        raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")


@app.get("/sessions", response_model=Dict[str, SessionInfo])
async def list_sessions():
    """List all active sessions."""
    logger.info("Listing all sessions")
    sessions = session_manager.list_sessions()
    return {k: SessionInfo(**v) for k, v in sessions.items() if v is not None}


@app.get("/sessions/{session_id}", response_model=SessionInfo)
async def get_session_info(session_id: str):
    """Get information about a specific session."""
    logger.info(f"Getting session info", session_id=session_id)
    session_info = session_manager.get_session_info(session_id)
    if not session_info:
        logger.warning(f"Session not found", session_id=session_id)
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionInfo(**session_info)


@app.delete("/sessions/{session_id}", response_model=APIResponse)
async def delete_session(session_id: str):
    """Delete a session and clean up associated files."""
    logger.info(f"Deleting session", session_id=session_id)
    success = session_manager.delete_session(session_id)
    if not success:
        logger.warning(f"Session not found for deletion", session_id=session_id)
        raise HTTPException(status_code=404, detail="Session not found")
    
    logger.info(f"Session deleted successfully", session_id=session_id)
    return APIResponse(
        success=True,
        message="Session deleted successfully"
    )


@app.get("/sessions/{session_id}/info", response_model=MeshInfo)
async def get_mesh_info(session_id: str, stl_tools: STLTools = Depends(get_stl_tools)):
    """Get basic mesh information."""
    logger.info(f"Getting mesh info", session_id=session_id)
    try:
        with PerformanceLogger(logger, "mesh info retrieval"):
            mesh_info = stl_tools.get_mesh_info()
        return MeshInfo(**mesh_info)
    except Exception as e:
        logger.error(f"Error getting mesh info", session_id=session_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Error getting mesh info: {str(e)}")


@app.get("/sessions/{session_id}/analysis", response_model=MeshStatistics)
async def get_mesh_statistics(session_id: str, stl_tools: STLTools = Depends(get_stl_tools)):
    """Get comprehensive mesh statistics."""
    logger.info(f"Getting mesh statistics", session_id=session_id)
    try:
        with PerformanceLogger(logger, "mesh statistics calculation"):
            statistics = stl_tools.get_mesh_statistics()
        return MeshStatistics(**statistics)
    except Exception as e:
        logger.error(f"Error getting mesh statistics", session_id=session_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Error getting mesh statistics: {str(e)}")


@app.get("/sessions/{session_id}/validation", response_model=ValidationResult)
async def validate_mesh(session_id: str, stl_tools: STLTools = Depends(get_stl_tools)):
    """Validate the mesh for common issues."""
    logger.info(f"Validating mesh", session_id=session_id)
    try:
        with PerformanceLogger(logger, "mesh validation"):
            validation = stl_tools.validate_mesh()
        return ValidationResult(**validation)
    except Exception as e:
        logger.error(f"Error validating mesh", session_id=session_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Error validating mesh: {str(e)}")


@app.post("/sessions/{session_id}/scale", response_model=APIResponse)
async def scale_mesh(
    session_id: str,
    scale_request: ScaleRequest,
    stl_tools: STLTools = Depends(get_stl_tools)
):
    """Scale the mesh by the specified factor."""
    logger.info(f"Scaling mesh", session_id=session_id, scale_factor=scale_request.scale_factor)
    try:
        with PerformanceLogger(logger, "mesh scaling"):
            success = stl_tools.scale_mesh(scale_request.scale_factor)
        if not success:
            raise Exception("Scaling operation failed")
        
        logger.info(f"Mesh scaled successfully", session_id=session_id, scale_factor=scale_request.scale_factor)
        return APIResponse(
            success=True,
            message="Mesh scaled successfully"
        )
    except Exception as e:
        logger.error(f"Error scaling mesh", session_id=session_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Error scaling mesh: {str(e)}")


@app.post("/sessions/{session_id}/reset", response_model=APIResponse)
async def reset_mesh(session_id: str):
    """Reset the mesh to its original state."""
    logger.info(f"Resetting mesh", session_id=session_id)
    try:
        # Reload the original file
        session = session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        stl_tools = STLTools()
        stl_tools.load_file(session['file_path'])
        session_manager.stl_instances[session_id] = stl_tools
        
        logger.info(f"Mesh reset successfully", session_id=session_id)
        return APIResponse(
            success=True,
            message="Mesh reset successfully"
        )
    except Exception as e:
        logger.error(f"Error resetting mesh", session_id=session_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Error resetting mesh: {str(e)}")


@app.post("/sessions/{session_id}/translate", response_model=APIResponse)
async def translate_mesh(
    session_id: str,
    translate_request: TranslateRequest,
    stl_tools: STLTools = Depends(get_stl_tools)
):
    """Translate the mesh by the specified vector."""
    logger.info(f"Translating mesh", session_id=session_id, translation=translate_request.translation)
    try:
        with PerformanceLogger(logger, "mesh translation"):
            success = stl_tools.translate_mesh(translate_request.translation)
        if not success:
            raise Exception("Translation operation failed")
        
        logger.info(f"Mesh translated successfully", session_id=session_id, translation=translate_request.translation)
        return APIResponse(
            success=True,
            message="Mesh translated successfully"
        )
    except Exception as e:
        logger.error(f"Error translating mesh", session_id=session_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Error translating mesh: {str(e)}")


@app.post("/sessions/{session_id}/cost", response_model=ResinCostEstimate)
async def estimate_resin_cost(
    session_id: str,
    cost_request: ResinCostRequest,
    stl_tools: STLTools = Depends(get_stl_tools)
):
    """Estimate resin cost for 3D printing."""
    logger.info(f"Estimating resin cost", session_id=session_id, 
               resin_density=cost_request.resin_density_g_cm3, 
               resin_price=cost_request.resin_price_per_kg)
    try:
        with PerformanceLogger(logger, "resin cost estimation"):
            cost_estimate = stl_tools.estimate_resin_cost(
                cost_request.resin_density_g_cm3,
                cost_request.resin_price_per_kg,
                cost_request.volume_unit
            )
        return ResinCostEstimate(**cost_estimate)
    except Exception as e:
        logger.error(f"Error estimating resin cost", session_id=session_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Error estimating resin cost: {str(e)}")


@app.post("/sessions/{session_id}/electroplating", response_model=ElectroplatingEstimate)
async def calculate_electroplating_parameters(
    session_id: str,
    plating_request: ElectroplatingRequest,
    stl_tools: STLTools = Depends(get_stl_tools)
):
    """Calculate comprehensive electroplating parameters for the 3D printed object."""
    logger.info(f"Calculating electroplating parameters", session_id=session_id,
               current_density_min=plating_request.current_density_min,
               current_density_max=plating_request.current_density_max,
               plating_thickness=plating_request.plating_thickness_microns)
    try:
        with PerformanceLogger(logger, "electroplating calculation"):
            plating_data = stl_tools.calculate_electroplating_parameters(
                current_density_min=plating_request.current_density_min,
                current_density_max=plating_request.current_density_max,
                plating_thickness_microns=plating_request.plating_thickness_microns,
                metal_density_g_cm3=plating_request.metal_density_g_cm3,
                current_efficiency=plating_request.current_efficiency,
                voltage=plating_request.voltage
            )
        return ElectroplatingEstimate(**plating_data)
    except Exception as e:
        logger.error(f"Error calculating electroplating parameters", session_id=session_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Error calculating electroplating parameters: {str(e)}")


@app.post("/sessions/{session_id}/electroplating/recommendations", response_model=ElectroplatingRecommendations)
async def get_electroplating_recommendations(
    session_id: str,
    recommendation_request: ElectroplatingRecommendationRequest,
    stl_tools: STLTools = Depends(get_stl_tools)
):
    """Get metal-specific electroplating recommendations and calculations."""
    logger.info(f"Getting electroplating recommendations", session_id=session_id, 
               metal_type=recommendation_request.metal_type)
    try:
        with PerformanceLogger(logger, "electroplating recommendations"):
            recommendations_data = stl_tools.get_electroplating_recommendations(
                metal_type=recommendation_request.metal_type.value
            )
        return ElectroplatingRecommendations(**recommendations_data)
    except Exception as e:
        logger.error(f"Error getting electroplating recommendations", session_id=session_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Error getting electroplating recommendations: {str(e)}")


@app.post("/sessions/{session_id}/export")
async def export_statistics(
    session_id: str,
    export_request: ExportRequest,
    stl_tools: STLTools = Depends(get_stl_tools)
):
    """Export mesh statistics to file."""
    logger.info(f"Exporting statistics", session_id=session_id, format=export_request.format)
    try:
        with PerformanceLogger(logger, "statistics export"):
            # Create temporary file for export
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix=f'.{export_request.format}', delete=False) as tmp_file:
                success = stl_tools.export_statistics(tmp_file.name, export_request.format)
                if not success:
                    raise Exception("Export operation failed")
                
                # Read the file content
                with open(tmp_file.name, 'r') as f:
                    content = f.read()
                
                # Clean up temporary file
                os.unlink(tmp_file.name)
        
        # Return file content
        if export_request.format == 'json':
            return JSONResponse(content=content, media_type="application/json")
        else:
            return JSONResponse(content=content, media_type="text/plain")
    except Exception as e:
        logger.error(f"Error exporting statistics", session_id=session_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Error exporting statistics: {str(e)}")


@app.get("/sessions/{session_id}/convex-hull-volume")
async def get_convex_hull_volume(session_id: str, stl_tools: STLTools = Depends(get_stl_tools)):
    """Get the convex hull volume of the mesh."""
    logger.info(f"Getting convex hull volume", session_id=session_id)
    try:
        with PerformanceLogger(logger, "convex hull volume calculation"):
            volume = stl_tools.get_convex_hull_volume()
        if volume is None:
            raise Exception("Convex hull volume calculation failed")
        
        return APIResponse(
            success=True,
            message="Convex hull volume calculated successfully",
            data={"convex_hull_volume": volume}
        )
    except Exception as e:
        logger.error(f"Error calculating convex hull volume", session_id=session_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Error calculating convex hull volume: {str(e)}")


@app.get("/sessions/{session_id}/stl")
async def get_stl_data(session_id: str, stl_tools: STLTools = Depends(get_stl_tools)):
    """Get the STL file data for 3D visualization."""
    logger.info(f"Getting STL data", session_id=session_id)
    try:
        with PerformanceLogger(logger, "STL data retrieval"):
            # Get the session to access the original file path
            session = session_manager.get_session(session_id)
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
            
            # Read the original STL file
            with open(session['file_path'], 'rb') as f:
                stl_data = f.read()
            
            # Return the STL data as binary
            return Response(
                content=stl_data,
                media_type="application/octet-stream",
                headers={"Content-Disposition": f"attachment; filename={session['filename']}"}
            )
    except Exception as e:
        logger.error(f"Error getting STL data", session_id=session_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Error getting STL data: {str(e)}")


@app.get("/stats", response_model=Dict[str, Any])
async def get_api_stats():
    """Get API statistics."""
    logger.info("Getting API statistics")
    try:
        session_stats = session_manager.get_stats()
        return {
            "sessions": session_stats,
            "api_info": {
                "version": "1.0.0",
                "uptime": "N/A",  # You could add uptime tracking
                "total_requests": "N/A"  # You could add request counting
            }
        }
    except Exception as e:
        logger.error(f"Error getting API stats", error=str(e))
        raise HTTPException(status_code=500, detail=f"Error getting API stats: {str(e)}")


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception", error=str(exc), path=request.url.path, method=request.method)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error": str(exc)
        }
    )


if __name__ == "__main__":
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8116,
        reload=True,
        log_level="info"
    ) 