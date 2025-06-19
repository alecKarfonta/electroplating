"""
STL Analysis API Package

A comprehensive REST API for STL file analysis and manipulation.
"""

__version__ = "1.0.0"
__author__ = "STL Analysis API Team"

from .main import app
from .core import (
    SessionManager, STLTools, APIResponse, FileUploadResponse, SessionInfo, 
    MeshInfo, MeshStatistics, ValidationResult, ResinCostEstimate, 
    ScaleRequest, TranslateRequest, ResinCostRequest, ExportRequest, VolumeUnit
)

__all__ = [
    "app",
    "SessionManager",
    "STLTools",
    "APIResponse",
    "FileUploadResponse", 
    "SessionInfo",
    "MeshInfo",
    "MeshStatistics",
    "ValidationResult",
    "ResinCostEstimate",
    "ScaleRequest",
    "TranslateRequest",
    "ResinCostRequest",
    "ExportRequest",
    "VolumeUnit"
] 