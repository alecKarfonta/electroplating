import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
} from '@mui/material';
import { ExpandMore, HelpOutline } from '@mui/icons-material';
import {
  ElectroplatingRequest,
  ElectroplatingEstimate,
  ElectroplatingRecommendationRequest,
  ElectroplatingRecommendations,
  MeshStatistics,
} from '../types/api';

interface InfoTooltipProps {
  title: string;
  description: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ title, description }) => (
  <Tooltip
    title={
      <Box sx={{ maxWidth: 280 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2">{description}</Typography>
      </Box>
    }
    arrow
    placement="top"
  >
    <IconButton size="small" sx={{ ml: 0.5, color: 'text.secondary' }}>
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

type UnitSystem = 'metric' | 'imperial';

const metalDefaults = {
  copper: { min: 0.07, max: 0.1, density: 8.96 },
  nickel: { min: 0.07, max: 0.15, density: 8.9 },
  chrome: { min: 0.10, max: 0.25, density: 7.19 },
  gold: { min: 0.04, max: 0.12, density: 19.32 },
  silver: { min: 0.03, max: 0.15, density: 10.49 },
};

const defaultThickness = { metric: 80.0, imperial: 3.15 };

const ElectroplatingCalculator: React.FC<ElectroplatingCalculatorProps> = ({
  onCalculate,
  onGetRecommendations,
  platingEstimate,
  recommendations,
  error = null,
  statistics = null,
}) => {
  const [selectedMetal, setSelectedMetal] = useState<'nickel' | 'copper' | 'chrome' | 'gold' | 'silver'>('copper');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [thicknessInput, setThicknessInput] = useState<number>(defaultThickness.imperial);

  const [formData, setFormData] = useState<ElectroplatingRequest>({
    current_density_min: metalDefaults.copper.min,
    current_density_max: metalDefaults.copper.max,
    plating_thickness_microns: defaultThickness.imperial * 25.4,
    metal_density_g_cm3: metalDefaults.copper.density,
    current_efficiency: 0.95,
    voltage: 3.0,
  });

  const validateAndCalculate = (newFormData: ElectroplatingRequest) => {
    if (!statistics?.surface_area || statistics.surface_area <= 0) return;
    const {
      current_density_min,
      current_density_max,
      plating_thickness_microns,
      metal_density_g_cm3,
      current_efficiency,
      voltage,
    } = newFormData;
    if (
      typeof current_density_min === 'number' && current_density_min > 0 &&
      typeof current_density_max === 'number' && current_density_max > 0 &&
      typeof plating_thickness_microns === 'number' && plating_thickness_microns > 0 &&
      typeof metal_density_g_cm3 === 'number' && metal_density_g_cm3 > 0 &&
      typeof current_efficiency === 'number' && current_efficiency > 0 &&
      typeof voltage === 'number' && voltage > 0
    ) {
      onCalculate(newFormData);
    }
  };

  const handleInputChange = (field: keyof ElectroplatingRequest, value: number) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    if (!isNaN(value) && value > 0) validateAndCalculate(newFormData);
  };

  const handleThicknessChange = (value: number) => {
    setThicknessInput(value);
    const thicknessInMils = unitSystem === 'metric' ? value * 0.0393701 : value;
    const newFormData = { ...formData, plating_thickness_microns: thicknessInMils * 25.4 };
    setFormData(newFormData);
    if (!isNaN(value) && value > 0) validateAndCalculate(newFormData);
  };

  const handleMetalChange = (metal: typeof selectedMetal) => {
    setSelectedMetal(metal);
    const defaults = metalDefaults[metal];
    const newFormData = {
      ...formData,
      current_density_min: defaults.min,
      current_density_max: defaults.max,
      metal_density_g_cm3: defaults.density,
    };
    setFormData(newFormData);
    validateAndCalculate(newFormData);
  };

  useEffect(() => {
    if (statistics?.surface_area && statistics.surface_area > 0) {
      validateAndCalculate(formData);
    }
  }, [statistics, formData]);

  useEffect(() => {
    onGetRecommendations({ metal_type: selectedMetal });
  }, [selectedMetal, statistics]);

  const handleUnitSystemChange = (newSystem: UnitSystem) => {
    setUnitSystem(newSystem);
    if (newSystem === 'imperial') {
      setThicknessInput(Math.round(thicknessInput * 0.0393701 * 100) / 100);
    } else {
      setThicknessInput(Math.round(thicknessInput * 25.4));
    }
  };

  const formatNumber = (num: number, decimals = 2) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getCurrentDensityLabel = () => (unitSystem === 'metric' ? 'A/dm²' : 'A/in²');

  const getCurrentDensityHelperText = () => {
    if (unitSystem === 'metric') {
      const minMetric = (metalDefaults[selectedMetal].min / 0.064516).toFixed(3);
      const maxMetric = (metalDefaults[selectedMetal].max / 0.064516).toFixed(3);
      return `Typical range: ${minMetric}-${maxMetric} A/dm²`;
    }
    return `Typical range: ${metalDefaults[selectedMetal].min}-${metalDefaults[selectedMetal].max} A/in²`;
  };

  const displayCurrentDensity = (value: number) =>
    unitSystem === 'metric' ? Math.round((value / 0.064516) * 1000) / 1000 : value;

  const convertMass = (grams: number) =>
    unitSystem === 'metric'
      ? `${formatNumber(grams)} g`
      : `${formatNumber(grams * 0.035274, 3)} oz`;

  const getThicknessLabel = () =>
    unitSystem === 'metric' ? 'Plating Thickness (μm)' : 'Plating Thickness (mils)';

  const getThicknessHelperText = () =>
    unitSystem === 'metric' ? 'Typical range: 5-500 μm' : 'Typical range: 0.2-2.0 mils';

  const formatSurfaceArea = () => {
    if (!statistics) return '';
    return unitSystem === 'metric'
      ? `${formatNumber(statistics.surface_area)} mm²`
      : `${formatNumber(statistics.surface_area * 0.00155)} in²`;
  };

  const resultItems = platingEstimate
    ? [
        { label: 'Current', value: `${formatNumber(platingEstimate.current_requirements.recommended_amps)} A`, sub: `${formatNumber(platingEstimate.current_requirements.min_amps)}–${formatNumber(platingEstimate.current_requirements.max_amps)} A range` },
        { label: 'Plating Time', value: formatTime(platingEstimate.plating_parameters.plating_time_minutes), sub: `${formatNumber(platingEstimate.plating_parameters.plating_time_hours, 2)} hours` },
        { label: 'Metal Required', value: convertMass(platingEstimate.material_requirements.metal_mass_g), sub: unitSystem === 'metric' ? `${formatNumber(platingEstimate.material_requirements.metal_mass_kg, 4)} kg` : `${formatNumber(platingEstimate.material_requirements.metal_mass_g * 0.00220462, 4)} lbs` },
        { label: 'Power', value: `${formatNumber(platingEstimate.power_requirements.power_watts)} W`, sub: `${formatNumber(platingEstimate.power_requirements.energy_kwh, 3)} kWh` },
        { label: 'Total Cost', value: `$${formatNumber(platingEstimate.cost_estimates.total_cost)}`, sub: `Electricity $${formatNumber(platingEstimate.cost_estimates.electricity_cost)} · Solution $${formatNumber(platingEstimate.cost_estimates.solution_cost)}` },
        ...(statistics ? [{ label: 'Surface Area', value: formatSurfaceArea(), sub: '' }] : []),
      ]
    : [];

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Accordion defaultExpanded disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 0, minHeight: 48 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Input Parameters
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0 }}>
          <Box sx={{ mb: 2 }}>
            <ToggleButtonGroup
              value={unitSystem}
              exclusive
              onChange={(_, value) => value && handleUnitSystemChange(value)}
              size="small"
            >
              <ToggleButton value="metric">Metric</ToggleButton>
              <ToggleButton value="imperial">Imperial</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Plating Metal</InputLabel>
                <Select
                  value={selectedMetal}
                  label="Plating Metal"
                  onChange={(e) => handleMetalChange(e.target.value as typeof selectedMetal)}
                >
                  {(['copper', 'nickel', 'chrome', 'gold', 'silver'] as const).map((metal) => (
                    <MenuItem key={metal} value={metal}>
                      {metal.charAt(0).toUpperCase() + metal.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  size="small"
                  label={`Min Current Density (${getCurrentDensityLabel()})`}
                  type="number"
                  value={displayCurrentDensity(formData.current_density_min || 0)}
                  onChange={(e) => {
                    const displayValue = parseFloat(e.target.value);
                    const imperialValue = unitSystem === 'metric' ? displayValue * 0.064516 : displayValue;
                    handleInputChange('current_density_min', imperialValue);
                  }}
                  inputProps={{ min: 0.01, max: unitSystem === 'metric' ? 15.5 : 1, step: 0.01 }}
                  helperText={getCurrentDensityHelperText()}
                />
                <InfoTooltip
                  title="Minimum Current Density"
                  description="Lower values improve coverage in recessed areas but increase plating time."
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  size="small"
                  label={`Max Current Density (${getCurrentDensityLabel()})`}
                  type="number"
                  value={displayCurrentDensity(formData.current_density_max || 0)}
                  onChange={(e) => {
                    const displayValue = parseFloat(e.target.value);
                    const imperialValue = unitSystem === 'metric' ? displayValue * 0.064516 : displayValue;
                    handleInputChange('current_density_max', imperialValue);
                  }}
                  inputProps={{ min: 0.01, max: unitSystem === 'metric' ? 15.5 : 1, step: 0.01 }}
                  helperText={getCurrentDensityHelperText()}
                />
                <InfoTooltip
                  title="Maximum Current Density"
                  description="Higher values increase speed but may cause burning or poor finish."
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label={getThicknessLabel()}
                type="number"
                value={thicknessInput}
                onChange={(e) => handleThicknessChange(parseFloat(e.target.value))}
                helperText={getThicknessHelperText()}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Metal Density (g/cm³)"
                  type="number"
                  value={formData.metal_density_g_cm3}
                  onChange={(e) => handleInputChange('metal_density_g_cm3', parseFloat(e.target.value))}
                  helperText="Nickel: 8.9, Copper: 8.96, Gold: 19.32"
                />
                <InfoTooltip
                  title="Metal Density"
                  description="Mass per unit volume of the plating metal."
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Current Efficiency"
                  type="number"
                  value={formData.current_efficiency}
                  onChange={(e) => handleInputChange('current_efficiency', parseFloat(e.target.value))}
                  helperText="Typical range: 0.85-0.98"
                />
                <InfoTooltip
                  title="Current Efficiency"
                  description="Fraction of current that deposits metal vs. side reactions."
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Voltage (V)"
                type="number"
                value={formData.voltage}
                onChange={(e) => handleInputChange('voltage', parseFloat(e.target.value))}
                helperText="Typical range: 3-12V"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {platingEstimate && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Calculation Results
          </Typography>
          <Grid container spacing={2}>
            {resultItems.map(({ label, value, sub }) => (
              <Grid item xs={6} sm={4} md={2} key={label}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {label}
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {value}
                </Typography>
                {sub && (
                  <Typography variant="caption" color="text.secondary">
                    {sub}
                  </Typography>
                )}
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Equipment Settings
            </Typography>
            <Typography variant="body2">
              {platingEstimate.recommendations.current_setting} · {platingEstimate.recommendations.voltage_setting}
            </Typography>
          </Box>
        </>
      )}

      {recommendations && (
        <Accordion defaultExpanded disableGutters elevation={0} sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 0 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {selectedMetal.charAt(0).toUpperCase() + selectedMetal.slice(1)} Plating Guide
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0 }}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {[
                { label: 'Appearance', value: recommendations.metal_properties.color },
                { label: 'Hardness', value: recommendations.metal_properties.hardness },
                { label: 'Corrosion Resistance', value: recommendations.metal_properties.corrosion_resistance },
                { label: 'Solution Cost', value: `$${formatNumber(recommendations.metal_properties.solution_cost_per_kg)}/kg` },
              ].map(({ label, value }) => (
                <Grid item xs={6} sm={3} key={label}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" fontWeight={500}>{value}</Typography>
                </Grid>
              ))}
            </Grid>

            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              Professional Tips for {selectedMetal.charAt(0).toUpperCase() + selectedMetal.slice(1)} Plating
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {recommendations.metal_specific_tips[selectedMetal]?.map((tip, index) => (
                <Typography component="li" variant="body2" color="text.secondary" key={index} sx={{ mb: 0.5 }}>
                  {tip}
                </Typography>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};

export default ElectroplatingCalculator;
