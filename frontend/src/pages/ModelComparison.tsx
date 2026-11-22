import React, { useEffect, useState } from 'react';
import {
  GitCompare,
  Cpu,
  Trophy,
  ShieldCheck,
  Zap,
  Clock,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { getModelsComparison } from '../services/api';

export const ModelComparison: React.FC = () => {
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
          <p className="text-sm text-slate-400">Loading 5-Model Benchmark...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.evaluation_metrics || {};
  const bestModel = data?.best_model || 'XGBoost';
  const splitInfo = data?.dataset_split || {};

  const modelsList = Object.keys(metrics);

  // Chart data
  const chartData = modelsList.map((m) => {
    const item = metrics[m];
    return {
      name: m.replace('Classifier', '').replace('Support Vector Machine', 'SVM'),
      Accuracy: Number((item.accuracy * 100).toFixed(1)),
      'Macro F1': Number((item.f1_macro * 100).toFixed(1)),
      'Severe F1': Number((item.f1_severe * 100).toFixed(1)),
      'ROC-AUC': item.roc_auc ? Number((item.roc_auc * 100).toFixed(1)) : 0,
    };
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-2">
          <GitCompare className="w-4 h-4" />
          Model Benchmark Suite
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Five Machine Learning Algorithms Comparison
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Comprehensive benchmark of the exact 5 algorithms trained on INDOFLOODS and evaluated on 
          unseen holdout gauge catchments using StratifiedGroupKFold validation.
        </p>
      </div>

      {/* Best Model Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-4 h-4" />
            Top Performing Algorithm
          </div>
          <h2 className="text-2xl font-black text-slate-900">{bestModel} Classifier</h2>
          <p className="text-xs text-slate-600 max-w-xl">
            {data?.selection_criterion ||
              'Selected based on highest holdout Macro F1-score and ROC-AUC for balanced flood severity discrimination without spatial leakage.'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Macro F1</div>
            <div className="text-base font-bold text-blue-600 font-mono mt-0.5">
              {(metrics[bestModel]?.f1_macro * 100).toFixed(1)}%
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Holdout Acc</div>
            <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
              {(metrics[bestModel]?.accuracy * 100).toFixed(1)}%
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">ROC-AUC</div>
            <div className="text-base font-bold text-teal-600 font-mono mt-0.5">
              {(metrics[bestModel]?.roc_auc * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Validation Scheme Callout */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-xs text-slate-700 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Group-Aware Split:</strong> Training on {splitInfo.train_events || 3771} events ({splitInfo.train_gauges || 125} gauges) · Holdout evaluation on {splitInfo.test_events || 777} events ({splitInfo.test_gauges || 30} gauges).
          </span>
        </div>
        <span className="font-mono text-blue-600 text-[11px]">0 Gauge Leakage</span>
      </div>

      {/* Interactive Metric Comparison Bar Chart */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Algorithm Performance Comparison (Unseen Catchment Gauges)
            </h2>
            <p className="text-xs text-slate-500">Comparing Accuracy, Macro F1, Severe Class F1, and ROC-AUC</p>
          </div>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Macro F1" fill="#0d9488" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Accuracy" fill="#0284c7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Severe F1" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ROC-AUC" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comprehensive Benchmark Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-600" />
          Detailed Benchmark Metrics Matrix
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Algorithm</th>
                <th className="py-3 px-4">Holdout Accuracy</th>
                <th className="py-3 px-4">Macro F1</th>
                <th className="py-3 px-4">Severe F1</th>
                <th className="py-3 px-4">ROC-AUC</th>
                <th className="py-3 px-4">CV Macro F1 (Mean ± Std)</th>
                <th className="py-3 px-4">Train Time</th>
                <th className="py-3 px-4">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {modelsList.map((m) => {
                const item = metrics[m];
                const isBest = m === bestModel;
                return (
                  <tr
                    key={m}
                    className={`hover:bg-slate-50 transition-colors ${
                      isBest ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      {m}
                      {isBest && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-blue-500/30">
                          Selected
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {(item.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {(item.f1_macro * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-800">
                      {(item.f1_severe * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-teal-600">
                      {item.roc_auc ? (item.roc_auc * 100).toFixed(1) + '%' : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {(item.cv_metrics?.cv_macro_f1_mean * 100).toFixed(1)}% ± {(item.cv_metrics?.cv_macro_f1_std * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {item.training_time_sec}s
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {item.prediction_latency_ms} ms
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generated Visual Artifacts (ROC Curves & Confusion Matrices) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            ROC Curves (All 5 Algorithms)
          </h3>
          <p className="text-xs text-slate-500">
            True Positive Rate vs False Positive Rate evaluated across the holdout gauge dataset.
          </p>
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
            <img
              src="/static/reports/roc_curves.png"
              alt="ROC Curves"
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-teal-600" />
            Confusion Matrices (Holdout Set)
          </h3>
          <p className="text-xs text-slate-500">
            Confusion matrices showing actual vs predicted Flood and Severe Flood counts.
          </p>
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
            <img
              src="/static/reports/confusion_matrices.png"
              alt="Confusion Matrices"
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
