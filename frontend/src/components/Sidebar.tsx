import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Layers,
  ShieldCheck,
  Building2,
  Settings2,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loadPolicySettings, PolicySettingsModal } from './PolicySettingsModal';

export type ActiveNavTab = 'FORECASTS' | 'SPEND_REQUESTS' | 'INTEGRATIONS';

interface SidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  pendingSpendRequestsCount?: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenIntegrationsModal: () => void;
  onPolicyChange?: (threshold: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingSpendRequestsCount = 0,
  isCollapsed,
  onToggleCollapse,
  onOpenIntegrationsModal,
  onPolicyChange,
}) => {
  const { workspace } = useAuth();
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policy, setPolicy] = useState(() => loadPolicySettings());

  const navItems = [
    {
      id: 'FORECASTS' as ActiveNavTab,
      label: 'Forecasts & Runway',
      sub: 'Passive AI financial ledger',
      icon: TrendingUp,
      badge: null,
      onClick: () => onSelectTab('FORECASTS'),
    },
    {
      id: 'SPEND_REQUESTS' as ActiveNavTab,
      label: 'Spend Hub & Cards',
      sub: '/buy requests & virtual cards',
      icon: CreditCard,
      badge: pendingSpendRequestsCount > 0 ? pendingSpendRequestsCount : null,
      onClick: () => onSelectTab('SPEND_REQUESTS'),
    },
    {
      id: 'INTEGRATIONS' as ActiveNavTab,
      label: 'Integrations Hub',
      sub: 'Slack channels & Gmail',
      icon: Layers,
      badge: null,
      onClick: () => onOpenIntegrationsModal(),
    },
  ];

  return (
    <>
      <aside
        className={`relative flex flex-col justify-between bg-[#0b1730] text-white z-30 shadow-2xl border-r border-white/8 select-none flex-shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[60px]' : 'w-[230px]'
        }`}
      >
        {/* ── Brand Header ───────────────────────────────────────────────── */}
        <div>
          <div
            className={`flex items-center gap-3 px-3.5 py-5 border-b border-white/8 cursor-pointer group`}
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {/* Logo mark */}
            <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-200 text-slate-950 flex items-center justify-center font-extrabold text-sm shadow-md shrink-0 transition-transform group-hover:scale-105">
              V
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <span className="font-extrabold text-[13px] font-display tracking-wider text-white uppercase block leading-none truncate">
                  Vanguard
                </span>
                <span className="text-[10px] text-amber-300/70 font-medium tracking-wide block mt-0.5">
                  Predictive Capital
                </span>
              </div>
            )}

            {/* Collapse / Expand indicator */}
            <ChevronRight
              className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 shrink-0 ${
                isCollapsed ? 'rotate-0' : 'rotate-180'
              }`}
            />
          </div>

          {/* ── Navigation Links ──────────────────────────────────────────── */}
          <nav className="px-2 py-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && item.id !== 'INTEGRATIONS';

              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 cursor-pointer group relative ${
                    isCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-white/10 shadow-inner'
                      : 'hover:bg-white/6 text-slate-400 hover:text-white'
                  }`}
                >
                  {/* Active indicator line */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-amber-400" />
                  )}

                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-amber-300' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />

                  {!isCollapsed && (
                    <div className="flex-1 text-left min-w-0 overflow-hidden">
                      <div className={`text-xs font-semibold leading-tight truncate ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal leading-tight truncate group-hover:text-slate-400">
                        {item.sub}
                      </div>
                    </div>
                  )}

                  {/* Badge (expanded) */}
                  {!isCollapsed && item.badge !== null && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 font-mono shrink-0">
                      {item.badge}
                    </span>
                  )}

                  {/* Badge dot (collapsed) */}
                  {isCollapsed && item.badge !== null && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#0b1730]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Bottom Section ─────────────────────────────────────────────── */}
        <div className="pb-3 border-t border-white/8 space-y-1 pt-2 px-2">
          {/* Policy settings button */}
          <button
            onClick={() => setPolicyOpen(true)}
            title={isCollapsed ? 'Policy Settings' : undefined}
            className={`w-full flex items-center gap-3 rounded-xl py-2.5 transition cursor-pointer group hover:bg-white/6 ${
              isCollapsed ? 'px-0 justify-center' : 'px-3'
            }`}
          >
            <Settings2 className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-amber-300 transition-colors" />
            {!isCollapsed && (
              <div className="flex-1 text-left min-w-0">
                <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200 block truncate">Policy Settings</span>
                <span className="text-[10px] text-slate-600 group-hover:text-slate-400 block truncate">
                  Threshold: <strong className="text-emerald-400">${policy.threshold}</strong>
                </span>
              </div>
            )}
          </button>

          {/* Policy active badge (expanded only) */}
          {!isCollapsed && (
            <div className="mx-0.5 p-2.5 rounded-xl bg-emerald-900/20 border border-emerald-500/15 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>${policy.threshold} Policy Active</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Single-use virtual cards capped at ${policy.threshold}
              </p>
            </div>
          )}

          {/* Workspace pill */}
          {!isCollapsed && (
            <div className="mx-0.5 flex items-center gap-2 p-2 rounded-xl bg-white/4 text-xs text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-amber-300/70 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-bold text-slate-200 block truncate text-[11px]">{workspace?.name || 'Acme Corp'}</span>
                <span className="text-[10px] text-slate-500 block font-mono">Workspace #{workspace?.id || 1}</span>
              </div>
            </div>
          )}

          {/* Collapsed: shield icon only */}
          {isCollapsed && (
            <div className="flex justify-center py-1" title={`$${policy.threshold} Policy Active`}>
              <ShieldCheck className="w-4 h-4 text-emerald-500/60" />
            </div>
          )}
        </div>
      </aside>

      {/* Policy modal */}
      {policyOpen && (
        <PolicySettingsModal
          onClose={() => setPolicyOpen(false)}
          onSave={(s) => {
            setPolicy(s);
            onPolicyChange?.(s.threshold);
            setPolicyOpen(false);
          }}
        />
      )}
    </>
  );
};
