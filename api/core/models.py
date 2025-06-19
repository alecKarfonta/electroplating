"""
Pydantic models for STL API request and response schemas.
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Union, Any
from enum import Enum


class VolumeUnit(str, Enum):
    """Volume units for cost estimation."""
    MM3 = "mm3"
    CM3 = "cm3"


class ScaleRequest(BaseModel):
    """Request model for scaling operations."""
    scale_factor: Union[float, List[float]] = Field(
        ..., 
        description="Scaling factor(s). Can be a single float or list of 3 floats for x,y,z"
    )


class TranslateRequest(BaseModel):
    """Request model for translation operations."""
    translation: List[float] = Field(
        ..., 
        min_items=3, 
        max_items=3,
        description="Translation vector [x, y, z]"
    )


class ResinCostRequest(BaseModel):
    """Request model for resin cost estimation."""
    resin_density_g_cm3: float = Field(
        ..., 
        gt=0,
        description="Density of the resin in grams per cubic centimeter (g/cm³)"
    )
    resin_price_per_kg: float = Field(
        ..., 
        gt=0,
        description="Price of the resin in currency per kilogram"
    )
    volume_unit: VolumeUnit = Field(
        default=VolumeUnit.MM3,
        description="The unit of the mesh volume"
    )


class ExportRequest(BaseModel):
    """Request model for export operations."""
    format: str = Field(
        default="json",
        pattern="^(json|txt)$",
        description="Output format ('json' or 'txt')"
    )


class MeshInfo(BaseModel):
    """Basic mesh information response."""
    file_path: str
    triangle_count: int
    bounding_box: Dict[str, List[float]]
    center_of_mass: List[float]
    surface_area: float
    volume: float


class MeshStatistics(BaseModel):
    """Comprehensive mesh statistics response."""
    triangle_count: int
    vertex_count: int
    surface_area: float
    volume: float
    center_of_mass: List[float]
    bounding_box: Dict[str, List[float]]
    triangle_areas: Dict[str, float]
    edge_lengths: Dict[str, float]
    aspect_ratio: Optional[float]
    surface_area_to_volume_ratio: Optional[float]


class ValidationResult(BaseModel):
    """Mesh validation result response."""
    is_valid: bool
    issues: List[str]
    warnings: List[str]
    degenerate_triangles: List[int]


class ResinCostEstimate(BaseModel):
    """Resin cost estimation response."""
    volume_mm3: float
    volume_cm3: float
    mass_g: float
    mass_kg: float
    cost: float


class ElectroplatingRequest(BaseModel):
    """Request model for electroplating calculations."""
    current_density_min: float = Field(
        default=0.07,
        gt=0,
        description="Minimum current density in amps per square inch"
    )
    current_density_max: float = Field(
        default=0.1,
        gt=0,
        description="Maximum current density in amps per square inch"
    )
    plating_thickness_microns: float = Field(
        default=80.0,
        gt=0,
        description="Desired plating thickness in microns"
    )
    metal_density_g_cm3: float = Field(
        default=8.9,
        gt=0,
        description="Density of plating metal in g/cm³"
    )
    current_efficiency: float = Field(
        default=0.95,
        gt=0,
        le=1.0,
        description="Current efficiency as decimal (0-1)"
    )
    voltage: float = Field(
        default=3.0,
        gt=0,
        description="Operating voltage in volts"
    )


class MetalType(str, Enum):
    """Supported plating metals."""
    NICKEL = "nickel"
    COPPER = "copper"
    CHROME = "chrome"
    GOLD = "gold"
    SILVER = "silver"


class ElectroplatingRecommendationRequest(BaseModel):
    """Request model for metal-specific electroplating recommendations."""
    metal_type: MetalType = Field(
        default=MetalType.NICKEL,
        description="Type of metal for plating"
    )


class SurfaceAreaInfo(BaseModel):
    """Surface area information in different units."""
    mm2: float
    cm2: float
    in2: float


class CurrentRequirements(BaseModel):
    """Current requirements for electroplating."""
    min_amps: float
    max_amps: float
    recommended_amps: float
    current_density_range: Dict[str, float]


class PlatingParameters(BaseModel):
    """Plating time and thickness parameters."""
    thickness_microns: float
    thickness_inches: float
    plating_time_minutes: float
    plating_time_hours: float
    plating_rate_inches_per_min: float


class MaterialRequirements(BaseModel):
    """Material requirements for plating."""
    metal_mass_g: float
    metal_mass_kg: float
    metal_volume_cm3: float
    metal_density_g_cm3: float


class PowerRequirements(BaseModel):
    """Power and energy requirements."""
    voltage: float
    power_watts: float
    energy_wh: float
    energy_kwh: float


class CostEstimates(BaseModel):
    """Cost estimates for electroplating."""
    electricity_cost: float
    solution_cost: float
    total_cost: float


class QualityFactors(BaseModel):
    """Quality factors affecting plating."""
    surface_roughness_factor: float
    coverage_efficiency: float
    current_efficiency: float


class PlatingRecommendations(BaseModel):
    """Practical recommendations for plating."""
    current_setting: str
    voltage_setting: str
    time_setting: str
    surface_preparation: str
    solution_temperature: str
    agitation: str


class ElectroplatingEstimate(BaseModel):
    """Comprehensive electroplating calculation response."""
    surface_area: SurfaceAreaInfo
    current_requirements: CurrentRequirements
    plating_parameters: PlatingParameters
    material_requirements: MaterialRequirements
    power_requirements: PowerRequirements
    cost_estimates: CostEstimates
    quality_factors: QualityFactors
    recommendations: PlatingRecommendations


class MetalProperties(BaseModel):
    """Properties of a specific plating metal."""
    density_g_cm3: float
    current_density_min: float
    current_density_max: float
    voltage: float
    plating_rate_inches_per_min: float
    solution_cost_per_kg: float
    color: str
    hardness: str
    corrosion_resistance: str
    typical_thickness_microns: float


class ElectroplatingRecommendations(BaseModel):
    """Metal-specific electroplating recommendations."""
    metal_properties: MetalProperties
    calculated_parameters: ElectroplatingEstimate
    metal_specific_tips: Dict[str, List[str]]


class APIResponse(BaseModel):
    """Generic API response wrapper."""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class FileUploadResponse(BaseModel):
    """Response for file upload operations."""
    session_id: str
    filename: str
    file_size: int
    message: str


class SessionInfo(BaseModel):
    """Session information response."""
    session_id: str
    filename: str
    file_size: int
    upload_time: str
    last_accessed: str 