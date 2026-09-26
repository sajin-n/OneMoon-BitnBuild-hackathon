import React from 'react';
import { StatusBadge } from '../components/StatusBadge.js';

export const Sidepanel: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h1 className="text-base font-bold text-white">OneMoon</h1>
            <p className="text-xs text-sky-400">Security Telemetry Sidepanel</p>
          </div>
          <StatusBadge label="Running" status="active" />
        </div>

        <div className="mt-4 space-y-3">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
            <span className="font-semibold text-slate-300">Sidepanel View</span>
            <p className="text-slate-400">
              The sidepanel will provide deep forensic email telemetry, IOC traces, and audit verification when emails are inspected.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
        OneMoon Browser Extension &copy; 2026
      </div>
    </div>
  );
};
