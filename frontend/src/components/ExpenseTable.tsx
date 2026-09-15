import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Calendar,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Mail,
  ChevronRight,
  Zap,
  History,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { PredictedExpense } from '../types';

interface ExpenseTableProps {
  expenses: PredictedExpense[];
  loading: boolean;
  onSelectExpense: (expense: PredictedExpense) => void;
  activeTimeframeLabel?: string;
}

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  TRAVEL:          { label: 'Travel',        color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     dot: 'bg-blue-500' },
  CONTRACTORS:     { label: 'Contractors',   color: 'text-amber-800',  bg: 'bg-amber-50 border-amber-300',   dot: 'bg-amber-500' },
  SOFTWARE_TOOLS:  { label: 'Software',      color: 'text-teal-700',   bg: 'bg-teal-50 border-teal-200',     dot: 'bg-teal-500' },
  INFRASTRUCTURE:  { label: 'Infrastructure',color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500' },
  GENERAL_OPS:     { label: 'General Ops',   color: 'text-slate-600',  bg: 'bg-slate-100 border-slate-200',  dot: 'bg-slate-400' },
};

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  loading,
  onSelectExpense,
  activeTimeframeLabel,
}) => {
  const [activeTab,        setActiveTab]        = useState<'PROJECTED' | 'HISTORY'>('PROJECTED');
  const [searchTerm,       setSearchTerm]       = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [sortOrder,        setSortOrder]        = useState<'asc' | 'desc'>('desc');
  const [currentPage,      setCurrentPage]      = useState<number>(1);
  const [pageSize,         setPageSize]         = useState<number>(8);

  const { projectedList, historyList } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const projected: PredictedExpense[] = [];
    const history:   PredictedExpense[] = [];

    expenses.forEach((item) => {
      const dateStr = item.predictedDate || todayStr;
      if (dateStr >= todayStr) projected.push(item);
      else                     history.push(item);
    });

    return { projectedList: projected, historyList: history };
  }, [expenses]);

  const tabExpenses = useMemo(() => {
    if (activeTab === 'PROJECTED') return projectedList.length > 0 ? projectedList : expenses;
    return historyList.length > 0 ? historyList : expenses;
  }, [activeTab, projectedList, historyList, expenses]);

  const filteredExpenses = useMemo(() => {
    return tabExpenses
      .filter((item) => {
        const matchesSearch =
          item.itemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.sourceChannelOrSubject &&
            item.sourceChannelOrSubject.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesDept =
          departmentFilter === 'ALL' ? true : item.department === departmentFilter;
        return matchesSearch && matchesDept;
      })
      .sort((a, b) => {
        const amtA = Number(a.estimatedAmount) || 0;
        const amtB = Number(b.estimatedAmount) || 0;
        return sortOrder === 'desc' ? amtB - amtA : amtA - amtB;
      });
  }, [tabExpenses, searchTerm, departmentFilter, sortOrder]);

  // Reset page on user-driven filter changes — NOT on expenses polling
  useEffect(() => { setCurrentPage(1); }, [searchTerm, departmentFilter, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / pageSize));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const startIndex       = (currentPage - 1) * pageSize;
  const endIndex         = Math.min(startIndex + pageSize, filteredExpenses.length);
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  const calcLeadTime = (dateStr?: string) => {
    if (!dateStr) return 21;
    try {
      const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
      return Math.max(0, diff);
    } catch { return 21; }
  };

  const catMeta = (dept?: string) => CATEGORY_META[dept ?? ''] ?? CATEGORY_META.GENERAL_OPS;

  const confColor = (score: number) => {
    if (score >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-700' };
    if (score >= 60) return { bar: 'bg-amber-500',   text: 'text-amber-700'   };
    return                  { bar: 'bg-rose-500',    text: 'text-rose-600'    };
  };

  return (
    <div className="glass-card flex flex-col overflow-hidden">
      {/* ── Tab Strip ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 pt-1">
        <div className="flex items-center gap-1">
          {/* Projected tab */}
          <button
            onClick={() => setActiveTab('PROJECTED')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all font-display ${
              activeTab === 'PROJECTED'
                ? 'border-vanguard-blue text-vanguard-navy'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'PROJECTED' ? 'text-vanguard-gold' : 'text-slate-400'}`} />
            Projected Outflows
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'PROJECTED' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500'
            }`}>
              {projectedList.length}
            </span>
          </button>

          {/* History tab */}
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all font-display ${
              activeTab === 'HISTORY'
                ? 'border-vanguard-blue text-vanguard-navy'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <History className={`w-3.5 h-3.5 ${activeTab === 'HISTORY' ? 'text-vanguard-blue' : 'text-slate-400'}`} />
            History
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'HISTORY' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'
            }`}>
              {historyList.length}
            </span>
          </button>
        </div>

        {activeTimeframeLabel && (
          <span className="text-[11px] text-slate-400 font-medium shrink-0 hidden sm:block">
            {activeTimeframeLabel}
          </span>
        )}
      </div>

      {/* ── Controls Bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        {/* Search */}
        <div className="relative flex-1 min-w-[140px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-vanguard-blue focus:ring-1 focus:ring-vanguard-blue/20 transition font-sans"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-slate-400 hover:text-slate-700" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="relative">
          <SlidersHorizontal className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-vanguard-blue appearance-none font-sans cursor-pointer"
          >
            <option value="ALL">All</option>
            <option value="TRAVEL">Travel</option>
            <option value="CONTRACTORS">Contractors</option>
            <option value="SOFTWARE_TOOLS">Software</option>
            <option value="INFRASTRUCTURE">Infrastructure</option>
            <option value="GENERAL_OPS">General Ops</option>
          </select>
        </div>

        {/* Sort */}
        <button
          onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition cursor-pointer"
        >
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
          {sortOrder === 'desc' ? 'Highest' : 'Lowest'}
        </button>

        {/* Live indicator */}
        <div className="ml-auto hidden md:flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* ── Expense Feed (card-rows, no horizontal scroll) ─────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          // Skeleton loading
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3.5 animate-pulse">
                <div className="w-8 h-8 rounded-lg shimmer-box flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-48 shimmer-box" />
                  <div className="h-2.5 w-72 shimmer-box" />
                  <div className="flex gap-2">
                    <div className="h-5 w-20 shimmer-box rounded-full" />
                    <div className="h-5 w-16 shimmer-box rounded-full" />
                  </div>
                </div>
                <div className="space-y-2 text-right flex-shrink-0">
                  <div className="h-5 w-20 shimmer-box" />
                  <div className="h-2 w-14 shimmer-box" />
                </div>
              </div>
            ))}
          </div>
        ) : paginatedExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <AlertCircle className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-semibold text-sm text-slate-600">No matching expenses</p>
            <p className="text-xs mt-1">Try switching tabs or adjusting filters</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {paginatedExpenses.map((expense, idx) => {
              const isEmail = expense.sourceType === 'GMAIL' ||
                (expense.sourceChannelOrSubject?.startsWith('Email') ?? false);
              const leadTime = expense.advanceDaysNotice ?? calcLeadTime(expense.predictedDate);
              const cm       = catMeta(expense.department);
              const cc       = confColor(expense.confidenceScore ?? 0);
              const amount   = Number(expense.estimatedAmount) || 0;

              return (
                <div
                  key={expense.id}
                  onClick={() => onSelectExpense(expense)}
                  className="expense-row flex items-start gap-3 px-4 py-3.5 cursor-pointer group animate-fade-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* Source icon pill */}
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5 ${
                    isEmail
                      ? 'bg-sky-50 border border-sky-200'
                      : 'bg-indigo-50 border border-indigo-200'
                  }`}>
                    {isEmail
                      ? <Mail className="w-3.5 h-3.5 text-sky-600" />
                      : <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    }
                  </div>

                  {/* Center: Description + meta */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Title + badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-sm text-vanguard-black group-hover:text-vanguard-blue transition-colors font-display leading-tight">
                        {expense.itemDescription}
                      </span>
                      {expense.isBenchmarkEstimate && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          ⚡ Benchmark
                        </span>
                      )}
                      {(expense.revisionCount ?? 0) > 1 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          🔁 Concluded ({expense.revisionCount})
                        </span>
                      )}
                    </div>

                    {/* Source + snippet */}
                    <p className="text-[11px] text-slate-400 leading-tight line-clamp-1 italic">
                      {expense.sourceChannelOrSubject ?? '#general'} ·{' '}
                      "{expense.rawSnippet ? expense.rawSnippet.slice(0, 58) + '…' : 'Discussed in channel'}"
                    </p>

                    {/* Meta chips row */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {/* Category */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cm.bg} ${cm.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cm.dot}`} />
                        {cm.label}
                      </span>

                      {/* Date */}
                      {expense.predictedDate && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Calendar className="w-2.5 h-2.5 text-slate-400" />
                          {expense.predictedDate}
                        </span>
                      )}

                      {/* Lead time */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Zap className="w-2.5 h-2.5" />
                        {leadTime}d ahead
                      </span>
                    </div>
                  </div>

                  {/* Right: Amount + confidence */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-1.5 min-w-[80px]">
                    <span className="font-mono font-extrabold text-base text-vanguard-black tracking-tight">
                      {formatCurrency(amount)}
                    </span>

                    {/* Confidence score + bar */}
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold font-mono ${cc.text}`}>
                        {expense.confidenceScore ?? 0}%
                      </span>
                      <div className="conf-bar-track">
                        <div
                          className={`conf-bar-fill ${cc.bar}`}
                          style={{ width: `${expense.confidenceScore ?? 0}%` }}
                        />
                      </div>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-vanguard-blue transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pagination Footer ──────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2 flex-wrap">
        {/* Count + rows selector */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>
            <span className="font-bold text-vanguard-navy font-mono">{filteredExpenses.length === 0 ? 0 : startIndex + 1}</span>
            {' – '}
            <span className="font-bold text-vanguard-navy font-mono">{endIndex}</span>
            {' of '}
            <span className="font-bold text-vanguard-blue font-mono">{filteredExpenses.length}</span>
          </span>
          <div className="flex items-center gap-1">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {/* Page nav */}
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
            className="p-1 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer">
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="p-1 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <React.Fragment key={p}>
                    {prev && p - prev > 1 && <span className="text-slate-400 text-xs px-0.5">…</span>}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-[26px] h-6 rounded text-xs font-bold font-mono transition cursor-pointer ${
                        currentPage === p
                          ? 'bg-vanguard-blue text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}
          </div>

          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer">
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
