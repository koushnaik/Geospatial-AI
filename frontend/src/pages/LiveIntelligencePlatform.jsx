import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import RiskMap from '../components/RiskMap';
import InfoTooltip from '../components/InfoTooltip';
import { useTheme } from '../context/ThemeContext';
import {
  Upload, Sparkles, AlertTriangle, ShieldCheck, CheckCircle2,
  Image as ImageIcon, MapPin, Calendar, Clock, Droplets,
  Layers, ArrowRight, RefreshCw, Cpu, Award, Download,
  Printer, UserCheck, Eye, Compass, Waves, FileText, Check,
  ChevronDown, ChevronUp, AlertCircle, Info, ExternalLink, HelpCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';

const RISK_COLORS = {
  'No Detected Flooding': '#10B981',
  'Very Low': '#10B981',
  'Low': '#06B6D4',
  'Moderate': '#F59E0B',
  'High': '#F97316',
  'Severe': '#EF4444',
  'Very High': '#EF4444',
};

const USER_PERSONAS = [
  {
    id: 'General Public',
    label: 'General Public',
    icon: '👥',
    tagline: 'Household safety, emergency preparedness kits, and evacuation awareness.'
  },
  {
    id: 'Rescue Teams and Government Authorities',
    label: 'Rescue Teams & Authorities',
    icon: '🚨',
    tagline: 'Search & rescue prioritization, road access screening, and relief logistics.'
  },
  {
    id: 'Farmers',
    label: 'Farmers & Agriculture',
    icon: '🌾',
    tagline: 'Crop drainage, livestock evacuation, machinery protection, and harvest safeguards.'
  },
  {
    id: 'Land Buyers',
    label: 'Land Buyers & Investors',
    icon: '🏡',
    tagline: 'Historical flood screening, elevation analysis, and due diligence checks.'
  },
  {
    id: 'Builders and Developers',
    label: 'Builders & Developers',
    icon: '🏗️',
    tagline: 'Plinth height freeboard, on-site stormwater retention, and site drainage design.'
  }
];

export default function LiveIntelligencePlatform({ onNavigate, onSwitchWorkspace }) {
  const { chartTheme } = useTheme();

  // Primary State
  const [userPersona, setUserPersona] = useState('General Public');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedSampleId, setSelectedSampleId] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [observationDate, setObservationDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [samples, setSamples] = useState([]);
  
  // Optional Future Forecast Inputs
  const [showForecastInputs, setShowForecastInputs] = useState(false);
  const [forecastCoords, setForecastCoords] = useState({ lat: 10.150, lon: 76.400 });
  const [rainForecast24h, setRainForecast24h] = useState('');
  const [rainForecast48h, setRainForecast48h] = useState('');
  const [rainForecast7d, setRainForecast7d] = useState('');
  const [riverGaugeLevel, setRiverGaugeLevel] = useState('');

  // Processing State
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [forecastResult, setForecastResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [activeImageView, setActiveImageView] = useState('overlay'); // 'overlay', 'disagreement', 'mask', 'original'

  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);

  // Load demonstration samples on mount
  useEffect(() => {
    api.getFloodSamples()
      .then((data) => {
        if (data && data.samples) {
          setSamples(data.samples);
        }
      })
      .catch((err) => console.error('Failed to load flood samples:', err));
  }, []);

  // Handle local file selection
  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setSelectedSampleId(null);
    setPreviewUrl(URL.createObjectURL(file));
    if (!locationName) {
      setLocationName(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
    }
  };

  // Handle sample preset selection
  const handleSelectSample = (sample) => {
    setSelectedSampleId(sample.id);
    setSelectedFile(null);
    setPreviewUrl(`samples/${sample.filename}`);
    setLocationName(sample.location);
    setForecastCoords({ lat: sample.coordinates.latitude, lon: sample.coordinates.longitude });
  };

  // Main Action: Analyze Flood Situation
  const handleAnalyze = async () => {
    if (!selectedFile && !selectedSampleId) {
      setAnalysisError('Please upload a satellite/aerial image or choose a demonstration sample.');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else if (selectedSampleId) {
        formData.append('sample_id', selectedSampleId);
      }
      formData.append('user_location', locationName || 'Selected Location');
      formData.append('user_persona', userPersona);
      formData.append('spatial_resolution_m', '10.0');
      formData.append('threshold', '0.5');

      const imgRes = await api.analyzeFloodImage(formData);
      setAnalysisResult(imgRes);

      // If user provided forecast rain, run future forecast as well
      if (rainForecast24h || rainForecast48h || rainForecast7d) {
        try {
          const fcastRes = await api.predictFloodForecast({
            location_name: locationName || 'Selected Location',
            latitude: forecastCoords.lat,
            longitude: forecastCoords.lon,
            rainfall_forecast_24h: rainForecast24h ? parseFloat(rainForecast24h) : null,
            rainfall_forecast_48h: rainForecast48h ? parseFloat(rainForecast48h) : null,
            rainfall_forecast_7d: rainForecast7d ? parseFloat(rainForecast7d) : null,
            river_gauge_level_m: riverGaugeLevel ? parseFloat(riverGaugeLevel) : null,
            user_persona: userPersona
          });
          setForecastResult(fcastRes);
        } catch (fErr) {
          console.warn('Future forecast call skipped or failed:', fErr);
        }
      } else {
        setForecastResult(null);
      }

      // Scroll smoothly to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);

    } catch (err) {
      console.error('Flood analysis error:', err);
      setAnalysisError(err.response?.data?.detail || 'Failed to complete image analysis. Please verify backend connection.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Drag and drop handlers
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ========================================================================= */}
      {/* 1. HERO & WORKSPACE HEADER */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 border border-cyan-500/25 p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold">
            <Sparkles size={14} className="text-cyan-400" />
            <span>GeoFlood AI • Live Intelligence Platform</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            AI-Powered Flood Detection, Severity Assessment & Predictive Early Warning
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            Upload satellite, drone, or aerial imagery to instantly segment inundated areas with five deep learning architectures. Assess current flood extent, inspect physical severity, and project future meteorological flood susceptibility.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 size={14} /> 5 Segmentation Models Active
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <ShieldCheck size={14} /> Ensemble Consensus
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-teal-400">
              <Waves size={14} /> Multi-Horizon Forecasting
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. USER PERSONA SELECTOR */}
      {/* ========================================================================= */}
      <div className="bg-navy-900/90 border border-navy-800 rounded-2xl p-5 shadow-panel space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-navy-800/80 pb-3">
          <div>
            <span className="text-xs font-mono uppercase font-bold text-cyan-400 flex items-center gap-1.5">
              <UserCheck size={14} /> Tailor Intelligence for Your Role
            </span>
            <h3 className="text-sm font-bold text-white mt-0.5">
              Select your purpose to receive customized risk assessments and preparedness guidance
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Active: <strong className="text-white">{userPersona}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {USER_PERSONAS.map((p) => {
            const isSelected = userPersona === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setUserPersona(p.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-500 shadow-glow-cyan text-white'
                    : 'bg-navy-950/60 border-navy-800 text-slate-300 hover:border-navy-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg">{p.icon}</span>
                    {isSelected && <Check size={14} className="text-cyan-400" />}
                  </div>
                  <div className="font-bold text-xs">{p.label}</div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">
                    {p.tagline}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PRIMARY INTERACTION: IMAGE UPLOADER & DEMONSTRATION PRESETS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Upload Area (7 cols) */}
        <div className="lg:col-span-7 bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-panel space-y-5">
          <div className="flex items-center justify-between border-b border-navy-800 pb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Upload size={14} /> Primary Input: Imagery
              </span>
              <h2 className="text-base font-bold text-white mt-0.5">Upload Satellite, Drone or Aerial Imagery</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">PNG, JPG, TIFF (Max 50MB)</span>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer relative group overflow-hidden ${
              previewUrl
                ? 'border-cyan-500/60 bg-navy-950/80'
                : 'border-navy-700 hover:border-cyan-400 bg-navy-950/40 hover:bg-navy-950/80'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              accept="image/png,image/jpeg,image/jpg,image/tiff"
              className="hidden"
            />

            {previewUrl ? (
              <div className="space-y-3">
                <div className="relative inline-block max-h-64 rounded-xl overflow-hidden border border-navy-700 shadow-md">
                  <img
                    src={previewUrl}
                    alt="Submission Preview"
                    className="max-h-64 w-auto object-contain mx-auto"
                  />
                  <div className="absolute inset-0 bg-navy-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-xs">
                    <span className="px-3 py-1.5 rounded-lg bg-navy-900/90 text-white font-mono text-xs font-bold border border-navy-700 flex items-center gap-1.5">
                      <RefreshCw size={12} /> Replace Image
                    </span>
                  </div>
                </div>
                <div className="text-xs font-mono text-slate-300">
                  {selectedFile ? (
                    <span><strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  ) : (
                    <span>Preloaded Demonstration Case Active</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20 group-hover:scale-105 transition">
                  <Upload size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Drag & drop your flood imagery here, or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Accepts Sentinel-1 SAR, Sentinel-2 Optical, aerial surveys, or disaster ground photographs
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Metadata Controls: Location & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="text-xs font-mono text-slate-300 font-bold block mb-1.5 flex items-center gap-1">
                <MapPin size={12} className="text-cyan-400" /> Geographical Location (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Kaziranga Reach, Assam or 26.65°N, 93.35°E"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-navy-950 border border-navy-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 font-bold block mb-1.5 flex items-center gap-1">
                <Calendar size={12} className="text-teal-400" /> Observation Date & Time
              </label>
              <input
                type="date"
                value={observationDate}
                onChange={(e) => setObservationDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-navy-950 border border-navy-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Primary Action Button */}
          <div>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500 hover:from-cyan-400 hover:to-teal-400 text-navy-950 font-black text-sm tracking-wide shadow-glow-cyan transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Executing 5 Neural Segmentation Models & Synthesizing Consensus...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Analyse Flood Situation</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {analysisError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Demonstration Test Cases (5 cols) */}
        <div className="lg:col-span-5 bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-panel space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-navy-800 pb-3 mb-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Award size={14} /> Demonstration Mode
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">Verified Test Samples</h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400">5 Calibration Cases</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Select one of the five verified ground-truth test cases below to immediately evaluate the multi-model segmentation pipeline without uploading your own imagery.
            </p>

            <div className="space-y-2.5">
              {samples.map((s, idx) => {
                const isSelected = selectedSampleId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSample(s)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-500 shadow-glow-cyan text-white'
                        : 'bg-navy-950/70 border-navy-800 text-slate-300 hover:border-navy-700 hover:bg-navy-950'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{s.title}</span>
                        {s.synthetic && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            Synthetic Simulation
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{s.location}</div>
                      <div className="text-[10px] text-slate-500 truncate">{s.sensor_type}</div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={{
                          backgroundColor: `${RISK_COLORS[s.tier] || '#06B6D4'}20`,
                          color: RISK_COLORS[s.tier] || '#06B6D4',
                          border: `1px solid ${RISK_COLORS[s.tier] || '#06B6D4'}50`
                        }}
                      >
                        {s.tier}
                      </span>
                      <div className="text-[9px] text-slate-400 font-mono mt-1">{s.expected_flooded_range}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-navy-950 border border-navy-800 text-[11px] text-slate-400">
            <strong>Honesty Guarantee:</strong> All demonstration runs process directly through the actual PyTorch neural inference pipeline rather than displaying predetermined static values.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. OPTIONAL FUTURE FLOOD FORECASTING INPUT SECTION */}
      {/* ========================================================================= */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-5 shadow-panel">
        <button
          type="button"
          onClick={() => setShowForecastInputs(!showForecastInputs)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Droplets size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Optional Future Flood Forecasting Parameters</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-navy-950 text-slate-400 border border-navy-800">
                  Meteorological & River Level Scenarios
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate whether flooding may occur over the next 24 hours, 48 hours, or 7 days based on forecast rainfall.
              </p>
            </div>
          </div>
          <div className="text-slate-400 hover:text-white transition">
            {showForecastInputs ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {showForecastInputs && (
          <div className="mt-4 pt-4 border-t border-navy-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Forecast 24h Rain (mm)</label>
                <input
                  type="number"
                  placeholder="e.g. 140"
                  value={rainForecast24h}
                  onChange={(e) => setRainForecast24h(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Forecast 48h Rain (mm)</label>
                <input
                  type="number"
                  placeholder="e.g. 260"
                  value={rainForecast48h}
                  onChange={(e) => setRainForecast48h(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Forecast 7-Day Cumulative (mm)</label>
                <input
                  type="number"
                  placeholder="e.g. 520"
                  value={rainForecast7d}
                  onChange={(e) => setRainForecast7d(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">River Level Anomaly (m)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. +2.5"
                  value={riverGaugeLevel}
                  onChange={(e) => setRiverGaugeLevel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-navy-950/80 border border-navy-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Forecasts will evaluate across CatBoost, Random Forest, XGBoost, LightGBM, and Soft-Voting Ensemble.</span>
              <span className="text-teal-400 font-mono">Will compute simultaneously upon clicking Analyse Flood Situation.</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MASTER UNIFIED RESULTS EXPERIENCE */}
      {/* ========================================================================= */}
      {analysisResult && (
        <div ref={resultsRef} className="space-y-6 pt-4 border-t-2 border-cyan-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-navy-900 border border-navy-800 rounded-2xl p-5">
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Sparkles size={14} /> Master Flood Intelligence Dossier
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Unified Analytical Assessment for {analysisResult.input_metadata?.user_location}
              </h2>
              <p className="text-xs text-slate-400">
                Prediction Tracking ID: <strong className="text-white font-mono">{analysisResult.prediction_id}</strong> • Analyzed at {analysisResult.timestamp}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-850 text-slate-300 border border-navy-700 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer size={13} /> Print Dossier
              </button>
            </div>
          </div>

          {/* SECTION A: INPUT & SECTION B: CURRENT FLOOD DETECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Visualizer (7 cols) */}
            <div className="lg:col-span-7 bg-navy-900 border border-navy-800 rounded-2xl p-5 shadow-panel space-y-4">
              <div className="flex items-center justify-between border-b border-navy-800 pb-3">
                <div className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
                  <Eye size={14} className="text-cyan-400" />
                  <span>Interactive Segmentation Visualizer</span>
                </div>

                {/* View Switcher Tabs */}
                <div className="flex items-center p-1 rounded-lg bg-navy-950 border border-navy-800 text-[11px] font-mono">
                  <button
                    onClick={() => setActiveImageView('overlay')}
                    className={`px-2.5 py-1 rounded transition cursor-pointer ${
                      activeImageView === 'overlay' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Flood Overlay
                  </button>
                  <button
                    onClick={() => setActiveImageView('disagreement')}
                    className={`px-2.5 py-1 rounded transition cursor-pointer ${
                      activeImageView === 'disagreement' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Disagreement Regions
                  </button>
                  <button
                    onClick={() => setActiveImageView('mask')}
                    className={`px-2.5 py-1 rounded transition cursor-pointer ${
                      activeImageView === 'mask' ? 'bg-navy-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Binary Mask
                  </button>
                  <button
                    onClick={() => setActiveImageView('original')}
                    className={`px-2.5 py-1 rounded transition cursor-pointer ${
                      activeImageView === 'original' ? 'bg-navy-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Original
                  </button>
                </div>
              </div>

              {/* Display Canvas */}
              <div className="relative rounded-xl overflow-hidden border border-navy-800 bg-navy-950 text-center flex items-center justify-center min-h-[360px]">
                {activeImageView === 'overlay' && (
                  <img
                    src={analysisResult.ensemble_synthesis?.overlay_base64}
                    alt="Flood Overlay"
                    className="max-h-[420px] w-auto object-contain mx-auto"
                  />
                )}
                {activeImageView === 'disagreement' && (
                  <img
                    src={analysisResult.ensemble_synthesis?.disagreement_overlay_base64}
                    alt="Disagreement Overlay"
                    className="max-h-[420px] w-auto object-contain mx-auto"
                  />
                )}
                {activeImageView === 'mask' && (
                  <img
                    src={analysisResult.ensemble_synthesis?.mask_base64}
                    alt="Binary Mask"
                    className="max-h-[420px] w-auto object-contain mx-auto invert"
                  />
                )}
                {activeImageView === 'original' && (
                  <img
                    src={previewUrl}
                    alt="Original Input"
                    className="max-h-[420px] w-auto object-contain mx-auto"
                  />
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  <span>Electric Cyan = Predicted Floodwater Extent</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span>Amber = Model Borderline Disagreement Pixels</span>
                </span>
              </div>
            </div>

            {/* Metrics & Severity Card (5 cols) */}
            <div className="lg:col-span-5 bg-navy-900 border border-navy-800 rounded-2xl p-5 shadow-panel space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-navy-800 pb-3">
                  <span className="text-xs font-mono font-bold uppercase text-slate-400">
                    Observed Flood Severity
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-black uppercase font-mono border"
                    style={{
                      backgroundColor: `${analysisResult.detection_summary?.severity?.hex}20`,
                      color: analysisResult.detection_summary?.severity?.hex,
                      borderColor: `${analysisResult.detection_summary?.severity?.hex}50`
                    }}
                  >
                    {analysisResult.detection_summary?.severity?.category}
                  </span>
                </div>

                {/* Primary Flooded % Metric */}
                <div className="my-3 space-y-1">
                  <div className="text-[11px] font-mono uppercase text-slate-400">Flooded Pixel Surface Area</div>
                  <div
                    className="text-4xl sm:text-5xl font-black font-mono tracking-tight"
                    style={{ color: analysisResult.detection_summary?.severity?.hex }}
                  >
                    {analysisResult.detection_summary?.flooded_percentage}%
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mt-2">
                    {analysisResult.detection_summary?.severity?.summary}
                  </p>
                </div>

                {/* Key Measurement Grid */}
                <div className="grid grid-cols-2 gap-2.5 font-mono text-xs my-4">
                  <div className="p-2.5 rounded-xl bg-navy-950 border border-navy-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Estimated Area</span>
                    <span className="text-white font-bold text-sm">
                      {analysisResult.detection_summary?.estimated_area_km2} km²
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      ({analysisResult.detection_summary?.estimated_area_hectares} ha)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-navy-950 border border-navy-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Ensemble Agreement</span>
                    <span className="text-cyan-400 font-bold text-sm">
                      {analysisResult.ensemble_synthesis?.model_agreement_percentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      5 Models Averaged
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-navy-950 border border-navy-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Inference Latency</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {analysisResult.detection_summary?.total_inference_time_ms} ms
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      MPS / CPU Accelerated
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-navy-950 border border-navy-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Calibrated Confidence</span>
                    <span className="text-teal-400 font-bold text-sm">
                      {(analysisResult.detection_summary?.calibrated_confidence * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Empirical Bayes Scale
                    </span>
                  </div>
                </div>

                {/* Operational Community Impact */}
                <div className="p-3 rounded-xl bg-navy-950 border border-navy-800 text-xs text-slate-300">
                  <strong className="text-white block mb-1">Operational Ground Impact:</strong>
                  {analysisResult.detection_summary?.severity?.operational_impact}
                </div>
              </div>

              {/* Scientific Disclaimer on Water Distinction */}
              <div className="p-3 rounded-xl bg-navy-950/70 border border-cyan-500/20 text-[11px] text-slate-400 leading-relaxed">
                <span className="font-bold text-cyan-300 block mb-0.5">Scientific Water Distinction:</span>
                {analysisResult.scientific_water_distinction?.distinction_note}
              </div>
            </div>
          </div>

          {/* SECTION D: FIVE-ALGORITHM MODEL COMPARISON */}
          <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-panel space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-navy-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-indigo-400 flex items-center gap-1.5">
                  <Cpu size={14} /> Five-Algorithm Image Segmentation Suite
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Multi-Architecture Deep Learning Performance Comparison
                </h3>
                <p className="text-xs text-slate-400">
                  All 5 models evaluated simultaneously on the identical input image using the verified test benchmark weights.
                </p>
              </div>
              <span className="text-[11px] font-mono text-cyan-400">
                Synthesis: Weighted Probability Average + Majority Vote
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] border-b border-navy-800">
                  <tr>
                    <th className="p-3">Model Architecture</th>
                    <th className="p-3">Output Mask</th>
                    <th className="p-3">Flooded Pixel %</th>
                    <th className="p-3">IoU (Jaccard)</th>
                    <th className="p-3">Dice (F1)</th>
                    <th className="p-3">Precision / Recall</th>
                    <th className="p-3">Latency</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800 text-slate-200">
                  {Object.entries(analysisResult.individual_models || {}).map(([name, m]) => (
                    <tr key={name} className="hover:bg-navy-850/60 transition">
                      <td className="p-3">
                        <strong className="text-white block">{name}</strong>
                        <span className="text-[10px] text-slate-400">{m.parameters} params</span>
                      </td>
                      <td className="p-3">
                        <img
                          src={m.mask_base64}
                          alt={`${name} mask`}
                          className="w-10 h-10 rounded border border-navy-700 object-cover invert"
                        />
                      </td>
                      <td className="p-3 font-bold text-cyan-300">
                        {m.flooded_percentage}%
                      </td>
                      <td className="p-3 text-emerald-400 font-bold">
                        {m.validation_iou.toFixed(4)}
                      </td>
                      <td className="p-3 text-teal-300 font-bold">
                        {m.validation_dice.toFixed(4)}
                      </td>
                      <td className="p-3 text-slate-300">
                        {(m.precision * 100).toFixed(1)}% / {(m.recall * 100).toFixed(1)}%
                      </td>
                      <td className="p-3 text-slate-400">
                        {m.inference_time_ms} ms
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION E: FUTURE FLOOD PREDICTION SYSTEM (If Executed) */}
          {forecastResult && forecastResult.status === 'success' && (
            <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-panel space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-navy-800 pb-3">
                <div>
                  <span className="text-xs font-mono font-bold uppercase text-teal-400 flex items-center gap-1.5">
                    <Waves size={14} /> Multi-Horizon Future Flood Forecasting
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    Meteorological Risk Projections: 24h • 48h • 7-Day Cumulative
                  </h3>
                  <p className="text-xs text-slate-400">
                    Evaluated across CatBoost, Random Forest, XGBoost, LightGBM, and Consensus Ensemble using forecast precipitation scenarios.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400 block">Peak Risk Horizon:</span>
                  <span className="text-sm font-black font-mono text-rose-400 uppercase">
                    {forecastResult.peak_risk_category} (48h Peak)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(forecastResult.horizon_predictions || {}).map(([hKey, hVal]) => (
                  <div key={hKey} className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 font-bold">{hVal.horizon_label}</span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{
                          backgroundColor: `${hVal.hex}20`,
                          color: hVal.hex,
                          border: `1px solid ${hVal.hex}40`
                        }}
                      >
                        {hVal.risk_category}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-black font-mono" style={{ color: hVal.hex }}>
                        {hVal.flood_likelihood_pct}%
                      </div>
                      <span className="text-xs text-slate-400 font-mono">Flood Probability</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-navy-900 overflow-hidden border border-navy-800">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${hVal.flood_likelihood_pct}%`, backgroundColor: hVal.hex }}
                      />
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 space-y-1 pt-1 border-t border-navy-850">
                      <div>Expected Rainfall: <strong className="text-white">{hVal.expected_rainfall_mm} mm</strong></div>
                      <div>Model Consensus: <strong className="text-cyan-300">{hVal.model_agreement_percentage}%</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION F: ROLE-CUSTOMIZED PRACTICAL RECOMMENDATIONS */}
          <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-panel space-y-4">
            <div className="flex items-center justify-between border-b border-navy-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Actionable Guidance for {userPersona}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Tailored Mitigation & Preparedness Protocols
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Persona Filter Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(analysisResult.detection_summary?.persona_recommendations || []).map((rec, i) => (
                <div key={i} className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-white text-xs">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono text-[10px]">
                      {i + 1}
                    </span>
                    <span>{rec.title}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-7">{rec.action}</p>
                  <div className="pl-7 pt-1 border-t border-navy-850 text-[11px] text-cyan-400 font-mono">
                    <strong>Why This Matters:</strong> {rec.why}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION G: INTERACTIVE LOCATION MAP */}
          <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-panel space-y-3">
            <div className="flex items-center justify-between border-b border-navy-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-cyan-400 flex items-center gap-1.5">
                  <MapPin size={14} /> Geographical Situation Context
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Interactive Spatial Map Centred on Analysed Observation Site
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Coordinates: {forecastCoords.lat}°N, {forecastCoords.lon}°E
              </span>
            </div>

            <div className="rounded-xl overflow-hidden border border-navy-800">
              <RiskMap
                center={[forecastCoords.lat, forecastCoords.lon]}
                zoom={9}
                height="380px"
                selectedPoint={{
                  latitude: forecastCoords.lat,
                  longitude: forecastCoords.lon,
                  category: analysisResult.detection_summary?.severity?.category,
                  hex: analysisResult.detection_summary?.severity?.hex
                }}
                interactive={true}
              />
            </div>
          </div>

          {/* SECTION H: PUBLIC WELFARE, DISCLAIMERS & EMERGENCY LINKS */}
          <div className="bg-navy-950 border border-cyan-500/30 rounded-2xl p-6 shadow-panel space-y-3">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <ShieldCheck size={18} className="text-cyan-400 shrink-0" />
              <span>Public Safety & Operational Advisory Protocol</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Critical Distinction:</strong> GeoFlood AI provides scientific spatial intelligence and machine learning screening. Observed pixel extents reflect satellite surface coverage at image acquisition time. Historical susceptibility reflects terrain physics. Future forecasts reflect precipitation scenarios. <strong>None of these replace official evacuation orders.</strong>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-navy-900 border border-navy-800">
                <span className="text-slate-400 block text-[10px]">National Helpline</span>
                <strong className="text-white text-sm">NDRF: 1078</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-navy-900 border border-navy-800">
                <span className="text-slate-400 block text-[10px]">State Disaster Control</span>
                <strong className="text-white text-sm">SDMA: 1070</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-navy-900 border border-navy-800">
                <span className="text-slate-400 block text-[10px]">Emergency Ambulance</span>
                <strong className="text-white text-sm">108 / 112</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-navy-900 border border-navy-800">
                <span className="text-slate-400 block text-[10px]">Weather Alerts</span>
                <a
                  href="https://mausam.imd.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 font-bold flex items-center gap-1 hover:underline"
                >
                  <span>IMD Portal</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
