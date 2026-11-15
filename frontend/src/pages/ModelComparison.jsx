import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { Award, CheckCircle2, TrendingUp, Layers, Clock, ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function ModelComparison() {
  const { chartTheme } = useTheme();
  const [suite, setSuite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('macro_f1');

  useEffect(() => {
    api.getModelsComparison()
      .then((data) => {
        setSuite(data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const models = suite?.models || [];
  const rocCurves = suite?.roc_curves || {};
  const calibrationCurves = suite?.calibration_curves || {};
  const confusionMatrices = suite?.confusion_matrices || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-cyan-400 font-mono text-xs tracking-wider uppercase font-bold flex items-center gap-2 mb-1">
              <Award size={14} />
              <span>Empirical Validation Laboratory</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Multi-Model Performance Comparison</h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              All algorithms evaluated on the identical held-out spatial block validation partition (304 test samples across Indian river basins) with zero spatial leakage.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 text-emerald-400 text-xs font-mono font-semibold">
              Held-Out Test Set: N = 304
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Metrics Table */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
        <div className="flex items-center justify-between mb-4 border-b border-navy-800 pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Comparative Evaluation Matrix (Untouched Holdout)
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">Flood: 97 | Non-Flood: 207</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] border-b border-navy-800">
              <tr>
                <th className="p-3">Algorithm</th>
                <th className="p-3">Accuracy</th>
                <th className="p-3">Precision</th>
                <th className="p-3">Recall</th>
                <th className="p-3">Macro F1</th>
                <th className="p-3">ROC-AUC</th>
                <th className="p-3">Brier Score</th>
                <th className="p-3">ECE (Error)</th>
                <th className="p-3">Split Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 text-slate-200">
              {models.map((m) => (
                <tr key={m.model} className="hover:bg-navy-850/60">
                  <td className="p-3 font-bold text-white flex items-center gap-1.5">
                    {m.model}
                    {m.model.includes('Optimized') && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Optuna
                      </span>
                    )}
                    {m.model.includes('Ensemble') && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Ensemble
                      </span>
                    )}
                  </td>
                  <td className="p-3">{(m.accuracy * 100).toFixed(2)}%</td>
                  <td className="p-3">{(m.precision * 100).toFixed(2)}%</td>
                  <td className="p-3">{(m.recall * 100).toFixed(2)}%</td>
                  <td className="p-3 font-bold text-cyan-400">{m.macro_f1?.toFixed(4)}</td>
                  <td className="p-3 text-purple-400">{m.roc_auc?.toFixed(4)}</td>
                  <td className="p-3 text-amber-400">{m.brier_score != null ? m.brier_score.toFixed(4) : '—'}</td>
                  <td className="p-3 text-emerald-400">{m.ece != null ? m.ece.toFixed(4) : '—'}</td>
                  <td className="p-3 text-slate-400 text-[10px]">{m.split_method || 'spatial block holdout'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Bar Chart */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
          <div className="flex items-center justify-between mb-4 border-b border-navy-800 pb-3">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Comparative Metric Scores</h3>
            <div className="flex gap-1.5">
              {['macro_f1', 'accuracy', 'recall', 'roc_auc'].map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition ${
                    selectedMetric === metric
                      ? 'bg-cyan-600 text-navy-950 font-black shadow-glow-cyan'
                      : 'bg-navy-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {metric.replace('macro_', '')}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={models} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="model" stroke={chartTheme.axis} fontSize={9} angle={-20} textAnchor="end" />
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
                <Bar dataKey={selectedMetric} fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrices Grid */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
          <div className="flex items-center justify-between mb-4 border-b border-navy-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Confusion Matrix Breakdown</h3>
              <p className="text-slate-400 text-xs mt-0.5">True Negatives, False Positives, False Negatives, True Positives.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(confusionMatrices).slice(0, 6).map(([name, cm]) => (
              <div key={name} className="bg-navy-950 border border-navy-800 rounded-lg p-2.5 text-center">
                <div className="font-bold text-[11px] text-white truncate mb-2">{name}</div>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                  <div className="bg-navy-900 p-1.5 rounded text-emerald-400 border border-navy-800">
                    <span className="block text-[8px] text-slate-500 uppercase">TN</span>
                    {cm.tn}
                  </div>
                  <div className="bg-navy-900 p-1.5 rounded text-red-400 border border-navy-800">
                    <span className="block text-[8px] text-slate-500 uppercase">FP</span>
                    {cm.fp}
                  </div>
                  <div className="bg-navy-900 p-1.5 rounded text-amber-400 border border-navy-800">
                    <span className="block text-[8px] text-slate-500 uppercase">FN</span>
                    {cm.fn}
                  </div>
                  <div className="bg-navy-900 p-1.5 rounded text-cyan-400 font-bold border border-navy-800">
                    <span className="block text-[8px] text-slate-500 uppercase">TP</span>
                    {cm.tp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
