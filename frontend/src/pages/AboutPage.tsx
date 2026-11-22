import React from 'react';
import {
  Info,
  BookOpen,
  GraduationCap,
  Cpu,
  ShieldCheck,
  ExternalLink,
  Laptop
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-2">
          <Info className="w-4 h-4" />
          Academic Information & Architecture
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          About GeoFlood AI
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Machine Learning-Based Flood Severity Prediction and Analysis System developed for 
          academic evaluation, scientific demonstration, and hydrological disaster risk assessment.
        </p>
      </div>

      {/* Primary Dataset & Citation Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-blue-600">
          <BookOpen className="w-5 h-5" />
          <h2 className="text-base font-bold text-slate-900">Primary Dataset & Scientific Citation</h2>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          GeoFlood AI is trained on the official national database:
        </p>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 font-serif">
          <p className="font-semibold text-slate-900">
            INDOFLOODS: A Comprehensive Database for Flood Events in India Enhanced with Catchment Attributes
          </p>
          <p className="text-slate-500 font-sans text-[11px]">
            Authors: Sai Kiran Kuntla & Manabendra Saharia (Department of Civil Engineering & Yardi School of Artificial Intelligence, Indian Institute of Technology Delhi).
          </p>
          <div className="pt-2 font-mono text-[11px] text-blue-600 flex flex-wrap gap-4 font-sans">
            <span>DOI: 10.1175/BAMS-D-24-0008.1</span>
            <span>Zenodo: 14584655</span>
          </div>
        </div>
      </div>

      {/* Student Defense Guide: Key Concepts to Explain */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-amber-400">
          <GraduationCap className="w-5 h-5" />
          <h2 className="text-base font-bold text-slate-900">Student Defense Guide: Key Questions to Explain to Faculty</h2>
        </div>

        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h3 className="font-bold text-slate-900 text-sm">
              Q1. Why classify "Flood" vs "Severe Flood" instead of predicting flood vs no flood?
            </h3>
            <p className="leading-relaxed text-slate-700">
              When heavy monsoonal rain arrives, river channels naturally exceed basic warning levels. The life-critical question for emergency managers is not merely whether river discharge will rise, but whether it will surpass the <em>Danger Level threshold</em>, becoming a <strong>Severe Flood</strong> that breaches embankments and necessitates mass evacuations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h3 className="font-bold text-slate-900 text-sm">
              Q2. How is target data leakage strictly prevented?
            </h3>
            <p className="leading-relaxed text-slate-700">
              Warning Level and Danger Level thresholds are directly used by the CWC to classify events into Flood vs Severe Flood. If included as input features, models would trivially memorize the threshold. Similarly, post-event measurements like Peak Discharge, Flood Volume, and Event Duration are unavailable when an event is unfolding. GeoFlood AI purges all post-event and threshold metrics, relying strictly on pre-event antecedent rainfall (T1d–T10d) and static catchment attributes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h3 className="font-bold text-slate-900 text-sm">
              Q3. Why is Group-Aware Validation essential in hydrological machine learning?
            </h3>
            <p className="leading-relaxed text-slate-700">
              A standard random train/test split allows multiple historical flood events from the same gauge to appear simultaneously in training and testing. Because catchment slope, area, and soil are static per gauge, the model can memorize gauge identity instead of generalizing. StratifiedGroupKFold splits strictly by <code>GaugeID</code>, testing the models on completely unseen geographical catchments.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h3 className="font-bold text-slate-900 text-sm">
              Q4. Why does XGBoost outperform linear models?
            </h3>
            <p className="leading-relaxed text-slate-700">
              Catchment hydrologic processes are fundamentally non-linear: precipitation thresholds trigger sudden saturation overland flow (Hortonian and Dunne runoff). Tree ensembles like XGBoost capture complex non-linear feature interactions between relief, soil, and antecedent rainfall without imposing artificial linear constraints.
            </p>
          </div>
        </div>
      </div>

      {/* Runtime Environment Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <Laptop className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <div className="font-semibold text-slate-900">Apple Silicon macOS Execution (M4 Optimized)</div>
            <div>FastAPI + Scikit-Learn + XGBoost + SHAP · Single-Origin Integrated Architecture</div>
          </div>
        </div>
        <span className="font-mono text-blue-600 text-xs">GeoFlood AI v1.0.0</span>
      </div>
    </div>
  );
};
