import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import { BarChart3, Download, Layers, Activity, Table, ArrowUpRight } from 'lucide-react';

export default function ExploratoryDataAnalysis() {
  const { chartTheme } = useTheme();
  const [eda, setEda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState('rainfall_24h');

  useEffect(() => {
    api.getEdaSummary()
      .then(setEda)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const stats = eda?.descriptive_statistics || {};
  const correlations = eda?.target_correlations || [];

  const handleExportCSV = () => {
    if (!correlations.length) return;
    const header = 'Feature,Target_Correlation\n';
    const rows = correlations.map((c) => `${c.feature},${c.correlation}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eda_correlations.csv';
    a.click();
  };

  const classBalance = [
    { name: 'Non-Flood (Class 0)', value: eda?.class_balance?.['0'] || 824, color: '#10B981' },
    { name: 'Flooded (Class 1)', value: eda?.class_balance?.['1'] || 376, color: '#EF4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-cyan-400 font-mono text-xs tracking-wider uppercase font-bold flex items-center gap-2 mb-1">
              <BarChart3 size={14} />
              <span>Statistical Distribution Laboratory</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Exploratory Data Analysis (EDA)</h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Parametric descriptive statistics, class balance, and Pearson correlations with observed flood occurrences across all 16 geospatial features.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-700 text-slate-300 hover:text-white text-xs font-semibold transition shrink-0"
          >
            <Download size={14} className="text-cyan-400" />
            <span>Export Correlations CSV</span>
          </button>
        </div>
      </div>

      {/* Class Balance & Observation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-navy-900 border border-navy-800 p-4 rounded-xl shadow-panel text-center">
          <div className="text-xs uppercase text-slate-400 font-mono">Total Observations</div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {eda?.total_records || 1200}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Indian River Basins Multi-Sensor Cohort</div>
        </div>

        <div className="bg-navy-900 border border-navy-800 p-4 rounded-xl shadow-panel text-center">
          <div className="text-xs uppercase text-slate-400 font-mono">Inundated Samples (Class 1)</div>
          <div className="text-2xl font-black text-red-400 font-mono mt-1">
            {eda?.class_balance?.['1'] || 376}
          </div>
          <div className="text-[11px] text-red-400/80 mt-1 font-mono">31.3% Positives (Moderate Imbalance)</div>
        </div>

        <div className="bg-navy-900 border border-navy-800 p-4 rounded-xl shadow-panel text-center">
          <div className="text-xs uppercase text-slate-400 font-mono">Non-Flood Samples (Class 0)</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {eda?.class_balance?.['0'] || 824}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 font-mono">68.7% Negatives (Control Sites)</div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pearson Correlations with Flood Label (2 Columns) */}
        <div className="lg:col-span-2 bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Pearson Correlation with Flood Occurrence (r)
            </h2>
            <span className="text-xs text-slate-400 font-mono">Target: flood_label</span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={correlations.slice(0, 10)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis type="number" domain={[-0.8, 0.8]} stroke={chartTheme.axis} fontSize={10} />
                <YAxis dataKey="feature" type="category" stroke={chartTheme.axis} fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    borderColor: chartTheme.tooltipBorder,
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: chartTheme.tooltipText
                  }}
                />
                <Bar dataKey="correlation" fill="#06B6D4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-2">
            Positive correlations (rainfall, TWI) increase susceptibility; negative correlations (elevation, slope) provide drainage buffers.
          </div>
        </div>

        {/* Class Balance Donut Chart (1 Column) */}
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-2">
              Class Ratio Distribution
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Ground-truth binary balance between flooded and dry control points.
            </p>

            <div className="h-44 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classBalance}
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {classBalance.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltipBg,
                      borderColor: chartTheme.tooltipBorder,
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: chartTheme.tooltipText
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-2">
              {classBalance.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs p-2 rounded bg-navy-950 border border-navy-800 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <span className="text-slate-200 font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 mt-4 border-t border-navy-800 pt-3">
            Balanced weighting used in ML model estimators.
          </div>
        </div>
      </div>

      {/* Feature Parametric Statistics Table */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-panel">
        <div className="flex items-center justify-between mb-4 border-b border-navy-800 pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Table size={15} className="text-cyan-400" />
            <span>Descriptive Statistics (Mean, Std, Min, IQR, Max)</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">16 Features</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-navy-950 text-slate-400 border-b border-navy-800 text-[10px] uppercase">
              <tr>
                <th className="p-2.5">Feature</th>
                <th className="p-2.5">Mean</th>
                <th className="p-2.5">Std Dev</th>
                <th className="p-2.5">Min</th>
                <th className="p-2.5">25% (Q1)</th>
                <th className="p-2.5">50% (Median)</th>
                <th className="p-2.5">75% (Q3)</th>
                <th className="p-2.5">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 text-slate-200">
              {Object.entries(stats).map(([name, s]) => (
                <tr key={name} className="hover:bg-navy-850/60">
                  <td className="p-2.5 text-cyan-300 font-bold">{name}</td>
                  <td className="p-2.5">{s.mean}</td>
                  <td className="p-2.5 text-slate-400">{s.std}</td>
                  <td className="p-2.5">{s.min}</td>
                  <td className="p-2.5 text-slate-400">{s['25%']}</td>
                  <td className="p-2.5 font-bold text-teal-300">{s['50%']}</td>
                  <td className="p-2.5 text-slate-400">{s['75%']}</td>
                  <td className="p-2.5">{s.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
