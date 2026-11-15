import React from 'react';
import { ShieldCheck, Cpu, Waves } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="h-16 bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-8 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center gap-1.5 shadow-2xs">
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          Active Engine: <span className="font-mono text-blue-800 font-bold">Random Forest Ensemble</span>
        </span>
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Group-Aware Validated (0% Leakage)
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="hidden sm:inline font-mono text-slate-600">macOS Apple Silicon (M4)</span>
        <div className="h-4 w-px bg-slate-200"></div>
        <span className="text-slate-700 font-medium">IIT Delhi / CWC Dataset</span>
      </div>
    </header>
  );
};
