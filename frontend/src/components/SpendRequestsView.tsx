import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Send,
  RefreshCw,
  Search,
  Sliders,
  Flame,
  Zap,
  User,
} from 'lucide-react';
import { SpendRequest } from '../types';
import {
  getSpendRequests,
  submitBuyCommand,
  approveSpendRequest,
  rejectSpendRequest,
  simulateCardSwipe,
  reconcileReceipt,
} from '../api/spendRequests';
import { ViewCardButton } from './VirtualCardModal';
import { loadPolicySettings } from './PolicySettingsModal';

interface SpendRequestsViewProps {
  onOpenIntegrations?: () => void;
}

export const SpendRequestsView: React.FC<SpendRequestsViewProps> = ({
  onOpenIntegrations,
}) => {
  const [requests, setRequests] = useState<SpendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Read policy from settings (updated by sidebar)
  const [policy] = useState(() => loadPolicySettings());
  const policyThreshold = policy.threshold;

  // Command simulator states
  const [commandText, setCommandText] = useState('/buy Ergonomic Office Chair $240 from Operations');
  const [isSubmittingCommand, setIsSubmittingCommand] = useState(false);
  const [commandNotice, setCommandNotice] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getSpendRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load spend requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandText.trim()) return;

    try {
      setIsSubmittingCommand(true);
      setCommandNotice(null);
      const created = await submitBuyCommand(commandText.trim(), '@alex_lead', '#procurement');
      await fetchRequests();

      if (created.status === 'EXCEEDS_POLICY') {
        setCommandNotice(`Blocked by Policy: Request for $${created.requestedAmount} exceeds $${policyThreshold} threshold. Directed to manual reimbursement.`);
      } else {
        setCommandNotice(`Success: Spend request created for ${created.itemDescription} ($${created.approvedAmount || policyThreshold}). Awaiting manager approval.`);
      }
      setTimeout(() => setCommandNotice(null), 6000);
    } catch (err: any) {
      alert('Failed to execute command: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmittingCommand(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setActionLoading(id);
      await approveSpendRequest(id);
      await fetchRequests();
    } catch (err: any) {
      alert('Approval failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Reason for rejection (optional):', 'Exceeds current discretionary budget.');
    if (reason === null) return;

    try {
      setActionLoading(id);
      await rejectSpendRequest(id, reason);
      await fetchRequests();
    } catch (err: any) {
      alert('Rejection failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulateSwipe = async (id: number, amount: number) => {
    try {
      setActionLoading(id);
      await simulateCardSwipe(id, amount, 'Amazon Business / Authorized Vendor');
      await fetchRequests();
    } catch (err: any) {
      alert('Swipe failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReconcile = async (id: number) => {
    try {
      setActionLoading(id);
      await reconcileReceipt(id, 'Verified merchant receipt invoice: Item specs & total match single-use card swipe.');
      await fetchRequests();
    } catch (err: any) {
      alert('Reconcile failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let pending = 0;
    let pendingSpend = 0;
    let activeCards = 0;
    let exceedsPolicy = 0;
    let reconciled = 0;

    requests.forEach((r) => {
      if (r.status === 'PENDING_APPROVAL') {
        pending++;
        pendingSpend += Number(r.approvedAmount || r.requestedAmount || policyThreshold);
      } else if (r.status === 'APPROVED_CARD_ISSUED') {
        activeCards++;
      } else if (r.status === 'EXCEEDS_POLICY') {
        exceedsPolicy++;
      } else if (r.status === 'RECONCILED') {
        reconciled++;
      }
    });

    return { pending, pendingSpend, activeCards, exceedsPolicy, reconciled };
  }, [requests, policyThreshold]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
      const matchesSearch =
        r.itemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.department.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [requests, filterStatus, searchTerm]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-5 animate-fade-in text-slate-800">

      {/* ── Top Header & Title ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-vanguard-navy text-amber-400">
            <CreditCard className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-lg sm:text-xl font-bold font-display text-vanguard-black tracking-tight">
              Spend Approvals & Virtual Cards
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Employee procurement via <code className="text-vanguard-blue font-bold">/buy</code> · Single-use cards · <strong>${policyThreshold}</strong> policy cap
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenIntegrations && (
            <button
              onClick={onOpenIntegrations}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Configure Slack Webhooks"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Slack Webhooks</span>
            </button>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-1.5 text-xs text-blue-800 font-semibold" title="Lithic Sandbox Issuing API Connected">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">Lithic Sandbox</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cap: <strong>${policyThreshold}</strong></span>
          </div>
          <button
            onClick={fetchRequests}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition cursor-pointer"
            title="Refresh queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-vanguard-blue' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── 4 KPI Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-display text-vanguard-black">{stats.pending}</div>
            <span className="text-[11px] text-amber-700 font-medium">{formatCurrency(stats.pendingSpend)} under review</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Active Cards</span>
            <CreditCard className="w-4 h-4 text-vanguard-blue" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-display text-vanguard-black">{stats.activeCards}</div>
            <span className="text-[11px] text-emerald-700 font-medium">Single-use · 24h locked</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Exceeds Limit</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-display text-vanguard-black">{stats.exceedsPolicy}</div>
            <span className="text-[11px] text-rose-700 font-medium">Manual PO required</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Reconciled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-display text-vanguard-black">{stats.reconciled}</div>
            <span className="text-[11px] text-emerald-700 font-medium">100% receipt verified</span>
          </div>
        </div>
      </div>

      {/* ── Interactive /buy Command Console ──────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-vanguard-navy to-slate-900 text-white shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-display">
              Slack <code className="text-amber-300">/buy</code> Command Simulator
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Threshold: <strong className="text-amber-300">${policyThreshold}</strong> · Requests above auto-blocked
          </span>
        </div>

        <form onSubmit={handleCommandSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={commandText}
              onChange={(e) => setCommandText(e.target.value)}
              placeholder="e.g. /buy Ergonomic Chair $240 or /buy Sony Camera $1,200"
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs font-mono text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white/15 transition"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmittingCommand || !commandText.trim()}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmittingCommand ? 'Processing...' : 'Execute /buy'}
          </button>
        </form>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
          <span>Presets:</span>
          <button type="button" onClick={() => setCommandText('/buy Ergonomic Lumbar Chair $240 from Operations')} className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] font-mono transition cursor-pointer">
            Chair ($240)
          </button>
          <button type="button" onClick={() => setCommandText(`/buy Sony A7 IV Camera for shoots $1,200 from Marketing`)} className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-rose-300 text-[10px] font-mono transition cursor-pointer">
            Camera ($1,200 — Blocked)
          </button>
          <button type="button" onClick={() => setCommandText('/buy Standing Desk for remote work setup')} className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-amber-300 text-[10px] font-mono transition cursor-pointer">
            Desk (Unspecified)
          </button>
          <button type="button" onClick={() => setCommandText('/buy Figma Team Annual Seat $180 from Design')} className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-sky-300 text-[10px] font-mono transition cursor-pointer">
            Software ($180)
          </button>
        </div>

        {commandNotice && (
          <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-amber-200 flex items-center justify-between animate-fade-in">
            <span>{commandNotice}</span>
            <button onClick={() => setCommandNotice(null)} className="text-slate-400 hover:text-white ml-3">✕</button>
          </div>
        )}
      </div>

      {/* ── Filters & Search ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: 'ALL', label: 'All', count: requests.length },
            { id: 'PENDING_APPROVAL', label: 'Pending', count: stats.pending },
            { id: 'APPROVED_CARD_ISSUED', label: 'Active Cards', count: stats.activeCards },
            { id: 'EXCEEDS_POLICY', label: 'Exceeds Limit', count: stats.exceedsPolicy },
            { id: 'RECONCILED', label: 'Reconciled', count: stats.reconciled },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-vanguard-navy text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 rounded-full font-mono font-bold ${
                filterStatus === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search items, requesters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-vanguard-blue focus:bg-white"
          />
        </div>
      </div>

      {/* ── Main Spend Requests Queue ─────────────────────────────────────── */}
      <div className="space-y-2.5">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-2">
            <CreditCard className="w-8 h-8 mx-auto opacity-30" />
            <p className="font-semibold text-sm text-slate-600">No spend requests in this view</p>
            <p className="text-xs">Use the simulator above to submit a request via <code className="text-vanguard-blue">/buy</code></p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isPending = req.status === 'PENDING_APPROVAL';
            const isExceeds = req.status === 'EXCEEDS_POLICY';
            const isCardActive = req.status === 'APPROVED_CARD_ISSUED';
            const isSwiped = req.status === 'CARD_SWIPED';
            const isReconciled = req.status === 'RECONCILED';
            const isRejected = req.status === 'REJECTED';
            const hasCard = isCardActive || isSwiped || isReconciled;

            return (
              <div
                key={req.id}
                className={`p-4 rounded-2xl border bg-white shadow-sm transition-all duration-200 ${
                  isExceeds
                    ? 'border-rose-200 bg-rose-50/30'
                    : isPending
                    ? 'border-amber-200/80 ring-1 ring-amber-300/30'
                    : isReconciled
                    ? 'border-emerald-200/60 bg-emerald-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: meta + item */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Status badge row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        #{req.id}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-vanguard-navy/8 text-vanguard-navy border border-vanguard-navy/15">
                        {req.department}
                      </span>

                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                      {isExceeds && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertTriangle className="w-3 h-3" /> Exceeds ${policyThreshold} Limit
                        </span>
                      )}
                      {isCardActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Card Issued · 24h
                        </span>
                      )}
                      {isSwiped && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">
                          <Flame className="w-3 h-3" /> Swiped · Receipt Pending
                        </span>
                      )}
                      {isReconciled && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <ShieldCheck className="w-3 h-3" /> Reconciled & Audited
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-300">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </div>

                    {/* Item title */}
                    <h3 className="text-sm font-bold text-vanguard-black tracking-tight leading-tight">
                      {req.itemDescription}
                    </h3>

                    {/* Requester row */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1 text-slate-700 font-semibold">
                        <User className="w-3 h-3 text-slate-400" />
                        {req.requesterName}
                      </span>
                      <span>in {req.requesterChannel || '#procurement'}</span>
                      <span>·</span>
                      <span>Policy: ${policyThreshold}</span>
                    </div>

                    {/* Exceeds policy banner */}
                    {isExceeds && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-0.5">
                        <p className="font-bold flex items-center gap-1 text-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          Automated Virtual Card Blocked
                        </p>
                        <p className="text-[11px] text-rose-700">{req.rejectionReason}</p>
                      </div>
                    )}

                    {/* Rejection reason */}
                    {isRejected && req.rejectionReason && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                        Reason: "{req.rejectionReason}"
                      </p>
                    )}

                    {/* Swipe info */}
                    {(isSwiped || isReconciled) && req.actualChargedAmount && (
                      <div className="flex items-center gap-3 text-xs font-mono text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <span>Actual Charged: <strong>{formatCurrency(req.actualChargedAmount)}</strong></span>
                        <span>Merchant: {req.merchantName}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: amount + actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {/* Amount */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {isPending ? 'Requested Cap' : 'Card Limit'}
                      </span>
                      <div className={`text-xl font-extrabold font-mono tracking-tight ${isExceeds ? 'text-rose-700' : 'text-vanguard-black'}`}>
                        {formatCurrency(Number(req.approvedAmount || req.requestedAmount || policyThreshold))}
                      </div>
                    </div>

                    {/* Pending actions */}
                    {isPending && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={actionLoading === req.id}
                          className="py-1.5 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <CreditCard className="w-3 h-3" />
                          {actionLoading === req.id ? 'Issuing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoading === req.id}
                          className="py-1.5 px-2.5 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {/* View card button for cards */}
                    {hasCard && (
                      <ViewCardButton
                        request={req}
                        onSimulateSwipe={handleSimulateSwipe}
                        onReconcile={handleReconcile}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
