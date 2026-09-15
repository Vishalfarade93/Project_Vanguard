import React from 'react';
import { Layers, AlertTriangle, ShieldCheck, Database, HardDrive, Cpu, Briefcase, Palette } from 'lucide-react';
import { DepartmentBudget } from '../types';

interface DepartmentBudgetsProps {
  budgets: DepartmentBudget[];
  loading?: boolean;
}

export const DepartmentBudgets: React.FC<DepartmentBudgetsProps> = ({ budgets }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getDeptIcon = (dept: string) => {
    switch (dept) {
      case 'INFRASTRUCTURE':
        return <HardDrive className="w-4 h-4 text-cyan-400" />;
      case 'DATA_PLATFORM':
        return <Database className="w-4 h-4 text-purple-400" />;
      case 'CONTRACTORS':
        return <Briefcase className="w-4 h-4 text-amber-400" />;
      case 'ENGINEERING_TOOLS':
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'DESIGN':
        return <Palette className="w-4 h-4 text-pink-400" />;
      default:
        return <Layers className="w-4 h-4 text-blue-400" />;
    }
  };

  const getDeptTitle = (dept: string) => {
    switch (dept) {
      case 'INFRASTRUCTURE':
        return 'Cloud Storage & Compute';
      case 'DATA_PLATFORM':
        return 'Data Platform & Snowflake';
      case 'CONTRACTORS':
        return 'Contractors & Security Audits';
      case 'ENGINEERING_TOOLS':
        return 'Engineering Tools & SaaS';
      case 'DESIGN':
        return 'Design & Product Licenses';
      default:
        return dept;
    }
  };

  return (
    <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800/80 backdrop-blur-md shadow-lg space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/60 gap-2">
        <div>
          <h3 className="text-base font-bold text-white flex items-center">
            <Layers className="w-4 h-4 mr-2 text-cyan-400" />
            Department Budget Run-Rate &amp; Thresholds
          </h3>
          <p className="text-xs text-slate-400">
            Real-time consumption tracking based on conversational chatter forecasts
          </p>
        </div>

        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-cyan-400" />
          Budget Guardrails Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((item) => {
          const isWarning = item.isWarning;
          return (
            <div
              key={item.department}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                isWarning
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    {getDeptIcon(item.department)}
                  </div>
                  <span className="text-xs font-bold text-white">
                    {getDeptTitle(item.department)}
                  </span>
                </div>

                {isWarning && (
                  <span className="inline-flex items-center text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    High Usage
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between text-xs mt-3 mb-1.5">
                <span className="text-slate-400">Forecasted Spend</span>
                <span className="font-mono font-bold text-slate-200">
                  {formatCurrency(Number(item.predictedSpend))}{' '}
                  <span className="text-[10px] font-normal text-slate-500">
                    / {formatCurrency(Number(item.budgetLimit))}
                  </span>
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800/80">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isWarning
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                  }`}
                  style={{ width: `${Math.min(item.percentUsed, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                <span>{item.percentUsed}% Allocated</span>
                <span>
                  {formatCurrency(Math.max(0, item.budgetLimit - item.predictedSpend))} Available
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
