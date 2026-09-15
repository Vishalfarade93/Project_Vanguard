import React, { useState, useMemo } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { Header } from './Header';
import { SlackConnectionBanner } from './SlackConnectionBanner';
import { TimeframeFilterBar } from './TimeframeFilterBar';
import { SummaryCards } from './SummaryCards';
import { BudgetChart } from './BudgetChart';
import { CategoryAllocationWidget } from './CategoryAllocationWidget';
import { ExpenseTable } from './ExpenseTable';
import { ExpenseDetailDrawer } from './ExpenseDetailDrawer';
import { ChannelManagementModal } from './ChannelManagementModal';
import { AlertCircle, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import { PredictedExpense, TimeframeOption } from '../types';

export const BudgetScenarioDashboard: React.FC = () => {
  const { expenses, loading, error, refetch } = useExpenses();

  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>('30d');
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<PredictedExpense | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredExpenses = useMemo(() => {
    if (selectedTimeframe === 'all') return expenses;
    const todayStr = new Date().toISOString().split('T')[0];
    const today    = new Date();

    return expenses.filter((exp) => {
      const dateStr = exp.predictedDate;
      if (!dateStr) return selectedTimeframe !== 'history';
      if (selectedTimeframe === 'history') return dateStr < todayStr;
      if (selectedTimeframe === 'future')  return dateStr >= todayStr;

      const diff = Math.ceil((new Date(dateStr).getTime() - today.getTime()) / 86400000);
      if (selectedTimeframe === '7d')  return diff >= 0 && diff <= 7;
      if (selectedTimeframe === '30d') return diff >= 0 && diff <= 30;
      if (selectedTimeframe === '90d') return diff >= 0 && diff <= 90;
      return true;
    });
  }, [expenses, selectedTimeframe]);

  const dynamicSummary = useMemo(() => {
    let totalSpend = 0, highConfCount = 0, highConfSpend = 0,
        pendingCount = 0, pendingSpend = 0, approvedCount = 0, approvedSpend = 0;

    filteredExpenses.forEach((exp) => {
      const amt = Number(exp.estimatedAmount) || 0;
      totalSpend += amt;
      if ((exp.confidenceScore ?? 0) >= 80) { highConfCount++; highConfSpend += amt; }
      if (exp.status === 'PENDING')           { pendingCount++;  pendingSpend  += amt; }
      else if (exp.status === 'APPROVED')     { approvedCount++; approvedSpend += amt; }
    });

    return {
      totalPredictedSpend: totalSpend,
      totalExpensesCount:  filteredExpenses.length,
      highConfidenceCount: highConfCount,
      highConfidenceSpend: highConfSpend,
      pendingReviewCount:  pendingCount,
      pendingReviewSpend:  pendingSpend,
      approvedCount,
      approvedSpend,
    };
  }, [filteredExpenses]);

  const timeframeLabels: Record<TimeframeOption, string> = {
    '7d':    'Next 7 Days',
    '30d':   'Next 30 Days',
    '90d':   'Next 90 Days (Quarterly)',
    future:  'All Future Intentions',
    history: 'Historical Archive',
    all:     'Complete Horizon',
  };

  return (
    <div className="min-h-screen flex flex-col bg-vanguard-canvas font-sans">

      {/* ─── Sticky Header ──────────────────────────────────── */}
      <Header
        onOpenIntegrations={() => setIsIntegrationsOpen(true)}
        pendingCount={dynamicSummary.totalExpensesCount}
      />

      {/* ─── Main Content ───────────────────────────────────── */}
      <main className="flex-1 max-w-screen-xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">

        {/* Toast / Error banners */}
        {notification && (
          <div className={`mb-4 px-4 py-3 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 flex-shrink-0" />
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="ml-4 hover:underline">Dismiss</button>
          </div>
        )}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button onClick={() => refetch()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 font-bold border border-rose-300 transition">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* ── Row 1: Slack banner + Timeframe filter (side-by-side on desktop) ── */}
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <div className="flex-1">
            <SlackConnectionBanner
              onOpenIntegrations={() => setIsIntegrationsOpen(true)}
              onSyncComplete={refetch}
            />
          </div>
          <div className="lg:w-auto">
            <TimeframeFilterBar
              selectedTimeframe={selectedTimeframe}
              onChangeTimeframe={setSelectedTimeframe}
              filteredCount={dynamicSummary.totalExpensesCount}
              filteredTotalSpend={dynamicSummary.totalPredictedSpend}
            />
          </div>
        </div>

        {/* ── Row 2: 4 KPI Summary Cards ──────────────────────────────────── */}
        <div className="mb-4">
          <SummaryCards summary={dynamicSummary} loading={loading} />
        </div>

        {/* ── Row 3: Parallel — Expense Feed (left) + Charts (right, sticky) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* LEFT: Expense card-list feed */}
          <div className="lg:col-span-7">
            <ExpenseTable
              expenses={filteredExpenses}
              loading={loading}
              onSelectExpense={setSelectedExpense}
              activeTimeframeLabel={timeframeLabels[selectedTimeframe]}
            />
          </div>

          {/* RIGHT: Sticky charts panel — fills viewport height */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-[73px] lg:self-start">
            <BudgetChart expenses={filteredExpenses} />
            <CategoryAllocationWidget expenses={filteredExpenses} />
          </div>
        </div>
      </main>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur py-3 text-center text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-vanguard-blue" />
          Vanguard Intelligence · Autonomous Financial Early-Warning · Connected to Slack
        </span>
      </footer>

      {/* ─── Drawers & Modals ───────────────────────────────── */}
      <ExpenseDetailDrawer expense={selectedExpense} onClose={() => setSelectedExpense(null)} />
      <ChannelManagementModal
        isOpen={isIntegrationsOpen}
        onClose={() => setIsIntegrationsOpen(false)}
        onChannelsUpdated={refetch}
      />
    </div>
  );
};
