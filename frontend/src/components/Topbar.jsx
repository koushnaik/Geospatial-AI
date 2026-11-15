import React from 'react';
import {
  ChevronRight, Sun, Moon, ShieldCheck, Activity,
  Server, Globe, HardDrive, Compass, Sparkles, Cpu
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Topbar({
  currentPage,
  theme: propTheme,
  onToggleTheme: propToggleTheme,
  isDemo,
  onNavigate,
  activeWorkspace = 'live',
  onSwitchWorkspace
}) {
  const context = useTheme();
  const theme = propTheme || context.theme;
  const onToggleTheme = propToggleTheme || context.toggleTheme;
  const isDark = theme === 'dark';

  // Determine section based on page name
  const getSection = (page) => {
    if (page === 'Live Flood Intelligence') return 'Live Platform';
    if (page === 'Master Prediction Results') return 'Unified Results';
    if (['Overview Dashboard', 'Historical Flood Explorer'].includes(page)) return 'Research Core';
    if (['Dataset Explorer', 'Data Preprocessing', 'Exploratory Data Analysis'].includes(page)) return 'Geospatial Data';
    if (['Model Training', 'Hyperparameter Optimization', 'Model Comparison'].includes(page)) return 'Machine Learning';
    if (['Flood Susceptibility Prediction', 'Geospatial Risk Map'].includes(page)) return 'Inference & Risk';
    if (['Flood Image Analysis', 'Explainable AI', 'Ensemble Analysis'].includes(page)) return 'Deep Learning & XAI';
    return 'Audit & Exports';
  };

  return (
    <header className="h-14 bg-navy-900/90 border-b border-navy-800 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors duration-200">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs">
        <span
          className="font-semibold text-slate-400 hover:text-cyan-400 cursor-pointer transition"
          onClick={() => onNavigate(activeWorkspace === 'live' ? 'Live Flood Intelligence' : 'Overview Dashboard')}
        >
          GeoFlood AI
        </span>
        <ChevronRight size={13} className="text-slate-500" />
        <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">
          {getSection(currentPage)}
        </span>
        <ChevronRight size={13} className="text-slate-500" />
        <span className="font-bold text-white font-mono text-xs">
          {currentPage}
        </span>
        {isDemo && (
          <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 hidden sm:inline">
            DEMONSTRATION DATA
          </span>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Workspace Mode Switcher Pill */}
        {onSwitchWorkspace && (
          <div className="flex items-center p-1 rounded-xl bg-navy-950 border border-navy-800 text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => onSwitchWorkspace('live')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                activeWorkspace === 'live'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-navy-950 font-black shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={12} />
              <span className="hidden sm:inline">Live Intelligence</span>
              <span className="sm:hidden">Live</span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchWorkspace('research')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                activeWorkspace === 'research'
                  ? 'bg-purple-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu size={12} />
              <span className="hidden sm:inline">Research Suite</span>
              <span className="sm:hidden">Research</span>
            </button>
          </div>
        )}

        {/* Backend Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-navy-800 border border-navy-700/80 text-[11px] font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>API 8000</span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-400 font-bold">5 Deep + 9 ML</span>
        </div>

        {/* Interactive Theme Toggle */}
        <button
          onClick={onToggleTheme}
          aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 border border-navy-700 text-slate-300 hover:text-white transition shadow-sm cursor-pointer"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        >
          {isDark ? (
            <>
              <Sun size={15} className="text-amber-400" />
              <span className="text-[11px] font-mono font-medium hidden sm:inline text-amber-300">Light</span>
            </>
          ) : (
            <>
              <Moon size={15} className="text-cyan-600" />
              <span className="text-[11px] font-mono font-medium hidden sm:inline text-cyan-700">Dark</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
