import React, { useMemo } from 'react';
import { Layers, Plane, Users, Server, Wrench, Package } from 'lucide-react';
import { PredictedExpense } from '../types';

interface CategoryAllocationWidgetProps { expenses: PredictedExpense[] }

const CAT_META = {
  TRAVEL:         { label: 'Travel & Flights',       icon: Plane,   bar: 'from-blue-500 to-vanguard-blue',      badge: 'bg-blue-50 text-blue-700 border-blue-200'   },
  CONTRACTORS:    { label: 'Contractors & Hiring',    icon: Users,   bar: 'from-amber-400 to-amber-600',          badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  INFRASTRUCTURE: { label: 'Cloud & Infra',           icon: Server,  bar: 'from-vanguard-indigo to-vanguard-violet', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  SOFTWARE_TOOLS: { label: 'Software & SaaS',         icon: Wrench,  bar: 'from-teal-400 to-vanguard-teal',      badge: 'bg-teal-50 text-teal-700 border-teal-200'   },
  GENERAL_OPS:    { label: 'General Ops',             icon: Package, bar: 'from-slate-300 to-slate-500',          badge: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const CategoryAllocationWidget: React.FC<CategoryAllocationWidgetProps> = ({ expenses }) => {
  const data = useMemo(() => {
    const totals: Record<string, number> = {
      TRAVEL: 0, CONTRACTORS: 0, INFRASTRUCTURE: 0, SOFTWARE_TOOLS: 0, GENERAL_OPS: 0,
    };
    let grand = 0;

    expenses.forEach((e) => {
      const dept = e.department ?? 'GENERAL_OPS';
      const amt  = Number(e.estimatedAmount) || 0;
      totals[dept !== undefined && dept in totals ? dept : 'GENERAL_OPS'] += amt;
      grand += amt;
    });

    return Object.keys(totals)
      .map((key) => {
        const amt = totals[key];
        const pct = grand > 0 ? Math.round((amt / grand) * 100) : 0;
        return { key, amount: amt, percentage: pct, ...CAT_META[key as keyof typeof CAT_META] };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const total = data.reduce((s, d) => s + d.amount, 0);

  const fmt = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  // Mini donut segments (SVG)
  const RADIUS = 28;
  const CIRC   = 2 * Math.PI * RADIUS;

  const donutColors = ['#003566', '#FFC300', '#4338CA', '#0E7490', '#94A3B8'];

  let offset = 0;
  const segments = data.map((d, i) => {
    const dash   = (d.percentage / 100) * CIRC;
    const seg    = { offset, dash, color: donutColors[i % donutColors.length] };
    offset += dash;
    return seg;
  });

  return (
    <div className="glass-card p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-vanguard-blue" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-vanguard-black font-display leading-tight">
              Spend Intent by Category
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Allocation across business domains</p>
          </div>
        </div>

        {/* Mini Donut */}
        {total > 0 && (
          <svg width="60" height="60" viewBox="0 0 64 64" className="flex-shrink-0">
            <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="#F1F5F9" strokeWidth="6" />
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx="32"
                cy="32"
                r={RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth="6"
                strokeDasharray={`${seg.dash} ${CIRC - seg.dash}`}
                strokeDashoffset={-seg.offset}
                style={{ transformOrigin: 'center', transform: 'rotate(-90deg)', transition: 'stroke-dasharray 0.7s ease' }}
              />
            ))}
            <text x="32" y="32" textAnchor="middle" dominantBaseline="middle"
              fontSize="8" fontWeight="700" fill="#001D3D" fontFamily="JetBrains Mono">
              {data.filter(d => d.amount > 0).length}
            </text>
            <text x="32" y="41" textAnchor="middle" dominantBaseline="middle"
              fontSize="6" fill="#64748B" fontFamily="DM Sans">
              cats
            </text>
          </svg>
        )}
      </div>

      {/* Total */}
      {total > 0 && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">Total Intent Outflow</span>
          <span className="font-mono font-extrabold text-sm text-vanguard-navy">{fmt(total)}</span>
        </div>
      )}

      {/* Category bars */}
      <div className="space-y-2.5 flex-1">
        {data.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${cat.badge}`}>
                    <Icon className="w-2.5 h-2.5" />
                    {cat.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-vanguard-navy text-[11px]">{fmt(cat.amount)}</span>
                  <span className="font-mono text-[10px] text-slate-400 w-7 text-right font-medium">{cat.percentage}%</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${cat.bar} transition-all duration-700`}
                  style={{ width: `${Math.max(cat.percentage > 0 ? 2 : 0, cat.percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {total === 0 && (
        <div className="flex-1 flex items-center justify-center py-8 text-slate-300">
          <div className="text-center">
            <Layers className="w-8 h-8 mx-auto mb-1.5 opacity-30" />
            <p className="text-xs text-slate-400">No category data in this horizon</p>
          </div>
        </div>
      )}
    </div>
  );
};
