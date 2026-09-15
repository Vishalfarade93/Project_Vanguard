import React from 'react';
import { Radio, Clock, Layers, CheckCircle2 } from 'lucide-react';
import { ExpenseSummary } from '../types';

interface SummaryCardsProps {
  summary: ExpenseSummary | null;
  loading: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, loading }) => {
  const fmt = (val?: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val ?? 0);

  const cards = [
    {
      title:    'Projected Outflow',
      value:    fmt(summary?.totalPredictedSpend),
      sub:      'Predicted unbilled spend',
      icon:     Radio,
      gradient: 'from-vanguard-blue/10 to-vanguard-navy/5',
      border:   'border-vanguard-blue/20',
      iconBg:   'bg-vanguard-blue/10 text-vanguard-blue border-vanguard-blue/20',
      accent:   'bg-vanguard-blue',
      tag:      'Primary',
      tagCls:   'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      title:    'Early Warning',
      value:    '22.5 Days',
      sub:      'Avg. lead before invoice',
      icon:     Clock,
      gradient: 'from-amber-50/80 to-amber-50/20',
      border:   'border-amber-200/60',
      iconBg:   'bg-amber-100/70 text-amber-700 border-amber-200',
      accent:   'bg-vanguard-gold',
      tag:      'Proactive',
      tagCls:   'bg-amber-50 text-amber-900 border-amber-300',
    },
    {
      title:    'Spending Events',
      value:    `${summary?.totalExpensesCount ?? 0} Items`,
      sub:      'Detected in Slack & Gmail',
      icon:     Layers,
      gradient: 'from-violet-50/60 to-indigo-50/30',
      border:   'border-violet-200/50',
      iconBg:   'bg-violet-100/70 text-violet-700 border-violet-200',
      accent:   'bg-vanguard-violet',
      tag:      'Synthesized',
      tagCls:   'bg-violet-50 text-violet-800 border-violet-200',
    },
    {
      title:    'Signal Listener',
      value:    'Live & Monitoring',
      sub:      'Continuous webhook active',
      icon:     CheckCircle2,
      gradient: 'from-emerald-50/60 to-teal-50/20',
      border:   'border-emerald-200/60',
      iconBg:   'bg-emerald-100/70 text-emerald-700 border-emerald-200',
      accent:   'bg-vanguard-emerald',
      tag:      'Real-Time',
      tagCls:   'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} border ${card.border} p-4 shadow-card glass-card-hover animate-fade-in`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            {/* Top accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${card.accent} opacity-60`} />

            <div className="flex items-start justify-between mb-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${card.tagCls}`}>
                {card.tag}
              </span>
              <div className={`p-1.5 rounded-xl border ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-0.5">
              <p className="text-[11px] font-medium text-slate-500 font-sans">{card.title}</p>
              {loading ? (
                <div className="h-7 w-24 shimmer-box my-1" />
              ) : (
                <p className="text-xl font-extrabold text-vanguard-black tracking-tight font-display leading-tight">
                  {card.value}
                </p>
              )}
              <p className="text-[11px] text-slate-400 font-sans">{card.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
