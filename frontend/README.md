# STL Analysis Frontend

A modern React-based frontend application for analyzing STL files, visualizing 3D models, and calculating printing costs.

## Features

- **File Upload**: Drag-and-drop STL file upload with validation
- **3D Visualization**: Interactive 3D model viewer using Three.js
- **Mesh Analysis**: Comprehensive statistics including surface area, volume, triangle count
- **Mesh Validation**: Automatic validation with issue detection and warnings
- **Cost Estimation**: Resin cost calculator with customizable parameters
- **Responsive Design**: Modern UI built with Material-UI
- **Real-time Updates**: Live analysis results and cost calculations

## Technology Stack

- **React 18** with TypeScript
- **Material-UI (MUI)** for UI components
- **Three.js** for 3D rendering
- **Axios** for API communication
- **React Dropzone** for file uploads
- **Nginx** for production serving

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Backend API running (see main project README)

## Development Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**:
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`

3. **Build for production**:
   ```bash
   npm run build
   ```

## Docker Setup

### Build the Docker image:
```bash
docker build -t stl-analysis-frontend .
```

### Run the container:
```bash
docker run -p 3000:80 stl-analysis-frontend
```

### Using Docker Compose (recommended):
```bash
# From the project root
docker-compose up frontend
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:8116
```

## API Integration

The frontend communicates with the STL Analysis API backend. Make sure the backend is running and accessible at the configured API URL.

### Available API Endpoints Used:

- `POST /upload` - Upload STL file
- `GET /sessions/{id}/analysis` - Get mesh statistics
- `GET /sessions/{id}/validation` - Validate mesh
- `POST /sessions/{id}/cost` - Calculate resin cost
- `GET /sessions/{id}/info` - Get basic mesh info

## Project Structure

```
frontend/
├── public/                 # Static files
├── src/
│   ├── components/         # React components
│   │   ├── FileUpload.tsx  # File upload component
│   │   ├── STLViewer.tsx   # 3D model viewer
│   │   ├── MeshStats.tsx   # Statistics display
│   │   └── CostCalculator.tsx # Cost calculation
│   ├── services/           # API services
│   │   └── api.ts         # API client
│   ├── types/             # TypeScript types
│   │   └── api.ts         # API type definitions
│   ├── App.tsx            # Main application component
│   └── index.tsx          # Application entry point
├── Dockerfile             # Docker configuration
├── nginx.conf             # Nginx configuration
└── package.json           # Dependencies and scripts
```

## Usage

1. **Upload STL File**: Drag and drop an STL file or click to browse
2. **View 3D Model**: The uploaded file will be displayed in the 3D viewer
3. **Analyze Mesh**: Automatic analysis provides statistics and validation
4. **Calculate Costs**: Use the cost calculator to estimate printing costs
5. **Export Results**: Download analysis results in various formats

## Development

### Adding New Features

1. Create new components in `src/components/`
2. Add API services in `src/services/`
3. Update TypeScript types in `src/types/`
4. Test with the development server

### Styling

The application uses Material-UI (MUI) for styling. Custom styles can be added using the `sx` prop or styled components.

### 3D Visualization

The STL viewer uses Three.js with the following features:
- Orbit controls for camera manipulation
- Proper lighting and shadows
- Automatic model centering and scaling
- Grid and axes helpers

## Troubleshooting

### Common Issues

1. **API Connection Errors**: Ensure the backend is running and accessible
2. **File Upload Issues**: Check file format (must be .stl)
3. **3D Rendering Problems**: Verify WebGL support in browser
4. **Build Errors**: Clear node_modules and reinstall dependencies

### Performance

- Large STL files may take time to process
- 3D rendering performance depends on model complexity
- Consider model optimization for better performance

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test thoroughly before submitting
4. Update documentation as needed

## License

This project is part of the STL Analysis Tool suite. 