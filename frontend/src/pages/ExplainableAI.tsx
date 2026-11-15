import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  HelpCircle,
  TrendingUp,
  Layers,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { getModelsComparison } from '../services/api';

export const ExplainableAI: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModelsComparison()
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">Loading Explainable AI Module...</p>
        </div>
      </div>
    );
  }

  const globalShap = data?.global_shap_importance || [];
  const chartData = globalShap.slice(0, 10).map((item: any) => ({
    feature: item.feature,
    importance: item.importance,
  }));

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-2">
          <BrainCircuit className="w-4 h-4" />
          Model Interpretability
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Explainable AI (XAI) & SHAP Analysis
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          SHapley Additive exPlanations (SHAP) grounded in cooperative game theory to quantify 
          how each rainfall and catchment attribute drives Severe Flood classifications.
        </p>
      </div>

      {/* Global SHAP Importance Chart */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Global SHAP Feature Importance (Top 10 Drivers)
          </h2>
          <p className="text-xs text-slate-500">
            Mean absolute SHAP value across holdout validation events (XGBoost TreeExplainer)
          </p>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis dataKey="feature" type="category" stroke="#64748b" tick={{ fontSize: 11 }} width={120} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
              />
              <Bar dataKey="importance" name="Mean |SHAP Value|" fill="#0d9488" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scientific Explanations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            01 · Antecedent Rainfall (T1d–T10d)
          </div>
          <h3 className="text-sm font-bold text-slate-900">Precipitation Dynamics</h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            Short-term accumulation (T1d, T2d) provides rapid peak surge contribution, while extended antecedent rainfall (T7d, T10d) saturates the catchment soil, dramatically lowering the infiltration capacity.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
          <div className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            02 · Catchment Relief & Slope
          </div>
          <h3 className="text-sm font-bold text-slate-900">Topographic Gradient</h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            Catchment Relief reflects the potential energy and hydraulic gradient of the drainage basin. High relief produces high-velocity surface runoff with shorter time-to-peak hydrographs.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            03 · Drainage Density & Soil
          </div>
          <h3 className="text-sm font-bold text-slate-900">Substrate Infiltration</h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            High drainage density channels rainwater into master streams rapidly. Soil classifications like Vertisols swell when wet, preventing deep percolation and accelerating flash runoff into severe flood conditions.
          </p>
        </div>
      </div>

      {/* Methodology Reference Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-4">
        <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
          <h3 className="font-bold text-slate-900 text-sm">SHAP Theoretical Guarantee</h3>
          <p>
            SHAP values satisfy efficiency, symmetry, dummy, and additivity axioms. For any individual event prediction,
            the sum of all feature SHAP attributions exactly equals the difference between the model's expected base output
            and its final prediction score:
          </p>
          <code className="block p-2 rounded bg-slate-50 border border-slate-200 text-blue-600 font-mono text-[11px] mt-2">
            f(x) = E[f(x)] + Σ Φ_i (SHAP attributions)
          </code>
        </div>
      </div>
    </div>
  );
};
