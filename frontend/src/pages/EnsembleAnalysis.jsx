import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Layers, ShieldCheck, CheckCircle2, TrendingUp, Cpu, Sliders,
  HelpCircle, Sparkles, BarChart3, AlertTriangle, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from 'recharts';

const ENSEMBLE_BENCHMARKS = [
  {
    strategy: 'Majority Hard Voting',
    accuracy: 0.7204,
    macro_f1: 0.7012,
    flood_recall: 0.7422,
    roc_auc: 0.7510,
    brier_score: 0.1820,
    desc: 'Binary mode decision over 6 discrete predictions: y_hat = mode(C_1, ..., C_6). Ignores probability nuance.',
  },
  {
    strategy: 'Soft Mean Probability (Selected)',
    accuracy: 0.7237,
    macro_f1: 0.7063,
    flood_recall: 0.7577,
    roc_auc: 0.7708,
    brier_score: 0.1684,
    desc: 'Unweighted arithmetic average of calibrated class probabilities: P_bar = (1/6) sum(P_i). Smoothest calibration.',
  },
  {
    strategy: 'Validation-Weighted Averaging',
    accuracy: 0.7270,
    macro_f1: 0.7095,
    flood_recall: 0.7628,
    roc_auc: 0.7745,
    brier_score: 0.1652,
    desc: 'Probability averaging weighted by validation F1 scores: w_i = F1_i / sum(F1). Gives higher weight to gradient boosters.',
  },
  {
    strategy: 'Top Standalone Model (XGBoost)',
    accuracy: 0.7237,
    macro_f1: 0.7063,
    flood_recall: 0.7577,
    roc_auc: 0.7542,
    brier_score: 0.1745,
    desc: 'Best standalone tree estimator. Vulnerable to isolated spatial feature overfitting on extreme edge cases.',
  },
];

const DEFAULT_SIMULATOR_MODELS = [
  { id: 'lr', name: 'Logistic Regression', prob: 0.62, weight: 0.641 },
  { id: 'rf', name: 'Random Forest', prob: 0.78, weight: 0.701 },
  { id: 'svm', name: 'Support Vector Machine', prob: 0.69, weight: 0.672 },
  { id: 'xgb', name: 'XGBoost', prob: 0.81, weight: 0.706 },
  { id: 'lgb', name: 'LightGBM', prob: 0.74, weight: 0.689 },
  { id: 'cat', name: 'CatBoost', prob: 0.84, weight: 0.712 },
];

export default function EnsembleAnalysis() {
  const { chartTheme } = useTheme();
  const [modelProbs, setModelProbs] = useState(
    DEFAULT_SIMULATOR_MODELS.reduce((acc, m) => ({ ...acc, [m.id]: m.prob }), {})
  );

  const handleProbChange = (id, val) => {
    setModelProbs((prev) => ({ ...prev, [id]: parseFloat(val) }));
  };

  // Compute live consensus metrics
  const probsList = Object.values(modelProbs);
  const softMean = probsList.reduce((a, b) => a + b, 0) / probsList.length;
  
  // Weighted mean
  const totalWeight = DEFAULT_SIMULATOR_MODELS.reduce((sum, m) => sum + m.weight, 0);
  const weightedMean = DEFAULT_SIMULATOR_MODELS.reduce(
    (sum, m) => sum + modelProbs[m.id] * m.weight,
    0
  ) / totalWeight;

  // Majority votes (threshold 0.5)
  const votes = probsList.filter((p) => p >= 0.5).length;
  const hardVoteDecision = votes >= 3 ? 'Flood (1)' : 'Non-Flood (0)';

  // Variance & standard deviation
  const variance =
    probsList.reduce((acc, p) => acc + Math.pow(p - softMean, 2), 0) / probsList.length;
  const stdDev = Math.sqrt(variance);

  // Model agreement %
  const agreement = Math.max(votes, 6 - votes) / 6 * 100;

  // Risk categorization
  const getRiskTier = (score) => {
    if (score < 0.2) return { tier: 'Very Low', color: '#10B981', bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
    if (score < 0.4) return { tier: 'Low', color: '#06B6D4', bg: 'bg-cyan-500/20', text: 'text-cyan-400' };
    if (score < 0.6) return { tier: 'Moderate', color: '#F59E0B', bg: 'bg-amber-500/20', text: 'text-amber-400' };
    if (score < 0.8) return { tier: 'High', color: '#F97316', bg: 'bg-orange-500/20', text: 'text-orange-400' };
    return { tier: 'Very High', color: '#EF4444', bg: 'bg-rose-500/20', text: 'text-rose-400' };
  };

  const softRisk = getRiskTier(softMean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-800 pb-5">
        <div>
          <div className="text-cyan-400 font-mono text-xs tracking-wider uppercase font-bold flex items-center gap-2">
            <Layers size={14} /> Multi-Model Synthesis Laboratory
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Ensemble Learning & Consensus Aggregation Analysis
          </h1>
          <p className="text-slate-400 text-sm">
            Empirical comparative analysis of voting, averaging, and calibration strategies across 6 heterogeneous ML architectures.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800">
            6 Estimators • Soft Voting Ensemble
          </span>
        </div>
      </div>

      {/* Strategies Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 space-y-3 shadow-panel">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Method 1</span>
            <span className="text-[10px] font-mono text-slate-500">Discrete Binary</span>
          </div>
          <h3 className="text-sm font-bold text-white">Majority (Hard) Voting</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Assigns the class label supported by &gt; 50% of estimators: ŷ = mode(C_1, ..., C_6). Suppresses isolated algorithmic hallucinations but discards borderline probability margins.
          </p>
          <div className="pt-2 border-t border-navy-800 text-xs font-mono text-cyan-300 flex items-center justify-between">
            <span>Accuracy: 72.04%</span>
            <span>Macro F1: 0.7012</span>
          </div>
        </div>

        <div className="bg-navy-900 border-2 border-cyan-500/60 rounded-xl p-5 space-y-3 shadow-panel shadow-glow-cyan">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-cyan-400">Method 2 (Production Standard)</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
              Active In Engine
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">Soft Voting (Mean Probability)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Computes the arithmetic average of calibrated class posteriors: P̄ = (1/6) ∑ P(Y=1|X, M_i). Smooths individual decision boundaries and maximizes ROC-AUC (0.7708).
          </p>
          <div className="pt-2 border-t border-navy-800 text-xs font-mono text-cyan-300 flex items-center justify-between">
            <span>Accuracy: 72.37%</span>
            <span>Macro F1: 0.7063</span>
            <span>ROC-AUC: 0.7708</span>
          </div>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 space-y-3 shadow-panel">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Method 3</span>
            <span className="text-[10px] font-mono text-slate-500">Validation-Weighted</span>
          </div>
          <h3 className="text-sm font-bold text-white">F1-Weighted Probability Averaging</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Weights each model's probability by its held-out validation F1: w_i = F1_i / ∑ F1. Gives higher voting weight to CatBoost (0.712) and XGBoost (0.706) over linear baselines.
          </p>
          <div className="pt-2 border-t border-navy-800 text-xs font-mono text-cyan-300 flex items-center justify-between">
            <span>Accuracy: 72.70%</span>
            <span>Macro F1: 0.7095</span>
            <span>ROC-AUC: 0.7745</span>
          </div>
        </div>
      </div>

      {/* Interactive Consensus Simulator & Variance Inspector */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders size={16} className="text-cyan-400" /> Interactive Ensemble Consensus Simulator
            </h2>
            <p className="text-slate-400 text-xs">
              Adjust individual model predicted probabilities below to inspect real-time consensus, variance, and confidence.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            6 Estimators Active
          </span>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEFAULT_SIMULATOR_MODELS.map((m) => (
            <div key={m.id} className="p-3 bg-navy-950 rounded-lg border border-navy-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">{m.name}</span>
                <span className="font-mono text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-[11px]">
                  {modelProbs[m.id].toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={modelProbs[m.id]}
                onChange={(e) => handleProbChange(m.id, e.target.value)}
                className="w-full accent-cyan-500 h-1.5 bg-navy-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0.00 (Dry)</span>
                <span>Val F1: {m.weight}</span>
                <span>1.00 (Flood)</span>
              </div>
            </div>
          ))}
        </div>

        {/* Real-time Consensus Output Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="bg-navy-950 border border-navy-800 rounded-lg p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Soft Voting Mean</span>
            <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">{(softMean * 100).toFixed(1)}%</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Weighted: {(weightedMean * 100).toFixed(1)}%</div>
          </div>

          <div className="bg-navy-950 border border-navy-800 rounded-lg p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Risk Tier</span>
            <div className={`text-xl font-bold mt-1 ${softRisk.text}`}>
              {softRisk.tier}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">5-Tier Standard</div>
          </div>

          <div className="bg-navy-950 border border-navy-800 rounded-lg p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Model Agreement</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{agreement.toFixed(0)}%</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{votes} of 6 predict flood</div>
          </div>

          <div className="bg-navy-950 border border-navy-800 rounded-lg p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Disagreement / Std Dev</span>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">σ = {stdDev.toFixed(3)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {stdDev < 0.1 ? 'High Consensus' : stdDev < 0.2 ? 'Moderate Variance' : 'High Divergence'}
            </div>
          </div>
        </div>
      </div>

      {/* Quantitative Benchmark Comparison Chart */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
        <div className="flex items-center justify-between mb-3 border-b border-navy-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={16} className="text-cyan-400" /> Empirical Benchmark Comparison
            </h2>
            <p className="text-slate-400 text-xs">Evaluated across the 304 held-out spatial block validation points.</p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Held-Out Test Set (N=304)</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ENSEMBLE_BENCHMARKS} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="strategy" stroke={chartTheme.axis} fontSize={10} angle={-5} textAnchor="end" />
              <YAxis stroke={chartTheme.axis} domain={[0.68, 0.80]} fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartTheme.tooltipBg,
                  borderColor: chartTheme.tooltipBorder,
                  borderRadius: '8px',
                  color: chartTheme.tooltipText,
                  fontSize: '11px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="accuracy" name="Accuracy" fill="#22D3EE" radius={[4, 4, 0, 0]} />
              <Bar dataKey="macro_f1" name="Macro F1" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="flood_recall" name="Flood Recall" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="roc_auc" name="ROC-AUC" fill="#818CF8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
