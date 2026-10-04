import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Layers,
  Settings2,
  Activity,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
  const { user, logout } = useAuth();
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
      {/* ── Vanguard Slim Vertical Strip (Left Dock) ────────────────── */}
      <aside className="relative flex flex-col justify-between w-[58px] h-screen bg-vanguard-navy border-r border-slate-800/80 text-slate-300 z-40 select-none flex-shrink-0 transition-all duration-200 py-3.5">
        
        {/* Top Section & Navigation Strip */}
        <div className="flex flex-col items-center w-full space-y-3">
          {/* Top Quick AI Intelligence Trigger (fills top space elegantly) */}
          <div
            className="relative w-full flex items-center justify-center h-10"
            onMouseEnter={() => setHoveredTab('AI_STATUS')}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <div className="w-10 h-10 rounded-xl bg-vanguard-blue/40 border border-vanguard-gold/25 flex items-center justify-center text-vanguard-gold shadow-sm hover:border-vanguard-gold/50 transition cursor-default">
              <Sparkles className="w-4 h-4 text-vanguard-gold animate-pulse" />
            </div>

            {/* AI Status Tooltip */}
            {hoveredTab === 'AI_STATUS' && (
              <div
                className="absolute left-[66px] top-1/2 -translate-y-1/2 z-50 px-3 py-2 bg-vanguard-black/95 backdrop-blur-md text-white rounded-xl shadow-2xl text-xs whitespace-nowrap pointer-events-none animate-fade-in border border-vanguard-gold/20 flex flex-col gap-0.5"
                style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))' }}
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-vanguard-gold" />
                  <span className="font-bold text-[13px] text-slate-100">Vanguard AI Active</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Autonomous Expense Early-Warning</span>
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-vanguard-black rotate-45 border-l border-b border-vanguard-gold/20" />
              </div>
            )}
          </div>

          {/* Navigation Icon List */}
          <nav className="w-full flex flex-col items-center space-y-3 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && item.id !== 'INTEGRATIONS';

              return (
                <div
                  key={item.id}
                  className="relative w-full flex items-center justify-center"
                  onMouseEnter={() => setHoveredTab(item.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                >
                  {/* Left Active Indicator Bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-vanguard-gold shadow-[0_0_10px_#FFC300]" />
                  )}

                  {/* Icon Button */}
                  <button
                    onClick={item.onClick}
                    className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-vanguard-gold text-vanguard-navy font-bold shadow-glow-gold scale-105'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={item.label}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />

                    {/* Pending Request Dot / Badge */}
                    {item.badge !== null && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white ring-2 ring-vanguard-navy shadow-sm font-mono animate-bounce">
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Floating Tooltip with Vanguard Palette */}
                  {hoveredTab === item.id && (
                    <div
                      className="absolute left-[66px] top-1/2 -translate-y-1/2 z-50 px-3.5 py-2 bg-vanguard-black/95 backdrop-blur-md text-white rounded-xl shadow-2xl text-xs whitespace-nowrap pointer-events-none animate-fade-in border border-vanguard-gold/20 flex flex-col gap-0.5"
                      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[13px] text-slate-100">{item.label}</span>
                        {item.badge !== null && (
                          <span className="px-1.5 py-0.5 rounded-full bg-vanguard-gold text-vanguard-navy text-[10px] font-mono font-extrabold">
                            {item.badge} Pending
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{item.sub}</span>
                      {/* Triangle Pointer */}
                      <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-vanguard-black rotate-45 border-l border-b border-vanguard-gold/20" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Policy Settings Icon */}
            <div
              className="relative w-full flex items-center justify-center pt-1"
              onMouseEnter={() => setHoveredTab('POLICY')}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <button
                onClick={() => setPolicyOpen(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-vanguard-gold hover:bg-white/10 transition-all cursor-pointer"
                title="Policy Settings"
              >
                <Settings2 className="w-5 h-5 stroke-[1.8]" />
              </button>

              {/* Policy Tooltip */}
              {hoveredTab === 'POLICY' && (
                <div
                  className="absolute left-[66px] top-1/2 -translate-y-1/2 z-50 px-3.5 py-2 bg-vanguard-black/95 backdrop-blur-md text-white rounded-xl shadow-2xl text-xs whitespace-nowrap pointer-events-none animate-fade-in border border-vanguard-gold/20 flex flex-col gap-0.5"
                  style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] text-slate-100">Policy Settings</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                      ${policy.threshold} Limit
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Virtual Card Single-Use Threshold</span>
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-vanguard-black rotate-45 border-l border-b border-vanguard-gold/20" />
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom Strip Elements */}
        <div className="flex flex-col items-center w-full space-y-3 pb-1">
          {/* Live AI Pulse Indicator */}
          <div
            className="relative flex items-center justify-center group cursor-pointer"
            onMouseEnter={() => setHoveredTab('STATUS')}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400" title="Vanguard Engine Live">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>

            {hoveredTab === 'STATUS' && (
              <div className="absolute left-[66px] top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 bg-vanguard-black text-emerald-400 rounded-xl shadow-xl text-xs whitespace-nowrap pointer-events-none border border-emerald-500/30">
                <span className="font-bold">Autonomous Engine Live</span>
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-vanguard-black rotate-45 border-l border-b border-emerald-500/30" />
              </div>
            )}
          </div>

          {/* User Sign Out Button */}
          {user && (
            <div
              className="relative flex items-center justify-center group"
              onMouseEnter={() => setHoveredTab('LOGOUT')}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <button
                onClick={logout}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                title={`Sign out (${user.fullName})`}
              >
                <LogOut className="w-4 h-4 stroke-[1.8]" />
              </button>

              {hoveredTab === 'LOGOUT' && (
                <div
                  className="absolute left-[66px] top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 bg-vanguard-black text-rose-300 rounded-xl shadow-xl text-xs whitespace-nowrap pointer-events-none border border-rose-500/30">
                  <span className="font-semibold">Sign Out</span>
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-vanguard-black rotate-45 border-l border-b border-rose-500/30" />
                </div>
              )}
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
