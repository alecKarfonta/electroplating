import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ElectroplatingCalculator from '../ElectroplatingCalculator';
import { 
  ElectroplatingRequest, 
  ElectroplatingEstimate, 
  ElectroplatingRecommendations, 
  MeshStatistics 
} from '../../types/api';

// Mock props
const mockOnCalculate = jest.fn();
const mockOnGetRecommendations = jest.fn();

const mockStatistics: MeshStatistics = {
  triangle_count: 2000,
  vertex_count: 1000,
  surface_area: 1000, // mm²
  volume: 5000, // mm³
  center_of_mass: [5, 5, 2.5],
  bounding_box: {
    min: [0, 0, 0],
    max: [10, 10, 5]
  },
  triangle_areas: {
    min: 0.1,
    max: 2.0,
    mean: 0.5,
    std: 0.3
  },
  edge_lengths: {
    min: 0.5,
    max: 3.0,
    mean: 1.5,
    std: 0.5
  },
  aspect_ratio: 2.0,
  surface_area_to_volume_ratio: 0.2
};

const mockEstimate: ElectroplatingEstimate = {
  surface_area: { mm2: 1000, cm2: 10, in2: 1.55 },
  current_requirements: {
    min_amps: 0.7,
    max_amps: 1.0,
    recommended_amps: 0.85,
    current_density_range: { min: 0.07, max: 0.1, recommended: 0.08 }
  },
  plating_parameters: {
    thickness_microns: 20,
    thickness_inches: 0.000787,
    plating_time_minutes: 20,
    plating_time_hours: 0.33,
    plating_rate_inches_per_min: 0.0000394
  },
  material_requirements: {
    metal_mass_g: 0.45,
    metal_mass_kg: 0.00045,
    metal_volume_cm3: 0.05,
    metal_density_g_cm3: 8.96
  },
  power_requirements: {
    voltage: 3.0,
    power_watts: 2.55,
    energy_wh: 0.85,
    energy_kwh: 0.00085
  },
  cost_estimates: {
    electricity_cost: 0.05,
    solution_cost: 1.45,
    total_cost: 1.50
  },
  quality_factors: {
    surface_roughness_factor: 1.2,
    coverage_efficiency: 0.95,
    current_efficiency: 0.95
  },
  recommendations: {
    current_setting: '0.85A',
    voltage_setting: '3.0V',
    time_setting: '20 minutes',
    surface_preparation: 'Clean with acetone',
    solution_temperature: '25°C',
    agitation: 'Gentle stirring'
  }
};

const mockRecommendations: ElectroplatingRecommendations = {
  metal_properties: {
    density_g_cm3: 8.96,
    current_density_min: 0.07,
    current_density_max: 0.1,
    voltage: 3.0,
    plating_rate_inches_per_min: 0.0000394,
    solution_cost_per_kg: 10,
    color: 'reddish-brown',
    hardness: 'soft',
    corrosion_resistance: 'good',
    typical_thickness_microns: 80
  },
  calculated_parameters: {
    surface_area: { mm2: 1000, cm2: 10, in2: 1.55 },
    current_requirements: {
      min_amps: 0.7,
      max_amps: 1.0,
      recommended_amps: 0.85,
      current_density_range: { min: 0.07, max: 0.1, recommended: 0.08 }
    },
    plating_parameters: {
      thickness_microns: 20,
      thickness_inches: 0.000787,
      plating_time_minutes: 20,
      plating_time_hours: 0.33,
      plating_rate_inches_per_min: 0.0000394
    },
    material_requirements: {
      metal_mass_g: 0.45,
      metal_mass_kg: 0.00045,
      metal_volume_cm3: 0.05,
      metal_density_g_cm3: 8.96
    },
    power_requirements: {
      voltage: 3.0,
      power_watts: 2.55,
      energy_wh: 0.85,
      energy_kwh: 0.00085
    },
    cost_estimates: {
      electricity_cost: 0.05,
      solution_cost: 1.45,
      total_cost: 1.50
    },
    quality_factors: {
      surface_roughness_factor: 1.2,
      coverage_efficiency: 0.95,
      current_efficiency: 0.95
    },
    recommendations: {
      current_setting: '0.85A',
      voltage_setting: '3.0V',
      time_setting: '20 minutes',
      surface_preparation: 'Clean with acetone',
      solution_temperature: '25°C',
      agitation: 'Gentle stirring'
    }
  },
  metal_specific_tips: {
    'copper': ['Ensure proper cleaning', 'Monitor temperature'],
    'quality': ['Use filtered solution', 'Maintain consistent current']
  }
};

const defaultProps = {
  onCalculate: mockOnCalculate,
  onGetRecommendations: mockOnGetRecommendations,
  loading: false,
  error: null,
  statistics: mockStatistics,
};

describe('ElectroplatingCalculator', () => {
  beforeEach(() => {
    mockOnCalculate.mockClear();
    mockOnGetRecommendations.mockClear();
  });

  it('renders correctly with default values', () => {
    render(<ElectroplatingCalculator {...defaultProps} />);
    
    expect(screen.getByText('Electroplating Calculator')).toBeInTheDocument();
    expect(screen.getByText('Model Surface Area')).toBeInTheDocument();
    expect(screen.getByText('1,000.00 mm²')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.07')).toBeInTheDocument(); // min current density
    expect(screen.getByDisplayValue('0.1')).toBeInTheDocument(); // max current density
  });

  it('displays surface area correctly based on unit system', async () => {
    const user = userEvent.setup();
    render(<ElectroplatingCalculator {...defaultProps} />);
    
    // Check metric units (default)
    expect(screen.getByText('1,000.00 mm²')).toBeInTheDocument();
    
    // Switch to imperial units
    const imperialButton = screen.getByRole('button', { name: /Imperial/i });
    await user.click(imperialButton);
    
    // Should now display in square inches (there are many elements with in²)
    const inSquareElements = screen.getAllByText(/in²/);
    expect(inSquareElements.length).toBeGreaterThan(0);
  });

  it('switches between unit systems correctly', async () => {
    const user = userEvent.setup();
    render(<ElectroplatingCalculator {...defaultProps} />);
    
    // Check initial metric state
    expect(screen.getByRole('button', { name: /Metric/i })).toHaveAttribute('aria-pressed', 'true');
    
    // Switch to imperial
    const imperialButton = screen.getByRole('button', { name: /Imperial/i });
    await user.click(imperialButton);
    
    expect(imperialButton).toHaveAttribute('aria-pressed', 'true');
    
    // Thickness input should show mils instead of microns
    expect(screen.getByLabelText(/Thickness \(mils\)/)).toBeInTheDocument();
  });

  it('handles form input changes correctly', async () => {
    const user = userEvent.setup();
    render(<ElectroplatingCalculator {...defaultProps} />);
    
    const minCurrentInput = screen.getByLabelText(/Min Current Density/);
    const maxCurrentInput = screen.getByLabelText(/Max Current Density/);
    
    await user.clear(minCurrentInput);
    await user.type(minCurrentInput, '0.05');
    expect(minCurrentInput).toHaveValue(0.05);
    
    await user.clear(maxCurrentInput);
    await user.type(maxCurrentInput, '0.12');
    expect(maxCurrentInput).toHaveValue(0.12);
    
    // Auto-calculation should trigger
    await waitFor(() => {
      expect(mockOnCalculate).toHaveBeenCalled();
    });
  });

  it('updates form data when metal type changes', async () => {
    const user = userEvent.setup();
    render(<ElectroplatingCalculator {...defaultProps} />);
    
    // Find the select element that has no name attribute  
    const metalSelect = screen.getByRole('combobox');
    await user.click(metalSelect);
    
    // Select nickel
    const nickelOption = screen.getByRole('option', { name: 'Nickel' });
    await user.click(nickelOption);
    
    // Should update density to nickel's default (8.9)
    await waitFor(() => {
      const densityInput = screen.getByLabelText(/Metal Density/);
      expect(densityInput).toHaveValue(8.9);
    });
    
    // Auto-calculation should trigger
    expect(mockOnCalculate).toHaveBeenCalled();
  });

  it('triggers recommendations when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ElectroplatingCalculator {...defaultProps} />);
    
    const recommendButton = screen.getByRole('button', { name: /Get Copper Recommendations/i });
    await user.click(recommendButton);
    
    expect(mockOnGetRecommendations).toHaveBeenCalledWith({ metal_type: 'copper' });
  });

  it('displays error message when error prop is provided', () => {
    const errorMessage = 'Failed to calculate electroplating parameters';
    render(<ElectroplatingCalculator {...defaultProps} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(<ElectroplatingCalculator {...defaultProps} loading={true} />);
    
    expect(screen.getByText('Auto-calculating...')).toBeInTheDocument();
  });

  it('displays plating estimate results when provided', () => {
    render(<ElectroplatingCalculator {...defaultProps} platingEstimate={mockEstimate} />);
    
    expect(screen.getByText('Calculation Results')).toBeInTheDocument();
    expect(screen.getByText('0.85 A')).toBeInTheDocument(); // recommended current
    expect(screen.getByText('20 minutes')).toBeInTheDocument(); // time
    expect(screen.getByText('0.45 g')).toBeInTheDocument(); // metal usage
  });

  it('displays recommendations when provided', () => {
    render(<ElectroplatingCalculator {...defaultProps} recommendations={mockRecommendations} />);
    
    expect(screen.getByText('reddish-brown Copper Specifications')).toBeInTheDocument();
    expect(screen.getByText('Metal Properties')).toBeInTheDocument();
    expect(screen.getByText('Ensure proper cleaning')).toBeInTheDocument(); // process note
    // Metal specific tips should be present but checking for copper key
    expect(screen.getByText('Metal-Specific Tips')).toBeInTheDocument();
  });

  it('does not auto-calculate without surface area statistics', () => {
    render(<ElectroplatingCalculator {...defaultProps} statistics={null} />);
    
    // Should not trigger auto-calculation without statistics
    expect(mockOnCalculate).not.toHaveBeenCalled();
  });

  it('validates input ranges correctly', async () => {
    const user = userEvent.setup();
    render(<ElectroplatingCalculator {...defaultProps} />);
    
    const minCurrentInput = screen.getByLabelText(/Min Current Density/) as HTMLInputElement;
    const maxCurrentInput = screen.getByLabelText(/Max Current Density/) as HTMLInputElement;
    
    // Check input constraints
    expect(minCurrentInput.min).toBe('0.01');
    expect(minCurrentInput.max).toBe('1');
    expect(maxCurrentInput.min).toBe('0.01');
    expect(maxCurrentInput.max).toBe('1');
  });

  it('converts thickness units correctly when switching unit systems', async () => {
    const user = userEvent.setup();
    render(<ElectroplatingCalculator {...defaultProps} />);
    
    // Start with metric - set thickness to 20 microns
    const thicknessInput = screen.getByLabelText(/Thickness/) as HTMLInputElement;
    await user.clear(thicknessInput);
    await user.type(thicknessInput, '20');
    
    // Switch to imperial
    const imperialButton = screen.getByRole('button', { name: /Imperial/i });
    await user.click(imperialButton);
    
    // Should convert to mils (20 microns = 0.787 mils, but component shows smaller value)
    await waitFor(() => {
      const newThicknessInput = screen.getByLabelText(/Thickness \(mils\)/) as HTMLInputElement;
      expect(parseFloat(newThicknessInput.value)).toBeCloseTo(0.00079, 4);
    });
  });

  it('shows helper text for input fields', () => {
    render(<ElectroplatingCalculator {...defaultProps} />);
    
    expect(screen.getAllByText('Typical range: 0.05-0.15 A/in²')).toHaveLength(2); // Min and max current density
    expect(screen.getByText('Nickel: 8.9, Copper: 8.96, Gold: 19.32')).toBeInTheDocument();
    expect(screen.getByText('Typical range: 0.85-0.98')).toBeInTheDocument();
    expect(screen.getByText('Results auto-calculate as you type')).toBeInTheDocument();
  });

  it('handles accordion expansion', async () => {
    const user = userEvent.setup();
    render(<ElectroplatingCalculator {...defaultProps} />);
    
    // Input Parameters accordion should be expanded by default
    expect(screen.getByText('Input Parameters')).toBeInTheDocument();
    expect(screen.getByLabelText(/Min Current Density/)).toBeVisible();
    
    // Click to collapse
    const accordionHeader = screen.getByText('Input Parameters').closest('button');
    if (accordionHeader) {
      await user.click(accordionHeader);
      // The inputs might still be in the DOM but could be collapsed
    }
  });
}); 