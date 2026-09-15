import React from 'react';
import { Sliders, Building, LogOut, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenIntegrations: () => void;
  pendingCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenIntegrations, pendingCount = 0 }) => {
  const { workspace, user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[56px] gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Geometric SVG logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-vanguard-blue to-vanguard-black flex items-center justify-center shadow-md border border-vanguard-blue/30 flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" fill="#003566" opacity="0.3" />
                <polygon points="12,4 20,9 20,15 12,20 4,15 4,9" fill="none" stroke="#FFC300" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3" fill="#FFD60A" />
                <line x1="12" y1="4" x2="12" y2="9" stroke="white" strokeWidth="1" opacity="0.6" />
                <line x1="20" y1="9" x2="15.6" y2="11.2" stroke="white" strokeWidth="1" opacity="0.6" />
                <line x1="20" y1="15" x2="15.6" y2="12.8" stroke="white" strokeWidth="1" opacity="0.6" />
                <line x1="12" y1="20" x2="12" y2="15" stroke="white" strokeWidth="1" opacity="0.6" />
                <line x1="4" y1="15" x2="8.4" y2="12.8" stroke="white" strokeWidth="1" opacity="0.6" />
                <line x1="4" y1="9" x2="8.4" y2="11.2" stroke="white" strokeWidth="1" opacity="0.6" />
              </svg>
            </div>

            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-vanguard-black tracking-tight font-display leading-none">
                  Vanguard <span className="text-vanguard-blue font-semibold">Intelligence</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-vanguard-gold animate-pulse" />
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-none mt-0.5">
                Autonomous financial early-warning · Slack & Gmail
              </p>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Workspace badge */}
            {workspace && (
              <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
                <Building className="w-3.5 h-3.5 text-vanguard-blue" />
                <span className="font-semibold text-vanguard-navy font-display">{workspace.name}</span>
                <span className="text-[10px] bg-blue-100 text-vanguard-blue px-1.5 py-0.5 rounded font-mono font-bold">
                  #{workspace.id}
                </span>
              </div>
            )}

            {/* Integrations button */}
            <button
              onClick={onOpenIntegrations}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-vanguard-navy bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer font-display"
            >
              <Sliders className="w-3.5 h-3.5 text-vanguard-blue" />
              <span className="hidden sm:inline">Channels</span>
            </button>

            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs text-emerald-800 font-semibold">
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
              <div className="flex items-center pl-2 border-l border-slate-200 gap-2">
                <div className="hidden lg:flex flex-col text-right leading-tight">
                  <span className="text-xs font-bold text-vanguard-black font-display">{user.fullName}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">{user.role.replace('_', ' ')}</span>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition cursor-pointer"
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
