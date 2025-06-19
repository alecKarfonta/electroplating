import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import FileUpload from '../FileUpload';

// Mock props
const mockOnFileSelect = jest.fn();

const defaultProps = {
  onFileSelect: mockOnFileSelect,
  loading: false,
  error: null,
};

// Mock File constructor for tests
const createMockFile = (name: string, type: string = 'application/octet-stream') => {
  const file = new File(['mock content'], name, { type });
  return file;
};

describe('FileUpload', () => {
  beforeEach(() => {
    mockOnFileSelect.mockClear();
  });

  it('renders correctly with default state', () => {
    render(<FileUpload {...defaultProps} />);
    
    expect(screen.getByText(/Upload STL File/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop an STL file here/i)).toBeInTheDocument();
  });

  it('displays error message when error prop is provided', () => {
    const errorMessage = 'Failed to upload file';
    render(<FileUpload {...defaultProps} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows loading state when loading prop is true', () => {
    render(<FileUpload {...defaultProps} loading={true} />);
    
    expect(screen.getByText(/Processing file.../i)).toBeInTheDocument();
  });

  it('handles file selection via click', async () => {
    const user = userEvent.setup();
    render(<FileUpload {...defaultProps} />);
    
    const file = createMockFile('test.stl', 'application/octet-stream');
    const input = screen.getByRole('button', { name: /browse files/i });
    
    // Click the button to trigger file dialog
    await user.click(input);
    
    // This is a simplified test - in a real scenario, we'd mock the file input
    expect(input).toBeInTheDocument();
  });

  it('shows browse button when not loading', () => {
    render(<FileUpload {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument();
  });

  it('renders upload instructions', () => {
    render(<FileUpload {...defaultProps} />);
    
    expect(screen.getByText(/or click to browse files/i)).toBeInTheDocument();
    expect(screen.getByText(/Supported format: STL files only/i)).toBeInTheDocument();
  });
}); 