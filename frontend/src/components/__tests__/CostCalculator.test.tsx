import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CostCalculator from '../CostCalculator';
import { ResinCostRequest, ResinCostEstimate } from '../../types/api';

// Mock props
const mockOnCalculate = jest.fn();

const mockCostEstimate: ResinCostEstimate = {
  volume_mm3: 1000000,
  volume_cm3: 1000,
  mass_g: 1100,
  mass_kg: 1.1,
  cost: 55.0,
};

const defaultProps = {
  onCalculate: mockOnCalculate,
  loading: false,
  error: null,
};

describe('CostCalculator', () => {
  beforeEach(() => {
    mockOnCalculate.mockClear();
  });

  it('renders correctly with default values', () => {
    render(<CostCalculator {...defaultProps} />);
    
    expect(screen.getByText('Cost Calculator')).toBeInTheDocument();
    expect(screen.getByLabelText(/Resin Density/)).toHaveValue(1.1);
    expect(screen.getByLabelText(/Resin Price/)).toHaveValue(50.0);
    expect(screen.getByDisplayValue('mm3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Calculate Cost/i })).toBeInTheDocument();
  });

  it('displays error message when error prop is provided', () => {
    const errorMessage = 'Failed to calculate cost';
    render(<CostCalculator {...defaultProps} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows loading state when loading prop is true', () => {
    render(<CostCalculator {...defaultProps} loading={true} />);
    
    expect(screen.getByRole('button', { name: /Calculating.../i })).toBeDisabled();
  });

  it('handles form input changes correctly', async () => {
    const user = userEvent.setup();
    render(<CostCalculator {...defaultProps} />);
    
    const densityInput = screen.getByLabelText(/Resin Density/);
    const priceInput = screen.getByLabelText(/Resin Price/);
    
    await user.clear(densityInput);
    await user.type(densityInput, '1.5');
    expect(densityInput).toHaveValue(1.5);
    
    await user.clear(priceInput);
    await user.type(priceInput, '75');
    expect(priceInput).toHaveValue(75);
  });

  it('submits form with correct data', async () => {
    const user = userEvent.setup();
    render(<CostCalculator {...defaultProps} />);
    
    const densityInput = screen.getByLabelText(/Resin Density/);
    const priceInput = screen.getByLabelText(/Resin Price/);
    const submitButton = screen.getByRole('button', { name: /Calculate Cost/i });
    
    await user.clear(densityInput);
    await user.type(densityInput, '1.2');
    await user.clear(priceInput);
    await user.type(priceInput, '60');
    
    await user.click(submitButton);
    
    expect(mockOnCalculate).toHaveBeenCalledWith({
      resin_density_g_cm3: 1.2,
      resin_price_per_kg: 60,
      volume_unit: 'mm3',
    });
  });

  it('displays cost estimation results when costEstimate is provided', () => {
    render(<CostCalculator {...defaultProps} costEstimate={mockCostEstimate} />);
    
    expect(screen.getByText('Cost Estimation Results')).toBeInTheDocument();
    expect(screen.getByText('1,000,000')).toBeInTheDocument(); // volume_mm3
    expect(screen.getByText('1000.00')).toBeInTheDocument(); // volume_cm3
    expect(screen.getByText('1100.00')).toBeInTheDocument(); // mass_g
    expect(screen.getByText('$55.00')).toBeInTheDocument(); // cost
  });

  it('renders volume unit selector', () => {
    render(<CostCalculator {...defaultProps} />);
    
    // Check that the volume unit selector exists with default value
    expect(screen.getByDisplayValue('mm3')).toBeInTheDocument();
  });

  it('prevents form submission when loading', () => {
    render(<CostCalculator {...defaultProps} loading={true} />);
    
    const submitButton = screen.getByRole('button', { name: /Calculating.../i });
    expect(submitButton).toBeDisabled();
    expect(mockOnCalculate).not.toHaveBeenCalled();
  });
}); 