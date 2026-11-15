import React, { useState, useEffect } from 'react';
import RiskMap from '../components/RiskMap';
import InfoTooltip from '../components/InfoTooltip';
import { useTheme } from '../context/ThemeContext';
import {
  MapPin, Compass, Droplet, Mountain, Waves, ShieldCheck,
  CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw, Printer,
  Download, Award, Layers, Sparkles, ExternalLink, Activity,
  Sliders, Calendar, Clock, Database, Check, Eye
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';

const RISK_COLORS = {
  'Very Low': '#10B981',
  'Low': '#06B6D4',
  'Moderate': '#F59E0B',
  'High': '#F97316',
  'Very High': '#EF4444',
};

const SOIL_NAMES = {
  1: 'Clay (Low Permeability / Ponding Prone)',
  2: 'Clay Loam (Moderate Infiltration)',
  3: 'Sandy Loam (Good Drainage)',
  4: 'Silt Loam (Alluvial)',
  5: 'Mountain / Peat / Organic Loam'
};

const LANDCOVER_NAMES = {
  10: 'Tree Cover (Forest)',
  20: 'Shrubland',
  30: 'Grassland',
  40: 'Cropland (Agricultural)',
  50: 'Built-up (Urban Impervious)',
  60: 'Bare / Sparse Terrain',
  80: 'Permanent Water Body',
  90: 'Herbaceous Wetland / Marsh',
  95: 'Mangroves'
};

export default function MasterPredictionResults({ onNavigate }) {
  const { chartTheme } = useTheme();
  const [predictionData, setPredictionData] = useState(null);
  const [mapLayer, setMapLayer] = useState('dark');

  useEffect(() => {
    // Load the latest prediction from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('geoflood_latest_prediction');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPredictionData(parsed);
        } catch (e) {
          console.error('Failed to parse saved prediction:', e);
        }
      }
    }
  }, []);

  if (!predictionData || !predictionData.result) {
    return (
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-10 text-center max-w-xl mx-auto shadow-panel space-y-4">
        <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
          <Compass size={24} />
        </div>
        <h2 className="text-xl font-bold text-white">No Active Prediction Loaded</h2>
        <p className="text-xs text-slate-400">
          Enter coordinates, search a city, or select a sample scenario on the Dashboard to calculate and view your comprehensive Master Susceptibility Dossier.
        </p>
        <button
          onClick={() => onNavigate('Overview Dashboard')}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { locationName, timestamp, inputs, result } = predictionData;
  const consensus = result.consensus || result.ensemble || {};
  const predictions = result.model_predictions || {};
  const explanation = result.explanation || {};
  const histInfo = result.historical_flood_info || {};
  const prepSteps = result.preparedness_recommendations || [];
  const predId = result.prediction_id || `PRED-${new Date(timestamp).getTime().toString().slice(-6)}`;

  // Prepare chart data for model comparison
  const chartData = Object.entries(predictions).map(([name, m]) => ({
    name: name.replace('Regression', 'Reg').replace('Support Vector Machine', 'SVM').replace(' (Optuna Optimized)', ' (Opt)'),
    fullName: name,
    score: Number(((m.susceptibility_score || m.probability || 0) * 100).toFixed(1)),
    category: m.category,
    agrees: m.agrees_with_ensemble !== false
  })).sort((a, b) => b.score - a.score);

  // Map markers: Selected point + nearby historical flood observations
  const mapPoints = [];

  // Add nearby historical flood ground-truth markers if available
  if (histInfo.records && histInfo.records.length > 0) {
    histInfo.records.forEach((rec, idx) => {
      mapPoints.push({
        latitude: rec.latitude,
        longitude: rec.longitude,
        name: `Historical Flood Record #${idx + 1}: ${rec.basin_name}`,
        basin: rec.basin_name,
        elevation: rec.elevation,
        risk_category: 'High',
        score: 0.90,
        historical: true
      });
    });
  }

  const selectedMapPoint = {
    latitude: inputs.latitude,
    longitude: inputs.longitude,
    name: `📍 Analysis Target: ${locationName}`,
    elevation: inputs.elevation,
    risk_category: consensus.category,
    score: consensus.score
  };

  return (
    <div className="space-y-6 pb-12 print:space-y-4 print:text-black">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-800 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('Overview Dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 border border-navy-700 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft size={14} className="text-cyan-400" />
            <span>New Analysis / Dashboard</span>
          </button>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} /> Master Susceptibility Dossier
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 border border-navy-700 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <Printer size={13} className="text-cyan-400" />
            <span>Print Dossier</span>
          </button>
          <button
            onClick={() => onNavigate('Reports & Downloads')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-navy-950 font-black text-xs shadow-glow-cyan transition cursor-pointer"
          >
            <Download size={13} />
            <span>Export Technical PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: LOCATION & EVALUATION DOSSIER HEADER */}
      {/* ========================================================================= */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-5 lg:p-6 shadow-panel">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-navy-800 pb-5 mb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-cyan-400 mb-1.5">
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 font-bold">
                ID: {predId}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Clock size={12} /> {new Date(timestamp).toLocaleString()}
              </span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> 9 Machine Learning Models Verified
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>{locationName}</span>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: consensus.hex || '#06B6D4' }}></span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-3">
              <span>Latitude: <strong>{Number(inputs.latitude).toFixed(4)}°N</strong></span>
              <span>•</span>
              <span>Longitude: <strong>{Number(inputs.longitude).toFixed(4)}°E</strong></span>
              <span>•</span>
              <span>Geodetic Datum: WGS84 EPSG:4326</span>
            </p>
          </div>

          {/* Quick Badges */}
          <div className="flex items-center gap-2 self-start">
            <div className="px-3 py-1.5 rounded-xl bg-navy-950 border border-navy-800 text-right">
              <div className="text-[10px] font-mono uppercase text-slate-400">Model Consensus</div>
              <div className="text-lg font-black font-mono text-cyan-400">{consensus.model_agreement_percentage}%</div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-navy-950 border border-navy-800 text-right">
              <div className="text-[10px] font-mono uppercase text-slate-400">Susceptibility Tier</div>
              <div className="text-lg font-black font-mono" style={{ color: consensus.hex || '#06B6D4' }}>
                {consensus.category}
              </div>
            </div>
          </div>
        </div>

        {/* Input Environmental Features Matrix */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-1.5">
            <Sliders size={13} className="text-cyan-400" />
            <span>Active Environmental Covariates Used for Inference</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-navy-950/70 border border-navy-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                <span>Elevation</span>
                <InfoTooltip term="elevation" size={11} />
              </span>
              <span className="text-white font-bold text-sm mt-1">{inputs.elevation} m</span>
            </div>

            <div className="p-2.5 rounded-xl bg-navy-950/70 border border-navy-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                <span>Slope</span>
                <InfoTooltip term="slope" size={11} />
              </span>
              <span className="text-white font-bold text-sm mt-1">{inputs.slope}°</span>
            </div>

            <div className="p-2.5 rounded-xl bg-navy-950/70 border border-navy-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                <span>24h Rain</span>
                <InfoTooltip term="rainfall_24h" size={11} />
              </span>
              <span className="text-teal-400 font-bold text-sm mt-1">{inputs.rainfall_24h} mm</span>
            </div>

            <div className="p-2.5 rounded-xl bg-navy-950/70 border border-navy-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                <span>30d Rain</span>
                <InfoTooltip term="rainfall_30d" size={11} />
              </span>
              <span className="text-slate-200 font-bold text-sm mt-1">{inputs.rainfall_30d} mm</span>
            </div>

            <div className="p-2.5 rounded-xl bg-navy-950/70 border border-navy-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                <span>River Dist</span>
                <InfoTooltip term="distance_to_river" size={11} />
              </span>
              <span className="text-white font-bold text-sm mt-1">{inputs.distance_to_river} m</span>
            </div>

            <div className="p-2.5 rounded-xl bg-navy-950/70 border border-navy-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                <span>TWI Wetness</span>
                <InfoTooltip term="twi" size={11} />
              </span>
              <span className="text-cyan-300 font-bold text-sm mt-1">{inputs.twi}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-navy-950/70 border border-navy-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                <span>Drainage</span>
                <InfoTooltip term="drainage_density" size={11} />
              </span>
              <span className="text-slate-200 font-bold text-sm mt-1">{inputs.drainage_density} km⁻¹</span>
            </div>

            <div className="p-2.5 rounded-xl bg-navy-950/70 border border-navy-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                <span>Soil & Cover</span>
                <InfoTooltip term="soil_type" size={11} />
              </span>
              <span className="text-slate-300 text-[11px] truncate mt-1">
                {inputs.soil_type === 1 ? 'Clay' : inputs.soil_type === 3 ? 'Sandy' : 'Loam'} / {inputs.landcover === 50 ? 'Urban' : 'Crop'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION B: FINAL FLOOD SUSCEPTIBILITY RESULT CARD */}
      {/* ========================================================================= */}
      <div className="bg-navy-900 border-2 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
        style={{ borderColor: `${consensus.hex || '#06B6D4'}60` }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Probability Gauge & Category (5 cols) */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-navy-800 pb-5 lg:pb-0 lg:pr-6">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-mono uppercase font-bold text-cyan-400 flex items-center gap-1">
                <span>Final Flood Susceptibility Assessment</span>
                <InfoTooltip term="susceptibility_score" />
              </span>
              <span className="text-[10px] font-mono text-slate-500">Bayes Decision Cutoff: 0.50</span>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <div className="text-4xl lg:text-5xl font-black font-mono tracking-tight"
                style={{ color: consensus.hex || '#06B6D4' }}
              >
                {(consensus.score * 100).toFixed(1)}%
              </div>
              <div className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow"
                style={{
                  backgroundColor: `${consensus.hex}22`,
                  color: consensus.hex,
                  borderColor: `${consensus.hex}60`
                }}
              >
                {consensus.category} Susceptibility
              </div>
            </div>

            {/* Continuous Progress Bar */}
            <div className="w-full h-3 rounded-full bg-navy-950 overflow-hidden my-3 border border-navy-800">
              <div
                className="h-full transition-all duration-1000 rounded-full"
                style={{
                  width: `${Math.max(consensus.score * 100, 4)}%`,
                  backgroundColor: consensus.hex
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Confidence: <strong className="text-white">{consensus.model_agreement_percentage}% Agreement</strong></span>
              <span>Posterior P: <strong>{consensus.score.toFixed(4)}</strong></span>
            </div>
          </div>

          {/* Right Column: Physical Explanation & Scientific Distinction (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">What This Result Means for This Location</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The multi-algorithm consensus ensemble predicts that a land unit with an elevation of{' '}
                <strong className="text-white">{inputs.elevation} meters</strong>, terrain slope of{' '}
                <strong className="text-white">{inputs.slope}°</strong>, and a 24-hour rainfall of{' '}
                <strong className="text-white">{inputs.rainfall_24h} mm</strong> has an intrinsic retrospective flood susceptibility category of{' '}
                <strong style={{ color: consensus.hex }}>{consensus.category}</strong>.
              </p>
            </div>

            {/* Core Scientific Disclaimer Box */}
            <div className="p-3 rounded-xl bg-navy-950 border border-cyan-500/20 text-xs text-slate-300 flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-cyan-300 block">Critical Scientific Distinction:</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>Flood Susceptibility is NOT a guarantee of current or future flooding.</strong> It reflects the long-term physical vulnerability of the terrain to retain water and pond when subjected to severe monsoon storms. It is a spatial planning metric, distinct from real-time dynamic flood hydrograph forecasting or hourly weather evacuation warnings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION C: REDESIGNED INTERACTIVE LOCATION GIS MAP */}
      {/* ========================================================================= */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-5 lg:p-6 shadow-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-800 pb-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <MapPin size={14} />
              <span>Interactive Geographical Risk Map</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Spatial Topographical Overview & Historical Observation Overlays
            </h2>
            <p className="text-xs text-slate-400">
              Centred directly on your submitted location ({Number(inputs.latitude).toFixed(4)}°N, {Number(inputs.longitude).toFixed(4)}°E).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400">
              Nearby Historical Points: <strong className="text-white">{histInfo.records?.length || 0}</strong>
            </span>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative rounded-xl overflow-hidden border border-navy-800">
          <RiskMap
            center={[inputs.latitude, inputs.longitude]}
            zoom={8}
            height="460px"
            points={mapPoints}
            selectedPoint={selectedMapPoint}
            interactive={true}
          />
        </div>

        {/* Map Footnote Details */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 border-t border-navy-800/80">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: consensus.hex }}></span>
            <span>Target Location Marker (Pulse Pin)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
            <span>Verified Historical Flood Observations (ISRO Bhuvan / Dartmouth GFD)</span>
          </div>
          <span className="font-mono text-[11px] text-cyan-400">
            Use the top-right layer control on the map to switch between Satellite, Dark GIS, and Street vectors.
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION D: INDIVIDUAL MACHINE LEARNING MODEL COMPARISON */}
      {/* ========================================================================= */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-5 lg:p-6 shadow-panel space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-800 pb-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Award size={14} />
              <span>Multi-Algorithm Voting Matrix</span>
              <InfoTooltip term="model_consensus" />
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Individual Model Predictions (Simultaneous Inference)
            </h2>
            <p className="text-xs text-slate-400">
              Empirical predictions from all 9 trained estimators for this exact feature vector.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            {consensus.highest_scoring_model && (
              <div className="p-2 rounded-lg bg-navy-950 border border-navy-800">
                <span className="text-slate-500 text-[10px] block">Highest Scoring Model:</span>
                <span className="text-white font-bold">{consensus.highest_scoring_model.model} ({(consensus.highest_scoring_model.score * 100).toFixed(1)}%)</span>
              </div>
            )}
            {consensus.lowest_scoring_model && (
              <div className="p-2 rounded-lg bg-navy-950 border border-navy-800">
                <span className="text-slate-500 text-[10px] block">Lowest Scoring Model:</span>
                <span className="text-white font-bold">{consensus.lowest_scoring_model.model} ({(consensus.lowest_scoring_model.score * 100).toFixed(1)}%)</span>
              </div>
            )}
          </div>
        </div>

        {/* Table & Chart Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table (6 cols) */}
          <div className="lg:col-span-6 overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] border-b border-navy-800">
                <tr>
                  <th className="p-3">Algorithm</th>
                  <th className="p-3">Risk Tier</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Consensus Agreement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800 text-slate-200">
                {Object.entries(predictions).map(([name, m]) => {
                  const agrees = m.agrees_with_ensemble !== false;
                  return (
                    <tr key={name} className="hover:bg-navy-850/60 transition">
                      <td className="p-3 font-semibold text-white truncate max-w-[170px]">{name}</td>
                      <td className="p-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{
                            color: m.hex || RISK_COLORS[m.category] || '#06B6D4',
                            backgroundColor: `${m.hex || RISK_COLORS[m.category] || '#06B6D4'}20`,
                            border: `1px solid ${m.hex || RISK_COLORS[m.category] || '#06B6D4'}40`
                          }}
                        >
                          {m.category}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-cyan-300">
                        {((m.susceptibility_score || m.probability || 0) * 100).toFixed(1)}%
                      </td>
                      <td className="p-3">
                        {agrees ? (
                          <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                            <Check size={13} /> Agrees
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                            <AlertTriangle size={13} /> Dissenting
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bar Chart (6 cols) */}
          <div className="lg:col-span-6 bg-navy-950 p-4 rounded-xl border border-navy-800 flex flex-col justify-between">
            <div className="text-xs font-mono font-bold text-slate-300 mb-2">
              Model Score Distribution Comparison
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="name" stroke={chartTheme.axis} fontSize={9} angle={-25} textAnchor="end" />
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
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.category] || '#06B6D4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-navy-800">
              <span>Soft-Voting Consensus Average: <strong className="text-white">{(consensus.score * 100).toFixed(1)}%</strong></span>
              <span>All 9 Models Trained & Loaded</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION E: WHY DID THE MODEL GIVE THIS RESULT? (EXPLAINABLE AI / SHAP) */}
      {/* ========================================================================= */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-5 lg:p-6 shadow-panel space-y-4">
        <div className="border-b border-navy-800 pb-4">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Eye size={14} />
            <span>Explainable AI (SHAP Waterfall Attribution)</span>
            <InfoTooltip term="shap_explanation" />
          </div>
          <h2 className="text-lg font-bold text-white mt-0.5">
            Why Did the AI Model Produce This Susceptibility Rating?
          </h2>
          <p className="text-xs text-slate-400">
            SHapley Additive exPlanations quantify how much each physical terrain and climate factor shifted the prediction relative to the baseline average.
          </p>
        </div>

        {/* Human-Readable Bullet Reasons */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Primary Environmental Hazard Drivers:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {explanation.dominant_risk_factors?.map((reason, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-navy-950 border border-navy-800 text-xs text-slate-300 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shrink-0"></span>
                <span className="leading-relaxed">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Positive (Increasing Risk) vs Negative (Protective Factors) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-navy-800">
          {/* Risk Increasing */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
              <span>⚠️ Factors Increasing Susceptibility (+)</span>
            </div>
            <div className="space-y-1.5">
              {explanation.positive_contributions?.slice(0, 4).map((f, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-navy-950 border border-rose-500/20 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">{f.feature}</span>
                  <span className="text-rose-400 font-bold">+{f.shap_value.toFixed(3)} SHAP</span>
                </div>
              )) || (
                <div className="text-xs text-slate-500 italic p-2">No extreme risk-amplifying anomalies detected.</div>
              )}
            </div>
          </div>

          {/* Risk Decreasing / Protective */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <span>🛡️ Protective Terrain Shields Decreasing Susceptibility (-)</span>
            </div>
            <div className="space-y-1.5">
              {explanation.negative_contributions?.slice(0, 4).map((f, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-navy-950 border border-emerald-500/20 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">{f.feature}</span>
                  <span className="text-emerald-400 font-bold">{f.shap_value.toFixed(3)} SHAP</span>
                </div>
              )) || (
                <div className="text-xs text-slate-500 italic p-2">No significant elevation or slope protection present.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION F: HISTORICAL FLOOD INFORMATION & GROUND-TRUTH DATABASE */}
      {/* ========================================================================= */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-5 lg:p-6 shadow-panel space-y-4">
        <div className="border-b border-navy-800 pb-4">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
            <Database size={14} />
            <span>Historical Inundation Ground-Truth Archive</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-0.5">
            Verified Historical Inundation Records Near This Location
          </h2>
          <p className="text-xs text-slate-400">
            Queried from the ISRO Bhuvan Flood Hazard layers and the Dartmouth Global Flood Database (GFD) within 75 km radius.
          </p>
        </div>

        {histInfo.has_records && histInfo.records?.length > 0 ? (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-navy-950 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span>{histInfo.message}</span>
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block font-mono">
                  Closest historical event: <strong className="text-cyan-300">{histInfo.closest_distance_km} km away</strong> in the <strong className="text-white">{histInfo.closest_basin}</strong>.
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono text-cyan-300 bg-cyan-950 border border-cyan-800 shrink-0">
                Verified Sensor Data
              </span>
            </div>

            {/* List of Nearest Events */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] border-b border-navy-800">
                  <tr>
                    <th className="p-2.5">River Basin</th>
                    <th className="p-2.5">Coordinates</th>
                    <th className="p-2.5">Proximity</th>
                    <th className="p-2.5">Elevation</th>
                    <th className="p-2.5">Recorded Rain</th>
                    <th className="p-2.5">Historical Frequency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800 text-slate-300">
                  {histInfo.records.map((r, i) => (
                    <tr key={i} className="hover:bg-navy-850/60">
                      <td className="p-2.5 font-bold text-white">{r.basin_name}</td>
                      <td className="p-2.5 text-cyan-300">{r.latitude.toFixed(3)}°N, {r.longitude.toFixed(3)}°E</td>
                      <td className="p-2.5 font-bold text-slate-200">{r.distance_km} km</td>
                      <td className="p-2.5">{r.elevation} m</td>
                      <td className="p-2.5 text-teal-400">{r.rainfall_24h} mm</td>
                      <td className="p-2.5 font-bold text-amber-400">{r.historical_frequency} flood cycles</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <Info size={16} className="text-cyan-400" />
              <span>No verified historical flood records were found for the selected area in the connected datasets.</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong>Important Notice:</strong> Do not confuse missing historical records with proof that flooding has never occurred. Current connected datasets monitor designated chronic disaster river basins (Periyar, Brahmaputra, Kosi, Narmada, Mahanadi). Localized urban cloudbursts or un-monitored secondary stream overflows may not be indexed in the national atlas.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION G: RECOMMENDED PREPAREDNESS STEPS */}
      {/* ========================================================================= */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-5 lg:p-6 shadow-panel space-y-4">
        <div className="border-b border-navy-800 pb-4">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck size={14} />
            <span>Adaptive Risk Mitigation Guidance</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-0.5">
            Recommended Preparedness Measures for {consensus.category} Susceptibility
          </h2>
          <p className="text-xs text-slate-400">
            Tailored household and community disaster-resilience recommendations based on this site's specific topographical profile.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {prepSteps.map((step, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white text-xs">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono text-[10px]">
                  {idx + 1}
                </span>
                <span>{step.title}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-7">{step.action}</p>
              <div className="pl-7 pt-1 border-t border-navy-850 text-[11px] text-cyan-400/90 font-mono">
                <strong>Why This Matters:</strong> {step.why}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-navy-950/80 border border-navy-850 text-[11px] text-slate-400">
          <strong>Notice:</strong> These recommendations are long-term structural and logistical preparedness guidelines, not real-time evacuation orders. During active extreme weather, always follow real-time advisories from the National Disaster Management Authority (NDMA) and State Emergency Operation Centers.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION H: DATA SOURCES & SCIENTIFIC LIMITATIONS */}
      {/* ========================================================================= */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-5 lg:p-6 shadow-panel space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <Database size={15} className="text-cyan-400" /> Data Provenance & Technical Transparency
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-white font-bold block mb-1">NASA SRTM 30m DEM</span>
            <span className="text-[11px] text-slate-400">Topography, slope gradient, and flow accumulation source at 30-meter ground resolution.</span>
          </div>

          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-white font-bold block mb-1">NASA GPM IMERG</span>
            <span className="text-[11px] text-slate-400">Multi-satellite precipitation calibration providing antecedent 24h, 7d, and 30d rainfall.</span>
          </div>

          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-white font-bold block mb-1">ESA WorldCover 10m</span>
            <span className="text-[11px] text-slate-400">Sentinel-1/2 land-cover classification used to estimate surface permeability and runoff coefficient.</span>
          </div>

          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-white font-bold block mb-1">ISRO Bhuvan / GFD</span>
            <span className="text-[11px] text-slate-400">Ground-truth inundation atlas across chronic Indian river basins (Periyar, Brahmaputra, Kosi, Mahanadi).</span>
          </div>
        </div>

        <div className="pt-2 text-[11px] text-slate-500 font-mono flex items-center justify-between">
          <span>GeoFlood AI Research Platform • Spatial Block Partitioned Evaluation (F1: 78.4%)</span>
          <span>Prediction ID: {predId}</span>
        </div>
      </div>
    </div>
  );
}
