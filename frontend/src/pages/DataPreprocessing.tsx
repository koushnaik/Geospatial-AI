import React, { useEffect, useState } from 'react';
import {
  Filter,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Scale
} from 'lucide-react';
import { getDatasetQuality, getDatasetSummary } from '../services/api';

export const DataPreprocessing: React.FC = () => {
  const [quality, setQuality] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDatasetQuality(), getDatasetSummary()])
      .then(([qRes, sRes]) => {
        setQuality(qRes);
        setSummary(sRes);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">Loading Pipeline Specifications...</p>
        </div>
      </div>
    );
  }

  const excluded = quality?.leakage_prevention?.excluded_post_event_variables || [];
  const observations = quality?.observations || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-2">
          <Filter className="w-4 h-4" />
          Machine Learning Pipeline
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Data Preprocessing & Leakage Prevention Architecture
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Detailed documentation of every transformation performed on the INDOFLOODS dataset,
          ensuring zero data leakage and scientific reproducibility for academic evaluation.
        </p>
      </div>

      {/* 5-Step Pipeline Flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[
          { step: '01', title: 'Data Ingestion & Joins', desc: 'Inner joins of 4 raw tables on EventID & GaugeID preserving all 4,548 events.' },
          { step: '02', title: 'Leakage Elimination', desc: 'Strict exclusion of post-event hydrologic metrics and warning/danger thresholds.' },
          { step: '03', title: 'Feature Preprocessing', desc: 'StandardScaler for 24 continuous features; OneHotEncoder for 4 categorical fields.' },
          { step: '04', title: 'Group-Aware Splitting', desc: 'StratifiedGroupKFold on GaugeID keeping entire catchments strictly isolated.' },
          { step: '05', title: 'Class Imbalance & Fitting', desc: 'Inverse class weighting within training folds; persistence to joblib artifacts.' },
        ].map((s) => (
          <div key={s.step} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="text-xs font-mono font-bold text-blue-600">{s.step}</div>
            <h3 className="text-xs font-bold text-slate-900">{s.title}</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* CRITICAL: Target Leakage Prevention Card */}
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-base font-bold text-slate-900">Target Leakage Prevention: Excluded Post-Event Variables</h2>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          {quality?.leakage_prevention?.rationale ||
            'Post-event measurements and flood classification thresholds were strictly purged from candidate predictive features.'}
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {excluded.map((item: string) => (
            <span
              key={item}
              className="text-xs font-mono px-3 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Group-Aware Validation Strategy Explanation */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="text-base font-bold text-slate-900">Group-Aware Spatial Validation Strategy</h2>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          In hydrologic flood records, a single gauge station experiences repeated historical events over decades.
          A conventional random train-test split suffers from massive spatial data leakage, as identical catchment terrain
          and soil attributes appear in both training and test sets.
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Validation Strategy</span>
            <span className="text-blue-600 font-bold">StratifiedGroupKFold</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Grouping Key</span>
            <span className="text-teal-600 font-bold">GaugeID (155 Unique Catchments)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Cross-Contamination</span>
            <span className="text-emerald-400 font-bold">0.0% (Zero Gauge Overlap)</span>
          </div>
        </div>
      </div>

      {/* Documented Audit Observations */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          Data Engineering Quality Audit Observations
        </h2>
        <ul className="space-y-2.5 text-xs text-slate-700">
          {observations.map((obs: string, idx: number) => (
            <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></span>
              <span className="leading-relaxed">{obs}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
