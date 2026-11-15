import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import RiskMap from '../components/RiskMap';
import InfoTooltip from '../components/InfoTooltip';
import { useTheme } from '../context/ThemeContext';
import {
  SAMPLE_SCENARIOS, lookupEnvironmentalFeatures
} from '../services/geospatialService';
import {
  Layers, MapPin, Activity, Cpu, AlertTriangle, ShieldCheck,
  CheckCircle2, Compass, Droplet, ArrowRight, BarChart3, HelpCircle,
  Sparkles, Save, Mountain, CloudRain, Waves, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';

const WORLD_COVER_OPTIONS = [
  { code: 10, label: 'Tree Cover (Forest)' },
  { code: 20, label: 'Shrubland' },
  { code: 30, label: 'Grassland' },
  { code: 40, label: 'Cropland (Agricultural)' },
  { code: 50, label: 'Built-up (Urban Impervious)' },
  { code: 60, label: 'Bare / Sparse' },
  { code: 80, label: 'Permanent Water Body' },
  { code: 90, label: 'Herbaceous Wetland' },
  { code: 95, label: 'Mangroves' },
];

const SOIL_OPTIONS = [
  { code: 1, label: 'Clay (Low Permeability / High Ponding)' },
  { code: 2, label: 'Clay Loam' },
  { code: 3, label: 'Sandy Loam (Moderate Drainage)' },
  { code: 4, label: 'Silt Loam' },
  { code: 5, label: 'Peat / Organic / Mountain Loam' },
];

const RISK_COLORS = {
  'Very Low': '#10B981',
  'Low': '#06B6D4',
  'Moderate': '#F59E0B',
  'High': '#F97316',
  'Very High': '#EF4444',
};

export default function FloodPrediction({ onSaveHistory }) {
  const { chartTheme } = useTheme();
  const [studyAreas, setStudyAreas] = useState([]);
  const [mode, setMode] = useState('geospatial'); // 'geospatial' or 'manual'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [locationTitle, setLocationTitle] = useState('Kochi (Periyar Basin), Kerala');

  const [formData, setFormData] = useState({
    latitude: 9.9312,
    longitude: 76.2673,
    elevation: 4.5,
    slope: 0.5,
    aspect: 240.0,
    rainfall_24h: 195.0,
    rainfall_7d: 620.0,
    rainfall_30d: 1350.0,
    distance_to_river: 120.0,
    drainage_density: 4.8,
    flow_accumulation: 54000.0,
    twi: 16.8,
    landcover: 50,
    soil_type: 1,
    ndvi: 0.35,
    flood_frequency: 6,
  });

  useEffect(() => {
    api.getStudyAreas().then(setStudyAreas).catch(() => {});
    // Check if there is a saved prediction from dashboard
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('geoflood_latest_prediction');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.inputs) {
            setFormData(parsed.inputs);
            if (parsed.locationName) setLocationTitle(parsed.locationName);
            if (parsed.result) setResult(parsed.result);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleStudyAreaSelect = (area) => {
    setLocationTitle(area.name);
    setFormData((prev) => ({
      ...prev,
      ...area,
      latitude: area.latitude,
      longitude: area.longitude
    }));
  };

  const handleScenarioSelect = (scenario) => {
    setLocationTitle(`${scenario.label} (${scenario.sublabel})`);
    setFormData((prev) => ({
      ...prev,
      latitude: scenario.latitude,
      longitude: scenario.longitude,
      elevation: scenario.elevation,
      slope: scenario.slope,
      aspect: scenario.aspect,
      rainfall_24h: scenario.rainfall_24h,
      rainfall_7d: scenario.rainfall_7d,
      rainfall_30d: scenario.rainfall_30d,
      distance_to_river: scenario.distance_to_river,
      drainage_density: scenario.drainage_density,
      flow_accumulation: scenario.flow_accumulation,
      twi: scenario.twi,
      landcover: scenario.landcover,
      soil_type: scenario.soil_type,
      ndvi: scenario.ndvi,
      flood_frequency: scenario.flood_frequency,
    }));
  };

  const handleMapCoordinateSelect = (coords) => {
    const lat = coords.latitude || coords.lat;
    const lon = coords.longitude || coords.lng;
    const env = lookupEnvironmentalFeatures(lat, lon);
    setLocationTitle(env.label);
    setFormData((prev) => ({
      ...prev,
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      elevation: env.elevation,
      slope: env.slope,
      aspect: env.aspect,
      rainfall_24h: env.rainfall_24h,
      rainfall_7d: env.rainfall_7d,
      rainfall_30d: env.rainfall_30d,
      distance_to_river: env.distance_to_river,
      drainage_density: env.drainage_density,
      flow_accumulation: env.flow_accumulation,
      twi: env.twi,
      landcover: env.landcover,
      soil_type: env.soil_type,
      ndvi: env.ndvi,
      flood_frequency: env.flood_frequency,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await api.predictSingle(formData);
      setResult(res);
      if (typeof window !== 'undefined') {
        localStorage.setItem('geoflood_latest_prediction', JSON.stringify({
          locationName: locationTitle,
          timestamp: new Date().toISOString(),
          inputs: formData,
          result: res
        }));
      }
      if (onSaveHistory) {
        onSaveHistory({
          id: Date.now(),
          timestamp: new Date().toISOString(),
          latitude: formData.latitude,
          longitude: formData.longitude,
          elevation: formData.elevation,
          rainfall_24h: formData.rainfall_24h,
          category: res.consensus?.category || res.ensemble?.category,
          score: res.consensus?.score || res.ensemble?.score,
          color: res.consensus?.color || res.ensemble?.color
        });
      }
    } catch (e) {
      alert(`Prediction failed: ${e.response?.data?.detail || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const consensus = result?.consensus || result?.ensemble;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-cyan-400 font-mono text-xs tracking-wider uppercase font-bold flex items-center gap-2 mb-1">
              <Compass size={14} />
              <span>Multi-Model Geospatial Inference Engine</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Flood Susceptibility Prediction</h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Evaluate retrospective flood hazard propensity for any geographic point using all six trained ML models and the consensus soft-voting ensemble.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-navy-950 p-1.5 rounded-xl border border-navy-800 self-start md:self-auto shrink-0">
            <button
              onClick={() => setMode('geospatial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                mode === 'geospatial' ? 'bg-cyan-600 text-navy-950 font-bold shadow-glow-cyan' : 'text-slate-400 hover:text-white'
              }`}
            >
              Interactive Map Mode
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                mode === 'manual' ? 'bg-cyan-600 text-navy-950 font-bold shadow-glow-cyan' : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Feature Vector Form
            </button>
          </div>
        </div>
      </div>

      {/* Quick Benchmark & Scenario Presets */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-4 shadow-panel">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
            <MapPin size={13} className="text-cyan-400" />
            <span>Calibrated Regional Scenarios & River Basins</span>
          </div>
          <span className="text-[11px] text-cyan-400 font-mono">
            {locationTitle}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {SAMPLE_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleScenarioSelect(sc)}
              className="px-3 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-850 border border-navy-800 hover:border-cyan-500 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5 font-mono cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span>{sc.label} ({sc.badge.split(' ')[0]})</span>
            </button>
          ))}
          {studyAreas.map((area) => (
            <button
              key={area.id}
              onClick={() => handleStudyAreaSelect(area)}
              className="px-3 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-850 border border-navy-800 hover:border-cyan-500 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5 font-mono cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              <span>{area.name.split('–')[0].trim()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Grid: Controls Left, Map/Form Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Essential Environmental Inputs */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel space-y-4">
          <div className="flex items-center justify-between border-b border-navy-800 pb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Location Coordinates</span>
            <span className="text-[10px] text-cyan-400 font-mono">WGS84 EPSG:4326</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <span>Latitude (°N)</span>
              </label>
              <input
                type="number"
                step="0.001"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2.5 text-xs text-white font-mono focus:border-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <span>Longitude (°E)</span>
              </label>
              <input
                type="number"
                step="0.001"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2.5 text-xs text-white font-mono focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <span>Elevation (m)</span>
                <InfoTooltip term="elevation" />
              </label>
              <input
                type="number"
                name="elevation"
                value={formData.elevation}
                onChange={handleChange}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2.5 text-xs text-white font-mono focus:border-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <span>Slope (°)</span>
                <InfoTooltip term="slope" />
              </label>
              <input
                type="number"
                step="0.1"
                name="slope"
                value={formData.slope}
                onChange={handleChange}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2.5 text-xs text-white font-mono focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
              <span>24h Rainfall (mm)</span>
              <InfoTooltip term="rainfall_24h" />
            </label>
            <input
              type="number"
              name="rainfall_24h"
              value={formData.rainfall_24h}
              onChange={handleChange}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2.5 text-xs text-teal-400 font-mono font-bold focus:border-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
              <span>ESA WorldCover Class</span>
              <InfoTooltip term="landcover" />
            </label>
            <select
              name="landcover"
              value={formData.landcover}
              onChange={handleChange}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2.5 text-xs text-white focus:border-cyan-500 outline-none font-mono"
            >
              {WORLD_COVER_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.code} – {opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
              <span>Soil Permeability Type</span>
              <InfoTooltip term="soil_type" />
            </label>
            <select
              name="soil_type"
              value={formData.soil_type}
              onChange={handleChange}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2.5 text-xs text-white focus:border-cyan-500 outline-none font-mono"
            >
              {SOIL_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.code} – {opt.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 disabled:opacity-50 text-navy-950 font-black text-xs uppercase tracking-wider shadow-glow-cyan transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>Running All 9 Models...</>
            ) : (
              <>
                <Activity size={16} />
                <span>Calculate Flood Susceptibility</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Interactive Map or Detailed Form (2 Columns) */}
        <div className="lg:col-span-2 bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
          {mode === 'geospatial' ? (
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-navy-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Interactive Spatial Inspection (Click map to auto-retrieve local terrain features)
                </span>
                <span className="text-xs text-cyan-400 font-mono">
                  {formData.latitude}°N, {formData.longitude}°E
                </span>
              </div>
              <RiskMap
                height="410px"
                center={[formData.latitude, formData.longitude]}
                zoom={7}
                selectedPoint={formData}
                onSelectCoordinates={handleMapCoordinateSelect}
                points={studyAreas}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-navy-800 pb-2 mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Full 16-Dimensional Feature Vector
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <span>Aspect (°)</span>
                  </label>
                  <input
                    type="number"
                    name="aspect"
                    value={formData.aspect}
                    onChange={handleChange}
                    className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <span>7-day Rain (mm)</span>
                    <InfoTooltip term="rainfall_7d" />
                  </label>
                  <input
                    type="number"
                    name="rainfall_7d"
                    value={formData.rainfall_7d}
                    onChange={handleChange}
                    className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <span>30-day Rain (mm)</span>
                    <InfoTooltip term="rainfall_30d" />
                  </label>
                  <input
                    type="number"
                    name="rainfall_30d"
                    value={formData.rainfall_30d}
                    onChange={handleChange}
                    className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <span>River Distance (m)</span>
                    <InfoTooltip term="distance_to_river" />
                  </label>
                  <input
                    type="number"
                    name="distance_to_river"
                    value={formData.distance_to_river}
                    onChange={handleChange}
                    className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <span>Drainage Density</span>
                    <InfoTooltip term="drainage_density" />
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="drainage_density"
                    value={formData.drainage_density}
                    onChange={handleChange}
                    className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <span>Flow Accumulation</span>
                    <InfoTooltip term="flow_accumulation" />
                  </label>
                  <input
                    type="number"
                    name="flow_accumulation"
                    value={formData.flow_accumulation}
                    onChange={handleChange}
                    className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <span>Topographic Wetness Index</span>
                    <InfoTooltip term="twi" />
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="twi"
                    value={formData.twi}
                    onChange={handleChange}
                    className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2 text-xs text-cyan-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <span>Sentinel-2 NDVI</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="ndvi"
                    value={formData.ndvi}
                    onChange={handleChange}
                    className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <span>Flood Frequency</span>
                  </label>
                  <input
                    type="number"
                    name="flood_frequency"
                    value={formData.flood_frequency}
                    onChange={handleChange}
                    className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results Display */}
      {result && (
        <div className="space-y-6 pt-2">
          {/* Main Consensus KPI Card */}
          <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-panel">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono tracking-widest text-slate-400">Consensus Assessment</span>
                  <InfoTooltip term="susceptibility_score" />
                </div>
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl font-black text-white">{consensus?.category} Susceptibility</h3>
                  <span
                    className="px-3.5 py-1 rounded-full text-xs font-black uppercase text-white shadow font-mono"
                    style={{ backgroundColor: RISK_COLORS[consensus?.category] || consensus?.color }}
                  >
                    Probability: {((consensus?.score || consensus?.probability || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-slate-300 text-xs max-w-2xl mt-1 leading-relaxed">{consensus?.description}</p>
              </div>

              <div className="flex gap-3">
                <div className="bg-navy-950 border border-navy-800 rounded-xl p-3.5 text-center min-w-[130px]">
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center justify-center gap-1">
                    <span>Model Agreement</span>
                    <InfoTooltip term="model_consensus" />
                  </div>
                  <div className="text-2xl font-black text-cyan-400 font-mono mt-0.5">{consensus?.model_agreement_percentage}%</div>
                  <div className="text-[10px] text-slate-500 font-mono">All 9 Estimators</div>
                </div>
                <div className="bg-navy-950 border border-navy-800 rounded-xl p-3.5 text-center min-w-[130px]">
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Binary Label</div>
                  <div className={`text-2xl font-black font-mono mt-0.5 ${consensus?.predicted_class === 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {consensus?.predicted_class === 1 ? 'Susceptible' : 'Resilient'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">P &ge; 0.50 Threshold</div>
                </div>
              </div>
            </div>

            {/* Dominant Risk Factors */}
            <div className="pt-4">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-300 mb-2 flex items-center gap-1.5 font-mono">
                <AlertTriangle size={14} className="text-amber-400" />
                <span>Primary Environmental Hazard Drivers</span>
                <InfoTooltip term="shap_explanation" />
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {result.explanation?.dominant_risk_factors?.map((reason, idx) => (
                  <div key={idx} className="bg-navy-950 border border-navy-800/80 rounded-lg p-3 text-xs text-slate-300 flex items-start gap-2 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Model Predictions Table & Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table */}
            <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
              <h3 className="text-sm font-bold text-white mb-1 font-mono uppercase tracking-wider">
                Simultaneous Multi-Algorithm Predictions
              </h3>
              <p className="text-slate-400 text-xs mb-3">Model-by-model classification for this exact coordinate vector.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] border-b border-navy-800">
                    <tr>
                      <th className="p-2.5">Algorithm</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Probability</th>
                      <th className="p-2.5">Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-800 text-slate-200">
                    {Object.values(result.model_predictions || {}).map((m) => (
                      <tr key={m.algorithm} className="hover:bg-navy-850/60">
                        <td className="p-2.5 font-semibold text-white">{m.algorithm}</td>
                        <td className="p-2.5">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              color: RISK_COLORS[m.category] || '#06B6D4',
                              backgroundColor: `${RISK_COLORS[m.category] || '#06B6D4'}20`,
                              border: `1px solid ${RISK_COLORS[m.category] || '#06B6D4'}40`
                            }}
                          >
                            {m.category}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-cyan-300">
                          {((m.susceptibility_score || m.probability || 0) * 100).toFixed(1)}%
                        </td>
                        <td className="p-2.5">
                          {m.predicted_class === 1 ? <span className="text-red-400 font-bold">1</span> : <span className="text-emerald-400 font-bold">0</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Susceptibility Score Comparison Chart */}
            <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
              <h3 className="text-sm font-bold text-white mb-1 font-mono uppercase tracking-wider">
                Predicted Susceptibility Distribution
              </h3>
              <p className="text-slate-400 text-xs mb-3">Model confidence consensus comparison.</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.values(result.model_predictions || {}).map((m) => ({
                      name: m.algorithm.replace('Regression', 'Reg').replace('Support Vector Machine', 'SVM').replace(' (Optuna Optimized)', '*'),
                      score: Number(((m.susceptibility_score || m.probability || 0) * 100).toFixed(1)),
                      category: m.category
                    }))}
                    margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="name" stroke={chartTheme.axis} fontSize={9} angle={-20} textAnchor="end" />
                    <YAxis stroke={chartTheme.axis} domain={[0, 100]} fontSize={10} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartTheme.tooltipBg,
                        borderColor: chartTheme.tooltipBorder,
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: chartTheme.tooltipText
                      }}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {Object.values(result.model_predictions || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.category] || '#06B6D4'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
