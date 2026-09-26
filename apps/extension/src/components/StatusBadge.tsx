import React from 'react';

interface StatusBadgeProps {
  label: string;
  status?: 'active' | 'standby' | 'alert';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, status = 'active' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'active':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60';
      case 'standby':
        return 'bg-amber-950/80 text-amber-400 border-amber-800/60';
      case 'alert':
        return 'bg-rose-950/80 text-rose-400 border-rose-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {label}
    </span>
  );
};
