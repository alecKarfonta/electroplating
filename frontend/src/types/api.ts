export interface APIResponse {
  success: boolean;
  message: string;
  data?: Record<string, any>;
  error?: string;
}

export interface FileUploadResponse {
  session_id: string;
  filename: string;
  file_size: number;
  message: string;
}

export interface SessionInfo {
  session_id: string;
  filename: string;
  file_size: number;
  upload_time: string;
  last_accessed: string;
}

export interface MeshInfo {
  file_path: string;
  triangle_count: number;
  bounding_box: {
    min: number[];
    max: number[];
  };
  center_of_mass: number[];
  surface_area: number;
  volume: number;
}

export interface MeshStatistics {
  triangle_count: number;
  vertex_count: number;
  surface_area: number;
  volume: number;
  center_of_mass: number[];
  bounding_box: {
    min: number[];
    max: number[];
  };
  triangle_areas: {
    min: number;
    max: number;
    mean: number;
    std: number;
  };
  edge_lengths: {
    min: number;
    max: number;
    mean: number;
    std: number;
  };
  aspect_ratio: number;
  surface_area_to_volume_ratio: number;
}

export interface ValidationResult {
  is_valid: boolean;
  issues: string[];
  warnings: string[];
  degenerate_triangles: number[];
}

export interface ResinCostRequest {
  resin_density_g_cm3: number;
  resin_price_per_kg: number;
  volume_unit: 'mm3' | 'cm3';
}

export interface ResinCostEstimate {
  volume_mm3: number;
  volume_cm3: number;
  mass_g: number;
  mass_kg: number;
  cost: number;
}

export interface ScaleRequest {
  scale_factor: number | number[];
}

export interface TranslateRequest {
  translation: number[];
}

export interface ExportRequest {
  format: 'json' | 'txt';
}

export interface ElectroplatingRequest {
  current_density_min?: number;
  current_density_max?: number;
  plating_thickness_microns?: number;
  metal_density_g_cm3?: number;
  current_efficiency?: number;
  voltage?: number;
}

export interface ElectroplatingRecommendationRequest {
  metal_type: 'nickel' | 'copper' | 'chrome' | 'gold' | 'silver';
}

export interface SurfaceAreaInfo {
  mm2: number;
  cm2: number;
  in2: number;
}

export interface CurrentRequirements {
  min_amps: number;
  max_amps: number;
  recommended_amps: number;
  current_density_range: {
    min: number;
    max: number;
    recommended: number;
  };
}

export interface PlatingParameters {
  thickness_microns: number;
  thickness_inches: number;
  plating_time_minutes: number;
  plating_time_hours: number;
  plating_rate_inches_per_min: number;
}

export interface MaterialRequirements {
  metal_mass_g: number;
  metal_mass_kg: number;
  metal_volume_cm3: number;
  metal_density_g_cm3: number;
}

export interface PowerRequirements {
  voltage: number;
  power_watts: number;
  energy_wh: number;
  energy_kwh: number;
}

export interface CostEstimates {
  electricity_cost: number;
  solution_cost: number;
  total_cost: number;
}

export interface QualityFactors {
  surface_roughness_factor: number;
  coverage_efficiency: number;
  current_efficiency: number;
}

export interface PlatingRecommendations {
  current_setting: string;
  voltage_setting: string;
  time_setting: string;
  surface_preparation: string;
  solution_temperature: string;
  agitation: string;
}

export interface ElectroplatingEstimate {
  surface_area: SurfaceAreaInfo;
  current_requirements: CurrentRequirements;
  plating_parameters: PlatingParameters;
  material_requirements: MaterialRequirements;
  power_requirements: PowerRequirements;
  cost_estimates: CostEstimates;
  quality_factors: QualityFactors;
  recommendations: PlatingRecommendations;
}

export interface MetalProperties {
  density_g_cm3: number;
  current_density_min: number;
  current_density_max: number;
  voltage: number;
  plating_rate_inches_per_min: number;
  solution_cost_per_kg: number;
  color: string;
  hardness: string;
  corrosion_resistance: string;
  typical_thickness_microns: number;
}

export interface ElectroplatingRecommendations {
  metal_properties: MetalProperties;
  calculated_parameters: ElectroplatingEstimate;
  metal_specific_tips: Record<string, string[]>;
} 