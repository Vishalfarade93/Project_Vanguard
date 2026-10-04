import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Layers,
  Settings2,
  Menu,
  Activity,
  LogOut,
  Building,
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
  const { workspace, user, logout } = useAuth();
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policy, setPolicy] = useState(() => loadPolicySettings());
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const navItems = [
    {
      id: 'FORECASTS' as ActiveNavTab,
      label: 'Forecasts & Runway',
      sub: 'Passive AI Financial Ledger',
      icon: TrendingUp,
      badge: null,
      activeGradient: 'from-amber-400 to-amber-500',
      shadowColor: 'rgba(245, 158, 11, 0.45)',
      onClick: () => onSelectTab('FORECASTS'),
    },
    {
      id: 'SPEND_REQUESTS' as ActiveNavTab,
      label: 'Spend Hub & Virtual Cards',
      sub: '/buy Requests & Auto-Issued Cards',
      icon: CreditCard,
      badge: pendingSpendRequestsCount > 0 ? pendingSpendRequestsCount : null,
      activeGradient: 'from-rose-400 via-pink-400 to-rose-500',
      shadowColor: 'rgba(244, 63, 94, 0.45)',
      onClick: () => onSelectTab('SPEND_REQUESTS'),
    },
    {
      id: 'INTEGRATIONS' as ActiveNavTab,
      label: 'Integrations Hub',
      sub: 'Slack Channels & Gmail Sync',
      icon: Layers,
      badge: null,
      activeGradient: 'from-sky-400 to-blue-500',
      shadowColor: 'rgba(56, 189, 248, 0.45)',
      onClick: () => onOpenIntegrationsModal(),
    },
  ];

  return (
    <>
      {/* Outer Floating Container with top/bottom margin for the modern floating dock look */}
      <aside className="relative flex flex-col justify-between my-3 ml-3 w-[72px] h-[calc(100vh-24px)] bg-[#1e202e] text-slate-300 rounded-[32px] shadow-[0_12px_32px_rgba(0,0,0,0.18)] z-40 select-none flex-shrink-0 transition-all duration-300 py-5">
        
        {/* ── Top Group: Menu / Nav Items ────────────────────────── */}
        <div className="flex flex-col items-center w-full space-y-4">
          {/* Top Menu Icon */}
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
            <Menu className="w-5 h-5 stroke-[2]" />
          </div>

          {/* Nav Items with Smooth Organic Curved Notch */}
          <nav className="w-full flex flex-col items-center space-y-3 pt-2">
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
                  {/* Organic Curved Notch Background (Smooth Bezier Bulb that protrudes to the right) */}
                  {isActive && (
                    <svg
                      width="26"
                      height="80"
                      viewBox="0 0 26 80"
                      fill="none"
                      className="absolute -right-[25px] top-1/2 -translate-y-1/2 pointer-events-none z-10"
                    >
                      <path
                        d="M0,0 C0,14 24,18 24,40 C24,62 0,66 0,80 L0,0 Z"
                        fill="#1e202e"
                      />
                    </svg>
                  )}

                  {/* Icon Button */}
                  <button
                    onClick={item.onClick}
                    className={`relative z-20 flex items-center justify-center transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'w-12 h-12 rounded-full translate-x-2.5 text-white scale-105'
                        : 'w-11 h-11 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    style={
                      isActive
                        ? {
                            background: `linear-gradient(135deg, ${item.activeGradient})`,
                            boxShadow: `0 8px 20px ${item.shadowColor}`,
                          }
                        : undefined
                    }
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4] drop-shadow-sm' : 'stroke-[1.8]'}`} />

                    {/* Pending Request Indicator Badge */}
                    {item.badge !== null && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white ring-2 ring-[#1e202e] shadow-sm font-mono animate-bounce">
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Floating Tooltip Bubble */}
                  {hoveredTab === item.id && (
                    <div
                      className="absolute left-[84px] top-1/2 -translate-y-1/2 z-50 px-3.5 py-2.5 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl text-xs whitespace-nowrap pointer-events-none animate-fade-in border border-white/15 flex flex-col gap-0.5"
                      style={{ filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.3))' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[13px]">{item.label}</span>
                        {item.badge !== null && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-extrabold">
                            {item.badge} Pending
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{item.sub}</span>
                      {/* Triangle Pointer */}
                      <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-900 rotate-45 border-l border-b border-white/15" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Policy Settings Button */}
            <div
              className="relative w-full flex items-center justify-center pt-2"
              onMouseEnter={() => setHoveredTab('POLICY')}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <button
                onClick={() => setPolicyOpen(true)}
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-all cursor-pointer"
              >
                <Settings2 className="w-5 h-5 stroke-[1.8]" />
              </button>

              {/* Tooltip */}
              {hoveredTab === 'POLICY' && (
                <div
                  className="absolute left-[84px] top-1/2 -translate-y-1/2 z-50 px-3.5 py-2.5 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl text-xs whitespace-nowrap pointer-events-none animate-fade-in border border-white/15 flex flex-col gap-0.5"
                  style={{ filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.3))' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px]">Policy Settings</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                      ${policy.threshold} Cap
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Virtual Card Single-Use Threshold</span>
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-900 rotate-45 border-l border-b border-white/15" />
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* ── Bottom Group: Status / Workspace / User / Sign Out ──── */}
        <div className="flex flex-col items-center w-full space-y-3">
          {/* Live Pulse Indicator */}
          <div
            className="relative flex items-center justify-center group cursor-pointer"
            onMouseEnter={() => setHoveredTab('STATUS')}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>

            {hoveredTab === 'STATUS' && (
              <div
                className="absolute left-[84px] top-1/2 -translate-y-1/2 z-50 px-3 py-2 bg-slate-900 text-white rounded-xl shadow-xl text-xs whitespace-nowrap pointer-events-none animate-fade-in border border-white/15"
                style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}
              >
                <span className="font-bold text-emerald-400">Vanguard AI Engine Online</span>
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-white/15" />
              </div>
            )}
          </div>

          {/* Workspace Pill / Avatar */}
          <div
            className="relative flex items-center justify-center group cursor-pointer"
            onMouseEnter={() => setHoveredTab('WORKSPACE')}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-extrabold text-xs flex items-center justify-center shadow-md">
              {workspace?.name?.charAt(0) || 'V'}
            </div>

            {hoveredTab === 'WORKSPACE' && (
              <div
                className="absolute left-[84px] top-1/2 -translate-y-1/2 z-50 px-3.5 py-2 bg-slate-900 text-white rounded-2xl shadow-xl text-xs whitespace-nowrap pointer-events-none animate-fade-in border border-white/15 flex flex-col"
                style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Building className="w-3 h-3 text-indigo-400" />
                  <span>{workspace?.name || 'Vanguard HQ'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">Workspace #{workspace?.id || 1}</span>
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-900 rotate-45 border-l border-b border-white/15" />
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
                className="w-10 h-10 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 stroke-[1.8]" />
              </button>

              {hoveredTab === 'LOGOUT' && (
                <div
                  className="absolute left-[84px] top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 bg-slate-900 text-rose-300 rounded-xl shadow-xl text-xs whitespace-nowrap pointer-events-none animate-fade-in border border-white/15"
                  style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}
                >
                  <span className="font-semibold">Sign Out ({user.fullName})</span>
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-white/15" />
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
