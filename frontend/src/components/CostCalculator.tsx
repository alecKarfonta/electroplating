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
  Divider,
} from '@mui/material';
import { ResinCostRequest, ResinCostEstimate } from '../types/api';

interface CostCalculatorProps {
  onCalculate: (request: ResinCostRequest) => void;
  costEstimate?: ResinCostEstimate | null;
  loading?: boolean;
  error?: string | null;
}

const CostCalculator: React.FC<CostCalculatorProps> = ({
  onCalculate,
  costEstimate,
  loading = false,
  error = null,
}) => {
  const [formData, setFormData] = useState<ResinCostRequest>({
    resin_density_g_cm3: 1.1,
    resin_price_per_kg: 50.0,
    volume_unit: 'mm3',
  });

  const handleInputChange = (field: keyof ResinCostRequest, value: number | string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Resin Density (g/cm³)"
              type="number"
              value={formData.resin_density_g_cm3}
              onChange={(e) => handleInputChange('resin_density_g_cm3', parseFloat(e.target.value))}
              inputProps={{ min: 0.1, max: 10, step: 0.1 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Resin Price ($/kg)"
              type="number"
              value={formData.resin_price_per_kg}
              onChange={(e) => handleInputChange('resin_price_per_kg', parseFloat(e.target.value))}
              inputProps={{ min: 0.1, step: 0.1 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Volume Unit</InputLabel>
              <Select
                value={formData.volume_unit}
                label="Volume Unit"
                onChange={(e) => handleInputChange('volume_unit', e.target.value)}
              >
                <MenuItem value="mm3">mm³</MenuItem>
                <MenuItem value="cm3">cm³</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" disabled={loading} size="small">
              {loading ? 'Calculating...' : 'Calculate Cost'}
            </Button>
          </Grid>
        </Grid>
      </form>

      {costEstimate && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Cost Estimation Results
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Volume</Typography>
              <Typography variant="body1" fontWeight={600}>
                {costEstimate.volume_cm3.toFixed(2)} cm³
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Mass</Typography>
              <Typography variant="body1" fontWeight={600}>
                {costEstimate.mass_g.toFixed(2)} g
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Total Cost</Typography>
              <Typography variant="body1" fontWeight={600}>
                ${costEstimate.cost.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default CostCalculator;
