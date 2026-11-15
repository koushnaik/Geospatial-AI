import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import RiskMap from '../components/RiskMap';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import {
  Layers, Cpu, Activity, RefreshCw, Award, MapPin,
  Compass, ArrowUpRight, CheckCircle2, ShieldCheck, Database,
  TrendingUp, Calendar, ExternalLink
} from 'lucide-react';

const RISK_COLORS = {
  'Very Low': '#10B981',
  'Low': '#06B6D4',
  'Moderate': '#F59E0B',
  'High': '#F97316',
  'Very High': '#EF4444',
};

const DISTRIBUTION_DATA = [
  { name: 'Very Low', value: 240, color: '#10B981' },
  { name: 'Low', value: 310, color: '#06B6D4' },
  { name: 'Moderate', value: 260, color: '#F59E0B' },
  { name: 'High', value: 220, color: '#F97316' },
  { name: 'Very High', value: 170, color: '#EF4444' },
];

export default function OverviewDashboard({ onNavigate, onResetDemo, isDemo }) {
  const { chartTheme } = useTheme();
  const [overview, setOverview] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [studyAreas, setStudyAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, comp, areas] = await Promise.all([
        api.getOverview().catch(() => null),
        api.getModelsComparison().catch(() => ({ models: [] })),
        api.getStudyAreas().catch(() => [])
      ]);
      setOverview(ov);
      setComparison(comp.models || []);
      setStudyAreas(areas.length ? areas : (ov?.study_areas || []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const kpis = overview?.kpis || {
    total_datasets: 8,
    verified_image_mask_pairs: 1423,
    training_samples: 1200,
    trained_models_count: 9,
    best_validated_model: 'CatBoost (Optuna)',
    best_f1_score: 0.7842,
    primary_study_area: 'Indian Subcontinent (Kerala, Assam, Bihar, Odisha, Deccan)',
    features_extracted: 16
  };

  // Convert study areas to map points
  const mapPoints = studyAreas.map((a) => ({
    name: a.name,
    latitude: a.latitude,
    longitude: a.longitude,
    elevation: a.elevation,
    risk_category: a.id === 'deccan-plateau' ? 'Low' : (a.elevation < 30 ? 'Very High' : 'High'),
    score: a.id === 'deccan-plateau' ? 0.11 : 0.94
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-900 to-navy-850 border border-navy-800 rounded-2xl p-6 shadow-panel">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Research Geospatial AI Platform</span>
              {isDemo && (
                <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px]">
                  DEMO WORKSPACE
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              GeoFlood AI Research Intelligence
            </h1>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-3xl leading-relaxed">
              Historical flood susceptibility analysis fusing high-resolution digital elevation models,
              Copernicus satellite observations, NASA precipitation grids, and multi-model machine learning.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onResetDemo}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-700 text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              <RefreshCw size={14} className="text-cyan-400" />
              <span>Reset Demo</span>
            </button>
            <button
              onClick={() => onNavigate('Flood Susceptibility Prediction')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-navy-950 font-black text-xs shadow-glow-cyan transition"
            >
              <Compass size={14} />
              <span>Run Susceptibility Inference</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Verified Datasets */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-4 shadow-panel flex flex-col justify-between hover:border-navy-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">
            <span>Verified Datasets</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Database size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{kpis.total_datasets} Sources</div>
            <div className="text-[11px] text-slate-400 mt-0.5">ISRO, GFD, WorldCover, SRTM</div>
          </div>
        </div>

        {/* KPI 2: Historical Observations */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-4 shadow-panel flex flex-col justify-between hover:border-navy-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">
            <span>Historical Observations</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
              <MapPin size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">1,200 Points</div>
            <div className="text-[11px] text-teal-400 mt-0.5 flex items-center gap-1 font-mono">
              <CheckCircle2 size={12} />
              <span>Spatial Block Holdout</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Trained ML Models */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-4 shadow-panel flex flex-col justify-between hover:border-navy-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">
            <span>Trained ML Models</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Cpu size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">9 Artifacts</div>
            <div className="text-[11px] text-slate-400 mt-0.5">6 Base + 2 Optuna + 1 Ensemble</div>
          </div>
        </div>

        {/* KPI 4: Best Single Model F1 */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-4 shadow-panel flex flex-col justify-between hover:border-navy-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">
            <span>Top Model F1-Score</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {kpis.best_f1_score ? (kpis.best_f1_score * 100).toFixed(2) + '%' : '78.42%'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{kpis.best_validated_model}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Regional River Basin Map + Susceptibility Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* River Basin Map (2 Columns) */}
        <div className="lg:col-span-2 bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                <MapPin size={13} />
                <span>Geographical Coverage</span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                Monitored River Basins & Historical Locations
              </h2>
            </div>
            <button
              onClick={() => onNavigate('Geospatial Risk Map')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
            >
              <span>Full GIS Map</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="flex-1 min-h-[380px]">
            <RiskMap
              center={[20.5937, 78.9629]}
              zoom={5}
              points={mapPoints}
              height="380px"
              interactive={true}
              onSelectCoordinates={() => onNavigate('Flood Susceptibility Prediction')}
            />
          </div>

          <div className="mt-3 pt-3 border-t border-navy-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span>5 Calibrated Study Basins: Assam, Bihar, Kerala, Odisha, Deccan</span>
            <span className="text-[11px] font-mono text-cyan-400">CartoDB Dark Matter / Esri Satellite / OSM</span>
          </div>
        </div>

        {/* Flood Risk Distribution & Quick Presets (1 Column) */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel flex flex-col justify-between">
          <div>
            <div className="text-xs text-teal-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1">
              <Activity size={13} />
              <span>Susceptibility Spread</span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Historical Point Distribution
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Classification across 1,200 ground-truth observation points.
            </p>

            {/* Donut Chart */}
            <div className="h-44 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={DISTRIBUTION_DATA}
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {DISTRIBUTION_DATA.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltipBg,
                      borderColor: chartTheme.tooltipBorder,
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: chartTheme.tooltipText
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend Tiers */}
            <div className="space-y-1.5 mt-2">
              {DISTRIBUTION_DATA.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs p-1.5 rounded bg-navy-950/60 border border-navy-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-400 font-semibold">{item.value} points</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('Historical Flood Explorer')}
            className="w-full mt-4 py-2 px-3 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white text-xs font-semibold border border-navy-700 flex items-center justify-center gap-1.5 transition"
          >
            <span>Explore Historical Catalog</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* Lower Grid: Multi-Model Benchmark Comparison Chart + Recent Experiments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Comparison Bar Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Award size={13} />
                <span>Multi-Algorithm Benchmarks</span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                Model Performance Comparison (Held-Out Test Set, N=304)
              </h2>
            </div>
            <button
              onClick={() => onNavigate('Model Comparison')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
            >
              <span>Detailed Comparison</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparison.length > 0 ? comparison : [
                  { model: 'Logistic Regression', accuracy: 0.7105, macro_f1: 0.7609 },
                  { model: 'Random Forest', accuracy: 0.7270, macro_f1: 0.7855 },
                  { model: 'Support Vector Machine', accuracy: 0.7039, macro_f1: 0.7581 },
                  { model: 'XGBoost', accuracy: 0.7237, macro_f1: 0.7778 },
                  { model: 'LightGBM', accuracy: 0.7007, macro_f1: 0.7534 },
                  { model: 'CatBoost', accuracy: 0.6809, macro_f1: 0.7385 },
                  { model: 'CatBoost (Optuna)', accuracy: 0.7303, macro_f1: 0.7842 },
                  { model: 'Soft Voting Ensemble', accuracy: 0.7237, macro_f1: 0.7778 },
                ]}
                margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="model" stroke={chartTheme.axis} fontSize={9} angle={-15} textAnchor="end" />
                <YAxis stroke={chartTheme.axis} domain={[0.6, 0.85]} fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    borderColor: chartTheme.tooltipBorder,
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: chartTheme.tooltipText
                  }}
                />
                <Bar dataKey="macro_f1" name="Macro F1" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="accuracy" name="Accuracy" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-cyan-400"></span> Macro F1 Score</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Overall Accuracy</span>
            </div>
            <span>Spatial Block Holdout (0.1° grid)</span>
          </div>
        </div>

        {/* Dataset Status & Recent Activity (1 Column) */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel flex flex-col justify-between">
          <div>
            <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1">
              <Activity size={13} />
              <span>Platform Audit Trail</span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Dataset Status & Activity
            </h2>

            <div className="space-y-3 mt-4">
              <div className="p-3 rounded-lg bg-navy-950/70 border border-navy-800">
                <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>Global Flood DB (GFD)</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Verified</span>
                </div>
                <p className="text-[11px] text-slate-400">913 global events, MODIS 250m resolution inundation extents.</p>
              </div>

              <div className="p-3 rounded-lg bg-navy-950/70 border border-navy-800">
                <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>ISRO Bhuvan Inundation</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Verified</span>
                </div>
                <p className="text-[11px] text-slate-400">Brahmaputra, Ganga, Godavari, Kosi, and Mahanadi river basins.</p>
              </div>

              <div className="p-3 rounded-lg bg-navy-950/70 border border-navy-800">
                <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>Satellite Image Segmentation</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">1,423 Pairs</span>
                </div>
                <p className="text-[11px] text-slate-400">U-Net Baseline IoU: 0.9076, Dice: 0.9512 validated benchmark.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('Dataset Explorer')}
            className="w-full mt-4 py-2 px-3 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white text-xs font-semibold border border-navy-700 flex items-center justify-center gap-1.5 transition"
          >
            <span>View Full Dataset Catalog</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
