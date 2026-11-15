import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Filter, CheckCircle2, AlertTriangle, ArrowRight, Play,
  RefreshCw, FileText, Sparkles, Layers, Sliders, Check
} from 'lucide-react';

export default function DataPreprocessing() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);

  const handleRunPreprocessing = async () => {
    setLoading(true);
    try {
      const res = await api.runPreprocessing();
      setReport(res.cleaning_report);
      setPreview(res.sample_preview || []);
    } catch (e) {
      alert(`Preprocessing failed: ${e.response?.data?.detail || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-cyan-400 font-mono text-xs tracking-wider uppercase font-bold flex items-center gap-2 mb-1">
              <Filter size={14} />
              <span>Data Quality & Transformation Pipeline</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Data Preprocessing & Feature Engineering</h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Automated spatial deduplication, median imputation, IQR outlier detection, and Topographic Wetness Index (TWI) calculation.
            </p>
          </div>
          <button
            onClick={handleRunPreprocessing}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 disabled:opacity-50 text-navy-950 font-black text-xs shadow-glow-cyan transition shrink-0"
          >
            {loading ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
            <span>Execute Preprocessing Pipeline</span>
          </button>
        </div>
      </div>

      {/* Preprocessing Architecture Steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-navy-900 border border-navy-800 p-4 rounded-xl shadow-panel space-y-1.5">
          <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">Step 1</div>
          <div className="text-sm font-bold text-white">Spatial Deduplication</div>
          <p className="text-xs text-slate-400 leading-relaxed">Identifies and removes duplicate coordinates with conflicting flood observations.</p>
        </div>
        <div className="bg-navy-900 border border-navy-800 p-4 rounded-xl shadow-panel space-y-1.5">
          <div className="text-[10px] font-mono uppercase text-teal-400 font-bold">Step 2</div>
          <div className="text-sm font-bold text-white">Median Imputation</div>
          <p className="text-xs text-slate-400 leading-relaxed">Imputes missing numeric terrain and precipitation values using training fold medians.</p>
        </div>
        <div className="bg-navy-900 border border-navy-800 p-4 rounded-xl shadow-panel space-y-1.5">
          <div className="text-[10px] font-mono uppercase text-blue-400 font-bold">Step 3</div>
          <div className="text-sm font-bold text-white">Feature Engineering</div>
          <p className="text-xs text-slate-400 leading-relaxed">Computes TWI via ln(flow_accumulation / tan(slope)) and extracts WorldCover indicators.</p>
        </div>
        <div className="bg-navy-900 border border-navy-800 p-4 rounded-xl shadow-panel space-y-1.5">
          <div className="text-[10px] font-mono uppercase text-purple-400 font-bold">Step 4</div>
          <div className="text-sm font-bold text-white">Spatial Block Holdout</div>
          <p className="text-xs text-slate-400 leading-relaxed">Applies GroupShuffleSplit on 0.1° grid bins to completely prevent spatial autocorrelation leakage.</p>
        </div>
      </div>

      {/* Preprocessing Execution Report */}
      {report && (
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel space-y-4">
          <div className="flex items-center justify-between border-b border-navy-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Data Cleansing Audit Summary</span>
            </h2>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              Pipeline Status: Clean & Ready
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-navy-950 p-3 rounded-lg border border-navy-800">
              <span className="text-[10px] uppercase text-slate-500 font-mono block">Original Observations</span>
              <span className="text-lg font-bold text-white font-mono">{report.initial_rows}</span>
            </div>
            <div className="bg-navy-950 p-3 rounded-lg border border-navy-800">
              <span className="text-[10px] uppercase text-slate-500 font-mono block">Duplicate Coordinates</span>
              <span className="text-lg font-bold text-amber-400 font-mono">{report.duplicates_removed}</span>
            </div>
            <div className="bg-navy-950 p-3 rounded-lg border border-navy-800">
              <span className="text-[10px] uppercase text-slate-500 font-mono block">Imputed Values</span>
              <span className="text-lg font-bold text-cyan-400 font-mono">{report.missing_values_imputed}</span>
            </div>
            <div className="bg-navy-950 p-3 rounded-lg border border-navy-800">
              <span className="text-[10px] uppercase text-slate-500 font-mono block">Final Cleansed Rows</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{report.final_rows}</span>
            </div>
          </div>
        </div>
      )}

      {/* Processed Data Preview Table */}
      {preview.length > 0 && (
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
          <div className="flex items-center justify-between mb-3 border-b border-navy-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Cleaned Feature Vector Sample Preview
            </h2>
            <span className="text-xs text-slate-400 font-mono">Top 5 Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-navy-950 text-slate-400 border-b border-navy-800 text-[10px] uppercase">
                <tr>
                  <th className="p-2.5">Latitude</th>
                  <th className="p-2.5">Longitude</th>
                  <th className="p-2.5">Elevation</th>
                  <th className="p-2.5">Slope</th>
                  <th className="p-2.5">Rain 24h</th>
                  <th className="p-2.5">River Dist</th>
                  <th className="p-2.5">TWI</th>
                  <th className="p-2.5">Flood Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800 text-slate-200">
                {preview.map((row, idx) => (
                  <tr key={idx} className="hover:bg-navy-850/60">
                    <td className="p-2.5 text-cyan-300">{Number(row.latitude).toFixed(3)}°</td>
                    <td className="p-2.5 text-cyan-300">{Number(row.longitude).toFixed(3)}°</td>
                    <td className="p-2.5">{row.elevation}m</td>
                    <td className="p-2.5">{row.slope}°</td>
                    <td className="p-2.5 text-teal-400">{row.rainfall_24h}mm</td>
                    <td className="p-2.5">{row.distance_to_river}m</td>
                    <td className="p-2.5 text-amber-300">{Number(row.twi).toFixed(2)}</td>
                    <td className="p-2.5 font-bold">
                      {row.flood_label === 1 ? (
                        <span className="text-red-400">1 (Flooded)</span>
                      ) : (
                        <span className="text-emerald-400">0 (Non-flood)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
