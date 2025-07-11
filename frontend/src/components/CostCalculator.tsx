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
  Card,
  CardContent,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Calculate, CurrencyExchange, HelpOutline } from '@mui/icons-material';
import { ResinCostRequest, ResinCostEstimate } from '../types/api';

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

  const handleInputChange = (field: keyof ResinCostRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        <CurrencyExchange sx={{ mr: 1, verticalAlign: 'middle' }} />
        Cost Calculator
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                label="Resin Density (g/cm³)"
                type="number"
                value={formData.resin_density_g_cm3}
                onChange={(e) => handleInputChange('resin_density_g_cm3', parseFloat(e.target.value))}
                inputProps={{ min: 0.1, max: 10, step: 0.1 }}
                helperText="Typical range: 0.8 - 2.0 g/cm³"
              />
              <InfoTooltip
                title="Resin Density"
                description="The mass per unit volume of your 3D printing resin. Different resin types have different densities: Standard resins (~1.1 g/cm³), Tough resins (~1.2 g/cm³), Flexible resins (~1.0 g/cm³). Check your resin specifications for exact values."
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Resin Price ($/kg)"
              type="number"
              value={formData.resin_price_per_kg}
              onChange={(e) => handleInputChange('resin_price_per_kg', parseFloat(e.target.value))}
              inputProps={{ min: 0.1, step: 0.1 }}
              helperText="Price per kilogram of resin"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
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
          <Grid item xs={12} sm={6}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              startIcon={<Calculate />}
              sx={{ height: 56 }}
            >
              {loading ? 'Calculating...' : 'Calculate Cost'}
            </Button>
          </Grid>
        </Grid>
      </form>

      {costEstimate && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Cost Estimation Results
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Volume (mm³)
                  </Typography>
                  <Typography variant="h6">
                    {costEstimate.volume_mm3.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Volume (cm³)
                  </Typography>
                  <Typography variant="h6">
                    {costEstimate.volume_cm3.toFixed(2)}
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
                    {costEstimate.mass_g.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ backgroundColor: 'success.light', color: 'white' }}>
                <CardContent>
                  <Typography color="inherit" gutterBottom>
                    Total Cost
                  </Typography>
                  <Typography variant="h6" color="inherit">
                    ${costEstimate.cost.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default CostCalculator; 