import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Layers,
  Settings2,
} from 'lucide-react';
import { loadPolicySettings, PolicySettingsModal } from './PolicySettingsModal';

export type ActiveNavTab = 'FORECASTS' | 'SPEND_REQUESTS' | 'INTEGRATIONS';

interface SidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  pendingSpendRequestsCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenIntegrationsModal: () => void;
  onPolicyChange?: (threshold: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingSpendRequestsCount = 0,
  onOpenIntegrationsModal,
  onPolicyChange,
}) => {
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policy, setPolicy] = useState(() => loadPolicySettings());
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const navItems = [
    {
      id: 'FORECASTS' as ActiveNavTab,
      label: 'Forecasts & Runway',
      sub: 'AI Predictive Financial Ledger',
      icon: TrendingUp,
      badge: null,
      onClick: () => onSelectTab('FORECASTS'),
    },
    {
      id: 'SPEND_REQUESTS' as ActiveNavTab,
      label: 'Spend Hub & Virtual Cards',
      sub: '/buy Requests & Auto-Issued Cards',
      icon: CreditCard,
      badge: pendingSpendRequestsCount > 0 ? pendingSpendRequestsCount : null,
      onClick: () => onSelectTab('SPEND_REQUESTS'),
    },
    {
      id: 'INTEGRATIONS' as ActiveNavTab,
      label: 'Integrations Hub',
      sub: 'Slack & Email Intelligence',
      icon: Layers,
      badge: null,
      onClick: () => onOpenIntegrationsModal(),
    },
  ];

  return (
    <>
      {/* ── Vertically Centered Aesthetic Floating Dock for 4 Elements ── */}
      <div className="flex flex-col justify-center items-center px-3.5 z-30 select-none flex-shrink-0">
        <aside className="relative flex flex-col items-center p-2 rounded-2xl bg-white border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-2.5 transition-all duration-300">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id && item.id !== 'INTEGRATIONS';

            return (
              <div
                key={item.id}
                className="relative flex items-center justify-center"
                onMouseEnter={() => setHoveredTab(item.id)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                {/* Active Indicator Bar on left */}
                {isActive && (
                  <span className="absolute -left-2 top-2 bottom-2 w-1 rounded-r-full bg-vanguard-navy shadow-sm" />
                )}

                {/* Icon Button */}
                <button
                  onClick={item.onClick}
                  className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-vanguard-navy text-vanguard-gold shadow-md scale-105 font-bold'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100/90 hover:scale-102'
                  }`}
                  title={item.label}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />

                  {/* Pending Request Dot / Badge */}
                  {item.badge !== null && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white ring-2 ring-white shadow-sm font-mono animate-bounce">
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Floating Tooltip with Vanguard Palette */}
                {hoveredTab === item.id && (
                  <div
                    className="absolute left-[56px] top-1/2 -translate-y-1/2 z-50 px-3.5 py-2 bg-vanguard-navy text-white rounded-xl shadow-2xl text-xs whitespace-nowrap pointer-events-none animate-fade-in border border-white/10 flex flex-col gap-0.5"
                    style={{ filter: 'drop-shadow(0 10px 20px rgba(0,29,61,0.25))' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[13px] text-white">{item.label}</span>
                      {item.badge !== null && (
                        <span className="px-1.5 py-0.5 rounded-full bg-vanguard-gold text-vanguard-navy text-[10px] font-mono font-extrabold">
                          {item.badge} Pending
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium">{item.sub}</span>
                    {/* Triangle Pointer */}
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-vanguard-navy rotate-45 border-l border-b border-white/10" />
                  </div>
                )}
              </div>
            );
          })}

          {/* 4th Element: Policy Settings */}
          <div
            className="relative flex items-center justify-center pt-1 border-t border-slate-100 w-full"
            onMouseEnter={() => setHoveredTab('POLICY')}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <button
              onClick={() => setPolicyOpen(true)}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100/90 hover:scale-102 transition-all cursor-pointer"
              title="Policy Settings"
            >
              <Settings2 className="w-5 h-5 stroke-[1.8]" />
            </button>

            {/* Policy Tooltip */}
            {hoveredTab === 'POLICY' && (
              <div
                className="absolute left-[56px] top-1/2 -translate-y-1/2 z-50 px-3.5 py-2 bg-vanguard-navy text-white rounded-xl shadow-2xl text-xs whitespace-nowrap pointer-events-none animate-fade-in border border-white/10 flex flex-col gap-0.5"
                style={{ filter: 'drop-shadow(0 10px 20px rgba(0,29,61,0.25))' }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[13px] text-white">Policy Settings</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-mono font-bold">
                    ${policy.threshold} Limit
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 font-medium">Virtual Card Single-Use Threshold</span>
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-vanguard-navy rotate-45 border-l border-b border-white/10" />
              </div>
            )}
          </div>
        </aside>
      </div>

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
