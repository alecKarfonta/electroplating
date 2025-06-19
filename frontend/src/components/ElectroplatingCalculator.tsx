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
  Tooltip,
  IconButton,
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
  HelpOutline,
  Circle,
  RadioButtonUnchecked,
  Brightness7,
  Star,
  Diamond,
} from '@mui/icons-material';
import {
  ElectroplatingRequest,
  ElectroplatingEstimate,
  ElectroplatingRecommendationRequest,
  ElectroplatingRecommendations,
  MeshStatistics,
} from '../types/api';

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
  metric: 80.0, // microns
  imperial: 3.15 // mils (80 microns converted)
};

// Metal icons and colors
const metalIcons = {
  copper: { icon: Circle, color: '#b45309' }, // Copper/bronze color
  nickel: { icon: RadioButtonUnchecked, color: '#6b7280' }, // Silver/gray color
  chrome: { icon: Brightness7, color: '#94a3b8' }, // Chrome/bright silver
  gold: { icon: Star, color: '#eab308' }, // Gold color
  silver: { icon: Diamond, color: '#e5e7eb' }, // Silver/white color
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
  // Helper function to get metal icon
  const getMetalIcon = (metal: keyof typeof metalIcons, size: 'small' | 'medium' | 'large' = 'medium') => {
    const metalConfig = metalIcons[metal];
    const IconComponent = metalConfig.icon;
    
    const sizeMap = {
      small: '1rem',
      medium: '1.25rem', 
      large: '1.5rem'
    };
    
    return (
      <IconComponent 
        sx={{ 
          color: metalConfig.color,
          fontSize: sizeMap[size],
          filter: metal === 'gold' ? 'drop-shadow(0 0 2px rgba(234, 179, 8, 0.3))' : 
                  metal === 'silver' ? 'drop-shadow(0 0 2px rgba(148, 163, 184, 0.3))' : 'none'
        }} 
      />
    );
  };
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

  // Auto-get recommendations when metal is selected
  useEffect(() => {
    onGetRecommendations({ metal_type: selectedMetal });
  }, [selectedMetal]); // Only depend on selectedMetal, not the function reference

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

      {/* Prominent Metal Selection */}
      <Card 
        sx={{ 
          mb: 3,
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          border: '2px solid #e2e8f0',
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <CardContent sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
              {getMetalIcon(selectedMetal, 'large')}
              <Science sx={{ fontSize: '1.5rem', color: '#8b5cf6' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Metal Selection
            </Typography>
          </Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
                             <FormControl fullWidth>
                <InputLabel sx={{ fontSize: '1.1rem', fontWeight: 600 }}>Select Plating Metal</InputLabel>
                <Select
                  value={selectedMetal}
                  label="Select Plating Metal"
                  onChange={(e) => handleMetalChange(e.target.value as any)}
                  sx={{ 
                    fontSize: '1.1rem',
                    '& .MuiSelect-select': {
                      py: 2,
                      display: 'flex',
                      alignItems: 'center'
                    }
                  }}
                  renderValue={(value) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {getMetalIcon(value as keyof typeof metalIcons, 'medium')}
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </Typography>
                    </Box>
                  )}
                >
                  <MenuItem value="copper">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {getMetalIcon('copper')}
                      <Box>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>Copper</Typography>
                        <Typography variant="caption" color="textSecondary">Excellent conductivity, decorative</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="nickel">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {getMetalIcon('nickel')}
                      <Box>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>Nickel</Typography>
                        <Typography variant="caption" color="textSecondary">Corrosion resistant, bright finish</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="chrome">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {getMetalIcon('chrome')}
                      <Box>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>Chrome</Typography>
                        <Typography variant="caption" color="textSecondary">Mirror finish, wear resistant</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="gold">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {getMetalIcon('gold')}
                      <Box>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>Gold</Typography>
                        <Typography variant="caption" color="textSecondary">Luxury, non-tarnishing</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="silver">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {getMetalIcon('silver')}
                      <Box>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>Silver</Typography>
                        <Typography variant="caption" color="textSecondary">High conductivity, antimicrobial</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {recommendations && (
              <>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 600 }}>
                      Solution Cost
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#059669' }}>
                      ${formatNumber(recommendations.metal_properties.solution_cost_per_kg)}/kg
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Chip 
                      label={recommendations.metal_properties.color}
                      sx={{ 
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        fontWeight: 600
                      }}
                    />
                    <Chip 
                      label={recommendations.metal_properties.hardness}
                      sx={{ 
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        color: '#8b5cf6',
                        fontWeight: 600
                      }}
                    />
                    <Chip 
                      label={recommendations.metal_properties.corrosion_resistance}
                      sx={{ 
                        backgroundColor: 'rgba(5, 150, 105, 0.1)',
                        color: '#059669',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

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
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
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
                <InfoTooltip
                  title="Current Density - Minimum"
                  description="The minimum electrical current per unit area applied during electroplating. Lower values provide better coverage in recessed areas but increase plating time. Too low may cause poor adhesion or uneven deposits."
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
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
                <InfoTooltip
                  title="Current Density - Maximum"
                  description="The maximum electrical current per unit area for this plating process. Higher values increase plating speed but may cause burning, poor surface finish, or stress in the deposit. Stay within the recommended range for your chosen metal."
                />
              </Box>
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
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
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
                <InfoTooltip
                  title="Metal Density"
                  description="The mass per unit volume of the plating metal. This affects calculations for metal consumption and costs. Each metal has a specific density: Copper (8.96), Nickel (8.9), Chrome (7.19), Gold (19.32), Silver (10.49) g/cm³."
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
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
                <InfoTooltip
                  title="Current Efficiency"
                  description="The percentage of electrical current that actually deposits metal (vs. other reactions like hydrogen evolution). 1.0 = 100% efficient. Lower efficiency means more time and power needed. Affected by solution chemistry, temperature, and current density."
                />
              </Box>
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
                    <InfoTooltip
                      title="Power Requirements"
                      description="Watts (W) = instantaneous power draw of your power supply. kWh = total energy consumed for the entire plating process. Used to calculate electricity costs and ensure your power supply can handle the load."
                    />
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
                    <InfoTooltip
                      title="Coverage Efficiency"
                      description="Measures how evenly the plating covers complex geometry. 100% = perfect uniform coverage. Lower values indicate uneven distribution due to geometry complexity, with some areas receiving thinner deposits than others."
                    />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {formatNumber(platingEstimate.quality_factors.coverage_efficiency * 100)}%
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      Surface Factor: {formatNumber(platingEstimate.quality_factors.surface_roughness_factor, 2)}
                    </Typography>
                    <InfoTooltip
                      title="Surface Roughness Factor"
                      description="Multiplier accounting for microscopic surface area. Rough surfaces have higher actual area than geometric area. Factor >1 means more material needed due to surface texture increasing effective plating area."
                    />
                  </Box>
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
        <Accordion 
          defaultExpanded
          sx={{ 
            mt: 3, 
            boxShadow: 'none', 
            border: '1px solid #e2e8f0',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMore />} 
            sx={{ 
              backgroundColor: '#f8fafc',
              '& .MuiAccordionSummary-content': {
                alignItems: 'center'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getMetalIcon(selectedMetal, 'large')}
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {selectedMetal.charAt(0).toUpperCase() + selectedMetal.slice(1)} Plating Guide
              </Typography>
              <Chip 
                label="Auto-updated"
                size="small"
                sx={{ 
                  ml: 1,
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  color: '#22c55e',
                  fontSize: '0.7rem'
                }}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Key Properties Row */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                    Key Properties
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ 
                        textAlign: 'center', 
                        py: 2,
                        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                        border: '1px solid #d1d5db'
                      }}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                          Appearance
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2937' }}>
                          {recommendations.metal_properties.color}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ 
                        textAlign: 'center', 
                        py: 2,
                        background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                        border: '1px solid #c4b5fd'
                      }}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                          Hardness
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#7c3aed' }}>
                          {recommendations.metal_properties.hardness}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ 
                        textAlign: 'center', 
                        py: 2,
                        background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                        border: '1px solid #86efac'
                      }}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                          Corrosion Resistance
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#16a34a' }}>
                          {recommendations.metal_properties.corrosion_resistance}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ 
                        textAlign: 'center', 
                        py: 2,
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        border: '1px solid #fcd34d'
                      }}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                          Solution Cost
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#d97706' }}>
                          ${formatNumber(recommendations.metal_properties.solution_cost_per_kg)}/kg
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Professional Tips */}
              <Grid item xs={12}>
                <Card sx={{ 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e2e8f0',
                  borderRadius: 2
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Lightbulb sx={{ mr: 1, color: '#f59e0b', fontSize: '1.5rem' }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        Professional Tips for {selectedMetal.charAt(0).toUpperCase() + selectedMetal.slice(1)} Plating
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      {recommendations.metal_specific_tips[selectedMetal]?.map((tip, index) => (
                        <Grid item xs={12} md={6} key={index}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            p: 2,
                            backgroundColor: '#f8fafc',
                            borderRadius: 2,
                            border: '1px solid #e2e8f0'
                          }}>
                            <CheckCircle 
                              sx={{ 
                                color: '#22c55e', 
                                fontSize: '1.2rem',
                                mr: 1.5,
                                mt: 0.2,
                                flexShrink: 0
                              }} 
                            />
                            <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.6 }}>
                              {tip}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}
    </Paper>
  );
};

export default ElectroplatingCalculator; 