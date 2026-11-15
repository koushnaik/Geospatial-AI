import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Download,
  ShieldCheck,
  Cpu,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  ArrowLeft,
  Share2,
  BrainCircuit,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { getPrediction, getPdfDownloadUrl } from '../services/api';
import { PredictionResult } from '../types';

export const PredictionResults: React.FC = () => {
  const { predictionId } = useParams<{ predictionId: string }>();
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!predictionId) return;
    getPrediction(predictionId)
      .then((data) => setResult(data))
      .catch((err) => {
        console.error(err);
        setError('Failed to load prediction assessment.');
      })
      .finally(() => setLoading(false));
  }, [predictionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading Multi-Algorithm Prediction & SHAP Analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Assessment Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'Unable to retrieve prediction record.'}</p>
        <Link
          to="/predict"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-xs text-slate-700 hover:bg-slate-200 border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Prediction Form
        </Link>
      </div>
    );
  }

  const isNoFlood = result.predicted_class === 'No Flood';
  const isFlood = result.predicted_class === 'Flood';
  const isSevere = result.predicted_class === 'Severe Flood';
  const inputs = result.inputs || {};
  const allPreds = result.all_predictions || [];
  const expl = result.explanation || { top_factors: [], summary_text: '', method: '', base_value: 0, global_importance: [] };

  // Prepare chart data for Section C
  const chartData = allPreds.map((p) => ({
    name: p.algorithm.replace('Classifier', '').replace('Support Vector Machine', 'SVM'),
    Accuracy: Number((p.accuracy * 100).toFixed(1)),
    'Macro F1': Number((p.f1_macro * 100).toFixed(1)),
    'Confidence': Number((p.confidence * 100).toFixed(1)),
  }));

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/predict"
          className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Start New Assessment
        </Link>
        <div className="flex items-center gap-3">
          <a
            href={getPdfDownloadUrl(result.prediction_id)}
            download
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF Report
          </a>
        </div>
      </div>

      {/* SECTION A: FINAL PREDICTION HERO CARD */}
      <div
        className={`rounded-2xl border p-8 shadow-2xl relative overflow-hidden transition-all ${
          isSevere
            ? 'bg-rose-50/70 border-rose-200 shadow-sm'
            : isFlood
            ? 'bg-amber-50/70 border-amber-200 shadow-sm'
            : 'bg-emerald-50/70 border-emerald-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${
                  isSevere
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : isFlood
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                Flood Occurrence & Severity Assessment
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {result.prediction_id.slice(0, 8)}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              {result.predicted_class}
              {isSevere ? (
                <AlertTriangle className="w-10 h-10 text-rose-400 shrink-0" />
              ) : isFlood ? (
                <AlertCircle className="w-10 h-10 text-amber-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-10 h-10 text-emerald-400 shrink-0" />
              )}
            </h1>

            <p className="text-sm text-slate-600 max-w-xl">
              {isSevere
                ? 'High risk of severe flood event exceeding Danger Level threshold. Preparedness and emergency protocols advised.'
                : isFlood
                ? 'Hydrologic inputs indicate flow exceeding Warning Level but remaining below the Danger Level threshold.'
                : 'Safe baseline conditions. Catchment capacity and antecedent precipitation remain well below flood thresholds.'}
            </p>
          </div>

          {/* Quick Metrics Badge Column */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Best Model</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{result.best_model}</div>
              <div className="text-[10px] text-blue-600">Primary Evaluator</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Confidence</div>
              <div className="text-base font-bold text-blue-600 font-mono mt-0.5">
                {(result.confidence * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400">Posterior Probability</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Model Consensus</div>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {result.agreement_count}/{result.total_models}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold">
                {result.agreement_percentage}% Agreement
              </div>
            </div>
          </div>
        </div>

        {/* Location Sub-bar */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-900 font-medium">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            {result.station_name || inputs.gauge_id || 'Manual Catchment Assessment'}
          </span>
          {inputs.basin && <span>Basin: <strong className="text-slate-700">{inputs.basin}</strong></span>}
          {inputs.state && <span>State: <strong className="text-slate-700">{inputs.state}</strong></span>}
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {result.timestamp} UTC
          </span>
        </div>
      </div>

      {/* SECTION B: FIVE-ALGORITHM COMPARISON TABLE */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Section B: Five-Algorithm Prediction Comparison
            </h2>
            <p className="text-xs text-slate-400">
              Predictions and confidence levels produced independently by each of our five trained machine learning models.
            </p>
          </div>
          <div className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 w-fit">
            Consensus: <strong className="text-blue-600">{result.agreement_count} of 5</strong> agree on {result.predicted_class}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Algorithm</th>
                <th className="py-3 px-4">Predicted Class</th>
                <th className="py-3 px-4">Prediction Confidence</th>
                <th className="py-3 px-4">Severe Class Probability</th>
                <th className="py-3 px-4">Holdout Macro F1</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {allPreds.map((p) => (
                <tr
                  key={p.algorithm}
                  className={`hover:bg-slate-50 transition-colors ${
                    p.is_best_model ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    {p.algorithm}
                    {p.is_best_model && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-blue-500/30">
                        Primary Model
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        p.predicted_class === 'Severe Flood'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : p.predicted_class === 'Flood'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {p.predicted_class}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                    {(p.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {(p.raw_probability * 100).toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    {(p.f1_macro * 100).toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {p.predicted_class === result.predicted_class ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Agrees
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Diverges
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION C & SECTION D: SIDE-BY-SIDE GRAPHS & SHAP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION C: PERFORMANCE COMPARISON CHART */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Section C: Model Performance Comparison
            </h2>
            <p className="text-xs text-slate-400">
              Holdout validation benchmark metrics (Macro F1, Accuracy) alongside current confidence.
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Macro F1" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Accuracy" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Confidence" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION D: RISK FACTOR ANALYSIS (SHAP) */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-teal-600" />
              Section D: Explainable AI & Risk Factors (SHAP)
            </h2>
            <p className="text-xs text-slate-400">
              Calculates each input feature's mathematical contribution toward the prediction.
            </p>
          </div>

          {/* Synthesis Text Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <strong className="text-blue-600 block mb-1">Hydrologic Risk Synthesis:</strong>
            {expl.summary_text}
          </div>

          {/* Top SHAP Contributing Factors */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Top Influential Factors
            </span>
            {(expl.top_factors || []).slice(0, 5).map((f) => {
              const isPositive = f.shap_value > 0;
              return (
                <div
                  key={f.feature}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{f.feature}</span>
                    {f.value !== undefined && f.value !== null && (
                      <span className="text-slate-400 font-mono ml-2">({f.value})</span>
                    )}
                    <span
                      className={`block text-[10px] mt-0.5 ${
                        isPositive ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {f.impact}
                    </span>
                  </div>
                  <div
                    className={`font-mono font-bold ${
                      isPositive ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {f.shap_value > 0 ? `+${f.shap_value.toFixed(3)}` : f.shap_value.toFixed(3)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION E: INPUT SUMMARY */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          Section E: Complete Input Parameters Summary
        </h2>

        {/* 10-day rainfall pills */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400">Antecedent Precipitation (mm)</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
              <div key={d} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] text-slate-400">{`T${d}d`}</div>
                <div className="text-xs font-mono font-bold text-blue-600 mt-0.5">
                  {inputs[`T${d}d`]} mm
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Catchment Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Drainage Area</span>
            <span className="font-semibold text-slate-900">{inputs['Drainage Area']} km²</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Catchment Relief</span>
            <span className="font-semibold text-slate-900">{inputs['Catchment Relief']} m</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Drainage Density</span>
            <span className="font-semibold text-slate-900">{inputs['Drainage Density']} km/km²</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Stream Order</span>
            <span className="font-semibold text-slate-900">{inputs['Stream Order']}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Soil Type</span>
            <span className="font-semibold text-slate-900">{inputs['Soil type']}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Land Cover</span>
            <span className="font-semibold text-slate-900">{inputs['Land cover']}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Lithology</span>
            <span className="font-semibold text-slate-900">{inputs['lithology type']}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Climate Zone</span>
            <span className="font-semibold text-slate-900">{inputs['KoppenGeiger Climate Type']}</span>
          </div>
        </div>
      </div>

      {/* SECTION F: DOWNLOADABLE REPORT CALLOUT */}
      <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600" />
            Section F: Official Assessment Report (PDF)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Download the formal evaluation report including all 5 model predictions, SHAP attribution values, and benchmark charts.
          </p>
        </div>
        <a
          href={getPdfDownloadUrl(result.prediction_id)}
          download
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all shrink-0"
        >
          Download PDF Now
        </a>
      </div>
    </div>
  );
};
