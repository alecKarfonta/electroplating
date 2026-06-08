import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  CssBaseline,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Backdrop,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

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
          <Alert severity="error">
            <Typography variant="subtitle1" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2">
              Please refresh the page and try again.
            </Typography>
          </Alert>
        </Container>
      );
    }
    return this.props.children;
  }
}

const sectionPaper = {
  p: 3,
  mb: 2,
};

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
      setSuccessMessage(`"${response.filename}" uploaded`);
      await loadAnalysis(response.session_id);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload file');
      setCurrentFile(null);
    } finally {
      setUploadLoading(false);
    }
  };

  const loadAnalysis = async (sid: string) => {
    setAnalysisLoading(true);
    setError(null);
    try {
      const [statsResponse, validationResponse] = await Promise.all([
        getMeshStatistics(sid),
        validateMesh(sid),
      ]);
      setStatistics(statsResponse);
      setValidation(validationResponse);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load analysis');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleCostCalculation = async (costRequest: ResinCostRequest) => {
    if (!sessionId) { setError('No file uploaded'); return; }
    setCostLoading(true);
    setError(null);
    try {
      setCostEstimate(await estimateResinCost(sessionId, costRequest));
      setSuccessMessage('Cost calculated');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to calculate cost');
    } finally {
      setCostLoading(false);
    }
  };

  const handleElectroplatingCalculation = async (platingRequest: ElectroplatingRequest) => {
    if (!sessionId) { setError('No file uploaded'); return; }
    setPlatingLoading(true);
    setError(null);
    try {
      setPlatingEstimate(await calculateElectroplatingParameters(sessionId, platingRequest));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to calculate electroplating parameters');
    } finally {
      setPlatingLoading(false);
    }
  };

  const handleGetRecommendations = async (recommendationRequest: ElectroplatingRecommendationRequest) => {
    if (!sessionId) { setError('No file uploaded'); return; }
    setPlatingLoading(true);
    try {
      setRecommendations(await getElectroplatingRecommendations(sessionId, recommendationRequest));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to get recommendations');
    } finally {
      setPlatingLoading(false);
    }
  };

  const handleScale = async (scaleRequest: ScaleRequest) => {
    if (!sessionId) { setError('No file uploaded'); return; }
    setScalingLoading(true);
    setError(null);
    try {
      await scaleMesh(sessionId, scaleRequest);
      setCurrentScale(Array.isArray(scaleRequest.scale_factor) ? scaleRequest.scale_factor[0] : scaleRequest.scale_factor);
      await loadAnalysis(sessionId);
      setCostEstimate(null);
      setPlatingEstimate(null);
      setRecommendations(null);
      setSuccessMessage('Scale applied');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to scale object');
    } finally {
      setScalingLoading(false);
    }
  };

  const handleReset = async () => {
    if (!sessionId) { setError('No file uploaded'); return; }
    setScalingLoading(true);
    setError(null);
    try {
      await resetMesh(sessionId);
      setCurrentScale(1.0);
      await loadAnalysis(sessionId);
      setCostEstimate(null);
      setPlatingEstimate(null);
      setRecommendations(null);
      setSuccessMessage('Reset to original size');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to reset object');
    } finally {
      setScalingLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const notification = error || successMessage;
  const notificationSeverity = error ? 'error' : 'success';

  return (
    <ErrorBoundary>
      <CssBaseline />
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar sx={{ minHeight: 56 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            PlateForge
          </Typography>
          <Typography variant="body2" sx={{ ml: 1.5, opacity: 0.7 }}>
            Electroplating Calculator
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Backdrop open={isLoading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <CircularProgress color="inherit" size={36} />
        </Backdrop>

        <Paper sx={sectionPaper}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Upload Model
          </Typography>
          <FileUpload onFileSelect={handleFileSelect} loading={uploadLoading} />
        </Paper>

        {currentFile && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ ...sectionPaper, height: 520, mb: 0, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                  3D Viewer
                </Typography>
                <Box sx={{ flex: 1, minHeight: 0, bgcolor: '#fafafa', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <STLViewer sessionId={sessionId} currentScale={currentScale} />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ ...sectionPaper, height: 520, mb: 0, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                  Scale
                </Typography>
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
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

        {currentFile && (
          <Paper sx={{ mb: 2, overflow: 'hidden' }}>
            <Accordion defaultExpanded disableGutters elevation={0}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Electroplating
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <ElectroplatingCalculator
                  onCalculate={handleElectroplatingCalculation}
                  onGetRecommendations={handleGetRecommendations}
                  platingEstimate={platingEstimate}
                  recommendations={recommendations}
                  loading={platingLoading}
                  statistics={statistics}
                />
              </AccordionDetails>
            </Accordion>

            <Accordion disableGutters elevation={0}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Mesh Analysis
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <MeshStats
                  statistics={statistics}
                  validation={validation}
                  loading={analysisLoading}
                  onRefresh={sessionId ? () => loadAnalysis(sessionId) : undefined}
                />
              </AccordionDetails>
            </Accordion>

            <Accordion disableGutters elevation={0}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Resin Cost
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <CostCalculator
                  onCalculate={handleCostCalculation}
                  costEstimate={costEstimate}
                  loading={costLoading}
                />
              </AccordionDetails>
            </Accordion>
          </Paper>
        )}
      </Container>

      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notification ? (
          <Alert onClose={handleCloseSnackbar} severity={notificationSeverity} variant="filled" sx={{ width: '100%' }}>
            {notification}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ErrorBoundary>
  );
}

export default App;
