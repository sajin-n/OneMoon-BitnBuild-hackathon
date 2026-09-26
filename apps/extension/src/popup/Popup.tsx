import React from 'react';
import { StatusBadge } from '../components/StatusBadge.js';

export const Popup: React.FC = () => {
  return (
    <div className="w-[340px] bg-slate-950 text-slate-100 p-4 border border-slate-800 rounded-lg shadow-xl font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-md shadow-sky-500/20">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">OneMoon</h1>
            <p className="text-[10px] text-sky-400 font-medium">Browser Shield</p>
          </div>
        </div>
        <StatusBadge label="Extension Running" status="active" />
      </div>

      {/* Body / Confirmation status */}
      <div className="py-4 space-y-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs space-y-1.5">
          <div className="flex justify-between items-center text-slate-300">
            <span>Runtime Status:</span>
            <span className="font-semibold text-emerald-400">ONLINE</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Manifest Version:</span>
            <span className="font-mono text-slate-400">V3</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Environment:</span>
            <span className="text-slate-400">Scaffolding / Ready</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          OneMoon extension is loaded and active. Email & web analysis modules will activate once connected.
        </p>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
        <span>v0.1.0</span>
        <span className="text-sky-400/80 font-medium">Security Intelligence</span>
      </div>
    </div>
  );
};
