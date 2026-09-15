import React from 'react';
import { Zap, Calendar, TrendingUp, Sparkles, History, Globe, Clock } from 'lucide-react';
import { TimeframeOption } from '../types';

interface TimeframeFilterBarProps {
  selectedTimeframe: TimeframeOption;
  onChangeTimeframe: (tf: TimeframeOption) => void;
  filteredCount: number;
  filteredTotalSpend: number;
}

const OPTIONS: { id: TimeframeOption; label: string; icon: React.ElementType; hot?: boolean }[] = [
  { id: '7d',     label: '7 Days',   icon: Zap,       hot: true  },
  { id: '30d',    label: '30 Days',  icon: Calendar,  hot: true  },
  { id: '90d',    label: '90 Days',  icon: TrendingUp              },
  { id: 'future', label: 'Future',   icon: Sparkles                },
  { id: 'history',label: 'History',  icon: History                 },
  { id: 'all',    label: 'All Time', icon: Globe                   },
];

export const TimeframeFilterBar: React.FC<TimeframeFilterBarProps> = ({
  selectedTimeframe,
  onChangeTimeframe,
  filteredCount,
  filteredTotalSpend,
}) => {
  const fmt = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="glass-card px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
      {/* Pill buttons */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
        {OPTIONS.map(({ id, label, icon: Icon, hot }) => {
          const active = selectedTimeframe === id;
          return (
            <button
              key={id}
              onClick={() => onChangeTimeframe(id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex-shrink-0 font-display ${
                active
                  ? 'bg-vanguard-blue text-white shadow-sm scale-[1.02]'
                  : 'bg-white/70 text-slate-500 border border-slate-200 hover:bg-white hover:text-vanguard-navy hover:border-vanguard-blue/30'
              }`}
            >
              <Icon className={`w-3 h-3 ${active ? 'text-vanguard-gold' : 'text-slate-400'}`} />
              {label}
              {hot && (
                <span className={`text-[9px] px-1 rounded-full font-bold ${
                  active ? 'bg-vanguard-gold text-vanguard-black' : 'bg-slate-200 text-slate-500'
                }`}>
                  {id === '7d' ? 'NOW' : 'HOT'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Summary pill */}
      <div className="flex items-center gap-2 flex-shrink-0 border border-slate-200/80 bg-white/70 px-3 py-1.5 rounded-lg text-xs">
        <Clock className="w-3 h-3 text-vanguard-blue flex-shrink-0" />
        <span className="font-mono font-bold text-vanguard-navy">{fmt(filteredTotalSpend)}</span>
        <span className="text-slate-300">·</span>
        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[10px]">
          {filteredCount} {filteredCount === 1 ? 'event' : 'events'}
        </span>
      </div>
    </div>
  );
};
