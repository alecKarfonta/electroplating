import React, { useState } from 'react';
import {
  Box,
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
import { ScaleRequest } from '../types/api';

interface ScaleControlsProps {
  onScale: (scaleRequest: ScaleRequest) => void;
  onReset?: () => void;
  loading?: boolean;
  error?: string | null;
  currentScale?: number;
}

const ScaleControls: React.FC<ScaleControlsProps> = ({
  onScale,
  onReset,
  loading = false,
  error = null,
  currentScale = 1.0,
}) => {
  const [scaleFactor, setScaleFactor] = useState<number>(1.0);
  const [scaleMode, setScaleMode] = useState<'uniform' | 'xyz'>('uniform');
  const [xScale, setXScale] = useState<number>(1.0);
  const [yScale, setYScale] = useState<number>(1.0);
  const [zScale, setZScale] = useState<number>(1.0);

  const handleUniformScale = (value: number) => setScaleFactor(value);

  const handleXYZScale = (axis: 'x' | 'y' | 'z', value: number) => {
    if (axis === 'x') setXScale(value);
    else if (axis === 'y') setYScale(value);
    else setZScale(value);
  };

  const handleScale = () => {
    const scaleRequest: ScaleRequest =
      scaleMode === 'uniform'
        ? { scale_factor: scaleFactor }
        : { scale_factor: [xScale, yScale, zScale] };
    onScale(scaleRequest);
  };

  const handleReset = () => {
    onReset?.();
    setScaleFactor(1.0);
    setXScale(1.0);
    setYScale(1.0);
    setZScale(1.0);
  };

  const presetScales = [0.5, 1.0, 2.0, 5.0, 10.0];

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Current scale: {currentScale.toFixed(2)}x
      </Typography>

      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
        {presetScales.map((value) => (
          <Chip
            key={value}
            label={`${value}x`}
            onClick={() => setScaleFactor(value)}
            variant={scaleFactor === value ? 'filled' : 'outlined'}
            color={scaleFactor === value ? 'primary' : 'default'}
            size="small"
          />
        ))}
      </Box>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Scale Mode</InputLabel>
        <Select
          value={scaleMode}
          label="Scale Mode"
          onChange={(e) => setScaleMode(e.target.value as 'uniform' | 'xyz')}
        >
          <MenuItem value="uniform">Uniform</MenuItem>
          <MenuItem value="xyz">Per Axis</MenuItem>
        </Select>
      </FormControl>

      {scaleMode === 'uniform' ? (
        <Box sx={{ mb: 2 }}>
          <Slider
            value={scaleFactor}
            onChange={(_, value) => handleUniformScale(value as number)}
            min={0.01}
            max={20}
            step={0.01}
            valueLabelDisplay="auto"
            size="small"
          />
          <TextField
            fullWidth
            size="small"
            label="Scale Factor"
            type="number"
            value={scaleFactor}
            onChange={(e) => handleUniformScale(parseFloat(e.target.value) || 1.0)}
            inputProps={{ min: 0.01, max: 100, step: 0.01 }}
          />
        </Box>
      ) : (
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {(['x', 'y', 'z'] as const).map((axis) => {
            const value = axis === 'x' ? xScale : axis === 'y' ? yScale : zScale;
            return (
              <Grid item xs={4} key={axis}>
                <TextField
                  fullWidth
                  size="small"
                  label={`${axis.toUpperCase()}`}
                  type="number"
                  value={value}
                  onChange={(e) => handleXYZScale(axis, parseFloat(e.target.value) || 1.0)}
                  inputProps={{ min: 0.01, max: 100, step: 0.01 }}
                />
              </Grid>
            );
          })}
        </Grid>
      )}

      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={1}>
        <Grid item xs={6}>
          <Button variant="contained" fullWidth onClick={handleScale} disabled={loading} size="small">
            {loading ? 'Applying...' : 'Apply'}
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button variant="outlined" fullWidth onClick={handleReset} size="small">
            Reset
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ScaleControls;
