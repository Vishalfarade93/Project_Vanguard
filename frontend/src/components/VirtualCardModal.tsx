import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Copy,
  Check,
  Clock,
  Flame,
  Lock,
  X,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { SpendRequest } from '../types';

interface VirtualCardModalProps {
  request: SpendRequest;
  onClose: () => void;
  onSimulateSwipe?: (requestId: number, amount: number) => void;
  onReconcile?: (requestId: number) => void;
}

export const VirtualCardModal: React.FC<VirtualCardModalProps> = ({
  request,
  onClose,
  onSimulateSwipe,
  onReconcile,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isBurned = request.isBurned || request.status === 'CARD_SWIPED' || request.status === 'RECONCILED';
  const approvedLimit = request.approvedAmount || 300.0;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

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
    const chargeAmount = request.requestedAmount && request.requestedAmount > 0
      ? request.requestedAmount
      : approvedLimit;
    onSimulateSwipe(request.id, chargeAmount);
    setTimeout(() => { setIsSwiping(false); onClose(); }, 800);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

  return (
    /* Completely transparent backdrop with crystal glass blur — zero black / dark tint */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      style={{
        background: 'transparent',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Modal Container */}
      <div
        className="relative w-full max-w-md animate-fade-in"
        style={{
          animation: 'slideUpModal 0.25s cubic-bezier(.16,1,.3,1) both',
          filter: 'drop-shadow(0 25px 35px rgba(0, 20, 50, 0.28)) drop-shadow(0 0 1px rgba(0,0,0,0.15))'
        }}
      >
        {/* Header Glass Capsule */}
        <div className="flex items-center justify-between mb-3.5 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center font-extrabold text-slate-950 text-xs shadow-md">
              V
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-slate-900 font-bold text-sm leading-tight truncate max-w-[210px]">{request.itemDescription}</p>
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              </div>
              <p className="text-slate-500 text-[11px] font-medium">Request #{request.id} · <span className="font-semibold text-slate-700">{request.requesterName}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-sm"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Face */}
        <div className={`relative w-full aspect-[1.586/1] rounded-2xl p-5 shadow-2xl flex flex-col justify-between overflow-hidden text-white font-mono select-none transition-all duration-300 ${
          isBurned
            ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border border-slate-600/50'
            : 'bg-gradient-to-br from-slate-950 via-[#0a1b3d] to-[#040d1f] border border-amber-500/40 ring-1 ring-white/20'
        }`}>
          {/* Subtle Glow Orbs */}
          <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-44 h-44 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />

          {/* Row 1: Brand + Status */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center font-bold text-slate-950 text-xs shadow-sm font-sans">V</div>
              <div>
                <span className="font-extrabold font-sans text-xs tracking-wider text-slate-100 uppercase">Vanguard Corporate</span>
                <span className="block text-[8px] font-sans text-slate-400 uppercase tracking-widest -mt-0.5">Single-Use Card</span>
              </div>
            </div>
            {isBurned ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/25 text-rose-200 border border-rose-500/40 shadow-sm">
                <Flame className="w-2.5 h-2.5" /> BURNED / USED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 shadow-sm animate-pulse">
                <Clock className="w-2.5 h-2.5" /> ACTIVE · 24H EXPIRY
              </span>
            )}
          </div>

          {/* Row 2: Chip + Ceiling */}
          <div className="flex items-center justify-between z-10 my-1">
            <div className="w-10 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/50 shadow-inner flex items-center justify-center relative overflow-hidden">
              <div className="w-full h-[1px] bg-amber-800/40 absolute top-2.5" />
              <div className="w-full h-[1px] bg-amber-800/40 absolute bottom-2.5" />
              <div className="h-full w-[1px] bg-amber-800/40 absolute left-3.5" />
              <div className="h-full w-[1px] bg-amber-800/40 absolute right-3.5" />
            </div>
            <div className="text-right">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-sans">Authorized Ceiling</span>
              <span className="text-xl font-extrabold text-amber-300 font-mono tracking-tight drop-shadow">{formatCurrency(approvedLimit)}</span>
            </div>
          </div>

          {/* Row 3: Card number + copy */}
          <div className="z-10 flex items-center justify-between">
            <span className="text-base font-bold tracking-widest text-slate-100 drop-shadow">
              {request.maskedCardNumber || '4242 •••• •••• 9812'}
            </span>
            <button
              onClick={handleCopyCard}
              className="p-1.5 rounded-lg hover:bg-white/15 text-slate-300 hover:text-white transition cursor-pointer"
              title="Copy card number"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Row 4: Cardholder + expiry + CVV */}
          <div className="flex items-end justify-between text-[10px] text-slate-300 pt-1.5 border-t border-white/10 z-10">
            <div>
              <span className="text-[7px] text-slate-400 uppercase block font-sans">Cardholder</span>
              <span className="font-semibold font-sans tracking-wide text-white uppercase text-[11px] truncate max-w-[160px] block">
                {request.cardholderName || request.requesterName}
              </span>
            </div>
            <div className="flex items-center gap-4">
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

        {/* Policy info panel */}
        <div className="mt-3 p-3.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/80 shadow-lg text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" /> Merchant Category Lock:
            </span>
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              {request.mccCategoryLock || 'OFFICE_EQUIPMENT_FURNITURE'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Hard Cap Policy: <strong className="text-slate-900 ml-1">{formatCurrency(approvedLimit)}</strong>
            </span>
            <span className="text-slate-500 font-medium">Automatic decline on excess</span>
          </div>
        </div>

        {/* Action buttons */}
        {request.status === 'APPROVED_CARD_ISSUED' && !isBurned && onSimulateSwipe && (
          <button
            onClick={handleSwipeClick}
            disabled={isSwiping}
            className="mt-3 w-full py-3 px-4 rounded-2xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-xl shadow-amber-400/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            <Flame className="w-4 h-4" />
            {isSwiping ? 'Processing swipe...' : `Simulate Purchase Swipe · ${formatCurrency(approvedLimit)}`}
          </button>
        )}

        {request.status === 'CARD_SWIPED' && onReconcile && (
          <div className="mt-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 shadow-md space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">Card Swiped · {formatCurrency(request.actualChargedAmount || approvedLimit)}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">Awaiting Receipt</span>
            </div>
            <button
              onClick={() => { onReconcile(request.id); onClose(); }}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" /> Simulate AI Receipt Reconciliation
            </button>
          </div>
        )}

        {request.status === 'RECONCILED' && (
          <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-md text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold">Reconciled & Audit Complete</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded-full">100% Policy Match</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
};

// ── Trigger Button ─────────────────────────────────────────────────────────
interface ViewCardButtonProps {
  request: SpendRequest;
  onSimulateSwipe?: (requestId: number, amount: number) => void;
  onReconcile?: (requestId: number) => void;
}

export const ViewCardButton: React.FC<ViewCardButtonProps> = ({
  request,
  onSimulateSwipe,
  onReconcile,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const isBurned = request.status === 'CARD_SWIPED' || request.status === 'RECONCILED';

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-sm transition-all cursor-pointer ${
          isBurned
            ? 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
            : 'bg-vanguard-navy text-amber-300 border border-vanguard-navy/30 hover:bg-slate-800 shadow-md hover:scale-[1.02]'
        }`}
        title="View virtual card details"
      >
        <CreditCard className="w-3.5 h-3.5" />
        {isBurned ? 'View Card' : 'View Card ›'}
      </button>

      {modalOpen && (
        <VirtualCardModal
          request={request}
          onClose={() => setModalOpen(false)}
          onSimulateSwipe={onSimulateSwipe}
          onReconcile={onReconcile}
        />
      )}
    </>
  );
};
