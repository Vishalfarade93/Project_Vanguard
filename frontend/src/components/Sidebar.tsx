import React from 'react';
import {
  TrendingUp,
  CreditCard,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ActiveNavTab = 'FORECASTS' | 'SPEND_REQUESTS' | 'INTEGRATIONS';

interface SidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  pendingSpendRequestsCount?: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenIntegrationsModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingSpendRequestsCount = 0,
  isCollapsed,
  onToggleCollapse,
  onOpenIntegrationsModal,
}) => {
  const { workspace } = useAuth();

  return (
    <aside
      className={`relative flex flex-col justify-between bg-vanguard-navy text-white transition-all duration-300 z-30 shadow-xl border-r border-white/10 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* ── Top Section: Logo & Brand ───────────────────────────────────────── */}
      <div>
        <div className={`flex items-center px-4 py-5 border-b border-white/10 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Vanguard Gold/Navy Monogram Logo */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-200 text-slate-950 flex items-center justify-center font-extrabold font-display text-sm shadow-md shrink-0">
              V
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-extrabold text-sm font-display tracking-wider text-white uppercase block leading-none">
                  Vanguard
                </span>
                <span className="text-[10px] text-amber-300/80 font-medium tracking-wide block mt-1">
                  Predictive Capital
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Navigation Links ──────────────────────────────────────────────── */}
        <div className="px-2 py-4 space-y-1.5">
          {/* Nav Item 1: Forecasts & Runway (Existing Dashboard) */}
          <button
            onClick={() => onSelectTab('FORECASTS')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer group ${
              activeTab === 'FORECASTS'
                ? 'bg-vanguard-blue text-white shadow-md shadow-blue-900/30'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title="Forecasts & Runway"
          >
            <TrendingUp className={`w-4 h-4 shrink-0 ${
              activeTab === 'FORECASTS' ? 'text-amber-300' : 'text-slate-400 group-hover:text-slate-200'
            }`} />
            {!isCollapsed && (
              <div className="flex-1 text-left min-w-0">
                <div className="font-bold leading-tight truncate">Forecasts &amp; Runway</div>
                <div className="text-[10px] text-slate-400 font-normal leading-tight truncate">
                  Passive AI financial ledger
                </div>
              </div>
            )}
          </button>

          {/* Nav Item 2: Spend Approvals & Cards (New /buy Module) */}
          <button
            onClick={() => onSelectTab('SPEND_REQUESTS')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer group relative ${
              activeTab === 'SPEND_REQUESTS'
                ? 'bg-vanguard-blue text-white shadow-md shadow-blue-900/30'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title="Spend Approvals & Cards"
          >
            <CreditCard className={`w-4 h-4 shrink-0 ${
              activeTab === 'SPEND_REQUESTS' ? 'text-amber-300' : 'text-slate-400 group-hover:text-slate-200'
            }`} />

            {!isCollapsed && (
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold leading-tight truncate">Spend Hub &amp; Cards</span>
                  {pendingSpendRequestsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 font-mono shadow-xs">
                      {pendingSpendRequestsCount}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 font-normal leading-tight truncate">
                  /buy requests &amp; virtual cards
                </div>
              </div>
            )}

            {isCollapsed && pendingSpendRequestsCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-vanguard-navy" />
            )}
          </button>

          {/* Nav Item 3: Integrations Hub */}
          <button
            onClick={() => onOpenIntegrationsModal()}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer group text-slate-300 hover:text-white hover:bg-white/10 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Integrations & Sources"
          >
            <Layers className="w-4 h-4 text-slate-400 group-hover:text-slate-200 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 text-left min-w-0">
                <div className="font-bold leading-tight truncate">Integrations Hub</div>
                <div className="text-[10px] text-slate-400 font-normal leading-tight truncate">
                  Slack channels &amp; Gmail
                </div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* ── Bottom Section: Policy Shield & Workspace Pill ───────────────── */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {/* Expand button if collapsed */}
        {isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {!isCollapsed && (
          <>
            {/* Policy Badge */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>$300 Strict Policy Active</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Single-use virtual cards strictly capped at $300.00
              </p>
            </div>

            {/* Workspace Card */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 text-xs text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <div className="min-w-0 flex-1 truncate">
                <span className="font-bold text-white block truncate">{workspace?.name || 'Acme Corp'}</span>
                <span className="text-[10px] text-slate-400 block truncate font-mono">Workspace #{workspace?.id || 1}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
