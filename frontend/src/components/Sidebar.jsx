import React from 'react';
import {
  LayoutDashboard, History, Database, Filter, BarChart3,
  Cpu, Award, Compass, Map, Image as ImageIcon, Eye,
  Layers, Download, Settings, RefreshCw, ChevronLeft, ChevronRight,
  Sliders, Waves, Activity, ShieldCheck, Sparkles, Terminal, Globe
} from 'lucide-react';

const LIVE_NAV_ITEMS = [
  { name: 'Live Flood Intelligence', icon: Sparkles, badge: 'Primary' },
  { name: 'Master Prediction Results', icon: Award },
  { name: 'Geospatial Risk Map', icon: Map },
  { name: 'Reports & Downloads', icon: Download },
];

const RESEARCH_NAV_SECTIONS = [
  {
    category: 'Research Core',
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
    category: 'Audit & Infrastructure',
    items: [
      { name: 'Experiment History', icon: Activity },
      { name: 'Reports & Downloads', icon: Download },
      { name: 'Settings', icon: Settings },
    ]
  }
];

export default function Sidebar({
  currentPage,
  onNavigate,
  onResetDemo,
  collapsed,
  setCollapsed,
  activeWorkspace = 'live',
  onSwitchWorkspace
}) {
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
                  {activeWorkspace === 'live' ? 'Live Platform' : 'Research Suite'}
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
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-navy-800 transition cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Workspace Mode Switcher Card */}
        {!collapsed && onSwitchWorkspace && (
          <div className="p-3 border-b border-navy-800/80 bg-navy-950/60">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Active Workspace</span>
              <span className={`w-2 h-2 rounded-full ${activeWorkspace === 'live' ? 'bg-cyan-400 animate-pulse' : 'bg-purple-400'}`}></span>
            </div>
            <div className="grid grid-cols-2 gap-1 p-1 bg-navy-900 rounded-xl border border-navy-800 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => onSwitchWorkspace('live')}
                className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeWorkspace === 'live'
                    ? 'bg-cyan-500 text-navy-950 font-black shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles size={11} />
                <span>Live</span>
              </button>
              <button
                type="button"
                onClick={() => onSwitchWorkspace('research')}
                className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeWorkspace === 'research'
                    ? 'bg-purple-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cpu size={11} />
                <span>Research</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="py-2.5 overflow-y-auto max-h-[calc(100vh-210px)] scrollbar-thin">
          {activeWorkspace === 'live' ? (
            /* WORKSPACE 1: LIVE FLOOD INTELLIGENCE NAVIGATION */
            <div className="px-2 space-y-1">
              {!collapsed && (
                <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Public Flood Intelligence
                </div>
              )}
              {LIVE_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => onNavigate(item.name)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/10 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                        : 'text-slate-400 hover:text-white hover:bg-navy-800/60'
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon size={16} className={isActive ? 'text-cyan-400' : 'text-slate-400 shrink-0'} />
                    {!collapsed && (
                      <span className="flex-1 truncate flex items-center justify-between">
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            {item.badge}
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}

              {!collapsed && (
                <div className="pt-4 px-1">
                  <div className="p-3 rounded-xl bg-navy-950 border border-navy-800 text-xs space-y-2">
                    <span className="text-[11px] font-bold text-slate-300 block">Need Advanced Tools?</span>
                    <p className="text-[10px] text-slate-400 leading-snug">
                      Switch to the Research Suite to inspect raw datasets, train neural models, and configure Optuna hyperparameters.
                    </p>
                    <button
                      type="button"
                      onClick={() => onSwitchWorkspace('research')}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-navy-850 hover:bg-navy-800 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Cpu size={12} />
                      <span>Open Research Workspace</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* WORKSPACE 2: RESEARCH & ADMINISTRATION NAVIGATION */
            <div className="px-2 space-y-3">
              {RESEARCH_NAV_SECTIONS.map((section) => (
                <div key={section.category}>
                  {!collapsed && (
                    <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                      {section.category}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPage === item.name;
                      return (
                        <button
                          key={item.name}
                          onClick={() => onNavigate(item.name)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${
                            isActive
                              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                              : 'text-slate-400 hover:text-white hover:bg-navy-800/60'
                          }`}
                          title={collapsed ? item.name : undefined}
                        >
                          <Icon size={14} className={isActive ? 'text-purple-400' : 'text-slate-400 shrink-0'} />
                          {!collapsed && <span className="truncate">{item.name}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-navy-800 bg-navy-950/40 space-y-2">
        {!collapsed && (
          <div className="text-[10px] font-mono text-slate-500 text-center">
            GeoFlood AI v2.0 • M4 Silicon
          </div>
        )}
      </div>
    </aside>
  );
}
