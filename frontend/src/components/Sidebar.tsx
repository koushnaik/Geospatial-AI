import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Waves,
  GitCompare,
  History,
  MapPin,
  Database,
  Filter,
  BrainCircuit,
  FileText,
  Info
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Severity Prediction', path: '/predict', icon: Waves },
  { name: 'Model Comparison', path: '/models', icon: GitCompare },
  { name: 'Historical Analysis', path: '/historical', icon: History },
  { name: 'Interactive Map', path: '/map', icon: MapPin },
  { name: 'Dataset Explorer', path: '/datasets', icon: Database },
  { name: 'Data Preprocessing', path: '/preprocessing', icon: Filter },
  { name: 'Explainable AI', path: '/explainability', icon: BrainCircuit },
  { name: 'Reports & Downloads', path: '/reports', icon: FileText },
  { name: 'About & System', path: '/about', icon: Info },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 select-none z-30 shadow-xs">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
          <Waves className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-slate-900 tracking-tight text-base flex items-center gap-1.5">
            GeoFlood <span className="text-blue-700 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">AI</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium tracking-tight">Environmental Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Core Workflows
        </div>
        {navItems.slice(0, 3).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs border border-blue-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}

        <div className="pt-5 px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Spatial & Analytics
        </div>
        {navItems.slice(3, 5).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs border border-blue-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}

        <div className="pt-5 px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Data & Science
        </div>
        {navItems.slice(5).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs border border-blue-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Models Online
          </span>
          <span className="text-[11px] font-mono font-semibold text-blue-700">INDOFLOODS</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1 font-medium">
          155 CWC Gauges · 7,338 Records
        </div>
      </div>
    </aside>
  );
};
