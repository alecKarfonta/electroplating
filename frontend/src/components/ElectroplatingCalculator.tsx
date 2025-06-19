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
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Calculate,
  ElectricBolt,
  Timer,
  Scale,
  AttachMoney,
  Science,
  Lightbulb,
  ExpandMore,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import {
  ElectroplatingRequest,
  ElectroplatingEstimate,
  ElectroplatingRecommendationRequest,
  ElectroplatingRecommendations,
} from '../types/api';

interface ElectroplatingCalculatorProps {
  onCalculate: (request: ElectroplatingRequest) => void;
  onGetRecommendations: (request: ElectroplatingRecommendationRequest) => void;
  platingEstimate?: ElectroplatingEstimate | null;
  recommendations?: ElectroplatingRecommendations | null;
  loading?: boolean;
  error?: string | null;
}

// Default current density values for different metals (A/in²)
const metalDefaults = {
  copper: { min: 0.07, max: 0.1, density: 8.96 },
  nickel: { min: 0.07, max: 0.15, density: 8.9 },
  chrome: { min: 0.10, max: 0.25, density: 7.19 },
  gold: { min: 0.04, max: 0.12, density: 19.32 },
  silver: { min: 0.03, max: 0.15, density: 10.49 }
};

const ElectroplatingCalculator: React.FC<ElectroplatingCalculatorProps> = ({
  onCalculate,
  onGetRecommendations,
  platingEstimate,
  recommendations,
  loading = false,
  error = null,
}) => {
  const [selectedMetal, setSelectedMetal] = useState<'nickel' | 'copper' | 'chrome' | 'gold' | 'silver'>('copper');
  
  const [formData, setFormData] = useState<ElectroplatingRequest>({
    current_density_min: metalDefaults.copper.min,
    current_density_max: metalDefaults.copper.max,
    plating_thickness_microns: 20.0,
    metal_density_g_cm3: metalDefaults.copper.density,
    current_efficiency: 0.95,
    voltage: 3.0,
  });

  const handleInputChange = (field: keyof ElectroplatingRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMetalChange = (metal: 'nickel' | 'copper' | 'chrome' | 'gold' | 'silver') => {
    setSelectedMetal(metal);
    const defaults = metalDefaults[metal];
    
    // Update form data with metal-specific defaults
    setFormData(prev => ({
      ...prev,
      current_density_min: defaults.min,
      current_density_max: defaults.max,
      metal_density_g_cm3: defaults.density,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  const handleGetRecommendations = () => {
    onGetRecommendations({ metal_type: selectedMetal });
  };

  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        <ElectricBolt sx={{ mr: 1, verticalAlign: 'middle' }} />
        Electroplating Calculator
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Min Current Density (A/in²)"
              type="number"
              value={formData.current_density_min}
              onChange={(e) => handleInputChange('current_density_min', parseFloat(e.target.value))}
              inputProps={{ min: 0.01, max: 1, step: 0.01 }}
              helperText="Typical range: 0.05-0.15 A/in²"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Max Current Density (A/in²)"
              type="number"
              value={formData.current_density_max}
              onChange={(e) => handleInputChange('current_density_max', parseFloat(e.target.value))}
              inputProps={{ min: 0.01, max: 1, step: 0.01 }}
              helperText="Typical range: 0.05-0.15 A/in²"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Plating Thickness (μm)"
              type="number"
              value={formData.plating_thickness_microns}
              onChange={(e) => handleInputChange('plating_thickness_microns', parseFloat(e.target.value))}
              inputProps={{ min: 1, max: 1000, step: 1 }}
              helperText="Typical range: 5-50 μm"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Metal Density (g/cm³)"
              type="number"
              value={formData.metal_density_g_cm3}
              onChange={(e) => handleInputChange('metal_density_g_cm3', parseFloat(e.target.value))}
              inputProps={{ min: 1, max: 25, step: 0.1 }}
              helperText="Nickel: 8.9, Copper: 8.96, Gold: 19.32"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Current Efficiency"
              type="number"
              value={formData.current_efficiency}
              onChange={(e) => handleInputChange('current_efficiency', parseFloat(e.target.value))}
              inputProps={{ min: 0.1, max: 1, step: 0.01 }}
              helperText="Typical range: 0.85-0.98"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Voltage (V)"
              type="number"
              value={formData.voltage}
              onChange={(e) => handleInputChange('voltage', parseFloat(e.target.value))}
              inputProps={{ min: 1, max: 20, step: 0.1 }}
              helperText="Typical range: 3-12V"
            />
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
              {loading ? 'Calculating...' : 'Calculate Parameters'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Metal Type</InputLabel>
              <Select
                value={selectedMetal}
                label="Metal Type"
                onChange={(e) => handleMetalChange(e.target.value as any)}
              >
                <MenuItem value="nickel">Nickel</MenuItem>
                <MenuItem value="copper">Copper</MenuItem>
                <MenuItem value="chrome">Chrome</MenuItem>
                <MenuItem value="gold">Gold</MenuItem>
                <MenuItem value="silver">Silver</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              fullWidth
              disabled={loading}
              startIcon={<Science />}
              onClick={handleGetRecommendations}
            >
              Get {selectedMetal.charAt(0).toUpperCase() + selectedMetal.slice(1)} Recommendations
            </Button>
          </Grid>
        </Grid>
      </form>

      {platingEstimate && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            <ElectricBolt sx={{ mr: 1, verticalAlign: 'middle' }} />
            Electroplating Results
          </Typography>
          
          <Grid container spacing={2}>
            {/* Surface Area */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Surface Area
                  </Typography>
                  <Typography variant="h6">
                    {formatNumber(platingEstimate.surface_area.in2)} in²
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatNumber(platingEstimate.surface_area.cm2)} cm²
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Current Requirements */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ backgroundColor: 'primary.light', color: 'white' }}>
                <CardContent>
                  <Typography color="inherit" gutterBottom>
                    Recommended Current
                  </Typography>
                  <Typography variant="h6" color="inherit">
                    {formatNumber(platingEstimate.current_requirements.recommended_amps)} A
                  </Typography>
                  <Typography variant="body2" color="inherit">
                    Range: {formatNumber(platingEstimate.current_requirements.min_amps)} - {formatNumber(platingEstimate.current_requirements.max_amps)} A
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Plating Time */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    <Timer sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                    Plating Time
                  </Typography>
                  <Typography variant="h6">
                    {formatTime(platingEstimate.plating_parameters.plating_time_minutes)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatNumber(platingEstimate.plating_parameters.plating_time_hours, 2)} hours
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Metal Mass */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    <Scale sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                    Metal Required
                  </Typography>
                  <Typography variant="h6">
                    {formatNumber(platingEstimate.material_requirements.metal_mass_g)} g
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatNumber(platingEstimate.material_requirements.metal_mass_kg, 4)} kg
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Power Requirements */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Power
                  </Typography>
                  <Typography variant="h6">
                    {formatNumber(platingEstimate.power_requirements.power_watts)} W
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatNumber(platingEstimate.power_requirements.energy_kwh, 3)} kWh
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Cost Estimates */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ backgroundColor: 'success.light', color: 'white' }}>
                <CardContent>
                  <Typography color="inherit" gutterBottom>
                    <AttachMoney sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                    Total Cost
                  </Typography>
                  <Typography variant="h6" color="inherit">
                    ${formatNumber(platingEstimate.cost_estimates.total_cost)}
                  </Typography>
                  <Typography variant="body2" color="inherit">
                    Elec: ${formatNumber(platingEstimate.cost_estimates.electricity_cost)} | 
                    Sol: ${formatNumber(platingEstimate.cost_estimates.solution_cost)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Quality Factors */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Coverage Efficiency
                  </Typography>
                  <Typography variant="h6">
                    {formatNumber(platingEstimate.quality_factors.coverage_efficiency * 100)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Surface Factor: {formatNumber(platingEstimate.quality_factors.surface_roughness_factor, 2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Thickness */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Plating Thickness
                  </Typography>
                  <Typography variant="h6">
                    {formatNumber(platingEstimate.plating_parameters.thickness_microns)} μm
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatNumber(platingEstimate.plating_parameters.thickness_inches * 1000, 3)} mils
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recommendations */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Lightbulb sx={{ mr: 1, verticalAlign: 'middle' }} />
              Recommendations
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Settings
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText 
                          primary="Current" 
                          secondary={platingEstimate.recommendations.current_setting} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText 
                          primary="Voltage" 
                          secondary={platingEstimate.recommendations.voltage_setting} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Timer color="primary" /></ListItemIcon>
                        <ListItemText 
                          primary="Time" 
                          secondary={platingEstimate.recommendations.time_setting} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Preparation
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><Info color="info" /></ListItemIcon>
                        <ListItemText 
                          primary="Surface Prep" 
                          secondary={platingEstimate.recommendations.surface_preparation} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Info color="info" /></ListItemIcon>
                        <ListItemText 
                          primary="Temperature" 
                          secondary={platingEstimate.recommendations.solution_temperature} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Info color="info" /></ListItemIcon>
                        <ListItemText 
                          primary="Agitation" 
                          secondary={platingEstimate.recommendations.agitation} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Quality Factors
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Chip 
                        label={`Coverage: ${formatNumber(platingEstimate.quality_factors.coverage_efficiency * 100)}%`}
                        color={platingEstimate.quality_factors.coverage_efficiency > 0.8 ? 'success' : 'warning'}
                        size="small"
                      />
                      <Chip 
                        label={`Efficiency: ${formatNumber(platingEstimate.quality_factors.current_efficiency * 100)}%`}
                        color="primary"
                        size="small"
                      />
                      <Chip 
                        label={`Surface Factor: ${formatNumber(platingEstimate.quality_factors.surface_roughness_factor, 2)}`}
                        color={platingEstimate.quality_factors.surface_roughness_factor < 1.2 ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}

      {recommendations && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            <Science sx={{ mr: 1, verticalAlign: 'middle' }} />
            {recommendations.metal_properties.color} {selectedMetal.charAt(0).toUpperCase() + selectedMetal.slice(1)} Recommendations
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Metal Properties
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Color" 
                        secondary={recommendations.metal_properties.color} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Hardness" 
                        secondary={recommendations.metal_properties.hardness} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Corrosion Resistance" 
                        secondary={recommendations.metal_properties.corrosion_resistance} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Solution Cost" 
                        secondary={`$${formatNumber(recommendations.metal_properties.solution_cost_per_kg)}/kg`} 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Metal-Specific Tips
                  </Typography>
                  <List dense>
                    {recommendations.metal_specific_tips[selectedMetal]?.map((tip, index) => (
                      <ListItem key={index}>
                        <ListItemIcon><Lightbulb color="primary" /></ListItemIcon>
                        <ListItemText primary={tip} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default ElectroplatingCalculator; 