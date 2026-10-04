import React from 'react';
import { Sliders, Building, LogOut, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VanguardLogo } from './VanguardLogo';

interface HeaderProps {
  onOpenIntegrations: () => void;
  pendingCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenIntegrations, pendingCount = 0 }) => {
  const { workspace, user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3 sm:gap-4 flex-nowrap">

          {/* Brand */}
          <div className="flex items-center gap-3.5 flex-shrink-0 min-w-0">
            <VanguardLogo size="md" />
            <div className="hidden xl:block border-l border-slate-200 pl-3.5">
              <p className="text-[10px] text-slate-400 font-sans leading-none">
                Autonomous spend early-warning · Slack & Email
              </p>
            </div>
          </div>

          {/* Nav Actions - strict single row, perfectly vertically aligned */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap flex-shrink-0">
            {/* Workspace badge */}
            {workspace && (
              <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs flex-shrink-0">
                <Building className="w-3.5 h-3.5 text-vanguard-blue flex-shrink-0" />
                <span className="font-semibold text-vanguard-navy font-display max-w-[140px] lg:max-w-[200px] truncate">
                  {workspace.name}
                </span>
                <span className="text-[10px] bg-blue-100 text-vanguard-blue px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0">
                  #{workspace.id}
                </span>
              </div>
            )}

            {/* Integrations button */}
            <button
              onClick={onOpenIntegrations}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-vanguard-navy bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer font-display flex-shrink-0"
              title="Manage Slack & Email Integrations"
            >
              <Sliders className="w-3.5 h-3.5 text-vanguard-blue" />
              <span className="hidden sm:inline">Integrations</span>
            </button>

            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs text-emerald-800 font-semibold flex-shrink-0">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span className="hidden md:inline">Live</span>
              {pendingCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold font-mono">
                  {pendingCount}
                </span>
              )}
            </div>

            {/* User + logout */}
            {user && (
              <div className="flex items-center pl-2 sm:pl-3 border-l border-slate-200 gap-2 sm:gap-2.5 flex-shrink-0">
                <div className="hidden md:flex flex-col text-right leading-tight">
                  <span className="text-xs font-bold text-vanguard-black font-display max-w-[130px] truncate">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition cursor-pointer flex-shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
