import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Layers,
  ShieldCheck,
  Building2,
  Settings2,
  ChevronLeft,
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
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const navItems = [
    {
      id: 'FORECASTS' as ActiveNavTab,
      label: 'Forecasts & Runway',
      sub: 'Passive AI financial ledger',
      icon: TrendingUp,
      badge: null,
      activeColor: 'from-amber-500 to-amber-400',
      activeShadow: 'shadow-amber-500/30',
      onClick: () => onSelectTab('FORECASTS'),
    },
    {
      id: 'SPEND_REQUESTS' as ActiveNavTab,
      label: 'Spend Hub & Cards',
      sub: '/buy requests & virtual cards',
      icon: CreditCard,
      badge: pendingSpendRequestsCount > 0 ? pendingSpendRequestsCount : null,
      activeColor: 'from-amber-500 to-amber-400',
      activeShadow: 'shadow-amber-500/30',
      onClick: () => onSelectTab('SPEND_REQUESTS'),
    },
    {
      id: 'INTEGRATIONS' as ActiveNavTab,
      label: 'Integrations Hub',
      sub: 'Slack channels & Gmail',
      icon: Layers,
      badge: null,
      activeColor: 'from-blue-600 to-indigo-500',
      activeShadow: 'shadow-blue-500/30',
      onClick: () => onOpenIntegrationsModal(),
    },
  ];

  return (
    <>
      <aside
        className={`relative flex flex-col justify-between bg-white/95 backdrop-blur-xl border-r border-slate-200/90 text-slate-800 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)] select-none flex-shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[72px]' : 'w-[240px]'
        }`}
      >
        {/* ── Top Navigation Group (Direct icons — no duplicate logo section) ── */}
        <div className="pt-4 pb-2">
          {/* Subtle top indicator */}
          <div className="px-3 mb-3 flex items-center justify-between">
            {!isCollapsed && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 font-display">
                Navigation
              </span>
            )}
            <button
              onClick={onToggleCollapse}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer ${
                isCollapsed ? 'mx-auto' : ''
              }`}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav Items Rail */}
          <nav className="px-2 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && item.id !== 'INTEGRATIONS';

              return (
                <div
                  key={item.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredTab(item.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                >
                  <button
                    onClick={item.onClick}
                    className={`w-full flex items-center rounded-2xl transition-all duration-200 cursor-pointer text-left relative ${
                      isCollapsed
                        ? 'p-2 justify-center'
                        : 'px-3 py-2.5 gap-3'
                    } ${
                      isActive
                        ? isCollapsed
                          ? 'bg-transparent'
                          : 'bg-amber-50/80 border border-amber-200/60 shadow-sm'
                        : 'hover:bg-slate-100/80 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {/* Active Icon Circle / Notch Bubble */}
                    <div
                      className={`relative flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? `w-11 h-11 rounded-2xl bg-gradient-to-tr ${item.activeColor} text-slate-950 shadow-lg ${item.activeShadow} ring-2 ring-white scale-105`
                          : 'w-10 h-10 rounded-xl text-slate-500 group-hover:text-slate-800 group-hover:bg-white group-hover:shadow-sm'
                      }`}
                    >
                      <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />

                      {/* Notification badge on icon (collapsed or mobile) */}
                      {item.badge !== null && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white ring-2 ring-white shadow-sm font-mono animate-bounce">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {/* Expanded Label & Subtitle */}
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0 overflow-hidden pr-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold leading-snug truncate ${
                            isActive ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'
                          }`}>
                            {item.label}
                          </span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate font-medium mt-0.5">
                          {item.sub}
                        </span>
                      </div>
                    )}

                    {/* Expanded Badge */}
                    {!isCollapsed && item.badge !== null && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 shadow-sm font-mono shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Sleek Tooltip for Collapsed State */}
                  {isCollapsed && hoveredTab === item.id && (
                    <div
                      className="absolute left-[76px] top-1/2 -translate-y-1/2 z-50 px-3 py-2 bg-slate-900 text-white rounded-xl shadow-xl text-xs font-semibold whitespace-nowrap pointer-events-none animate-fade-in flex items-center gap-2 border border-slate-700/60"
                      style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))' }}
                    >
                      <span>{item.label}</span>
                      {item.badge !== null && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-mono font-bold">
                          {item.badge}
                        </span>
                      )}
                      {/* Triangle pointer */}
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-slate-700/60" />
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* ── Bottom Section (Policy, Workspace & Settings) ──────────────── */}
        <div className="p-2.5 border-t border-slate-200/80 space-y-1.5 bg-slate-50/50">
          {/* Policy settings button */}
          <div className="relative group">
            <button
              onClick={() => setPolicyOpen(true)}
              className={`w-full flex items-center rounded-2xl p-2 transition cursor-pointer group hover:bg-white hover:shadow-sm ${
                isCollapsed ? 'justify-center' : 'gap-3 px-3 py-2.5'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60 group-hover:scale-105 transition-transform">
                <Settings2 className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 block truncate">Policy Settings</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold font-mono bg-emerald-100 text-emerald-800">
                      ${policy.threshold}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block truncate">
                    Single-use card ceiling
                  </span>
                </div>
              )}
            </button>

            {/* Tooltip for Policy settings when collapsed */}
            {isCollapsed && (
              <div className="absolute left-[76px] top-1/2 -translate-y-1/2 hidden group-hover:flex z-50 px-3 py-2 bg-slate-900 text-white rounded-xl shadow-xl text-xs font-semibold whitespace-nowrap pointer-events-none items-center gap-2 border border-slate-700/60">
                <span>Policy Settings · Limit <strong>${policy.threshold}</strong></span>
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-slate-700/60" />
              </div>
            )}
          </div>

          {/* Active Policy Status Chip (Expanded Only) */}
          {!isCollapsed && (
            <div className="px-3 py-2 rounded-xl bg-white border border-slate-200/70 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Auto-Issue Guard</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Active
              </span>
            </div>
          )}

          {/* Workspace Pill */}
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-500">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-slate-700 block truncate text-[11px]">{workspace?.name || 'Vanguard HQ'}</span>
                <span className="text-[10px] text-slate-400 block font-mono">ID #{workspace?.id || 1}</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Policy Settings Modal */}
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
