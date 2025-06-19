import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Slider,
  Chip,
  Divider,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  Refresh,
  AspectRatio,
  Straighten,
} from '@mui/icons-material';
import { ScaleRequest } from '../types/api';

interface ScaleControlsProps {
  onScale: (scaleRequest: ScaleRequest) => void;
  onReset?: () => void;
  loading?: boolean;
  error?: string | null;
  currentScale?: number;
  onRefresh?: () => void;
}

const ScaleControls: React.FC<ScaleControlsProps> = ({
  onScale,
  onReset,
  loading = false,
  error = null,
  currentScale = 1.0,
  onRefresh,
}) => {
  const [scaleFactor, setScaleFactor] = useState<number>(1.0);
  const [scaleMode, setScaleMode] = useState<'uniform' | 'xyz'>('uniform');
  const [xScale, setXScale] = useState<number>(1.0);
  const [yScale, setYScale] = useState<number>(1.0);
  const [zScale, setZScale] = useState<number>(1.0);

  const handleUniformScale = (value: number) => {
    setScaleFactor(value);
  };

  const handleXYZScale = (axis: 'x' | 'y' | 'z', value: number) => {
    switch (axis) {
      case 'x':
        setXScale(value);
        break;
      case 'y':
        setYScale(value);
        break;
      case 'z':
        setZScale(value);
        break;
    }
  };

  const handleScale = () => {
    let scaleRequest: ScaleRequest;
    
    if (scaleMode === 'uniform') {
      scaleRequest = { scale_factor: scaleFactor };
    } else {
      scaleRequest = { scale_factor: [xScale, yScale, zScale] };
    }
    
    onScale(scaleRequest);
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
    setScaleFactor(1.0);
    setXScale(1.0);
    setYScale(1.0);
    setZScale(1.0);
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const presetScales = [
    { label: '0.5x', value: 0.5 },
    { label: '1x', value: 1.0 },
    { label: '2x', value: 2.0 },
    { label: '5x', value: 5.0 },
    { label: '10x', value: 10.0 },
  ];

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        <AspectRatio sx={{ mr: 1, verticalAlign: 'middle' }} />
        Scale Controls
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Current Scale: {currentScale.toFixed(2)}x
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {presetScales.map((preset) => (
            <Chip
              key={preset.value}
              label={preset.label}
              onClick={() => setScaleFactor(preset.value)}
              variant={scaleFactor === preset.value ? 'filled' : 'outlined'}
              color={scaleFactor === preset.value ? 'primary' : 'default'}
              size="small"
            />
          ))}
        </Box>
      </Box>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Scale Mode</InputLabel>
        <Select
          value={scaleMode}
          label="Scale Mode"
          onChange={(e) => setScaleMode(e.target.value as 'uniform' | 'xyz')}
        >
          <MenuItem value="uniform">Uniform Scale</MenuItem>
          <MenuItem value="xyz">XYZ Scale</MenuItem>
        </Select>
      </FormControl>

      {scaleMode === 'uniform' ? (
        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>
            Scale Factor: {scaleFactor.toFixed(2)}x
          </Typography>
          <Slider
            value={scaleFactor}
            onChange={(_, value) => handleUniformScale(value as number)}
            min={0.01}
            max={20}
            step={0.01}
            marks={[
              { value: 0.01, label: '0.01x' },
              { value: 1, label: '1x' },
              { value: 10, label: '10x' },
              { value: 20, label: '20x' },
            ]}
            valueLabelDisplay="auto"
          />
          <TextField
            fullWidth
            label="Scale Factor"
            type="number"
            value={scaleFactor}
            onChange={(e) => handleUniformScale(parseFloat(e.target.value) || 1.0)}
            inputProps={{ min: 0.01, max: 100, step: 0.01 }}
            helperText="Enter a scale factor (0.01 to 100)"
            sx={{ mt: 2 }}
          />
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Typography gutterBottom>X Scale: {xScale.toFixed(2)}x</Typography>
            <Slider
              value={xScale}
              onChange={(_, value) => handleXYZScale('x', value as number)}
              min={0.01}
              max={10}
              step={0.01}
              valueLabelDisplay="auto"
            />
            <TextField
              fullWidth
              label="X Scale"
              type="number"
              value={xScale}
              onChange={(e) => handleXYZScale('x', parseFloat(e.target.value) || 1.0)}
              inputProps={{ min: 0.01, max: 100, step: 0.01 }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography gutterBottom>Y Scale: {yScale.toFixed(2)}x</Typography>
            <Slider
              value={yScale}
              onChange={(_, value) => handleXYZScale('y', value as number)}
              min={0.01}
              max={10}
              step={0.01}
              valueLabelDisplay="auto"
            />
            <TextField
              fullWidth
              label="Y Scale"
              type="number"
              value={yScale}
              onChange={(e) => handleXYZScale('y', parseFloat(e.target.value) || 1.0)}
              inputProps={{ min: 0.01, max: 100, step: 0.01 }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography gutterBottom>Z Scale: {zScale.toFixed(2)}x</Typography>
            <Slider
              value={zScale}
              onChange={(_, value) => handleXYZScale('z', value as number)}
              min={0.01}
              max={10}
              step={0.01}
              valueLabelDisplay="auto"
            />
            <TextField
              fullWidth
              label="Z Scale"
              type="number"
              value={zScale}
              onChange={(e) => handleXYZScale('z', parseFloat(e.target.value) || 1.0)}
              inputProps={{ min: 0.01, max: 100, step: 0.01 }}
              size="small"
            />
          </Grid>
        </Grid>
      )}

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleScale}
            disabled={loading}
            startIcon={<ZoomIn />}
            sx={{ height: 56 }}
          >
            {loading ? 'Scaling...' : 'Apply Scale'}
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleReset}
            startIcon={<Refresh />}
            sx={{ height: 56 }}
          >
            Reset
          </Button>
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleRefresh}
            startIcon={<Straighten />}
            sx={{ height: 56 }}
          >
            Refresh Data
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ScaleControls; 