import React from 'react';
import {
  LayoutDashboard, History, Database, Filter, BarChart3,
  Cpu, Award, Compass, Map, Image as ImageIcon, Eye,
  Layers, Download, Settings, RefreshCw, ChevronLeft, ChevronRight,
  Sliders, Waves, Activity, ShieldCheck, Sparkles
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    category: 'Core Platform',
    items: [
      { name: 'Overview Dashboard', icon: LayoutDashboard },
      { name: 'Historical Flood Explorer', icon: History },
    ]
  },
  {
    category: 'Geospatial Data',
    items: [
      { name: 'Dataset Explorer', icon: Database },
      { name: 'Data Preprocessing', icon: Filter },
      { name: 'Exploratory Data Analysis', icon: BarChart3 },
    ]
  },
  {
    category: 'Machine Learning',
    items: [
      { name: 'Model Training', icon: Cpu },
      { name: 'Hyperparameter Optimization', icon: Sliders },
      { name: 'Model Comparison', icon: Award },
    ]
  },
  {
    category: 'Inference & Spatial Risk',
    items: [
      { name: 'Flood Susceptibility Prediction', icon: Compass },
      { name: 'Master Prediction Results', icon: Sparkles },
      { name: 'Geospatial Risk Map', icon: Map },
    ]
  },
  {
    category: 'Deep Learning & XAI',
    items: [
      { name: 'Flood Image Analysis', icon: ImageIcon },
      { name: 'Explainable AI', icon: Eye },
      { name: 'Ensemble Analysis', icon: Layers },
    ]
  },
  {
    category: 'Audit & Exports',
    items: [
      { name: 'Experiment History', icon: Activity },
      { name: 'Reports & Downloads', icon: Download },
      { name: 'Settings', icon: Settings },
    ]
  }
];

export default function Sidebar({ currentPage, onNavigate, onResetDemo, collapsed, setCollapsed }) {
  return (
    <aside
      className={`bg-navy-900 border-r border-navy-800 transition-all duration-300 flex flex-col justify-between shrink-0 select-none z-30 shadow-panel ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="p-3.5 border-b border-navy-800 flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-navy-950 font-black text-sm shadow-glow-cyan">
                <Waves size={18} className="text-white" />
              </div>
              <div>
                <div className="text-white font-black text-sm tracking-tight flex items-center gap-1.5">
                  <span>GeoFlood</span>
                  <span className="text-cyan-400 font-mono text-xs">AI</span>
                </div>
                <div className="text-[9px] text-teal-400 font-mono tracking-wider font-semibold uppercase">
                  Research Platform
                </div>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white mx-auto shadow-glow-cyan">
              <Waves size={16} />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-navy-800 transition"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Categories */}
        <nav className="p-2 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          {NAV_SECTIONS.map((sec) => (
            <div key={sec.category} className="space-y-1">
              {!collapsed && (
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  {sec.category}
                </div>
              )}
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => onNavigate(item.name)}
                    title={collapsed ? item.name : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition text-left ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-400 font-semibold border-l-2 border-cyan-400 shadow-glow-cyan/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-navy-850'
                    }`}
                  >
                    <Icon size={16} className={`shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Area: Demo Reset & Hardware Pill */}
      <div className="p-3 border-t border-navy-800 bg-navy-950/60">
        {!collapsed ? (
          <div className="space-y-2">
            <button
              onClick={onResetDemo}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700/60 text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              <RefreshCw size={13} className="text-cyan-400" />
              <span>Reset Demo Workspace</span>
            </button>
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>FastAPI 2.0</span>
              </span>
              <span>Apple M4</span>
            </div>
          </div>
        ) : (
          <button
            onClick={onResetDemo}
            className="w-full p-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-cyan-400 flex items-center justify-center transition"
            title="Reset Demo Workspace"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}
