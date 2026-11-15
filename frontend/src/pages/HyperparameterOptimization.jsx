import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  Sliders, Play, CheckCircle2, AlertCircle, ArrowUpRight,
  TrendingUp, Award, RefreshCw, Cpu, Layers, BarChart2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from 'recharts';

const SEARCH_SPACES = {
  'CatBoost': [
    { param: 'iterations', range: '100 – 350', type: 'Integer (step 50)', desc: 'Number of gradient boosted decision trees' },
    { param: 'depth', range: '4 – 8', type: 'Integer', desc: 'Tree depth limit for symmetric oblivious trees' },
    { param: 'learning_rate', range: '0.01 – 0.20', type: 'Log Uniform Float', desc: 'Shrinkage rate applied to tree leaf weights' },
    { param: 'l2_leaf_reg', range: '1.0 – 10.0', type: 'Float', desc: 'L2 regularization coefficient for leaf value estimation' },
  ],
  'LightGBM': [
    { param: 'n_estimators', range: '100 – 350', type: 'Integer (step 50)', desc: 'Total boosting iterations' },
    { param: 'max_depth', range: '3 – 10', type: 'Integer', desc: 'Maximum tree depth (-1 for unlimited)' },
    { param: 'num_leaves', range: '15 – 63', type: 'Integer', desc: 'Maximum number of leaves in one tree' },
    { param: 'learning_rate', range: '0.01 – 0.20', type: 'Log Uniform Float', desc: 'Step size shrinkage rate' },
  ],
  'Random Forest': [
    { param: 'n_estimators', range: '100 – 400', type: 'Integer (step 50)', desc: 'Number of ensemble bagging trees' },
    { param: 'max_depth', range: '5 – 20', type: 'Integer', desc: 'Maximum tree depth' },
    { param: 'min_samples_split', range: '2 – 10', type: 'Integer', desc: 'Minimum sample count required to split an internal node' },
    { param: 'min_samples_leaf', range: '1 – 5', type: 'Integer', desc: 'Minimum sample count required at each leaf' },
  ],
  'XGBoost': [
    { param: 'n_estimators', range: '100 – 350', type: 'Integer (step 50)', desc: 'Number of gradient boosted trees' },
    { param: 'max_depth', range: '3 – 10', type: 'Integer', desc: 'Maximum tree depth' },
    { param: 'learning_rate', range: '0.01 – 0.20', type: 'Log Uniform Float', desc: 'Boosting step size' },
    { param: 'subsample', range: '0.60 – 1.00', type: 'Float', desc: 'Subsample ratio of training instances' },
  ],
  'Support Vector Machine': [
    { param: 'C', range: '0.10 – 10.0', type: 'Log Uniform Float', desc: 'Regularization parameter' },
    { param: 'gamma', range: "['scale', 'auto']", type: 'Categorical', desc: 'Kernel coefficient for RBF kernel' },
  ],
  'Logistic Regression': [
    { param: 'C', range: '0.01 – 10.0', type: 'Log Uniform Float', desc: 'Inverse of regularization strength' },
    { param: 'max_iter', range: '500 – 2500', type: 'Integer (step 250)', desc: 'Maximum iterations for L-BFGS solver' },
  ]
};

const PRE_TUNED_MODELS = [
  {
    name: 'CatBoost (Optuna Optimized)',
    baseName: 'CatBoost',
    bestParams: { depth: 8, iterations: 250, learning_rate: 0.1247, l2_leaf_reg: 9.5431 },
    baselineF1: 0.7385,
    optimizedF1: 0.7842,
    improvement: '+4.57%',
    accuracy: '73.03%',
    rocAuc: '0.7576',
    savedPath: 'artifacts/models/catboost_optimized.joblib'
  },
  {
    name: 'LightGBM (Optuna Optimized)',
    baseName: 'LightGBM',
    bestParams: { max_depth: 7, n_estimators: 200, num_leaves: 22, learning_rate: 0.0224 },
    baselineF1: 0.7534,
    optimizedF1: 0.7582,
    improvement: '+0.48%',
    accuracy: '71.05%',
    rocAuc: '0.7636',
    savedPath: 'artifacts/models/lightgbm_optimized.joblib'
  }
];

export default function HyperparameterOptimization() {
  const { chartTheme } = useTheme();
  const [selectedModel, setSelectedModel] = useState('CatBoost');
  const [trials, setTrials] = useState(10);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRunOptimization = async () => {
    setRunning(true);
    setError(null);
    try {
      const data = await api.runOptimization(selectedModel, trials);
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Optimization run failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider font-mono mb-1">
              <Sliders size={14} />
              <span>Bayesian Hyperparameter Search</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Hyperparameter Optimization</h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Fine-tune flood susceptibility classification algorithms using Optuna's Tree-structured Parzen
              Estimator (TPE) algorithm evaluated against spatial block cross-validation holdouts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 text-teal-400 text-xs font-mono font-semibold flex items-center gap-1.5">
              <Award size={13} />
              Optuna v5.0.0 TPE Sampler
            </span>
          </div>
        </div>
      </div>

      {/* Pre-Tuned Models Showcase */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
        <div className="flex items-center justify-between mb-4 border-b border-navy-800 pb-3">
          <div className="flex items-center gap-2">
            <Award className="text-amber-400" size={16} />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Saved Optuna-Tuned Artifacts
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Validated on 0.1° Spatial Block Holdout</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRE_TUNED_MODELS.map((m) => (
            <div key={m.name} className="bg-navy-950 border border-navy-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">{m.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {m.improvement} F1 Gain
                </span>
              </div>
              <p className="text-slate-500 text-xs font-mono mb-3">Saved: {m.savedPath}</p>
              
              <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                <div className="bg-navy-900 p-2 rounded border border-navy-800">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono">Baseline F1</span>
                  <span className="text-xs font-mono text-slate-300 font-bold">{m.baselineF1}</span>
                </div>
                <div className="bg-navy-900 p-2 rounded border border-navy-800">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono">Tuned F1</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">{m.optimizedF1}</span>
                </div>
                <div className="bg-navy-900 p-2 rounded border border-navy-800">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono">Accuracy</span>
                  <span className="text-xs font-mono text-cyan-400 font-bold">{m.accuracy}</span>
                </div>
                <div className="bg-navy-900 p-2 rounded border border-navy-800">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono">ROC-AUC</span>
                  <span className="text-xs font-mono text-purple-400 font-bold">{m.rocAuc}</span>
                </div>
              </div>

              <div className="bg-navy-900/60 p-2.5 rounded-lg border border-navy-800">
                <span className="text-[10px] text-slate-400 block font-semibold mb-1 font-mono">Optimal Parameters:</span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                  {Object.entries(m.bestParams).map(([k, v]) => (
                    <span key={k} className="px-2 py-0.5 rounded bg-navy-800 text-cyan-300 border border-navy-700">
                      {k}: <strong className="text-white">{v}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Optimization Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Controls */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel space-y-4">
          <div className="flex items-center gap-2 border-b border-navy-800 pb-3">
            <Cpu className="text-cyan-400" size={16} />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Live Study Configurator</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Target ML Algorithm</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              {Object.keys(SEARCH_SPACES).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-300">Optuna Trial Count</label>
              <span className="text-xs font-mono text-cyan-400 font-bold">{trials} Trials</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="5"
              value={trials}
              onChange={(e) => setTrials(parseInt(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>5 trials</span>
              <span>15 trials</span>
              <span>25 trials</span>
            </div>
          </div>

          <div className="p-3 bg-navy-950 border border-navy-800 rounded-lg text-slate-400 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-white font-semibold font-mono text-[11px]">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Apple Silicon Safe Execution</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Enforces restricted threading (<code className="text-cyan-300 font-mono">n_jobs=1</code>) during trial evaluations to avoid OpenMP deadlocks on Apple Silicon M4.
            </p>
          </div>

          <button
            onClick={handleRunOptimization}
            disabled={running}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 disabled:opacity-50 text-navy-950 font-black text-xs shadow-glow-cyan flex items-center justify-center gap-2 transition"
          >
            {running ? (
              <>
                <RefreshCw size={14} className="animate-spin text-navy-950" />
                <span>Running Optuna Trials...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Launch Bayesian Optimization</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-red-300 text-xs flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Columns: Active Search Space Table */}
        <div className="lg:col-span-2 bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
          <div className="flex items-center justify-between border-b border-navy-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="text-teal-400" size={16} />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Search Space: <span className="text-cyan-400">{selectedModel}</span>
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Sampled via Optuna TPE</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-navy-950 text-slate-400 border-b border-navy-800 text-[10px] uppercase">
                <tr>
                  <th className="p-2.5">Hyperparameter</th>
                  <th className="p-2.5">Distribution Range</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Role in Regularization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800 text-slate-200">
                {(SEARCH_SPACES[selectedModel] || []).map((row) => (
                  <tr key={row.param} className="hover:bg-navy-850/60">
                    <td className="p-2.5 text-cyan-300 font-bold">{row.param}</td>
                    <td className="p-2.5 text-amber-300">{row.range}</td>
                    <td className="p-2.5 text-slate-400">{row.type}</td>
                    <td className="p-2.5 text-slate-300">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Live Study Results */}
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Best Hyperparameters */}
            <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel md:col-span-1">
              <div className="flex items-center gap-2 mb-3 border-b border-navy-800 pb-2">
                <Award className="text-emerald-400" size={16} />
                <h3 className="text-sm font-bold text-white font-mono">Optimal Parameters Found</h3>
              </div>
              <div className="space-y-2">
                {Object.entries(result.best_params || {}).map(([param, val]) => (
                  <div key={param} className="flex justify-between items-center p-2 rounded bg-navy-950 border border-navy-800 text-xs font-mono">
                    <span className="text-slate-400">{param}</span>
                    <span className="text-emerald-400 font-bold">{String(val)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs flex items-center justify-between font-mono">
                <span>Validation F1 Improvement:</span>
                <span className="font-bold text-sm">
                  {result.improvement >= 0 ? `+${(result.improvement * 100).toFixed(2)}%` : `${(result.improvement * 100).toFixed(2)}%`}
                </span>
              </div>
            </div>

            {/* Trial Progression Chart */}
            <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel md:col-span-2">
              <div className="flex items-center justify-between mb-3 border-b border-navy-800 pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-cyan-400" size={16} />
                  <h3 className="text-sm font-bold text-white font-mono">Optuna Trial Progression (Objective Macro F1)</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">{result.trials?.length || 0} Total Trials</span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.trials || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="trial" stroke={chartTheme.axis} fontSize={10} name="Trial" />
                    <YAxis stroke={chartTheme.axis} domain={['auto', 'auto']} fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartTheme.tooltipBg,
                        borderColor: chartTheme.tooltipBorder,
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: chartTheme.tooltipText
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#06B6D4" strokeWidth={2} dot={{ r: 3 }} name="Macro F1" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Before vs After Comparison Table */}
          <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
            <h3 className="text-sm font-bold text-white mb-3 font-mono uppercase tracking-wider">Before vs. After Optimization Metrics</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-navy-950 text-slate-400 border-b border-navy-800 text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Variant</th>
                    <th className="p-3">Macro F1</th>
                    <th className="p-3">Accuracy</th>
                    <th className="p-3">Precision</th>
                    <th className="p-3">Recall</th>
                    <th className="p-3">ROC-AUC</th>
                    <th className="p-3">Brier Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800 text-slate-200">
                  <tr className="hover:bg-navy-850/60">
                    <td className="p-3 font-semibold text-slate-400">{result.model} (Baseline)</td>
                    <td className="p-3 font-bold text-slate-300">{result.baseline_metrics?.macro_f1?.toFixed(4)}</td>
                    <td className="p-3">{(result.baseline_metrics?.accuracy * 100)?.toFixed(2)}%</td>
                    <td className="p-3">{(result.baseline_metrics?.precision_macro * 100)?.toFixed(2)}%</td>
                    <td className="p-3">{(result.baseline_metrics?.recall_macro * 100)?.toFixed(2)}%</td>
                    <td className="p-3 text-purple-300">{result.baseline_metrics?.roc_auc?.toFixed(4) || '—'}</td>
                    <td className="p-3 text-amber-300">{result.baseline_metrics?.brier_score?.toFixed(4) || '—'}</td>
                  </tr>
                  <tr className="hover:bg-navy-850/60 bg-cyan-950/20">
                    <td className="p-3 font-bold text-cyan-300 flex items-center gap-1.5">
                      {result.model} (Optuna Optimized)
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        Saved
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-400">{result.optimized_metrics?.macro_f1?.toFixed(4)}</td>
                    <td className="p-3">{(result.optimized_metrics?.accuracy * 100)?.toFixed(2)}%</td>
                    <td className="p-3">{(result.optimized_metrics?.precision_macro * 100)?.toFixed(2)}%</td>
                    <td className="p-3">{(result.optimized_metrics?.recall_macro * 100)?.toFixed(2)}%</td>
                    <td className="p-3 text-purple-300">{result.optimized_metrics?.roc_auc?.toFixed(4) || '—'}</td>
                    <td className="p-3 text-amber-300">{result.optimized_metrics?.brier_score?.toFixed(4) || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
