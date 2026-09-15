import React from 'react';
import {
  X,
  Sparkles,
  Calendar,
  MessageSquare,
  Mail,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { PredictedExpense } from '../types';

interface ExpenseDetailDrawerProps {
  expense: PredictedExpense | null;
  onClose: () => void;
}

export const ExpenseDetailDrawer: React.FC<ExpenseDetailDrawerProps> = ({
  expense,
  onClose,
}) => {
  if (!expense) return null;

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const isEmail =
    expense.sourceType === 'GMAIL' ||
    (expense.sourceChannelOrSubject &&
      expense.sourceChannelOrSubject.startsWith('Email'));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col overflow-hidden text-slate-800 font-sans">
        
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-200/70 text-slate-700">
                Forecast #{expense.id}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-vanguard-navy/10 text-vanguard-navy border border-vanguard-navy/20">
                {expense.department || 'GENERAL_OPS'}
              </span>
              {expense.isBenchmarkEstimate && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  ⚡ Benchmark Estimate
                </span>
              )}
              {expense.revisionCount && expense.revisionCount > 1 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300">
                  ⚡ Concluded ({expense.revisionCount} Revisions)
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-vanguard-black tracking-tight">
              {expense.itemDescription}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

          {/* Amount and Timing Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-amber-50/30 border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1">
                Projected Cash Outflow
              </span>
              <div className="text-3xl font-extrabold font-mono text-vanguard-black tracking-tight">
                {formatCurrency(Number(expense.estimatedAmount))}
              </div>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Target Incurred Date:{' '}
                <span className="text-vanguard-navy ml-1 font-bold">
                  {expense.predictedDate || 'Upcoming Month'}
                </span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1">
                Detection Source
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                {isEmail ? (
                  <>
                    <Mail className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                    Gmail Server
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                    Slack Server
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Origin Source & Raw Conversational Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
                <Tag className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                Captured Communication Snippet
              </span>
              <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 font-semibold">
                {expense.sourceChannelOrSubject || '#channel'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
              <div className="text-xs text-slate-800 font-mono leading-relaxed whitespace-pre-wrap italic">
                "{expense.rawSnippet || 'Discussed in team communication channel'}"
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                <span>Ingested from {isEmail ? 'Company Mail Server' : 'Slack Events API'}</span>
                <span>Real-Time Extracted</span>
              </div>
            </div>
          </div>

          {/* Conversational Thread & Revision History */}
          {expense.conversationContext && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-vanguard-blue" />
                  Negotiation &amp; Thread History ({expense.revisionCount || 1} Turn{(expense.revisionCount || 1) > 1 ? 's' : ''})
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Reconciled Single Record
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                {expense.conversationContext}
              </div>
            </div>
          )}

          {/* AI Financial Reasoning & Unit Economics */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
              <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
              AI Extraction Rationale
            </span>

            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-slate-50 border border-blue-100 space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                {expense.aiReasoning ||
                  'Identified spending intent and financial trigger in communication. Extracted item, timeline, and modeled cost projection.'}
              </p>

              {/* Confidence Score Meter */}
              <div className="space-y-1.5 pt-2 border-t border-blue-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Model Confidence Calibration</span>
                  <span className="font-bold text-vanguard-navy font-mono">
                    {expense.confidenceScore}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-vanguard-blue to-amber-500 rounded-full transition-all duration-700"
                    style={{ width: `${expense.confidenceScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Scenario Analysis Range (Low, Expected, High) */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1.5 text-vanguard-blue" />
              Financial Scenario Bandwidth
            </span>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Conservative / Low
                </span>
                <span className="text-slate-700 font-mono font-bold mt-1 block">
                  {formatCurrency(
                    expense.costRangeMin || Number(expense.estimatedAmount) * 0.85
                  )}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-300">
                <span className="text-[10px] text-amber-800 uppercase font-extrabold block">
                  Expected Forecast
                </span>
                <span className="text-vanguard-black font-mono font-extrabold mt-1 block">
                  {formatCurrency(Number(expense.estimatedAmount))}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  High Ceiling
                </span>
                <span className="text-slate-700 font-mono font-bold mt-1 block">
                  {formatCurrency(
                    expense.costRangeMax || Number(expense.estimatedAmount) * 1.25
                  )}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Proactive cash flow intelligence & early-warning system
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
