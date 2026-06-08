import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Alert,
  Button,
  Divider,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { MeshStatistics, ValidationResult } from '../types/api';

interface MeshStatsProps {
  statistics?: MeshStatistics | null;
  validation?: ValidationResult | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => Promise<void>;
}

const MeshStats: React.FC<MeshStatsProps> = ({
  statistics,
  validation,
  loading = false,
  error = null,
  onRefresh,
}) => {
  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading statistics...
      </Typography>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!statistics) {
    return null;
  }

  const formatNumber = (num: number, decimals = 2) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);

  const formatVolume = (volume: number) =>
    volume >= 1000 ? `${formatNumber(volume / 1000)} cm³` : `${formatNumber(volume)} mm³`;

  const formatArea = (area: number) =>
    area >= 100 ? `${formatNumber(area / 100)} cm²` : `${formatNumber(area)} mm²`;

  const stats = [
    { label: 'Surface Area', value: formatArea(statistics.surface_area) },
    { label: 'Volume', value: formatVolume(statistics.volume) },
    { label: 'Triangles', value: statistics.triangle_count.toLocaleString() },
    { label: 'Vertices', value: statistics.vertex_count.toLocaleString() },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Mesh geometry summary
        </Typography>
        {onRefresh && (
          <Button
            variant="text"
            size="small"
            onClick={onRefresh}
            disabled={loading}
            startIcon={<Refresh fontSize="small" />}
          >
            Refresh
          </Button>
        )}
      </Box>

      <Grid container spacing={2}>
        {stats.map(({ label, value }) => (
          <Grid item xs={6} sm={3} key={label}>
            <Typography variant="caption" color="text.secondary" display="block">
              {label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {value}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {validation && (validation.issues.length > 0 || validation.warnings.length > 0) && (
        <>
          <Divider sx={{ my: 2 }} />
          {validation.issues.length > 0 && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {validation.issues.join(' · ')}
            </Alert>
          )}
          {validation.warnings.length > 0 && (
            <Alert severity="warning">
              {validation.warnings.join(' · ')}
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default MeshStats;
