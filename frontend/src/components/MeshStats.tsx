import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert,
  Button,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Info,
  Warning,
  CheckCircle,
  Error,
  TrendingUp,
  Straighten,
  AspectRatio,
  Refresh,
  HelpOutline,
} from '@mui/icons-material';
import { MeshStatistics, ValidationResult, ResinCostEstimate } from '../types/api';

// InfoTooltip component for showing helpful descriptions
interface InfoTooltipProps {
  title: string;
  description: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ title, description }) => (
  <Tooltip
    title={
      <Box sx={{ maxWidth: 300 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2">
          {description}
        </Typography>
      </Box>
    }
    arrow
    placement="top"
    sx={{
      '& .MuiTooltip-tooltip': {
        backgroundColor: '#1e293b',
        fontSize: '0.875rem',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      },
      '& .MuiTooltip-arrow': {
        color: '#1e293b',
      },
    }}
  >
    <IconButton 
      size="small" 
      sx={{ 
        ml: 0.5, 
        color: '#6b7280',
        '&:hover': { 
          color: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)' 
        }
      }}
    >
      <HelpOutline fontSize="small" />
    </IconButton>
  </Tooltip>
);

interface MeshStatsProps {
  statistics?: MeshStatistics | null;
  validation?: ValidationResult | null;
  costEstimate?: ResinCostEstimate;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => Promise<void>;
}

const MeshStats: React.FC<MeshStatsProps> = ({
  statistics,
  validation,
  costEstimate,
  loading = false,
  error = null,
  onRefresh,
}) => {
  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loading statistics...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!statistics) {
    return null;
  }

  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${formatNumber(volume / 1000)} cm³`;
    }
    return `${formatNumber(volume)} mm³`;
  };

  const formatArea = (area: number) => {
    if (area >= 100) {
      return `${formatNumber(area / 100)} cm²`;
    }
    return `${formatNumber(area)} mm²`;
  };

  return (
    <Box>
      {/* Basic Statistics */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
            Basic Statistics
          </Typography>
          {onRefresh && (
            <Button
              variant="outlined"
              size="small"
              onClick={onRefresh}
              disabled={loading}
              startIcon={<Refresh />}
            >
              Refresh
            </Button>
          )}
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Triangles
                </Typography>
                <Typography variant="h4">
                  {statistics.triangle_count.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Vertices
                </Typography>
                <Typography variant="h4">
                  {statistics.vertex_count.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography color="textSecondary" gutterBottom>
                    Surface Area
                  </Typography>
                  <InfoTooltip
                    title="Surface Area"
                    description="Total surface area of the 3D model that will be electroplated. This is the most critical measurement for calculating current requirements, plating time, and material costs. Larger surface areas require proportionally more current and materials."
                  />
                </Box>
                <Typography variant="h4">
                  {formatArea(statistics.surface_area)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Volume
                </Typography>
                <Typography variant="h4">
                  {formatVolume(statistics.volume)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Detailed Analysis */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
          Detailed Analysis
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Triangle Areas
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={`Min: ${formatNumber(statistics.triangle_areas.min)}`} size="small" />
              <Chip label={`Max: ${formatNumber(statistics.triangle_areas.max)}`} size="small" />
              <Chip label={`Mean: ${formatNumber(statistics.triangle_areas.mean)}`} size="small" />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Edge Lengths
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={`Min: ${formatNumber(statistics.edge_lengths.min)}`} size="small" />
              <Chip label={`Max: ${formatNumber(statistics.edge_lengths.max)}`} size="small" />
              <Chip label={`Mean: ${formatNumber(statistics.edge_lengths.mean)}`} size="small" />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" gutterBottom>
                <AspectRatio sx={{ mr: 1, verticalAlign: 'middle' }} />
                Aspect Ratio
              </Typography>
              <InfoTooltip
                title="Aspect Ratio"
                description="The ratio of the longest dimension to the shortest dimension of the object's bounding box. Higher values indicate elongated or flattened shapes that may require special electroplating considerations."
              />
            </Box>
            <Typography variant="h6">
              {formatNumber(statistics.aspect_ratio)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" gutterBottom>
                Surface Area to Volume Ratio
              </Typography>
              <InfoTooltip
                title="Surface Area to Volume Ratio"
                description="Higher ratios indicate more complex geometry with lots of surface detail relative to bulk volume. Objects with high ratios require more plating material per unit volume and may have longer plating times."
              />
            </Box>
            <Typography variant="h6">
              {formatNumber(statistics.surface_area_to_volume_ratio)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Validation Results */}
      {validation && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {validation.is_valid ? (
              <CheckCircle sx={{ mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
            ) : (
              <Error sx={{ mr: 1, verticalAlign: 'middle', color: 'error.main' }} />
            )}
            Mesh Validation
          </Typography>
          
          {validation.issues.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Issues Found:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validation.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </Alert>
          )}
          
          {validation.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Warnings:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </Alert>
          )}
          
          {validation.degenerate_triangles.length > 0 && (
            <Alert severity="warning">
              <Typography variant="subtitle2">
                Degenerate triangles found: {validation.degenerate_triangles.length}
              </Typography>
            </Alert>
          )}
        </Paper>
      )}

      {/* Cost Estimation */}
      {costEstimate && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            <Straighten sx={{ mr: 1, verticalAlign: 'middle' }} />
            Cost Estimation
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Volume (mm³)
                  </Typography>
                  <Typography variant="h6">
                    {formatNumber(costEstimate.volume_mm3)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Mass (g)
                  </Typography>
                  <Typography variant="h6">
                    {formatNumber(costEstimate.mass_g)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Mass (kg)
                  </Typography>
                  <Typography variant="h6">
                    {formatNumber(costEstimate.mass_kg, 4)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ backgroundColor: 'primary.light', color: 'white' }}>
                <CardContent>
                  <Typography color="inherit" gutterBottom>
                    Estimated Cost
                  </Typography>
                  <Typography variant="h6" color="inherit">
                    ${formatNumber(costEstimate.cost)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default MeshStats; 