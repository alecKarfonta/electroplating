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
    expect(screen.getAllByText(/Upload STL File/i)).toHaveLength(2);
  });

  it('displays main components', () => {
    render(<App />);
    
    // Check for main sections - Calculator sections only appear after file upload
    expect(screen.getAllByText(/Upload STL File/i)).toHaveLength(2);
    expect(screen.getByText(/STL Analysis & Electroplating Calculator/i)).toBeInTheDocument();
  });

  it('shows upload section initially', () => {
    render(<App />);
    
    expect(screen.getByText(/Drag & drop an STL file here/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to browse files/i)).toBeInTheDocument();
  });
}); 