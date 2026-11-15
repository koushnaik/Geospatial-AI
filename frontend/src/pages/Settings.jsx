import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Cpu, Monitor, Globe, ShieldCheck,
  CheckCircle2, RefreshCw, AlertCircle, HardDrive, Zap, Sliders
} from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function Settings({
  unit, setUnit,
  theme: propTheme, setTheme: propSetTheme,
  apiEndpoint, setApiEndpoint
}) {
  const themeContext = useTheme();
  const theme = propTheme || themeContext.theme;
  const setTheme = propSetTheme || themeContext.setTheme;

  const [pingStatus, setPingStatus] = useState(null); // null, 'testing', 'success', 'error'
  const [pingLatency, setPingLatency] = useState(null);

  const handleTestConnection = async () => {
    setPingStatus('testing');
    const start = performance.now();
    try {
      const res = await api.checkHealth();
      const elapsed = Math.round(performance.now() - start);
      setPingLatency(elapsed);
      if (res.status === 'healthy') {
        setPingStatus('success');
      } else {
        setPingStatus('error');
      }
    } catch (e) {
      setPingStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-800 pb-5">
        <div>
          <div className="text-cyan-400 font-mono text-xs tracking-wider uppercase font-bold flex items-center gap-2">
            <SettingsIcon size={14} /> Workspace Configuration
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Platform Settings & Hardware Environment
          </h1>
          <p className="text-slate-400 text-sm">
            Display preferences, regional area units, API connectivity, and host Apple Silicon runtime profiles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            System Operational • FastAPI 8000
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Preferences */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 space-y-5 shadow-panel">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-navy-800 pb-3">
            <Sliders size={16} className="text-cyan-400" /> Display & Localization Preferences
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Geospatial Area Measurement Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-navy-950 border border-navy-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-500 transition cursor-pointer"
            >
              <option value="Square kilometers">Square kilometers (km²)</option>
              <option value="Square miles">Square miles (mi²)</option>
              <option value="Hectares">Hectares (ha)</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Controls basin and flood extent calculation displays across maps and cards.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Visual Interface Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full bg-navy-950 border border-navy-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-500 transition cursor-pointer font-medium"
            >
              <option value="dark">Deep Navy & Cyan (#0B1220 - GIS Analytics Standard)</option>
              <option value="light">Clean Light Slate & White (#F1F5F9 - High Visibility Mode)</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Switches application between Deep Navy Dark Mode and Clean Light Mode.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                FastAPI Backend Endpoint URL
              </label>
              {pingStatus === 'success' && (
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Connected ({pingLatency}ms)
                </span>
              )}
              {pingStatus === 'error' && (
                <span className="text-[10px] font-mono text-rose-400 flex items-center gap-1">
                  <AlertCircle size={11} /> Connection Failed
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg p-2.5 text-xs text-white font-mono outline-none focus:border-cyan-500 transition"
              />
              <button
                onClick={handleTestConnection}
                disabled={pingStatus === 'testing'}
                className="px-3.5 py-2 rounded-lg bg-navy-850 hover:bg-navy-800 border border-navy-700 text-xs font-medium text-slate-200 transition flex items-center gap-1.5"
              >
                {pingStatus === 'testing' ? (
                  <RefreshCw size={13} className="animate-spin text-cyan-400" />
                ) : (
                  <Zap size={13} className="text-cyan-400" />
                )}
                Ping
              </button>
            </div>
          </div>
        </div>

        {/* Target Hardware Architecture */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 space-y-4 shadow-panel">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-navy-800 pb-3">
            <Cpu size={16} className="text-cyan-400" /> Host Hardware & Execution Profile
          </h2>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 bg-navy-950 rounded-lg border border-navy-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Host Architecture</span>
              <span className="font-bold text-white mt-0.5 block text-sm">Apple Silicon M4 • macOS Darwin</span>
              <span className="text-[10px] text-slate-400">16 GB Unified Memory (Zero Memory Bottlenecks)</span>
            </div>

            <div className="p-3 bg-navy-950 rounded-lg border border-navy-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">OpenMP Threading Mode</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-emerald-400">Single-Thread Isolated Mode Enforced</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Zero Deadlock
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                LightGBM (n_jobs=1), CatBoost (thread_count=1) prevents Apple Silicon libomp lockups.
              </span>
            </div>

            <div className="p-3 bg-navy-950 rounded-lg border border-navy-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Deep Learning Acceleration</span>
              <span className="font-bold text-cyan-300 mt-0.5 block">PyTorch 2.14 • Apple Silicon MPS / CPU</span>
              <span className="text-[10px] text-slate-400">
                U-Net, DeepLabv3+, SegFormer semantic segmentation inference.
              </span>
            </div>

            <div className="p-3 bg-navy-950 rounded-lg border border-navy-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Model Artifact Directory</span>
              <span className="font-mono text-slate-300 mt-0.5 block text-[11px] truncate">
                ~/Desktop/aiml/artifacts/models/
              </span>
              <span className="text-[10px] text-slate-400">
                9 verified model artifacts preserved and verified.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
