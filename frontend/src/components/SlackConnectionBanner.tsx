import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, RefreshCw, Sliders } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getIntegrationStatus, syncSlackChannels, getSlackAuthorizeUrl } from '../api/expenses';
import { TenantIntegrationStatus } from '../types';

interface SlackConnectionBannerProps {
  onOpenIntegrations: () => void;
  onSyncComplete?: () => void;
  refreshTrigger?: number;
}

const SlackMark = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 122.8 122.8">
    <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#e01e5a"/>
    <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36c5f0"/>
    <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C77.6 5.8 83.4 0 90.5 0s12.9 5.8 12.9 12.9v32.3z" fill="#2eb67d"/>
    <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ecb22e"/>
  </svg>
);

export const SlackConnectionBanner: React.FC<SlackConnectionBannerProps> = ({
  onOpenIntegrations,
  onSyncComplete,
  refreshTrigger = 0,
}) => {
  const { workspace } = useAuth();
  const [status,       setStatus]       = useState<TenantIntegrationStatus | null>(null);
  const [isSyncing,    setIsSyncing]    = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [toast,        setToast]        = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = () => getIntegrationStatus().then(setStatus).catch(() => {});

  useEffect(() => {
    fetchStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get('slack_connected') === 'true') {
      const team = params.get('team') || 'your Slack';
      setToast({ type: 'success', text: `🎉 Connected to ${team}!` });
      fetchStatus();
      if (onSyncComplete) onSyncComplete();
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setToast(null), 5000);
    } else if (params.get('slack_error')) {
      setToast({ type: 'error', text: `Authorization failed: ${params.get('slack_error')}` });
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setToast(null), 5000);
    }
  }, [workspace?.id, refreshTrigger]);

  const handleOAuth = async () => {
    const res = await getSlackAuthorizeUrl(workspace?.id).catch(() => null);
    if (res?.isConfigured && res.authorizeUrl) window.location.href = res.authorizeUrl;
    else onOpenIntegrations();
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncSlackChannels();
      setSyncFeedback(`Synced ${res.syncedChannelsCount} channels (${res.expensesExtracted} new)`);
      if (onSyncComplete) onSyncComplete();
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (e: any) {
      setSyncFeedback(`Sync failed`);
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const isConnected = status?.slackConnected ?? false;
  const teamName    = status?.workspaceName ?? workspace?.name ?? 'Company';
  const channels    = status?.monitoredChannels?.length
    ? status.monitoredChannels.slice(0, 3)
    : ['#procurement'];

  return (
    <div className="glass-card px-4 py-2.5">
      {/* Toast */}
      {toast && (
        <div className={`mb-2 px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-1.5">
            {toast.type === 'success' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {/* Left: Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <SlackMark />

          {isConnected ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
              Not connected
            </span>
          )}

          <span className="text-sm font-bold text-vanguard-black font-display">{teamName}</span>

          {isConnected && (
            <div className="flex items-center gap-1 flex-wrap">
              {channels.map((ch) => (
                <span key={ch} className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px] text-vanguard-blue font-mono font-medium">
                  {ch}
                </span>
              ))}
            </div>
          )}

          {syncFeedback && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-vanguard-blue text-[10px] font-semibold">
              <Check className="w-2.5 h-2.5 text-emerald-600" /> {syncFeedback}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isConnected ? (
            <>
              <button
                onClick={handleOAuth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-vanguard-navy hover:bg-vanguard-blue text-white shadow-xs transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                <SlackMark />
                <span>Add to Slack</span>
              </button>
              <button
                onClick={onOpenIntegrations}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-xs transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                <Sliders className="w-3 h-3 text-slate-400" />
                <span>Manage</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all duration-200 cursor-pointer disabled:opacity-50 whitespace-nowrap flex-shrink-0"
              >
                <RefreshCw className={`w-3 h-3 text-vanguard-blue ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
              </button>
              <button
                onClick={onOpenIntegrations}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-vanguard-navy hover:bg-vanguard-blue shadow-xs transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                <Sliders className="w-3 h-3 text-vanguard-gold" />
                <span>Manage</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
