import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import InfoTooltip from '../components/InfoTooltip';
import {
  Download, FileText, CheckCircle2, ShieldCheck, RefreshCw, ExternalLink,
  Code2, Sparkles, BookOpen, Layers, Printer, Eye, MapPin, Activity,
  Award, AlertTriangle, Calendar
} from 'lucide-react';

const REPORT_TYPES = [
  {
    id: 'full',
    title: 'Complete Project Technical Report (PDF)',
    pages: '18 Pages',
    desc: 'Full academic documentation with system architecture, six-algorithm metrics, Optuna hyperparameter tuning, and dataset provenance.',
    sections: ['Executive Summary', 'Geospatial Data Pipeline', 'Model Benchmarking', 'Explainability (SHAP)', 'Deep Learning Vision'],
  },
  {
    id: 'comparison',
    title: 'Model Comparison & Evaluation Report (PDF)',
    pages: '12 Pages',
    desc: 'Empirical comparison of all 6 algorithms plus soft voting ensemble, complete with ROC-AUC, PR curves, and confusion matrices.',
    sections: ['Algorithm Architecture', 'Validation Metrics Matrix', 'Calibration & Brier Scores', 'Optuna TPE Tuning Progression'],
  },
  {
    id: 'dataset',
    title: 'Geospatial Dataset Audit Report (PDF)',
    pages: '10 Pages',
    desc: 'Full catalog documentation of ISRO Bhuvan, Global Flood DB, ESA WorldCover, NASA SRTM, ERA5-Land, and Sen1Floods11.',
    sections: ['Data Provenance', 'Spatial Block Partitioning', 'Class Balance Analysis', '1,423 Vision Pair Verification'],
  },
  {
    id: 'shap',
    title: 'Explainable AI & Feature Importance Report (PDF)',
    pages: '8 Pages',
    desc: 'TreeExplainer SHAP rankings, mean absolute impacts, local waterfall vectors, and geophysical domain justifications.',
    sections: ['Global Feature Rankings', 'Local Case Studies (Kerala, Assam)', 'Hydrodynamic Rationales', 'Policy Recommendations'],
  },
];

export default function ReportsDownloads() {
  const [downloading, setDownloading] = useState(null);
  const [reportUrl, setReportUrl] = useState(null);
  const [activeReport, setActiveReport] = useState(null);

  useEffect(() => {
    // Load latest prediction from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('geoflood_latest_prediction');
      if (saved) {
        try {
          setActiveReport(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('geoflood-api-endpoint');
      if (saved && saved.trim()) return saved.trim().replace(/\/+$/, '');
    }
    return import.meta.env.VITE_GEOFLOOD_API_BASE_URL || 'http://127.0.0.1:8000';
  };

  const handleGenerate = async (report) => {
    setDownloading(report.id);
    setReportUrl(null);
    try {
      const res = await api.generateReport(report.title);
      if (res.status === 'success') {
        const fullUrl = `${getApiBaseUrl()}${res.download_url}`;
        setReportUrl(fullUrl);
        window.open(fullUrl, '_blank');
      }
    } catch (e) {
      alert(`Report generation error: ${e.response?.data?.detail || e.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const consensus = activeReport?.result?.consensus || activeReport?.result?.ensemble;
  const inputs = activeReport?.inputs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-800 pb-5">
        <div>
          <div className="text-cyan-400 font-mono text-xs tracking-wider uppercase font-bold flex items-center gap-2">
            <Download size={14} /> Academic Documentation & Exports
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Reports & Research Downloads
          </h1>
          <p className="text-slate-400 text-sm">
            Generate formal technical PDF reports, preview dynamic site evaluations, and export quantitative benchmark metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800">
            ReportLab PDF Engine • Live Compilation
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DYNAMIC IN-APP REPORT VIEWER FOR CURRENT ACTIVE PREDICTION */}
      {/* ========================================================================= */}
      {activeReport && consensus && (
        <div className="bg-navy-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-5 print:bg-white print:text-black print:border-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-800 pb-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-cyan-400">
                <FileText size={15} />
                <span>DYNAMIC SITE SUSCEPTIBILITY DOSSIER</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px]">
                  ACTIVE IN-APP PREVIEW
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">
                {activeReport.locationName || 'Evaluated Geographic Site'}
              </h2>
              <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                <Calendar size={12} />
                <span>Generated: {new Date(activeReport.timestamp).toLocaleString()}</span>
                <span>•</span>
                <span>Coordinates: {Number(inputs?.latitude).toFixed(4)}°N, {Number(inputs?.longitude).toFixed(4)}°E</span>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-750 border border-navy-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Printer size={14} className="text-cyan-400" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          {/* Dossier Executive Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-navy-950 p-4 rounded-xl border border-navy-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                Risk Classification
              </span>
              <div className="text-2xl font-black" style={{ color: consensus.hex || '#06B6D4' }}>
                {consensus.category}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                Score: {(consensus.score * 100).toFixed(1)}%
              </div>
            </div>

            <div className="bg-navy-950 p-4 rounded-xl border border-navy-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                Model Consensus
              </span>
              <div className="text-2xl font-black text-cyan-400 font-mono">
                {consensus.model_agreement_percentage}%
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                Agreement Across 9 Models
              </div>
            </div>

            <div className="bg-navy-950 p-4 rounded-xl border border-navy-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                Elevation & Slope
              </span>
              <div className="text-2xl font-black text-white font-mono">
                {inputs?.elevation}m
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                Slope: {inputs?.slope}°
              </div>
            </div>

            <div className="bg-navy-950 p-4 rounded-xl border border-navy-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                24h Precipitation
              </span>
              <div className="text-2xl font-black text-teal-400 font-mono">
                {inputs?.rainfall_24h} mm
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                30d: {inputs?.rainfall_30d} mm
              </div>
            </div>
          </div>

          {/* Environmental Parameter Audit Table */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
              Hydrological & Terrain Factor Matrix
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-navy-950 border border-navy-800">
                <span className="text-slate-500 block text-[10px]">River Distance</span>
                <span className="text-white font-bold">{inputs?.distance_to_river} m</span>
              </div>
              <div className="p-2.5 rounded bg-navy-950 border border-navy-800">
                <span className="text-slate-500 block text-[10px]">Drainage Density</span>
                <span className="text-white font-bold">{inputs?.drainage_density} km/km²</span>
              </div>
              <div className="p-2.5 rounded bg-navy-950 border border-navy-800">
                <span className="text-slate-500 block text-[10px]">Flow Accumulation</span>
                <span className="text-white font-bold">{inputs?.flow_accumulation}</span>
              </div>
              <div className="p-2.5 rounded bg-navy-950 border border-navy-800">
                <span className="text-slate-500 block text-[10px]">TWI Index</span>
                <span className="text-cyan-300 font-bold">{inputs?.twi}</span>
              </div>
              <div className="p-2.5 rounded bg-navy-950 border border-navy-800">
                <span className="text-slate-500 block text-[10px]">WorldCover Class</span>
                <span className="text-white font-bold">{inputs?.landcover}</span>
              </div>
              <div className="p-2.5 rounded bg-navy-950 border border-navy-800">
                <span className="text-slate-500 block text-[10px]">Flood Frequency</span>
                <span className="text-white font-bold">{inputs?.flood_frequency} events</span>
              </div>
            </div>
          </div>

          {/* Model Breakdown Matrix */}
          {activeReport.result?.model_predictions && (
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
                Simultaneous Model Predictions
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs font-mono">
                {Object.entries(activeReport.result.model_predictions).map(([algo, m]) => (
                  <div key={algo} className="p-2 rounded bg-navy-950 border border-navy-800 flex items-center justify-between">
                    <span className="text-slate-300 truncate max-w-[120px]">{algo}</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: `${m.hex}22`,
                        color: m.hex
                      }}
                    >
                      {m.category} ({(m.susceptibility_score * 100).toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scientific Context */}
          <div className="pt-3 border-t border-navy-800 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck size={15} className="text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Scientific Notice:</strong> This susceptibility score represents long-term terrain hazard propensity derived from geospatial data fusion and machine learning. It is intended for spatial planning and research, not real-time evacuation alerts.
            </span>
          </div>
        </div>
      )}

      {/* Reports Generator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_TYPES.map((rep) => (
          <div
            key={rep.id}
            className="bg-navy-900 border border-navy-800 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-navy-700 transition shadow-panel"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-cyan-400">
                  <FileText size={18} />
                  <h3 className="font-bold text-white text-sm">{rep.title}</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-navy-950 border border-navy-800">
                  {rep.pages}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">{rep.desc}</p>

              <div className="mt-3 pt-3 border-t border-navy-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5 font-mono">
                  Included Sections
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {rep.sections.map((sec, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] bg-navy-950 text-slate-300 border border-navy-800 font-mono"
                    >
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-navy-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">Format: PDF Document</span>
              <button
                onClick={() => handleGenerate(rep)}
                disabled={downloading === rep.id}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-navy-800 disabled:text-slate-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer"
              >
                {downloading === rep.id ? (
                  <>
                    <RefreshCw className="animate-spin" size={13} />
                    <span>Compiling PDF...</span>
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    <span>Generate & Download</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Direct Data Downloads Grid */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 space-y-4 shadow-panel">
        <div className="flex items-center justify-between border-b border-navy-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <Code2 size={16} className="text-cyan-400" /> Raw Benchmark Data & Evaluation Artifacts
            </h3>
            <p className="text-slate-400 text-xs">Direct machine-readable endpoints for academic verification and independent audits.</p>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
            REST API v1.0
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={`${getApiBaseUrl()}/api/models/comparison`}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-lg bg-navy-950 border border-navy-800 hover:border-cyan-600/50 text-xs text-slate-200 flex items-center justify-between transition group"
          >
            <div>
              <div className="font-bold text-white group-hover:text-cyan-300 transition">Model Metrics Matrix</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">JSON • 9 Models Benchmark</div>
            </div>
            <ExternalLink size={14} className="text-slate-500 group-hover:text-cyan-400 transition" />
          </a>

          <a
            href={`${getApiBaseUrl()}/api/datasets`}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-lg bg-navy-950 border border-navy-800 hover:border-cyan-600/50 text-xs text-slate-200 flex items-center justify-between transition group"
          >
            <div>
              <div className="font-bold text-white group-hover:text-cyan-300 transition">Dataset Catalog & Audit</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">JSON • 8 Datasets + Provenance</div>
            </div>
            <ExternalLink size={14} className="text-slate-500 group-hover:text-cyan-400 transition" />
          </a>

          <a
            href={`${getApiBaseUrl()}/api/segmentation/benchmarks`}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-lg bg-navy-950 border border-navy-800 hover:border-cyan-600/50 text-xs text-slate-200 flex items-center justify-between transition group"
          >
            <div>
              <div className="font-bold text-white group-hover:text-cyan-300 transition">Vision Benchmarks</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">JSON • U-Net, DeepLab, SegFormer</div>
            </div>
            <ExternalLink size={14} className="text-slate-500 group-hover:text-cyan-400 transition" />
          </a>
        </div>
      </div>

      {/* Interactive Documentation Links */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
        <div className="flex items-center justify-between mb-3 border-b border-navy-800 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
            <BookOpen size={16} className="text-cyan-400" /> Interactive OpenAPI / Swagger Documentation
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">FastAPI Auto-Generated Docs</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <a
            href={`${getApiBaseUrl()}/docs`}
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-navy-950 rounded-lg border border-navy-800 hover:border-navy-700 flex items-center justify-between text-slate-300 transition"
          >
            <div>
              <div className="font-bold text-white">Swagger UI Playground</div>
              <div className="text-[11px] text-slate-400">Interactive live query tester at /docs</div>
            </div>
            <ExternalLink size={14} className="text-cyan-400" />
          </a>
          <a
            href={`${getApiBaseUrl()}/redoc`}
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-navy-950 rounded-lg border border-navy-800 hover:border-navy-700 flex items-center justify-between text-slate-300 transition"
          >
            <div>
              <div className="font-bold text-white">Redoc API Specification</div>
              <div className="text-[11px] text-slate-400">Detailed endpoint schemas at /redoc</div>
            </div>
            <ExternalLink size={14} className="text-cyan-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
