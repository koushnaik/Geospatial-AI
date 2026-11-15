import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Waves,
  MapPin,
  Sliders,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Lock,
  Unlock,
  CheckCircle2,
  RefreshCw,
  Mountain,
  Compass,
  Thermometer,
  Layers
} from 'lucide-react';
import { getGauges, getGaugeDetails, createPrediction } from '../services/api';
import { GaugeStation } from '../types';

export const PredictionForm: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'station' | 'manual'>('station');
  const [gauges, setGauges] = useState<GaugeStation[]>([]);
  const [selectedGaugeId, setSelectedGaugeId] = useState<string>('');
  const [selectedGauge, setSelectedGauge] = useState<GaugeStation | null>(null);
  const [loadingGauges, setLoadingGauges] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State (all 28 features stored cleanly in React state)
  const [formData, setFormData] = useState<Record<string, any>>({
    // 10 Antecedent Rainfall Accumulation features (mm)
    T1d: 65.0,
    T2d: 110.0,
    T3d: 150.0,
    T4d: 180.0,
    T5d: 210.0,
    T6d: 230.0,
    T7d: 250.0,
    T8d: 265.0,
    T9d: 275.0,
    T10d: 285.0,

    // 11 Catchment Topography & Morphology Attributes
    'Drainage Area': 5200.0,
    'Catchment Relief': 850.0,
    'Catchment Length': 78.0,
    'Catchment Perimeter': 190.0,
    'Drainage Density': 0.65,
    'Stream Order': 4,
    'Sinuosity Index': 1.35,
    'Form Factor': 0.85,
    'Relief Ratio': 0.011,
    'Elongation Ratio': 0.65,
    'Circularity Ratio': 0.55,

    // 3 Environmental & Climate Baselines
    'Annual Precipitation': 1450.0,
    'Precipitation Seasonality': 65.0,
    'Annual Mean Temperature': 24.5,

    // 4 Substrate & Soil Classifications
    'Soil type': 'Vertisols',
    'Land cover': 'Cropland',
    'lithology type': 'Basic volcanic rocks',
    'KoppenGeiger Climate Type': 'Tropical'
  });

  // Load gauges list on component mount
  useEffect(() => {
    getGauges()
      .then((data) => {
        setGauges(data);
        if (data.length > 0) {
          setSelectedGaugeId(data[0].gauge_id);
        }
      })
      .catch((err) => console.error('Failed to load gauge stations:', err))
      .finally(() => setLoadingGauges(false));
  }, []);

  // When selected gauge changes in Mode A, load its verified attributes
  useEffect(() => {
    if (!selectedGaugeId) return;
    getGaugeDetails(selectedGaugeId)
      .then((details) => {
        setSelectedGauge(details);
        if (mode === 'station' && details.catchment_attributes) {
          setFormData((prev) => ({
            ...prev,
            ...details.catchment_attributes,
            ...(details.rainfall_baseline || {})
          }));
        }
      })
      .catch((err) => console.error('Failed to load station details:', err));
  }, [selectedGaugeId]);

  // Handle mode switching
  const handleModeSwitch = (newMode: 'station' | 'manual') => {
    setMode(newMode);
    setErrorMsg(null);
    if (newMode === 'station' && selectedGauge?.catchment_attributes) {
      // Re-populate from current station
      setFormData((prev) => ({
        ...prev,
        ...selectedGauge.catchment_attributes,
        ...(selectedGauge.rainfall_baseline || {})
      }));
    }
  };

  // Safe input change handler: preserves input text during typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Preset handlers
  const handleApplyRainPreset = (type: 'moderate' | 'extreme' | 'baseline') => {
    if (type === 'baseline' && selectedGauge?.rainfall_baseline) {
      setFormData((prev) => ({
        ...prev,
        ...selectedGauge.rainfall_baseline
      }));
    } else if (type === 'moderate') {
      setFormData((prev) => ({
        ...prev,
        T1d: 35.0, T2d: 65.0, T3d: 90.0, T4d: 110.0, T5d: 130.0,
        T6d: 145.0, T7d: 160.0, T8d: 170.0, T9d: 180.0, T10d: 190.0
      }));
    } else if (type === 'extreme') {
      setFormData((prev) => ({
        ...prev,
        T1d: 145.0, T2d: 240.0, T3d: 310.0, T4d: 370.0, T5d: 420.0,
        T6d: 460.0, T7d: 500.0, T8d: 530.0, T9d: 560.0, T10d: 590.0
      }));
    }
  };

  // Manual Terrain presets for Mode B
  const handleApplyTerrainPreset = (terrain: 'peninsular' | 'himalayan' | 'alluvial') => {
    if (terrain === 'peninsular') {
      setFormData((prev) => ({
        ...prev,
        'Drainage Area': 5200.0,
        'Catchment Relief': 850.0,
        'Catchment Length': 78.0,
        'Catchment Perimeter': 190.0,
        'Drainage Density': 0.65,
        'Stream Order': 4,
        'Sinuosity Index': 1.35,
        'Form Factor': 0.85,
        'Relief Ratio': 0.011,
        'Elongation Ratio': 0.65,
        'Circularity Ratio': 0.55,
        'Annual Precipitation': 1250.0,
        'Precipitation Seasonality': 75.0,
        'Annual Mean Temperature': 25.5,
        'Soil type': 'Vertisols',
        'Land cover': 'Cropland',
        'lithology type': 'Basic volcanic rocks',
        'KoppenGeiger Climate Type': 'Tropical'
      }));
    } else if (terrain === 'himalayan') {
      setFormData((prev) => ({
        ...prev,
        'Drainage Area': 1850.0,
        'Catchment Relief': 3400.0,
        'Catchment Length': 62.0,
        'Catchment Perimeter': 145.0,
        'Drainage Density': 1.45,
        'Stream Order': 5,
        'Sinuosity Index': 1.15,
        'Form Factor': 0.48,
        'Relief Ratio': 0.055,
        'Elongation Ratio': 0.45,
        'Circularity Ratio': 0.38,
        'Annual Precipitation': 2400.0,
        'Precipitation Seasonality': 110.0,
        'Annual Mean Temperature': 12.0,
        'Soil type': 'Leptosols',
        'Land cover': 'Forest',
        'lithology type': 'Metamorphics',
        'KoppenGeiger Climate Type': 'Temperate'
      }));
    } else if (terrain === 'alluvial') {
      setFormData((prev) => ({
        ...prev,
        'Drainage Area': 48000.0,
        'Catchment Relief': 210.0,
        'Catchment Length': 350.0,
        'Catchment Perimeter': 890.0,
        'Drainage Density': 0.35,
        'Stream Order': 6,
        'Sinuosity Index': 1.75,
        'Form Factor': 0.39,
        'Relief Ratio': 0.0006,
        'Elongation Ratio': 0.71,
        'Circularity Ratio': 0.62,
        'Annual Precipitation': 1100.0,
        'Precipitation Seasonality': 92.0,
        'Annual Mean Temperature': 26.0,
        'Soil type': 'Fluvisols',
        'Land cover': 'Cropland',
        'lithology type': 'Unconsolidated sediments',
        'KoppenGeiger Climate Type': 'Tropical'
      }));
    }
  };

  // Form submission with rigorous input validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      // 1. Validate Rainfall (T1d to T10d)
      for (let i = 1; i <= 10; i++) {
        const key = `T${i}d`;
        const val = Number(formData[key]);
        if (formData[key] === '' || isNaN(val)) {
          throw new Error(`Rainfall ${key} must be a valid number.`);
        }
        if (val < 0) {
          throw new Error(`Rainfall ${key} cannot be negative (${val} mm).`);
        }
      }

      // 2. Validate Catchment Topography & Morphology Attributes
      const requiredNumericFields = [
        { key: 'Drainage Area', min: 0.01, label: 'Drainage Area (km²)' },
        { key: 'Catchment Relief', min: 0, label: 'Catchment Relief (m)' },
        { key: 'Catchment Length', min: 0.01, label: 'Catchment Length (km)' },
        { key: 'Catchment Perimeter', min: 0.01, label: 'Catchment Perimeter (km)' },
        { key: 'Drainage Density', min: 0, label: 'Drainage Density (km/km²)' },
        { key: 'Stream Order', min: 1, max: 10, label: 'Stream Order' },
        { key: 'Sinuosity Index', min: 0, label: 'Sinuosity Index' },
        { key: 'Form Factor', min: 0, label: 'Form Factor' },
        { key: 'Relief Ratio', min: 0, label: 'Relief Ratio' },
        { key: 'Elongation Ratio', min: 0, label: 'Elongation Ratio' },
        { key: 'Circularity Ratio', min: 0, label: 'Circularity Ratio' },
        { key: 'Annual Precipitation', min: 0, label: 'Annual Precipitation (mm)' },
        { key: 'Precipitation Seasonality', min: 0, label: 'Precipitation Seasonality (%)' },
        { key: 'Annual Mean Temperature', min: -30, max: 60, label: 'Annual Mean Temperature (°C)' }
      ];

      for (const field of requiredNumericFields) {
        const val = Number(formData[field.key]);
        if (formData[field.key] === '' || isNaN(val)) {
          throw new Error(`Field '${field.label}' is required and must be a valid number.`);
        }
        if (val < field.min) {
          throw new Error(`'${field.label}' must be at least ${field.min}.`);
        }
        if (field.max !== undefined && val > field.max) {
          throw new Error(`'${field.label}' must not exceed ${field.max}.`);
        }
      }

      // 3. Validate Categorical Selections
      const validCategories = {
        'Soil type': ['Vertisols', 'Cambisols', 'Luvisols', 'Acrisols', 'Leptosols', 'Lixisols', 'Fluvisols', 'No dominant class'],
        'Land cover': ['Cropland', 'Forest', 'Mosaic vegetation', 'No dominant class'],
        'lithology type': ['Basic volcanic rocks', 'Metamorphics', 'Unconsolidated sediments', 'Acid plutonic rocks', 'Siliciclastic sedimentary rocks', 'No dominant class'],
        'KoppenGeiger Climate Type': ['Tropical', 'Arid', 'Temperate', 'No dominant class']
      };

      for (const [catField, allowed] of Object.entries(validCategories)) {
        if (!allowed.includes(formData[catField])) {
          throw new Error(`Please select a valid option for ${catField}.`);
        }
      }

      setSubmitting(true);

      // Build payload for FastAPI backend matching PredictionInputSchema
      const payload = {
        mode,
        gauge_id: mode === 'station' ? selectedGaugeId : undefined,
        station_name: mode === 'station' ? selectedGauge?.station : 'Manual Catchment Assessment',
        state: mode === 'station' ? selectedGauge?.state : undefined,
        basin: mode === 'station' ? selectedGauge?.basin : undefined,
        T1d: Number(formData.T1d),
        T2d: Number(formData.T2d),
        T3d: Number(formData.T3d),
        T4d: Number(formData.T4d),
        T5d: Number(formData.T5d),
        T6d: Number(formData.T6d),
        T7d: Number(formData.T7d),
        T8d: Number(formData.T8d),
        T9d: Number(formData.T9d),
        T10d: Number(formData.T10d),
        'Drainage Area': Number(formData['Drainage Area']),
        'Catchment Relief': Number(formData['Catchment Relief']),
        'Catchment Length': Number(formData['Catchment Length']),
        'Catchment Perimeter': Number(formData['Catchment Perimeter']),
        'Drainage Density': Number(formData['Drainage Density']),
        'Stream Order': Math.round(Number(formData['Stream Order'])),
        'Sinuosity Index': Number(formData['Sinuosity Index']),
        'Form Factor': Number(formData['Form Factor']),
        'Relief Ratio': Number(formData['Relief Ratio']),
        'Elongation Ratio': Number(formData['Elongation Ratio']),
        'Circularity Ratio': Number(formData['Circularity Ratio']),
        'Annual Precipitation': Number(formData['Annual Precipitation']),
        'Precipitation Seasonality': Number(formData['Precipitation Seasonality']),
        'Annual Mean Temperature': Number(formData['Annual Mean Temperature']),
        'Soil type': formData['Soil type'],
        'Land cover': formData['Land cover'],
        'lithology type': formData['lithology type'],
        'KoppenGeiger Climate Type': formData['KoppenGeiger Climate Type']
      };

      const result = await createPrediction(payload);
      navigate(`/results/${result.prediction_id}`);
    } catch (err: any) {
      console.error('Prediction submission failed:', err);
      setErrorMsg(err.response?.data?.detail || err.message || 'Prediction failed. Please check inputs.');
      setSubmitting(false);
    }
  };

  const isStationMode = mode === 'station';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-2">
          <Waves className="w-4 h-4" />
          Inference Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Flood Severity Prediction Assessment
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Enter antecedent precipitation accumulation and catchment geomorphological attributes to classify flood severity (Flood vs Severe Flood) using our five trained machine learning models.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="bg-white border border-slate-200 p-1.5 rounded-2xl flex flex-col sm:flex-row gap-2 w-full sm:w-fit shadow-sm">
        <button
          type="button"
          onClick={() => handleModeSwitch('station')}
          className={`flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            isStationMode
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4 shrink-0" />
          Mode A: Select Known Gauge Station
          {isStationMode && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch('manual')}
          className={`flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            !isStationMode
              ? 'bg-teal-600 text-white font-semibold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0" />
          Mode B: Manual Catchment Assessment
          {!isStationMode && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-200">Validation Notice</div>
            <div className="text-xs text-rose-300/90 mt-0.5">{errorMsg}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Mode A: Station Selector Card */}
        {isStationMode ? (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Select Gauge Station (155 Verified INDOFLOODS CWC Stations)
                  </label>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    Mode A Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Selecting a station auto-populates its exact catchment morphology, soil, and baseline hydrology. Those fields are set to read-only.
                </p>
              </div>
              <select
                value={selectedGaugeId}
                onChange={(e) => setSelectedGaugeId(e.target.value)}
                disabled={loadingGauges}
                className="bg-white border border-slate-300 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-84 shadow-sm"
              >
                {gauges.map((g) => (
                  <option key={g.gauge_id} value={g.gauge_id}>
                    {g.station} ({g.river} - {g.state})
                  </option>
                ))}
              </select>
            </div>

            {selectedGauge && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">River Basin:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedGauge.basin}</div>
                </div>
                <div>
                  <span className="text-slate-500">State:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedGauge.state}</div>
                </div>
                <div>
                  <span className="text-slate-500">Station Coordinates:</span>
                  <div className="font-mono text-blue-600 mt-0.5">
                    {selectedGauge.latitude.toFixed(2)}°N, {selectedGauge.longitude.toFixed(2)}°E
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Historical Records:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {selectedGauge.total_events} events ({selectedGauge.severe_flood_count} severe)
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-teal-950/20 border border-teal-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wide">
                    Mode B Active
                  </span>
                  <h3 className="text-sm font-bold text-white">Manual Catchment & Watershed Simulation</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  All catchment topography, morphology, climate, and soil attributes are fully editable below. You can enter custom values or apply realistic terrain presets.
                </p>
              </div>

              {/* Mode B Quick Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500">Terrain Presets:</span>
                <button
                  type="button"
                  onClick={() => handleApplyTerrainPreset('peninsular')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
                >
                  Peninsular Plateau
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTerrainPreset('himalayan')}
                  className="px-2.5 py-1 rounded-lg bg-teal-100 text-[11px] text-teal-800 border border-teal-200 hover:bg-teal-200 transition"
                >
                  Himalayan Steep
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTerrainPreset('alluvial')}
                  className="px-2.5 py-1 rounded-lg bg-sky-100 text-[11px] text-sky-800 border border-sky-200 hover:bg-sky-200 transition"
                >
                  Alluvial Plain
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Antecedent Rainfall Input */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
                Antecedent Rainfall Accumulation (T1d to T10d)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cumulative precipitation leading up to the flood threshold in millimeters (mm). Always editable in both modes.
              </p>
            </div>
            {/* Rainfall Presets */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 mr-1 hidden md:inline">Rainfall Presets:</span>
              <button
                type="button"
                onClick={() => handleApplyRainPreset('moderate')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
              >
                Moderate Rain
              </button>
              <button
                type="button"
                onClick={() => handleApplyRainPreset('extreme')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 text-[11px] text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
              >
                Extreme Monsoon
              </button>
              {isStationMode && selectedGauge?.rainfall_baseline && (
                <button
                  type="button"
                  onClick={() => handleApplyRainPreset('baseline')}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-[11px] text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
                >
                  Station Median
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((day) => {
              const key = `T${day}d`;
              return (
                <div key={day} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-slate-700">{`T${day}d`}</label>
                    <span className="text-[11px] text-slate-500 font-mono">mm</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2000"
                    name={key}
                    value={formData[key] ?? ''}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                  <div className="text-[10px] text-slate-500">{day}-day cumulative</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Catchment Topography & Morphology Attributes */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-bold">2</span>
                Catchment Topography & Morphology Attributes
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical watershed dimensions that govern runoff concentration, peak discharge timing, and basin attenuation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isStationMode ? (
                <button
                  type="button"
                  onClick={() => handleModeSwitch('manual')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 hover:text-amber-900 transition cursor-pointer"
                  title="Click to unlock and customize attributes in Manual Mode"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Locked to Station (Click to Unlock)
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300">
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  Editable (Manual Mode)
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Drainage Area (km²)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="Drainage Area"
                value={formData['Drainage Area'] ?? ''}
                onChange={handleInputChange}
                readOnly={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-teal-400 text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                }`}
                required
              />
              <span className="text-[10px] text-slate-500">Total watershed surface area</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catchment Relief (m)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                name="Catchment Relief"
                value={formData['Catchment Relief'] ?? ''}
                onChange={handleInputChange}
                readOnly={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-teal-400 text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                }`}
                required
              />
              <span className="text-[10px] text-slate-500">Elevation diff (highest point to outlet)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Drainage Density (km/km²)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="Drainage Density"
                value={formData['Drainage Density'] ?? ''}
                onChange={handleInputChange}
                readOnly={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-teal-400 text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                }`}
                required
              />
              <span className="text-[10px] text-slate-500">Total stream length per unit catchment area</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catchment Length (km)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="Catchment Length"
                value={formData['Catchment Length'] ?? ''}
                onChange={handleInputChange}
                readOnly={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-teal-400 text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                }`}
                required
              />
              <span className="text-[10px] text-slate-500">Longest straight-line distance</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catchment Perimeter (km)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="Catchment Perimeter"
                value={formData['Catchment Perimeter'] ?? ''}
                onChange={handleInputChange}
                readOnly={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-teal-400 text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                }`}
                required
              />
              <span className="text-[10px] text-slate-500">Basin outer boundary perimeter</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stream Order (Strahler)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="8"
                name="Stream Order"
                value={formData['Stream Order'] ?? ''}
                onChange={handleInputChange}
                readOnly={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-teal-400 text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                }`}
                required
              />
              <span className="text-[10px] text-slate-500">Hierarchical river network rank (1–8)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sinuosity Index
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                name="Sinuosity Index"
                value={formData['Sinuosity Index'] ?? ''}
                onChange={handleInputChange}
                readOnly={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-teal-400 text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                }`}
                required
              />
              <span className="text-[10px] text-slate-500">Channel length / Valley length</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Form Factor
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                name="Form Factor"
                value={formData['Form Factor'] ?? ''}
                onChange={handleInputChange}
                readOnly={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-teal-400 text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                }`}
                required
              />
              <span className="text-[10px] text-slate-500">Ratio of basin area to length squared</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relief Ratio
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                name="Relief Ratio"
                value={formData['Relief Ratio'] ?? ''}
                onChange={handleInputChange}
                readOnly={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-teal-400 text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                }`}
                required
              />
              <span className="text-[10px] text-slate-500">Catchment relief divided by basin length</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Elongation Ratio
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                name="Elongation Ratio"
                value={formData['Elongation Ratio'] ?? ''}
                onChange={handleInputChange}
                readOnly={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-teal-400 text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                }`}
                required
              />
              <span className="text-[10px] text-slate-500">Diameter of equal-area circle / length</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Circularity Ratio
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                name="Circularity Ratio"
                value={formData['Circularity Ratio'] ?? ''}
                onChange={handleInputChange}
                readOnly={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-teal-400 text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                }`}
                required
              />
              <span className="text-[10px] text-slate-500">Basin area / Area of circle with same perimeter</span>
            </div>
          </div>
        </div>

        {/* Section 3: Environmental & Climatology Baselines */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">3</span>
                Environmental & Climatology Baselines
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Baseline macroclimate averages and seasonality indices extracted from meteorological grids.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isStationMode ? (
                <button
                  type="button"
                  onClick={() => handleModeSwitch('manual')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 hover:text-amber-900 transition cursor-pointer"
                  title="Click to unlock and customize attributes in Manual Mode"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Locked to Station (Click to Unlock)
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300">
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  Editable (Manual Mode)
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Annual Precipitation (mm)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                name="Annual Precipitation"
                value={formData['Annual Precipitation'] ?? ''}
                onChange={handleInputChange}
                readOnly={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-indigo-300 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
                required
              />
              <span className="text-[10px] text-slate-500">Long-term mean annual rainfall</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Precipitation Seasonality (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="Precipitation Seasonality"
                value={formData['Precipitation Seasonality'] ?? ''}
                onChange={handleInputChange}
                readOnly={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-indigo-300 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
                required
              />
              <span className="text-[10px] text-slate-500">Coefficient of variation in monthly rainfall</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Annual Mean Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                min="-20"
                max="55"
                name="Annual Mean Temperature"
                value={formData['Annual Mean Temperature'] ?? ''}
                onChange={handleInputChange}
                readOnly={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-indigo-300 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
                required
              />
              <span className="text-[10px] text-slate-500">Mean annual catchment temperature</span>
            </div>
          </div>
        </div>

        {/* Section 4: Substrate, Soil & Environmental Classifications */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold">4</span>
                Substrate, Soil & Land Cover Classifications
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Soil infiltration capacity, vegetative ground cover, and baseline climate classification.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isStationMode ? (
                <button
                  type="button"
                  onClick={() => handleModeSwitch('manual')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 hover:text-amber-900 transition cursor-pointer"
                  title="Click to unlock and customize attributes in Manual Mode"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Locked to Station (Click to Unlock)
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300">
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  Editable (Manual Mode)
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Soil Type
              </label>
              <select
                name="Soil type"
                value={formData['Soil type']}
                onChange={handleInputChange}
                disabled={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-purple-300 text-slate-900 focus:border-purple-500'
                }`}
              >
                {['Vertisols', 'Cambisols', 'Luvisols', 'Acrisols', 'Leptosols', 'Lixisols', 'Fluvisols', 'No dominant class'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500">Harmonized World Soil DB</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Land Cover
              </label>
              <select
                name="Land cover"
                value={formData['Land cover']}
                onChange={handleInputChange}
                disabled={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-purple-300 text-slate-900 focus:border-purple-500'
                }`}
              >
                {['Cropland', 'Forest', 'Mosaic vegetation', 'No dominant class'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500">Dominant vegetative cover</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lithology Type
              </label>
              <select
                name="lithology type"
                value={formData['lithology type']}
                onChange={handleInputChange}
                disabled={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-purple-300 text-slate-900 focus:border-purple-500'
                }`}
              >
                {['Basic volcanic rocks', 'Metamorphics', 'Unconsolidated sediments', 'Acid plutonic rocks', 'Siliciclastic sedimentary rocks', 'No dominant class'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500">Subsurface bedrock lithology</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Climate Zone
              </label>
              <select
                name="KoppenGeiger Climate Type"
                value={formData['KoppenGeiger Climate Type']}
                onChange={handleInputChange}
                disabled={isStationMode}
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition ${
                  isStationMode
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-purple-300 text-slate-900 focus:border-purple-500'
                }`}
              >
                {['Tropical', 'Arid', 'Temperate', 'No dominant class'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500">Köppen-Geiger classification</span>
            </div>
          </div>
        </div>

        {/* Submit Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {isStationMode ? (
              <span className="flex items-center gap-1.5 text-cyan-400">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Ready to evaluate with station '{selectedGauge?.station || selectedGaugeId}' attributes.
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-teal-400">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                Custom manual parameters configured. Ready for multi-model inference.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Evaluating Across 5 ML Models & Computing SHAP...
              </>
            ) : (
              <>
                Run Severity Prediction & Analysis
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
