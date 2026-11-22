import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Layers,
  MapPin,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Cpu,
  BarChart3,
  Calendar,
  FileCheck2,
  CheckCircle2,
  Waves
} from 'lucide-react';
import { getDashboardOverview } from '../services/api';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardOverview()
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Loading Environmental Intelligence Platform...</p>
        </div>
      </div>
    );
  }

  const bestMetrics = data?.best_algorithm_metrics || {};

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner - Enterprise White Theme */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-white border border-blue-100/80 p-8 sm:p-10 shadow-xs">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200 text-blue-700 text-xs font-semibold mb-4 shadow-2xs">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            Operational Research Release · INDOFLOODS & Copernicus ERA5-Land
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            GeoFlood AI Intelligence Platform
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Machine learning platform for classifying watershed hydrological risk into 
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mx-1">No Flood</span>, 
            <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mx-1">Flood</span>, and 
            <span className="text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 mx-1">Severe Flood</span> 
            using antecedent rainfall accumulation and 11 catchment geomorphological attributes. Validated on 155 Indian CWC gauging stations with strict spatial leakage prevention.
          </p>
          <div className="mt-7 flex flex-wrap gap-3.5">
            <Link
              to="/predict"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-xs shadow-sm hover:bg-blue-700 transition-all"
            >
              Start Severity Prediction
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/models"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-700 border border-slate-200/90 font-medium text-xs hover:bg-slate-50 shadow-2xs transition-all"
            >
              <Cpu className="w-4 h-4 text-blue-600" />
              Compare 5 Algorithms
            </Link>
            <Link
              to="/map"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-700 border border-slate-200/90 font-medium text-xs hover:bg-slate-50 shadow-2xs transition-all"
            >
              <MapPin className="w-4 h-4 text-teal-600" />
              Interactive Gauge Map
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Observations</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            7,338
          </div>
          <p className="text-xs text-slate-500 mt-1">4,548 Floods + 2,790 Non-event baselines</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gauge Stations</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {data?.total_gauges || '155'}
          </div>
          <p className="text-xs text-slate-500 mt-1">Across {data?.total_states || 21} Indian states</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Distribution</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            3 Classes
          </div>
          <p className="text-xs text-slate-500 mt-1">38.0% No Flood · 39.8% Flood · 22.2% Severe</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Best ML Model</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700 font-mono tracking-tight">
            Random Forest
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Acc: 74.3% · ROC-AUC: 0.849 · Brier: 0.371
          </p>
        </div>
      </div>

      {/* Grid: 5 Algorithms Overview & Scientific Integrity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 5 Algorithms */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">5 Machine Learning Algorithms</h2>
              <p className="text-xs text-slate-500">Evaluated on 1,092 unseen holdout gauge observations (31 basins)</p>
            </div>
            <Link
              to="/models"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Full benchmark <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              { name: 'Random Forest', type: 'Ensemble Bagging (250 Trees)', rank: 'Top Performer', acc: '74.3%', f1: '62.1%', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
              { name: 'Support Vector Machine', type: 'RBF Non-linear Kernel', rank: 'High Recall', acc: '72.8%', f1: '64.4%', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
              { name: 'XGBoost Classifier', type: 'Gradient Boosted Trees', rank: 'Sample Weighted', acc: '70.6%', f1: '60.3%', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
              { name: 'Logistic Regression', type: 'Regularized Multinomial (L2)', rank: 'Linear Baseline', acc: '66.3%', f1: '55.9%', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
              { name: 'Decision Tree', type: 'Pruned CART Tree (depth=7)', rank: 'Interpretable Tree', acc: '65.3%', f1: '57.7%', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
            ].map((algo) => (
              <div
                key={algo.name}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between hover:bg-slate-100/60 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900">{algo.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${algo.badge}`}>
                      {algo.rank}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{algo.type}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-slate-900">{algo.acc}</div>
                  <div className="text-[10px] text-slate-400">Acc</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Notice */}
          <div className="mt-5 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-800">Zero Spatial Data Leakage:</strong> Training and holdout partitions are split strictly by river gauge catchment (<code className="text-blue-700 font-mono text-[11px]">GaugeID</code>). Models are evaluated only on basins never seen during training.
            </p>
          </div>
        </div>

        {/* Right Column: Research & Data Provenance */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Dataset & Data Integrity</h2>
            <p className="text-xs text-slate-500">Official government & reanalysis sources</p>
          </div>

          <div className="space-y-3.5 text-xs text-slate-600">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="font-semibold text-slate-900 mb-0.5">INDOFLOODS Benchmark (IIT Delhi)</div>
              <p className="text-slate-500 text-[11px]">4,548 flood events with official CWC Warning and Danger levels across 155 river stations.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="font-semibold text-slate-900 mb-0.5">Copernicus ERA5-Land Reanalysis</div>
              <p className="text-slate-500 text-[11px]">2,790 empirical non-flood observations sampled with a ±15-day flood event buffer.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="font-semibold text-slate-900 mb-0.5">HydroSHEDS & HWSD Characteristics</div>
              <p className="text-slate-500 text-[11px]">11 static catchment morphology parameters + soil, land cover, and climate zones.</p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/datasets"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition"
            >
              Explore Full Dataset <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
