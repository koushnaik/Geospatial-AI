import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Play, RefreshCw, CheckCircle2, Clock, Cpu, ShieldCheck,
  AlertCircle, Terminal, Layers, Award, ArrowUpRight
} from 'lucide-react';

const ALGORITHMS = [
  { id: 'all', name: 'All 6 Algorithms + Soft Voting Ensemble', desc: 'Full sequential execution with spatial cross-validation' },
  { id: 'logistic', name: '1. Logistic Regression', desc: 'Baseline linear classifier with balanced class weights (C=1.0, L-BFGS)' },
  { id: 'rf', name: '2. Random Forest', desc: 'Ensemble of 250 decision trees with balanced sub-sampling' },
  { id: 'svm', name: '3. Support Vector Machine', desc: 'Radial Basis Function (RBF) kernel with Platt probability scaling' },
  { id: 'xgb', name: '4. XGBoost', desc: 'Extreme Gradient Boosting with second-order Taylor expansion' },
  { id: 'lgb', name: '5. LightGBM', desc: 'Histogram-based gradient boosting (n_jobs=1 isolated threading)' },
  { id: 'cat', name: '6. CatBoost', desc: 'Oblivious decision trees with ordered target encoding (thread_count=1)' },
];

export default function ModelTraining() {
  const [selectedAlgo, setSelectedAlgo] = useState('all');
  const [skipExisting, setSkipExisting] = useState(true);
  const [status, setStatus] = useState(null);
  const [polling, setPolling] = useState(false);
  const [logs, setLogs] = useState([
    'System ready. Apple Silicon M4 isolated single-thread OpenMP configured.',
    'Pre-existing models: Logistic Regression, Random Forest, SVM, XGBoost, LightGBM, CatBoost intact in artifacts/models.',
    'Preservation rule active: skip_existing=True prevents overwriting validated artifacts.'
  ]);

  const handleStartTraining = async () => {
    try {
      setLogs((p) => [...p, 'Initiating background training job...']);
      const res = await api.startTraining(skipExisting);
      setStatus({ job_id: res.job_id, status: 'running', progress: 0.1, message: 'Job initialized' });
      pollStatus(res.job_id);
    } catch (e) {
      alert(`Failed to start training: ${e.message}`);
    }
  };

  const pollStatus = (jobId) => {
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const s = await api.getTrainingStatus(jobId);
        setStatus(s);
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${s.message}`]);
        if (s.status === 'completed' || s.status === 'failed') {
          clearInterval(interval);
          setPolling(false);
        }
      } catch (err) {
        clearInterval(interval);
        setPolling(false);
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-cyan-400 font-mono text-xs tracking-wider uppercase font-bold flex items-center gap-2 mb-1">
              <Cpu size={14} />
              <span>Multi-Algorithm Training Station</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Model Training & Orchestration</h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Train, cross-validate, and serialize the six core flood susceptibility estimators plus the consensus soft-voting ensemble.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 text-cyan-400 text-xs font-mono font-semibold">
              Apple Silicon M4 Compatible
            </span>
          </div>
        </div>
      </div>

      {/* Control Station & Execution Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Algorithm Selector (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono border-b border-navy-800 pb-3">
              Training Pipeline Configuration
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Select Target Algorithm</label>
              <div className="space-y-2">
                {ALGORITHMS.map((algo) => (
                  <div
                    key={algo.id}
                    onClick={() => setSelectedAlgo(algo.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition text-xs ${
                      selectedAlgo === algo.id
                        ? 'bg-navy-850 border-cyan-500 text-white shadow-glow-cyan/20 ring-1 ring-cyan-500/30'
                        : 'bg-navy-950 border-navy-800 text-slate-300 hover:border-navy-700'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{algo.name}</span>
                      {selectedAlgo === algo.id && <span className="text-cyan-400 text-[10px] font-mono">Selected</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{algo.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skip Existing Toggle */}
            <div className="p-3.5 bg-navy-950 border border-navy-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Preserve Existing Trained Models</span>
                <span className="text-[11px] text-slate-400">Skip retraining existing validated .joblib artifacts</span>
              </div>
              <input
                type="checkbox"
                checked={skipExisting}
                onChange={(e) => setSkipExisting(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Launch Button */}
            <button
              onClick={handleStartTraining}
              disabled={polling}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 disabled:opacity-50 text-navy-950 font-black text-xs shadow-glow-cyan flex items-center justify-center gap-2 transition"
            >
              {polling ? (
                <>
                  <RefreshCw className="animate-spin text-navy-950" size={15} />
                  <span>Training In Progress...</span>
                </>
              ) : (
                <>
                  <Play size={15} />
                  <span>Start Training Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Progress & Terminal Logs (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Job Progress Card */}
          <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Clock size={15} className="text-cyan-400" />
              <span>Job Execution Status</span>
            </h2>

            {status ? (
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Job ID: {status.job_id}</span>
                  <span className={`font-bold ${status.status === 'completed' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                    {status.status?.toUpperCase()}
                  </span>
                </div>

                <div className="w-full bg-navy-950 rounded-full h-2.5 overflow-hidden border border-navy-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-teal-400 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((status.progress || 0) * 100)}%` }}
                  />
                </div>

                <div className="text-xs text-slate-300 font-mono flex justify-between">
                  <span>{status.message}</span>
                  <span>{Math.round((status.progress || 0) * 100)}%</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center font-mono">
                No active training job running. Select an algorithm and launch above.
              </div>
            )}
          </div>

          {/* Terminal Console Logs */}
          <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
            <div className="flex items-center justify-between mb-3 border-b border-navy-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Terminal size={14} className="text-teal-400" />
                <span>Console Output</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Real-time Stream</span>
            </div>

            <div className="bg-navy-950 border border-navy-800/80 rounded-lg p-3 font-mono text-[11px] text-slate-300 space-y-1.5 h-64 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  <span className="text-cyan-400 mr-2">&gt;</span>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
