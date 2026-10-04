import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TrendingUp, MessageSquare, Mail } from 'lucide-react';
import { PredictedExpense } from '../types';

interface BudgetChartProps { expenses: PredictedExpense[] }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const slack = payload.find((p: any) => p.dataKey === 'slack')?.value ?? 0;
  const gmail = payload.find((p: any) => p.dataKey === 'gmail')?.value ?? 0;
  const total = slack + gmail;
  const fmt   = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-card-md text-xs min-w-[160px]">
      <p className="font-bold text-vanguard-black text-[11px] mb-2 font-display">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-vanguard-blue inline-block" />
            <MessageSquare className="w-2.5 h-2.5" />
            Slack
          </span>
          <span className="font-mono font-bold text-vanguard-navy">{fmt(slack)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-vanguard-gold inline-block" />
            <Mail className="w-2.5 h-2.5" />
            Gmail
          </span>
          <span className="font-mono font-bold text-amber-800">{fmt(gmail)}</span>
        </div>
        <div className="pt-1.5 mt-1 border-t border-slate-100 flex justify-between font-bold">
          <span className="text-vanguard-black">Total</span>
          <span className="font-mono text-vanguard-blue">{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
};

export const BudgetChart: React.FC<BudgetChartProps> = ({ expenses }) => {
  const chartData = useMemo(() => {
    const monthMap: Record<string, { monthKey: string; displayMonth: string; slack: number; gmail: number; total: number }> = {};

    expenses.forEach((item) => {
      if (item.status === 'REJECTED' || item.status === 'RETRACTED') return;
      const dateObj    = item.predictedDate ? new Date(item.predictedDate) : new Date();
      const monthKey   = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      const displayMonth = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { monthKey, displayMonth, slack: 0, gmail: 0, total: 0 };
      }

      const amount = Number(item.estimatedAmount) || 0;
      monthMap[monthKey].total += amount;

      const isEmail = item.sourceType === 'GMAIL' || item.sourceChannelOrSubject?.startsWith('Email');
      if (isEmail) monthMap[monthKey].gmail += amount;
      else         monthMap[monthKey].slack += amount;
    });

    return Object.values(monthMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [expenses]);

  const fmt = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;

  return (
    <div className="glass-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-vanguard-blue/10 border border-vanguard-blue/20 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-vanguard-blue" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-vanguard-black font-display leading-tight">
              Predicted Impact by Month
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Cash outflow timeline from Slack & Gmail</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-b from-vanguard-blue to-vanguard-navy inline-block" />
            Slack
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-b from-vanguard-gold to-amber-400 inline-block" />
            Gmail
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <TrendingUp className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-xs text-slate-400">No monthly data in this horizon</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="slackGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#003566" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#001D3D" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="gmailGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#FFC300" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#FFD60A" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="displayMonth"
                tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'DM Sans' }}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'DM Sans' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={fmt}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,53,102,0.04)', radius: 4 }} />
              <Bar dataKey="slack" name="Slack" fill="url(#slackGrad)" stackId="a"
                   radius={[0,0,3,3]} maxBarSize={36} />
              <Bar dataKey="gmail" name="Gmail" fill="url(#gmailGrad)" stackId="a"
                   radius={[3,3,0,0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
