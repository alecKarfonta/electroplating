import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  CssBaseline,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Backdrop,
} from '@mui/material';
import { 
  ThreeDRotation, 
  Science, 
  CloudUpload, 
  Analytics, 
  Calculate, 
  ElectricBolt, 
  AspectRatio,
  ExpandMore 
} from '@mui/icons-material';

import FileUpload from './components/FileUpload';
import STLViewer from './components/STLViewer';
import MeshStats from './components/MeshStats';
import CostCalculator from './components/CostCalculator';
import ElectroplatingCalculator from './components/ElectroplatingCalculator';
import ScaleControls from './components/ScaleControls';

import {
  uploadSTLFile,
  getMeshStatistics,
  validateMesh,
  estimateResinCost,
  calculateElectroplatingParameters,
  getElectroplatingRecommendations,
  scaleMesh,
  resetMesh,
} from './services/api';
import {
  FileUploadResponse,
  MeshStatistics,
  ValidationResult,
  ResinCostEstimate,
  ResinCostRequest,
  ElectroplatingRequest,
  ElectroplatingEstimate,
  ElectroplatingRecommendationRequest,
  ElectroplatingRecommendations,
  ScaleRequest,
} from './types/api';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2">
              An unexpected error occurred. Please refresh the page and try again.
            </Typography>
            {this.state.error && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                Error: {this.state.error.message}
              </Typography>
            )}
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [costLoading, setCostLoading] = useState(false);
  const [platingLoading, setPlatingLoading] = useState(false);
  const [scalingLoading, setScalingLoading] = useState(false);
  const [statistics, setStatistics] = useState<MeshStatistics | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [costEstimate, setCostEstimate] = useState<ResinCostEstimate | null>(null);
  const [platingEstimate, setPlatingEstimate] = useState<ElectroplatingEstimate | null>(null);
  const [recommendations, setRecommendations] = useState<ElectroplatingRecommendations | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentScale, setCurrentScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState(false);

  // Global loading state
  useEffect(() => {
    setIsLoading(uploadLoading || analysisLoading || costLoading || platingLoading || scalingLoading);
  }, [uploadLoading, analysisLoading, costLoading, platingLoading, scalingLoading]);

  const handleFileSelect = async (file: File) => {
    setCurrentFile(file);
    setUploadLoading(true);
    setError(null);
    setStatistics(null);
    setValidation(null);
    setCostEstimate(null);
    setPlatingEstimate(null);
    setRecommendations(null);
    setCurrentScale(1.0);

    try {
      const response: FileUploadResponse = await uploadSTLFile(file);
      setSessionId(response.session_id);
      setSuccessMessage(`File "${response.filename}" uploaded successfully!`);
      
      // Automatically load analysis
      await loadAnalysis(response.session_id);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to upload file';
      setError(errorMessage);
      setCurrentFile(null);
      console.error('Upload error:', err);
    } finally {
      setUploadLoading(false);
    }
  };

  const loadAnalysis = async (sessionId: string) => {
    setAnalysisLoading(true);
    setError(null);

    try {
      const [statsResponse, validationResponse] = await Promise.all([
        getMeshStatistics(sessionId),
        validateMesh(sessionId),
      ]);

      setStatistics(statsResponse);
      setValidation(validationResponse);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load analysis';
      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleCostCalculation = async (costRequest: ResinCostRequest) => {
    if (!sessionId) {
      setError('No file uploaded');
      return;
    }

    setCostLoading(true);
    setError(null);

    try {
      const response = await estimateResinCost(sessionId, costRequest);
      setCostEstimate(response);
      setSuccessMessage('Cost calculation completed!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to calculate cost';
      setError(errorMessage);
      console.error('Cost calculation error:', err);
    } finally {
      setCostLoading(false);
    }
  };

  const handleElectroplatingCalculation = async (platingRequest: ElectroplatingRequest) => {
    if (!sessionId) {
      setError('No file uploaded');
      return;
    }

    setPlatingLoading(true);
    setError(null);

    try {
      const response = await calculateElectroplatingParameters(sessionId, platingRequest);
      setPlatingEstimate(response);
      setSuccessMessage('Electroplating calculation completed!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to calculate electroplating parameters';
      setError(errorMessage);
      console.error('Electroplating calculation error:', err);
    } finally {
      setPlatingLoading(false);
    }
  };

  const handleGetRecommendations = async (recommendationRequest: ElectroplatingRecommendationRequest) => {
    if (!sessionId) {
      setError('No file uploaded');
      return;
    }

    setPlatingLoading(true);
    setError(null);

    try {
      const response = await getElectroplatingRecommendations(sessionId, recommendationRequest);
      setRecommendations(response);
      setSuccessMessage('Electroplating recommendations generated!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to get recommendations';
      setError(errorMessage);
      console.error('Recommendations error:', err);
    } finally {
      setPlatingLoading(false);
    }
  };

  const handleScale = async (scaleRequest: ScaleRequest) => {
    if (!sessionId) {
      setError('No file uploaded');
      return;
    }

    setScalingLoading(true);
    setError(null);

    try {
      await scaleMesh(sessionId, scaleRequest);
      
      // Update current scale - handle both number and array types
      if (Array.isArray(scaleRequest.scale_factor)) {
        setCurrentScale(scaleRequest.scale_factor[0]); // Use X scale as reference
      } else {
        setCurrentScale(scaleRequest.scale_factor);
      }
      
      // Reload all analysis data with new scale
      await loadAnalysis(sessionId);
      
      // Clear all estimates since they need to be recalculated
      setCostEstimate(null);
      setPlatingEstimate(null);
      setRecommendations(null);
      
      const scaleDisplay = Array.isArray(scaleRequest.scale_factor) 
        ? `${scaleRequest.scale_factor[0]}x` 
        : `${scaleRequest.scale_factor}x`;
      setSuccessMessage(`Object scaled by ${scaleDisplay} successfully!`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to scale object';
      setError(errorMessage);
      console.error('Scale error:', err);
    } finally {
      setScalingLoading(false);
    }
  };

  const handleReset = async () => {
    if (!sessionId) {
      setError('No file uploaded');
      return;
    }

    setScalingLoading(true);
    setError(null);

    try {
      await resetMesh(sessionId);
      
      // Reset current scale to 1.0
      setCurrentScale(1.0);
      
      // Reload all analysis data with original scale
      await loadAnalysis(sessionId);
      
      // Clear all estimates since they need to be recalculated
      setCostEstimate(null);
      setPlatingEstimate(null);
      setRecommendations(null);
      
      setSuccessMessage('Object reset to original state successfully!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to reset object';
      setError(errorMessage);
      console.error('Reset error:', err);
    } finally {
      setScalingLoading(false);
    }
  };

  const handleRefreshData = async () => {
    if (!sessionId) {
      setError('No file uploaded');
      return;
    }
    await loadAnalysis(sessionId);
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <ErrorBoundary>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <ThreeDRotation sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            STL Analysis & Electroplating Calculator
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Global Loading Backdrop */}
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={isLoading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={handleCloseSnackbar}>
            {error}
          </Alert>
        )}

        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={handleCloseSnackbar}>
            {successMessage}
          </Alert>
        )}

        {/* File Upload Section - Always at the top */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            <CloudUpload sx={{ mr: 1, verticalAlign: 'middle' }} />
            Upload STL File
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Upload a 3D model file to analyze its properties and calculate electroplating parameters.
          </Typography>
          <FileUpload onFileSelect={handleFileSelect} loading={uploadLoading} />
        </Paper>

        {/* 3D Viewer and Scaling Controls - Always visible when file is uploaded */}
        {currentFile && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* 3D Viewer - Takes up most of the space */}
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={{ p: 2, height: '600px' }}>
                <Typography variant="h6" gutterBottom>
                  <ThreeDRotation sx={{ mr: 1, verticalAlign: 'middle' }} />
                  3D Model Viewer
                </Typography>
                <Box sx={{ height: 'calc(100% - 60px)' }}>
                  <STLViewer 
                    sessionId={sessionId}
                    currentScale={currentScale}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Scaling Controls - Next to 3D viewer */}
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 2, height: '600px' }}>
                <Typography variant="h6" gutterBottom>
                  <AspectRatio sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Scale & Transform
                </Typography>
                <Box sx={{ height: 'calc(100% - 60px)', overflowY: 'auto' }}>
                  <ScaleControls 
                    onScale={handleScale}
                    onReset={handleReset}
                    loading={scalingLoading}
                    currentScale={currentScale}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Analysis, Cost Calculator, and Electroplating in Accordion */}
        {currentFile && (
          <Paper elevation={3}>
            {/* Analysis Accordion */}
            <Accordion defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls="analysis-content"
                id="analysis-header"
              >
                <Analytics sx={{ mr: 2 }} />
                <Typography variant="h6">Analysis</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <MeshStats 
                  statistics={statistics}
                  validation={validation}
                  loading={analysisLoading}
                  onRefresh={handleRefreshData}
                />
              </AccordionDetails>
            </Accordion>

            {/* Cost Calculator Accordion */}
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls="cost-content"
                id="cost-header"
              >
                <Calculate sx={{ mr: 2 }} />
                <Typography variant="h6">Cost Calculator</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CostCalculator 
                  onCalculate={handleCostCalculation}
                  costEstimate={costEstimate}
                  loading={costLoading}
                />
              </AccordionDetails>
            </Accordion>

            {/* Electroplating Accordion */}
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls="electroplating-content"
                id="electroplating-header"
              >
                <ElectricBolt sx={{ mr: 2 }} />
                <Typography variant="h6">Electroplating</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <ElectroplatingCalculator 
                  onCalculate={handleElectroplatingCalculation}
                  onGetRecommendations={handleGetRecommendations}
                  platingEstimate={platingEstimate}
                  recommendations={recommendations}
                  loading={platingLoading}
                />
              </AccordionDetails>
            </Accordion>
          </Paper>
        )}
      </Container>

      {/* Global Snackbar for notifications */}
      <Snackbar
        open={!!error || !!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </ErrorBoundary>
  );
}

export default App; 