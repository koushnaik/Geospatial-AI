import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Calendar,
  MapPin,
  Cpu,
  ArrowRight,
  Database,
  FileCheck
} from 'lucide-react';
import { getRecentPredictions, getPdfDownloadUrl } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentPredictions()
      .then((data) => setPredictions(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-2">
          <FileText className="w-4 h-4" />
          Documentation Archive
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Reports & Download Center
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Export publication-grade evaluation reports, view prediction audit histories,
          and access model metadata files.
        </p>
      </div>

      {/* Artifact Downloads Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-blue-600">
            <Cpu className="w-4 h-4" />
            <h3 className="font-bold text-slate-900 text-xs">Model Comparison Report</h3>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Full benchmark evaluation metrics across all 5 algorithms on holdout gauge catchments.
          </p>
          <a
            href="/api/models/comparison"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-600 font-semibold"
          >
            <Download className="w-3 h-3" /> Download JSON Specs →
          </a>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-teal-600">
            <Database className="w-4 h-4" />
            <h3 className="font-bold text-slate-900 text-xs">Dataset Audit Report</h3>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Complete table joins, leakage prevention, and data quality verification logs.
          </p>
          <a
            href="/api/datasets/audit"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-300 font-semibold"
          >
            <Download className="w-3 h-3" /> Download Audit JSON →
          </a>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-indigo-600">
            <FileCheck className="w-4 h-4" />
            <h3 className="font-bold text-slate-900 text-xs">Benchmark Charts</h3>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            High-resolution ROC curves, confusion matrices, and accuracy comparison plots.
          </p>
          <a
            href="/static/reports/model_comparison_chart.png"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-300 font-semibold"
          >
            <Download className="w-3 h-3" /> View Comparison Chart →
          </a>
        </div>
      </div>

      {/* Prediction History Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Generated Prediction Assessments</h2>
            <p className="text-xs text-slate-500">History of user evaluations and downloadable PDF reports</p>
          </div>
          <Link
            to="/predict"
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-600 text-slate-900 font-semibold transition"
          >
            New Assessment +
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading history...</div>
        ) : predictions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No prediction assessments logged yet. Run an assessment on the Prediction page to generate your first report.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/60 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Prediction ID</th>
                  <th className="py-3 px-4">Location / Station</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Predicted Class</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Consensus</th>
                  <th className="py-3 px-4 text-right">PDF Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60 font-sans">
                {predictions.map((p) => (
                  <tr key={p.prediction_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-blue-600">
                      <Link to={`/results/${p.prediction_id}`} className="hover:underline">
                        {p.prediction_id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{p.station_name || 'Manual Input'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{p.timestamp}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          p.predicted_class === 'Severe Flood'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {p.predicted_class}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-800">{(p.confidence * 100).toFixed(1)}%</td>
                    <td className="py-3.5 px-4 text-slate-700">{p.agreement_count}/5 Models</td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={getPdfDownloadUrl(p.prediction_id)}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-blue-600 text-xs font-semibold border border-slate-300"
                      >
                        <Download className="w-3 h-3" /> Download PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
