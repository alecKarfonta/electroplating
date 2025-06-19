import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the api service functions
jest.mock('./services/api', () => ({
  uploadSTLFile: jest.fn(),
  getMeshStatistics: jest.fn(),
  validateMesh: jest.fn(),
  estimateResinCost: jest.fn(),
  calculateElectroplatingParameters: jest.fn(),
  getElectroplatingRecommendations: jest.fn(),
  scaleMesh: jest.fn(),
  resetMesh: jest.fn(),
}));

// Mock STLViewer to avoid three.js import issues
jest.mock('./components/STLViewer', () => {
  return function MockSTLViewer() {
    return <div data-testid="stl-viewer">STL Viewer Mock</div>;
  };
});

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/PlateForge/i)).toBeInTheDocument();
    expect(screen.getByText(/Advanced Electroplating Calculator & 3D Analysis/i)).toBeInTheDocument();
  });

  it('displays main components', () => {
    render(<App />);
    
    // Check for main sections - use more specific text
    expect(screen.getByText(/PlateForge/i)).toBeInTheDocument();
    expect(screen.getByText(/Advanced STL analysis for precision electroplating calculations/i)).toBeInTheDocument();
  });

  it('shows upload section initially', () => {
    render(<App />);
    
    expect(screen.getByText(/Drag & drop your 3D model here, or click to browse/i)).toBeInTheDocument();
    expect(screen.getByText(/Advanced STL analysis for precision electroplating calculations/i)).toBeInTheDocument();
  });
}); 