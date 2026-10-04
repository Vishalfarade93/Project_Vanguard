import React, { useState } from 'react';
import {
  ShieldCheck,
  Copy,
  Check,
  Clock,
  Flame,
  Lock,
} from 'lucide-react';
import { SpendRequest } from '../types';

interface VirtualCardWidgetProps {
  request: SpendRequest;
  onSimulateSwipe?: (requestId: number, amount: number) => void;
  onReconcile?: (requestId: number) => void;
}

export const VirtualCardWidget: React.FC<VirtualCardWidgetProps> = ({
  request,
  onSimulateSwipe,
  onReconcile,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);

  const isBurned = request.isBurned || request.status === 'CARD_SWIPED' || request.status === 'RECONCILED';
  const approvedLimit = request.approvedAmount || 300.0;

  const handleCopyCard = () => {
    if (request.maskedCardNumber) {
      navigator.clipboard.writeText(request.maskedCardNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSwipeClick = () => {
    if (!onSimulateSwipe) return;
    setIsSwiping(true);
    // Charge exact or slightly lower amount (e.g. 95% of limit or exact)
    const chargeAmount = request.requestedAmount && request.requestedAmount > 0
      ? request.requestedAmount
      : approvedLimit;
    onSimulateSwipe(request.id, chargeAmount);
    setIsSwiping(false);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

  return (
    <div className="space-y-3">
      {/* ── Realistic Metallic Corporate Virtual Card ──────────────────────── */}
      <div className={`relative w-full aspect-[1.586/1] rounded-2xl p-5 shadow-xl flex flex-col justify-between overflow-hidden text-white font-mono select-none transition-all duration-300 ${
        isBurned
          ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border border-slate-600/50 opacity-90'
          : 'bg-gradient-to-br from-slate-900 via-vanguard-navy to-slate-950 border border-amber-500/30 ring-1 ring-white/10'
      }`}>
        {/* Card Background Watermark & Glow */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-vanguard-blue/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        {/* Card Header: Brand + Status Pill */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center font-bold text-slate-950 text-xs shadow-sm font-sans">
              V
            </div>
            <div>
              <span className="font-extrabold font-sans text-xs tracking-wider text-slate-100 uppercase">
                Vanguard Corporate
              </span>
              <span className="block text-[8px] font-sans text-slate-400 uppercase tracking-widest -mt-0.5">
                Single-Use Card
              </span>
            </div>
          </div>

          {/* Status Badge */}
          {isBurned ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <Flame className="w-2.5 h-2.5" />
              BURNED / USED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
              <Clock className="w-2.5 h-2.5" />
              ACTIVE · 24H EXPIRY
            </span>
          )}
        </div>

        {/* Card Middle: EMV Chip & Contactless */}
        <div className="flex items-center justify-between z-10 my-1">
          {/* Gold EMV Chip */}
          <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/50 shadow-inner flex items-center justify-center relative overflow-hidden">
            <div className="w-full h-[1px] bg-amber-800/40 absolute top-2" />
            <div className="w-full h-[1px] bg-amber-800/40 absolute bottom-2" />
            <div className="h-full w-[1px] bg-amber-800/40 absolute left-3" />
            <div className="h-full w-[1px] bg-amber-800/40 absolute right-3" />
          </div>

          {/* Spending Limit Display */}
          <div className="text-right">
            <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-sans">
              Authorized Ceiling
            </span>
            <span className="text-base font-extrabold text-amber-300 font-mono tracking-tight">
              {formatCurrency(approvedLimit)}
            </span>
          </div>
        </div>

        {/* Card Number */}
        <div className="z-10 flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold tracking-widest text-slate-100 drop-shadow-sm">
            {request.maskedCardNumber || '4242 •••• •••• 9812'}
          </span>
          <button
            onClick={handleCopyCard}
            className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            title="Copy card number"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Card Footer: Cardholder, Expiry, CVV */}
        <div className="flex items-end justify-between text-[10px] text-slate-300 pt-1 border-t border-white/10 z-10">
          <div>
            <span className="text-[7px] text-slate-400 uppercase block font-sans">Cardholder</span>
            <span className="font-semibold font-sans tracking-wide text-white uppercase text-[11px] truncate max-w-[140px] block">
              {request.cardholderName || request.requesterName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <span className="text-[7px] text-slate-400 uppercase block font-sans">Expires</span>
              <span className="font-bold text-white tracking-wider">{request.expiryDate || '10/27'}</span>
            </div>
            <div>
              <span className="text-[7px] text-slate-400 uppercase block font-sans">CVV</span>
              <span className="font-bold text-white tracking-wider">{request.cvv || '419'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Merchant Category Lock & Policy Shield Banner ─────────────────── */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5 text-[11px]">
            <Lock className="w-3.5 h-3.5 text-vanguard-blue" />
            Merchant Lock:
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-vanguard-blue border border-blue-200">
            {request.mccCategoryLock || 'OFFICE_EQUIPMENT_FURNITURE'}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Hard Cap Limit: <strong>{formatCurrency(approvedLimit)}</strong>
          </span>
          <span className="text-[10px] text-slate-400">Declines if exceeded</span>
        </div>
      </div>

      {/* ── Interactive Simulation Actions ─────────────────────────────────── */}
      {request.status === 'APPROVED_CARD_ISSUED' && !isBurned && onSimulateSwipe && (
        <button
          onClick={handleSwipeClick}
          disabled={isSwiping}
          className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-vanguard-navy hover:bg-slate-800 shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          {isSwiping ? 'Processing...' : `Simulate Purchase Swipe (${formatCurrency(approvedLimit)})`}
        </button>
      )}

      {request.status === 'CARD_SWIPED' && onReconcile && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-900">Card Swiped for {formatCurrency(request.actualChargedAmount || approvedLimit)}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 font-semibold">Awaiting Receipt</span>
          </div>
          <p className="text-[11px] text-amber-800">
            Card has burned. Slack bot requested invoice receipt from {request.requesterName}.
          </p>
          <button
            onClick={() => onReconcile(request.id)}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Simulate AI Receipt Reconciliation
          </button>
        </div>
      )}

      {request.status === 'RECONCILED' && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-[11px]">Reconciled &amp; Audit Complete</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-mono">100% Policy Match</span>
        </div>
      )}
    </div>
  );
};
