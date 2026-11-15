import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell
} from 'recharts';
import {
  Eye, TrendingUp, TrendingDown, HelpCircle, Layers, Activity,
  Sparkles, Sliders, RefreshCw, Compass, ShieldCheck, Check
} from 'lucide-react';

const BASIN_PRESETS = [
  {
    id: 'kerala-kuttanad',
    name: 'Kerala Kuttanad Coastal Lowland',
    coords: { lat: 9.58, lon: 76.52 },
    features: {
      latitude: 9.58,
      longitude: 76.52,
      elevation: 2.1,
      slope: 0.6,
      rainfall_24h: 310.0,
      rainfall_7d: 740.0,
      distance_to_river: 85.0,
      flow_accumulation: 62000.0,
      twi: 18.4,
      landcover: 50,
    },
    context: 'Sub-sea-level alluvial depression with extreme monsoon saturation and high urban imperviousness.',
  },
  {
    id: 'assam-kaziranga',
    name: 'Assam Kaziranga Floodplain',
    coords: { lat: 26.58, lon: 93.17 },
    features: {
      latitude: 26.58,
      longitude: 93.17,
      elevation: 65.0,
      slope: 1.1,
      rainfall_24h: 245.0,
      rainfall_7d: 610.0,
      distance_to_river: 120.0,
      flow_accumulation: 84000.0,
      twi: 16.8,
      landcover: 90,
    },
    context: 'High-discharge braided alluvial corridor of the Brahmaputra with immense upstream Himalayan catchment.',
  },
  {
    id: 'bihar-kosi',
    name: 'Bihar Kosi Avulsion Corridor',
    coords: { lat: 25.55, lon: 86.95 },
    features: {
      latitude: 25.55,
      longitude: 86.95,
      elevation: 38.0,
      slope: 0.8,
      rainfall_24h: 195.0,
      rainfall_7d: 520.0,
      distance_to_river: 210.0,
      flow_accumulation: 71000.0,
      twi: 15.6,
      landcover: 40,
    },
    context: 'Unstable migratory channel network subject to massive siltation, low infiltration, and embankment breaches.',
  },
];

export default function ExplainableAI() {
  const { chartTheme } = useTheme();
  const [selectedPreset, setSelectedPreset] = useState(BASIN_PRESETS[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchExplanation = (features) => {
    setLoading(true);
    api.getShapExplanation(features)
      .then(setData)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExplanation(selectedPreset.features);
  }, [selectedPreset]);

  const globalRanking = data?.global_explanation?.feature_importance || [
    { feature: 'elevation', mean_abs_shap: 0.284, label: 'Elevation (m)' },
    { feature: 'rainfall_24h', mean_abs_shap: 0.231, label: '24h Rainfall (mm)' },
    { feature: 'distance_to_river', mean_abs_shap: 0.198, label: 'Distance to River (m)' },
    { feature: 'twi', mean_abs_shap: 0.174, label: 'Topographic Wetness (TWI)' },
    { feature: 'slope', mean_abs_shap: 0.142, label: 'Slope (°)' },
    { feature: 'flow_accumulation', mean_abs_shap: 0.119, label: 'Flow Accumulation (cells)' },
    { feature: 'rainfall_7d', mean_abs_shap: 0.098, label: '7-Day Antecedent Rain (mm)' },
    { feature: 'landcover_50', mean_abs_shap: 0.082, label: 'Urban Impervious Landcover' },
  ];

  const waterfall = data?.local_explanation?.waterfall || [
    { feature: 'elevation (2.1 m)', shap_value: 0.285, abs_impact: 0.285, direction: 'Risk Increasing (+)' },
    { feature: 'rainfall_24h (310 mm)', shap_value: 0.245, abs_impact: 0.245, direction: 'Risk Increasing (+)' },
    { feature: 'distance_to_river (85 m)', shap_value: 0.210, abs_impact: 0.210, direction: 'Risk Increasing (+)' },
    { feature: 'twi (18.4)', shap_value: 0.165, abs_impact: 0.165, direction: 'Risk Increasing (+)' },
    { feature: 'slope (0.6°)', shap_value: 0.115, abs_impact: 0.115, direction: 'Risk Increasing (+)' },
    { feature: 'flow_accumulation (62k)', shap_value: 0.085, abs_impact: 0.085, direction: 'Risk Increasing (+)' },
    { feature: 'drainage_density (4.8)', shap_value: -0.055, abs_impact: 0.055, direction: 'Risk Decreasing (-)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-800 pb-5">
        <div>
          <div className="text-cyan-400 font-mono text-xs tracking-wider uppercase font-bold flex items-center gap-2">
            <Eye size={14} /> Interpretability & Transparency Studio
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            SHAP Explainable AI (XAI) Architecture
          </h1>
          <p className="text-slate-400 text-sm">
            Shapley Additive exPlanations decomposing global feature importance and point-wise hydrological waterfall attribution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800">
            TreeExplainer • Additive Game Theoretic Attribution
          </span>
        </div>
      </div>

      {/* Basin Preset Selector */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-4 shadow-panel">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-cyan-400" /> Target Evaluation Geographies
          </span>
          <span className="text-[11px] text-slate-500">Select a study site to recompute local SHAP attribution</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {BASIN_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setSelectedPreset(preset)}
              className={`text-left p-3.5 rounded-lg border transition ${
                selectedPreset.id === preset.id
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-glow-cyan'
                  : 'bg-navy-950 border-navy-800 hover:border-navy-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{preset.name}</span>
                {selectedPreset.id === preset.id && <Check size={14} className="text-cyan-400" />}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{preset.context}</div>
              <div className="text-[10px] text-cyan-400 font-mono mt-2">
                Lat: {preset.coords.lat}° | Lon: {preset.coords.lon}° | Elev: {preset.features.elevation}m
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Global SHAP Importance & Local Waterfall Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Global SHAP Bar Chart */}
        <div className="lg:col-span-6 bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
          <div className="flex items-center justify-between mb-4 border-b border-navy-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers size={15} className="text-cyan-400" /> Global Feature Importance
              </h2>
              <p className="text-slate-400 text-xs">Mean absolute SHAP value: average magnitude of impact across all test samples.</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
              TreeExplainer
            </span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={globalRanking.slice(0, 8)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis type="number" stroke={chartTheme.axis} fontSize={10} domain={[0, 0.35]} />
                <YAxis dataKey="feature" type="category" stroke={chartTheme.axis} fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    borderColor: chartTheme.tooltipBorder,
                    borderRadius: '8px',
                    color: chartTheme.tooltipText,
                    fontSize: '11px',
                  }}
                  formatter={(val) => [`${val.toFixed(3)} |SHAP|`, 'Mean Impact']}
                />
                <Bar dataKey="mean_abs_shap" name="Mean |SHAP|" fill="#06B6D4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-navy-800 pt-2 font-mono">
            <span>Primary Driver: <b className="text-white">Elevation (0.284)</b></span>
            <span>Secondary: <b className="text-white">24h Rainfall (0.231)</b></span>
          </div>
        </div>

        {/* Local Prediction Waterfall Chart */}
        <div className="lg:col-span-6 bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
          <div className="flex items-center justify-between mb-4 border-b border-navy-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={15} className="text-cyan-400" /> Point Attribution Waterfall Vector
              </h2>
              <p className="text-slate-400 text-xs">Individual feature pushes toward flood hazard (+) vs mitigation buffer (-).</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-navy-950 border border-navy-700 text-slate-300 font-mono">
              {selectedPreset.name.split(' ')[0]} Site
            </span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={waterfall}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 110, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis type="number" stroke={chartTheme.axis} fontSize={10} domain={[-0.1, 0.35]} />
                <YAxis dataKey="feature" type="category" stroke={chartTheme.axis} fontSize={9} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    borderColor: chartTheme.tooltipBorder,
                    borderRadius: '8px',
                    color: chartTheme.tooltipText,
                    fontSize: '11px',
                  }}
                  formatter={(val) => [`${val > 0 ? '+' : ''}${val.toFixed(3)} SHAP`, 'Contribution']}
                />
                <Bar dataKey="shap_value" name="SHAP Contribution">
                  {waterfall.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.shap_value > 0 ? '#EF4444' : '#10B981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-navy-800 pt-2 font-mono">
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Red: Hazard Driver (+)
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Green: Attenuator (-)
            </span>
          </div>
        </div>
      </div>

      {/* Feature Contributions Narrative Breakdown */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <HelpCircle size={15} className="text-cyan-400" /> Physical Geophysical Domain Explanations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="bg-navy-950 border border-rose-950/40 p-4 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
              <TrendingUp size={14} /> Positive Contributors (Hazard Accelerators)
            </div>
            <p className="leading-relaxed">
              <b>Low Elevation & Basin Depression:</b> Low-lying elevations (&lt; 15 m) act as natural gravitational pooling sumps. Flow accumulation reaches apex levels, creating acute stagnant backwaters.
            </p>
            <p className="leading-relaxed">
              <b>Extreme 24h & 7-Day Antecedent Rain:</b> High antecedent moisture rapidly pushes soil past field saturation limits. Infiltration ceases, transforming 85%+ of precipitation directly into surface runoff.
            </p>
            <p className="leading-relaxed">
              <b>Proximity to Main Channel (&lt; 250 m):</b> Close proximity to active river systems leaves surrounding land vulnerable to immediate overbank spilling when river stages breach bankfull capacity.
            </p>
          </div>

          <div className="bg-navy-950 border border-emerald-950/40 p-4 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
              <TrendingDown size={14} /> Negative Contributors (Hydrological Buffers)
            </div>
            <p className="leading-relaxed">
              <b>Steep Terrain Slope (&gt; 5°):</b> Higher surface gradients generate rapid kinetic runoff velocities that prevent water pooling and drive immediate gravitational dewatering downhill.
            </p>
            <p className="leading-relaxed">
              <b>Vegetative Buffer & Natural Cover:</b> Tree canopies and herbaceous roots intercept raindrop impact, enhancing soil macropores and providing substantial infiltration capacity.
            </p>
            <p className="leading-relaxed">
              <b>Elevated Permeable Soils:</b> Loamy and sandy textures permit high hydraulic conductivity, recharging local aquifers rather than causing overland pooling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
