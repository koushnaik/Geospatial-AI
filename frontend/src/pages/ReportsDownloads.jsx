import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Download, FileText, CheckCircle2, ShieldCheck, RefreshCw, ExternalLink,
  Code2, Sparkles, BookOpen, Layers
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

  const handleGenerate = async (report) => {
    setDownloading(report.id);
    setReportUrl(null);
    try {
      const res = await api.generateReport(report.title);
      if (res.status === 'success') {
        const fullUrl = `http://127.0.0.1:8000${res.download_url}`;
        setReportUrl(fullUrl);
        window.open(fullUrl, '_blank');
      }
    } catch (e) {
      alert(`Report generation error: ${e.response?.data?.detail || e.message}`);
    } finally {
      setDownloading(null);
    }
  };

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
            Generate formal technical PDF reports and export quantitative benchmark metrics in CSV and JSON formats.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800">
            ReportLab PDF Engine • Live Compilation
          </span>
        </div>
      </div>

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
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
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
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-navy-800 disabled:text-slate-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
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
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
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
            href="http://127.0.0.1:8000/api/models/comparison"
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
            href="http://127.0.0.1:8000/api/datasets"
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
            href="http://127.0.0.1:8000/api/segmentation/benchmarks"
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
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen size={16} className="text-cyan-400" /> Interactive OpenAPI / Swagger Documentation
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">FastAPI Auto-Generated Docs</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <a
            href="http://127.0.0.1:8000/docs"
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
            href="http://127.0.0.1:8000/redoc"
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
