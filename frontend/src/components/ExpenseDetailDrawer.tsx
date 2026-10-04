import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  MessageSquare,
  Mail,
  TrendingUp,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3,
  Save,
  RotateCcw,
  Check,
} from 'lucide-react';
import { PredictedExpense, ExpenseStatus } from '../types';
import { updateExpenseStatus, updateExpenseDetails } from '../api/expenses';

interface ExpenseDetailDrawerProps {
  expense: PredictedExpense | null;
  onClose: () => void;
  onExpenseUpdated?: () => void;
}

export const ExpenseDetailDrawer: React.FC<ExpenseDetailDrawerProps> = ({
  expense: initialExpense,
  onClose,
  onExpenseUpdated,
}) => {
  const [currentExpense, setCurrentExpense] = useState<PredictedExpense | null>(initialExpense);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states for inline editing
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDepartment, setEditDepartment] = useState('GENERAL_OPS');

  useEffect(() => {
    setCurrentExpense(initialExpense);
    if (initialExpense) {
      setEditDescription(initialExpense.itemDescription || '');
      setEditAmount(initialExpense.estimatedAmount ? String(initialExpense.estimatedAmount) : '0');
      setEditDate(initialExpense.predictedDate || '');
      setEditDepartment(initialExpense.department || 'GENERAL_OPS');
      setIsEditing(false);
    }
  }, [initialExpense]);

  if (!currentExpense) return null;

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const isEmail =
    currentExpense.sourceType === 'GMAIL' ||
    (currentExpense.sourceChannelOrSubject &&
      currentExpense.sourceChannelOrSubject.startsWith('Email'));

  const handleStatusChange = async (newStatus: ExpenseStatus) => {
    try {
      setActionLoading(newStatus);
      const updated = await updateExpenseStatus(currentExpense.id, newStatus);
      setCurrentExpense(updated);
      onExpenseUpdated?.();
    } catch (err) {
      console.error('Failed to update expense status', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading('SAVING');
      const numAmount = parseFloat(editAmount);
      if (isNaN(numAmount) || numAmount < 0) {
        alert('Please enter a valid amount.');
        return;
      }

      const updated = await updateExpenseDetails(currentExpense.id, {
        itemDescription: editDescription.trim(),
        estimatedAmount: numAmount,
        predictedDate: editDate,
        department: editDepartment,
      });

      setCurrentExpense(updated);
      setIsEditing(false);
      onExpenseUpdated?.();
    } catch (err) {
      console.error('Failed to update expense details', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelEdit = () => {
    setEditDescription(currentExpense.itemDescription || '');
    setEditAmount(currentExpense.estimatedAmount ? String(currentExpense.estimatedAmount) : '0');
    setEditDate(currentExpense.predictedDate || '');
    setEditDepartment(currentExpense.department || 'GENERAL_OPS');
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col overflow-hidden text-slate-800 font-sans">
        
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-start justify-between">
          <div className="space-y-1.5 flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-200/70 text-slate-700">
                Forecast #{currentExpense.id}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-vanguard-navy/10 text-vanguard-navy border border-vanguard-navy/20">
                {currentExpense.department || 'GENERAL_OPS'}
              </span>

              {/* Status Badge */}
              {currentExpense.status === 'APPROVED' && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                  <Check className="w-3 h-3" /> Approved Baseline
                </span>
              )}
              {currentExpense.status === 'REJECTED' && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Dismissed
                </span>
              )}
              {currentExpense.status === 'PENDING' && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  Pending Review
                </span>
              )}

              {currentExpense.isBenchmarkEstimate && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  ⚡ Benchmark Estimate
                </span>
              )}
              {currentExpense.revisionCount && currentExpense.revisionCount > 1 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300">
                  ⚡ Concluded ({currentExpense.revisionCount} Revisions)
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="pt-1">
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                  Item Description
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-vanguard-blue focus:ring-1 focus:ring-vanguard-blue"
                  placeholder="e.g. AWS Redshift Cluster"
                />
              </div>
            ) : (
              <h2 className="text-lg font-bold text-vanguard-black tracking-tight">
                {currentExpense.itemDescription}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && currentExpense.status !== 'RETRACTED' && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 shadow-2xs transition cursor-pointer"
                title="Edit forecast parameters"
              >
                <Edit3 className="w-3.5 h-3.5 text-vanguard-blue" />
                <span>Edit</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

          {/* Retracted Notice */}
          {currentExpense.status === 'RETRACTED' && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-sm animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-xs">Retracted Spend Intent (Source Deleted)</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  The original Slack conversation for this commitment was deleted or cancelled. This record is preserved in the audit log for compliance, but its estimated amount is <strong>automatically omitted from active projected outflow totals</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Dismissed / Rejected Notice */}
          {currentExpense.status === 'REJECTED' && (
            <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 shadow-sm animate-fade-in">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-xs">Dismissed from Active Financial Forecast</p>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    This item has been dismissed by finance management. It is excluded from total projected outflow calculations.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleStatusChange('PENDING')}
                disabled={actionLoading !== null}
                className="px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-lg transition shrink-0 cursor-pointer"
              >
                Restore
              </button>
            </div>
          )}

          {/* Inline Edit Form OR Summary Banner */}
          {isEditing ? (
            <div className="p-5 rounded-2xl border border-vanguard-blue/30 bg-blue-50/30 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                <span className="text-xs font-bold text-vanguard-navy uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-vanguard-blue" />
                  Edit Forecast Parameters
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Inline Adjustment</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Forecasted Amount ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-vanguard-blue focus:ring-1 focus:ring-vanguard-blue"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Projected Date
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-vanguard-blue focus:ring-1 focus:ring-vanguard-blue cursor-pointer"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Department Category
                  </label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-vanguard-blue focus:ring-1 focus:ring-vanguard-blue cursor-pointer"
                  >
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                    <option value="DATA_PLATFORM">Data Platform</option>
                    <option value="CONTRACTORS">Contractors</option>
                    <option value="ENGINEERING_TOOLS">Engineering Tools</option>
                    <option value="TRAVEL">Travel & Events</option>
                    <option value="DESIGN">Design & Creative</option>
                    <option value="GENERAL_OPS">General Operations</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={actionLoading !== null}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-vanguard-blue hover:bg-vanguard-navy shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {actionLoading === 'SAVING' ? 'Saving...' : 'Save Projection'}
                </button>
              </div>
            </div>
          ) : (
            /* Amount and Timing Banner */
            <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm ${
              currentExpense.status === 'RETRACTED' || currentExpense.status === 'REJECTED'
                ? 'bg-slate-50 border-slate-200 opacity-75'
                : 'bg-gradient-to-br from-slate-50 via-white to-amber-50/30 border-slate-200'
            }`}>
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1">
                  Projected Cash Outflow
                </span>
                <div className={`text-3xl font-extrabold font-mono tracking-tight ${
                  currentExpense.status === 'REJECTED' ? 'text-slate-400 line-through' : 'text-vanguard-black'
                }`}>
                  {formatCurrency(Number(currentExpense.estimatedAmount))}
                </div>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Target Incurred Date:{' '}
                  <span className="text-vanguard-navy ml-1 font-bold">
                    {currentExpense.predictedDate || 'Upcoming Month'}
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
          )}

          {/* Origin Source & Raw Conversational Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
                <Tag className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                Captured Communication Snippet
              </span>
              <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 font-semibold">
                {currentExpense.sourceChannelOrSubject || '#channel'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
              <div className="text-xs text-slate-800 font-mono leading-relaxed whitespace-pre-wrap italic">
                "{currentExpense.rawSnippet || 'Discussed in team communication channel'}"
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                <span>Ingested from {isEmail ? 'Company Mail Server' : 'Slack Events API'}</span>
                <span>Real-Time Extracted</span>
              </div>
            </div>
          </div>

          {/* Conversational Thread & Revision History */}
          {currentExpense.conversationContext && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-vanguard-blue" />
                  Negotiation &amp; Thread History ({currentExpense.revisionCount || 1} Turn{(currentExpense.revisionCount || 1) > 1 ? 's' : ''})
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Reconciled Single Record
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                {currentExpense.conversationContext}
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
                {currentExpense.aiReasoning ||
                  'Identified spending intent and financial trigger in communication. Extracted item, timeline, and modeled cost projection.'}
              </p>

              {/* Confidence Score Meter */}
              <div className="space-y-1.5 pt-2 border-t border-blue-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Model Confidence Calibration</span>
                  <span className="font-bold text-vanguard-navy font-mono">
                    {currentExpense.confidenceScore}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-vanguard-blue to-amber-500 rounded-full transition-all duration-700"
                    style={{ width: `${currentExpense.confidenceScore}%` }}
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
                    currentExpense.costRangeMin || Number(currentExpense.estimatedAmount) * 0.85
                  )}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-300">
                <span className="text-[10px] text-amber-800 uppercase font-extrabold block">
                  Expected Forecast
                </span>
                <span className="text-vanguard-black font-mono font-extrabold mt-1 block">
                  {formatCurrency(Number(currentExpense.estimatedAmount))}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  High Ceiling
                </span>
                <span className="text-slate-700 font-mono font-bold mt-1 block">
                  {formatCurrency(
                    currentExpense.costRangeMax || Number(currentExpense.estimatedAmount) * 1.25
                  )}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Drawer Footer with Lifecycle Management */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* If PENDING */}
            {currentExpense.status === 'PENDING' && (
              <>
                <button
                  onClick={() => handleStatusChange('APPROVED')}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {actionLoading === 'APPROVED' ? 'Approving...' : 'Approve Baseline'}
                </button>

                <button
                  onClick={() => handleStatusChange('REJECTED')}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  {actionLoading === 'REJECTED' ? 'Dismissing...' : 'Dismiss'}
                </button>
              </>
            )}

            {/* If APPROVED */}
            {currentExpense.status === 'APPROVED' && (
              <button
                onClick={() => handleStatusChange('PENDING')}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/70 border border-slate-200 bg-white transition cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Reset to Pending
              </button>
            )}

            {/* If REJECTED */}
            {currentExpense.status === 'REJECTED' && (
              <button
                onClick={() => handleStatusChange('PENDING')}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore to Forecast
              </button>
            )}
          </div>

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
