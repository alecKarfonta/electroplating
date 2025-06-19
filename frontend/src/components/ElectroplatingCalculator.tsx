import React, { useState, useEffect } from 'react';
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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Calculate,
  ElectricBolt,
  Timer,
  Scale,
  AttachMoney,
  Science,
  Lightbulb,
  CheckCircle,
  Info,
  AspectRatio,
  SwapHoriz,
  Settings,
  AutoAwesome,
  Speed,
  BatteryChargingFull,
  Engineering,
  ExpandMore,
  TrendingUp,
  Layers,
} from '@mui/icons-material';
import {
  ElectroplatingRequest,
  ElectroplatingEstimate,
  ElectroplatingRecommendationRequest,
  ElectroplatingRecommendations,
  MeshStatistics,
} from '../types/api';

interface ElectroplatingCalculatorProps {
  onCalculate: (request: ElectroplatingRequest) => void;
  onGetRecommendations: (request: ElectroplatingRecommendationRequest) => void;
  platingEstimate?: ElectroplatingEstimate | null;
  recommendations?: ElectroplatingRecommendations | null;
  loading?: boolean;
  error?: string | null;
  statistics?: MeshStatistics | null;
}

// Unit conversion type
type UnitSystem = 'metric' | 'imperial';

// Default current density values for different metals (A/in²)
const metalDefaults = {
  copper: { min: 0.07, max: 0.1, density: 8.96 },
  nickel: { min: 0.07, max: 0.15, density: 8.9 },
  chrome: { min: 0.10, max: 0.25, density: 7.19 },
  gold: { min: 0.04, max: 0.12, density: 19.32 },
  silver: { min: 0.03, max: 0.15, density: 10.49 }
};

// Default thickness values
const defaultThickness = {
  metric: 20.0, // microns
  imperial: 0.787 // mils (20 microns converted)
};

const ElectroplatingCalculator: React.FC<ElectroplatingCalculatorProps> = ({
  onCalculate,
  onGetRecommendations,
  platingEstimate,
  recommendations,
  loading = false,
  error = null,
  statistics = null,
}) => {
  const [selectedMetal, setSelectedMetal] = useState<'nickel' | 'copper' | 'chrome' | 'gold' | 'silver'>('copper');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [thicknessInput, setThicknessInput] = useState<number>(defaultThickness.metric);
  
  const [formData, setFormData] = useState<ElectroplatingRequest>({
    current_density_min: metalDefaults.copper.min,
    current_density_max: metalDefaults.copper.max,
    plating_thickness_microns: defaultThickness.metric,
    metal_density_g_cm3: metalDefaults.copper.density,
    current_efficiency: 0.95,
    voltage: 3.0,
  });

  const validateAndCalculate = (newFormData: ElectroplatingRequest) => {
    // Only proceed if we have statistics (surface area data)
    if (!statistics?.surface_area || statistics.surface_area <= 0) {
      return;
    }

    // Validate that all required fields have valid values
    if (
      typeof newFormData.current_density_min === 'number' && newFormData.current_density_min > 0 &&
      typeof newFormData.current_density_max === 'number' && newFormData.current_density_max > 0 &&
      typeof newFormData.plating_thickness_microns === 'number' && newFormData.plating_thickness_microns > 0 &&
      typeof newFormData.metal_density_g_cm3 === 'number' && newFormData.metal_density_g_cm3 > 0 &&
      typeof newFormData.current_efficiency === 'number' && newFormData.current_efficiency > 0 &&
      typeof newFormData.voltage === 'number' && newFormData.voltage > 0
    ) {
      onCalculate(newFormData);
    }
  };

  const handleInputChange = (field: keyof ElectroplatingRequest, value: any) => {
    const newFormData = {
      ...formData,
      [field]: value,
    };
    setFormData(newFormData);
    validateAndCalculate(newFormData);
  };

  const handleThicknessChange = (value: number) => {
    setThicknessInput(value);
    
    // Convert to microns for the form data
    const microns = unitSystem === 'metric' ? value : value * 25.4; // Convert mils to microns
    
    const newFormData = {
      ...formData,
      plating_thickness_microns: microns,
    };
    setFormData(newFormData);
    validateAndCalculate(newFormData);
  };

  const handleMetalChange = (metal: 'nickel' | 'copper' | 'chrome' | 'gold' | 'silver') => {
    setSelectedMetal(metal);
    const defaults = metalDefaults[metal];
    
    // Update form data with metal-specific defaults
    const newFormData = {
      ...formData,
      current_density_min: defaults.min,
      current_density_max: defaults.max,
      metal_density_g_cm3: defaults.density,
    };
    setFormData(newFormData);
    validateAndCalculate(newFormData);
  };

  // Initial calculation when component loads with statistics
  useEffect(() => {
    if (statistics?.surface_area && statistics.surface_area > 0) {
      // Only proceed if we have statistics (surface area data)
      if (
        typeof formData.current_density_min === 'number' && formData.current_density_min > 0 &&
        typeof formData.current_density_max === 'number' && formData.current_density_max > 0 &&
        typeof formData.plating_thickness_microns === 'number' && formData.plating_thickness_microns > 0 &&
        typeof formData.metal_density_g_cm3 === 'number' && formData.metal_density_g_cm3 > 0 &&
        typeof formData.current_efficiency === 'number' && formData.current_efficiency > 0 &&
        typeof formData.voltage === 'number' && formData.voltage > 0
      ) {
        onCalculate(formData);
      }
    }
  }, [statistics?.surface_area]); // Only trigger when surface area becomes available

  const handleGetRecommendations = () => {
    onGetRecommendations({ metal_type: selectedMetal });
  };

  // Unit conversion functions
  const convertArea = (area: { cm2: number; in2: number }) => {
    return unitSystem === 'metric' ? area.cm2 : area.in2;
  };

  const getAreaUnit = () => {
    return unitSystem === 'metric' ? 'cm²' : 'in²';
  };

  const convertLength = (microns: number) => {
    if (unitSystem === 'metric') {
      return `${formatNumber(microns)} μm`;
    } else {
      const mils = microns * 0.0393701 / 1000; // Convert to mils (thousandths of an inch)
      return `${formatNumber(mils, 3)} mils`;
    }
  };

  const convertMass = (grams: number) => {
    if (unitSystem === 'metric') {
      return `${formatNumber(grams)} g`;
    } else {
      const ounces = grams * 0.035274;
      return `${formatNumber(ounces, 3)} oz`;
    }
  };

  const handleUnitSystemChange = (newSystem: UnitSystem) => {
    setUnitSystem(newSystem);
    
    // Convert thickness input to new unit system
    if (newSystem === 'imperial') {
      // Convert microns to mils
      const mils = thicknessInput * 0.0393701 / 1000;
      setThicknessInput(mils);
    } else {
      // Convert mils to microns
      const microns = thicknessInput * 25.4;
      setThicknessInput(microns);
    }
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

  const getThicknessLabel = () => {
    return unitSystem === 'metric' ? 'Plating Thickness (μm)' : 'Plating Thickness (mils)';
  };

  const getThicknessHelperText = () => {
    return unitSystem === 'metric' ? 'Typical range: 5-50 μm' : 'Typical range: 0.2-2.0 mils';
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* Header with Unit Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Engineering sx={{ mr: 1, fontSize: '2rem', color: '#3b82f6' }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Electroplating Calculator
          </Typography>
          {loading && (
            <Chip 
              label="Auto-calculating..." 
              size="small" 
              color="primary"
              sx={{ ml: 2, fontSize: '0.7rem' }}
            />
          )}
        </Box>
        
        <ToggleButtonGroup
          value={unitSystem}
          exclusive
          onChange={(_, value) => value && handleUnitSystemChange(value)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              fontWeight: 600,
              '&.Mui-selected': {
                backgroundColor: '#3b82f6',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#2563eb',
                }
              }
            }
          }}
        >
          <ToggleButton value="metric">
            <SwapHoriz sx={{ mr: 0.5 }} />
            Metric
          </ToggleButton>
          <ToggleButton value="imperial">
            <SwapHoriz sx={{ mr: 0.5 }} />
            Imperial
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Surface Area Display - Only show if statistics available */}
      {statistics && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: '#3b82f6'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Layers sx={{ fontSize: '2rem', color: '#3b82f6' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e3a8a', mb: 0.5 }}>
                Model Surface Area
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#3b82f6' }}>
                {unitSystem === 'metric' 
                  ? `${formatNumber(statistics.surface_area)} mm²` 
                  : `${formatNumber(statistics.surface_area * 0.00155)} in²`
                }
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                {unitSystem === 'metric' 
                  ? `(${formatNumber(statistics.surface_area / 100)} cm²)`
                  : `(${formatNumber(statistics.surface_area * 0.00155 * 6.4516)} cm²)`
                }
              </Typography>
            </Box>
          </Box>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Input Parameters Section */}
      <Accordion defaultExpanded sx={{ mb: 3, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
        <AccordionSummary expandIcon={<ExpandMore />} sx={{ backgroundColor: '#f8fafc' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Settings sx={{ mr: 1, color: '#6366f1' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Input Parameters
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
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
                InputProps={{
                  startAdornment: <BatteryChargingFull sx={{ mr: 1, color: '#6b7280' }} />
                }}
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
                InputProps={{
                  startAdornment: <BatteryChargingFull sx={{ mr: 1, color: '#6b7280' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={getThicknessLabel()}
                type="number"
                value={thicknessInput}
                onChange={(e) => handleThicknessChange(parseFloat(e.target.value))}
                inputProps={{ 
                  min: unitSystem === 'metric' ? 1 : 0.04,
                  max: unitSystem === 'metric' ? 1000 : 39.37,
                  step: unitSystem === 'metric' ? 1 : 0.1
                }}
                helperText={getThicknessHelperText()}
                InputProps={{
                  startAdornment: <Layers sx={{ mr: 1, color: '#6b7280' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Metal Density (g/cm³)"
                type="number"
                value={formData.metal_density_g_cm3}
                onChange={(e) => handleInputChange('metal_density_g_cm3', parseFloat(e.target.value))}
                inputProps={{ min: 1, max: 25, step: 0.001 }}
                helperText="Nickel: 8.9, Copper: 8.96, Gold: 19.32"
                InputProps={{
                  startAdornment: <Scale sx={{ mr: 1, color: '#6b7280' }} />
                }}
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
                InputProps={{
                  startAdornment: <Speed sx={{ mr: 1, color: '#6b7280' }} />
                }}
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
                InputProps={{
                  startAdornment: <ElectricBolt sx={{ mr: 1, color: '#6b7280' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Alert 
                severity="info" 
                sx={{ 
                  height: 56,
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: 1,
                  '& .MuiAlert-icon': {
                    color: '#6366f1'
                  }
                }}
                icon={<AutoAwesome />}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Results auto-calculate as you type
                </Typography>
              </Alert>
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
                sx={{ 
                  py: 1.5,
                  borderColor: '#6366f1',
                  color: '#6366f1',
                  '&:hover': {
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)'
                  }
                }}
              >
                Get {selectedMetal.charAt(0).toUpperCase() + selectedMetal.slice(1)} Recommendations
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Results Section */}
      {platingEstimate && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TrendingUp sx={{ mr: 1, fontSize: '1.5rem', color: '#059669' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Calculation Results
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            {/* Current Requirements */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
                color: 'white',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BatteryChargingFull sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="inherit">
                      Recommended Current
                    </Typography>
                  </Box>
                  <Typography variant="h6" color="inherit" sx={{ fontWeight: 700 }}>
                    {formatNumber(platingEstimate.current_requirements.recommended_amps)} A
                  </Typography>
                  <Typography variant="body2" color="inherit" sx={{ opacity: 0.9 }}>
                    Range: {formatNumber(platingEstimate.current_requirements.min_amps)} - {formatNumber(platingEstimate.current_requirements.max_amps)} A
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Plating Time */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Timer sx={{ mr: 1, color: '#f59e0b' }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Plating Time
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
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
              <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Scale sx={{ mr: 1, color: '#8b5cf6' }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Metal Required
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {convertMass(platingEstimate.material_requirements.metal_mass_g)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {unitSystem === 'metric' 
                      ? `${formatNumber(platingEstimate.material_requirements.metal_mass_kg, 4)} kg`
                      : `${formatNumber(platingEstimate.material_requirements.metal_mass_g * 0.035274 / 16, 4)} lbs`
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Power Requirements */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ElectricBolt sx={{ mr: 1, color: '#ef4444' }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Power
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
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
              <Card sx={{ 
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', 
                color: 'white',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AttachMoney sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="inherit">
                      Total Cost
                    </Typography>
                  </Box>
                  <Typography variant="h6" color="inherit" sx={{ fontWeight: 700 }}>
                    ${formatNumber(platingEstimate.cost_estimates.total_cost)}
                  </Typography>
                  <Typography variant="body2" color="inherit" sx={{ opacity: 0.9 }}>
                    Elec: ${formatNumber(platingEstimate.cost_estimates.electricity_cost)} | 
                    Sol: ${formatNumber(platingEstimate.cost_estimates.solution_cost)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Quality Factors */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AutoAwesome sx={{ mr: 1, color: '#06b6d4' }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Coverage Efficiency
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
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
              <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Layers sx={{ mr: 1, color: '#84cc16' }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Plating Thickness
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {convertLength(platingEstimate.plating_parameters.thickness_microns)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {unitSystem === 'metric' 
                      ? `${formatNumber(platingEstimate.plating_parameters.thickness_inches * 1000, 3)} mils`
                      : `${formatNumber(platingEstimate.plating_parameters.thickness_microns)} μm`
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Process Recommendations Section */}
      {platingEstimate && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Lightbulb sx={{ mr: 1, fontSize: '1.5rem', color: '#f59e0b' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Process Recommendations
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Settings sx={{ mr: 1, color: '#6366f1' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Equipment Settings
                    </Typography>
                  </Box>
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
              <Card sx={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Science sx={{ mr: 1, color: '#059669' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Process Preparation
                    </Typography>
                  </Box>
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
              <Card sx={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AutoAwesome sx={{ mr: 1, color: '#8b5cf6' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Quality Metrics
                    </Typography>
                  </Box>
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
      )}

      {/* Metal-Specific Recommendations Section */}
      {recommendations && (
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Science sx={{ mr: 1, fontSize: '1.5rem', color: '#8b5cf6' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {recommendations.metal_properties.color} {selectedMetal.charAt(0).toUpperCase() + selectedMetal.slice(1)} Specifications
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Engineering sx={{ mr: 1, color: '#6366f1' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Metal Properties
                    </Typography>
                  </Box>
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
              <Card sx={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Lightbulb sx={{ mr: 1, color: '#f59e0b' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Metal-Specific Tips
                    </Typography>
                  </Box>
                  <List dense>
                    {recommendations.metal_specific_tips[selectedMetal]?.map((tip, index) => (
                      <ListItem key={index}>
                        <ListItemIcon><CheckCircle color="success" sx={{ fontSize: '1rem' }} /></ListItemIcon>
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