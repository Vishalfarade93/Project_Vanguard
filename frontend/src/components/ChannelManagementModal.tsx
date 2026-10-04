import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  CheckSquare,
  Square,
  Save,
  KeyRound,
  Mail,
  Sliders,
  Unlink,
} from 'lucide-react';
import {
  getIntegrationStatus,
  getSlackChannels,
  saveMonitoredChannels,
  connectSlackWorkspace,
  disconnectSlackWorkspace,
  getSlackAuthorizeUrl,
} from '../api/expenses';
import { SlackChannel, TenantIntegrationStatus } from '../types';
import { useAuth } from '../context/AuthContext';

interface ChannelManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChannelsUpdated?: () => void;
}

const SlackLogo = () => (
  <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 122.8 122.8">
    <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#e01e5a"/>
    <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36c5f0"/>
    <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C77.6 5.8 83.4 0 90.5 0s12.9 5.8 12.9 12.9v32.3z" fill="#2eb67d"/>
    <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ecb22e"/>
  </svg>
);

export const ChannelManagementModal: React.FC<ChannelManagementModalProps> = ({
  isOpen,
  onClose,
  onChannelsUpdated,
}) => {
  const { workspace } = useAuth();

  const [status, setStatus] = useState<TenantIntegrationStatus | null>(null);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  // Token update drawer
  const [showTokenUpdate, setShowTokenUpdate] = useState<boolean>(false);
  const [newToken, setNewToken] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Copy feedback
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  const inboundEmail = `inbox-${status?.inboundEmailSlug || workspace?.slug || 'company'}@vanguardbudget.com`;

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getIntegrationStatus();
      setStatus(data);

      if (data.monitoredChannels && data.monitoredChannels.length > 0) {
        setSelectedChannels(data.monitoredChannels);
      }

      // Fetch live channels from the connected Slack workspace
      const channelList = await getSlackChannels();
      setChannels(channelList);

      if ((!data.monitoredChannels || data.monitoredChannels.length === 0) && channelList.length > 0) {
        setSelectedChannels(channelList.slice(0, 3).map((c) => c.name));
      }
    } catch (err: any) {
      console.error('Failed to load channel management data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (name: string) => {
    setSelectedChannels((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const handleSelectAll = () => {
    if (selectedChannels.length === channels.length) {
      setSelectedChannels([]);
    } else {
      setSelectedChannels(channels.map((c) => c.name));
    }
  };

  const handleSaveChannels = async () => {
    try {
      setIsSaving(true);
      await saveMonitoredChannels(selectedChannels);
      setSavedNotice(true);
      if (onChannelsUpdated) onChannelsUpdated();
      setTimeout(() => setSavedNotice(false), 2500);
    } catch (err: any) {
      alert('Failed to save monitored channels: ' + (err.message || 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handle1ClickOAuth = async () => {
    try {
      setIsConnecting(true);
      setTokenError(null);
      const res = await getSlackAuthorizeUrl(workspace?.id);
      if (res.isConfigured && res.authorizeUrl) {
        window.location.href = res.authorizeUrl;
      } else {
        setShowTokenUpdate(true);
        setTokenError(res.message || 'Slack Client ID/Secret not set. You can connect via Bot Token directly below.');
      }
    } catch (err: any) {
      setShowTokenUpdate(true);
      setTokenError('OAuth initialization failed. You can connect via Bot Token below.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleUpdateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken.trim()) return;
    try {
      setIsConnecting(true);
      setTokenError(null);
      const res = await connectSlackWorkspace(newToken.trim());
      if (res.ok) {
        setNewToken('');
        setShowTokenUpdate(false);
        await loadData();
        if (onChannelsUpdated) onChannelsUpdated();
      } else {
        setTokenError(res.error || 'Failed to authenticate Slack Bot Token');
      }
    } catch (err: any) {
      setTokenError(err.response?.data?.error || err.message || 'Connection error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect this Slack workspace?')) return;
    try {
      await disconnectSlackWorkspace();
      await loadData();
      if (onChannelsUpdated) onChannelsUpdated();
    } catch (err: any) {
      alert('Failed to disconnect: ' + (err.message || 'Error'));
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(inboundEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-vanguard-navy/10 border border-vanguard-navy/20 text-vanguard-navy">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-vanguard-black flex items-center gap-2">
                Slack &amp; Channel Settings
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                  {workspace?.name || 'Your Company'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Choose which Slack channels Vanguard monitors for upcoming expense chatter
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
          
          {/* 1. Connection Status Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Slack Workspace Connection
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowTokenUpdate(!showTokenUpdate)}
                  className="text-[11px] text-vanguard-blue hover:text-vanguard-navy flex items-center gap-1 font-bold cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" />
                  {showTokenUpdate ? 'Cancel' : status?.slackConnected ? 'Manual Token' : 'Enter Token'}
                </button>
                {status?.slackConnected && (
                  <button
                    onClick={handleDisconnect}
                    className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer font-medium"
                    title="Disconnect Slack workspace"
                  >
                    <Unlink className="w-3 h-3" />
                    Disconnect
                  </button>
                )}
              </div>
            </div>

            {status?.slackConnected ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 text-xs text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-vanguard-black">{status.workspaceName} Slack</span>
                    <span className="text-slate-500 ml-2 font-mono text-[11px]">(@{status.slackBotName})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Connected
                  </span>
                  <button
                    onClick={handle1ClickOAuth}
                    className="text-[11px] text-slate-700 hover:text-vanguard-black px-2.5 py-1 bg-white border border-slate-300 rounded-lg shadow-sm transition font-medium"
                    title="Reconnect via 1-Click OAuth"
                  >
                    Reconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-vanguard-black">No Slack workspace connected yet</span>
                  <p className="text-[11px] text-slate-500">Connect in 1 click using official Slack OAuth authorization.</p>
                </div>
                <button
                  onClick={handle1ClickOAuth}
                  disabled={isConnecting}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-vanguard-navy hover:bg-vanguard-blue shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-50"
                >
                  <SlackLogo />
                  <span>{isConnecting ? 'Connecting...' : 'Add to Slack'}</span>
                </button>
              </div>
            )}

            {/* Collapsible Token Update Drawer */}
            {showTokenUpdate && (
              <form onSubmit={handleUpdateToken} className="pt-2 space-y-2 border-t border-slate-200">
                <label className="text-xs font-medium text-slate-600 block">
                  Manual Slack Bot Token (<code className="text-vanguard-blue">xoxb-...</code>)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="xoxb-your-bot-token"
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-vanguard-blue font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isConnecting || !newToken.trim()}
                    className="px-4 py-1.5 bg-vanguard-navy hover:bg-vanguard-blue disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                  >
                    {isConnecting ? 'Testing...' : 'Save Token'}
                  </button>
                </div>
                {tokenError && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                    <span>⚠️</span> {tokenError}
                  </p>
                )}
              </form>
            )}
          </div>

          {/* 2. Monitored Channels Checklist */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Monitored Channels
                </span>
                <span className="text-[11px] text-slate-500">
                  Select which channels Vanguard reads for future expenditure intent
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-[11px] text-vanguard-blue hover:text-vanguard-navy font-bold cursor-pointer"
                >
                  {selectedChannels.length === channels.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={loadData}
                  className="text-[11px] text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition cursor-pointer"
                  title="Refresh channel list from Slack"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-vanguard-blue" />
                Loading channels from Slack workspace...
              </div>
            ) : channels.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">
                No channels found. Please ensure your Slack bot has been invited to channels.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {channels.map((ch) => {
                  const isChecked = selectedChannels.includes(ch.name);
                  return (
                    <button
                      key={ch.id || ch.name}
                      type="button"
                      onClick={() => toggleChannel(ch.name)}
                      className={`flex items-start space-x-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isChecked
                          ? 'bg-blue-50/70 border-vanguard-blue/40 text-vanguard-black shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="mt-0.5 text-vanguard-blue">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-vanguard-blue" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-vanguard-black truncate font-mono">
                          {ch.name}
                        </div>
                        {ch.topic && (
                          <div className="text-[10px] text-slate-500 truncate font-sans">
                            {ch.topic}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Save Channels CTA */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                <strong className="text-vanguard-navy font-bold">{selectedChannels.length}</strong> channels actively monitored
              </span>

              <button
                onClick={handleSaveChannels}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-1.5 bg-vanguard-navy hover:bg-vanguard-blue text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {savedNotice ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                    Saved Successfully!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    {isSaving ? 'Saving...' : 'Save Monitored Channels'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3. Dedicated Inbound Quote Email */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-vanguard-blue" />
                Dedicated Quote Forwarding Email
              </span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="text-[10px] px-2.5 py-1 bg-white hover:bg-slate-100 text-vanguard-blue font-bold rounded-lg border border-slate-200 transition flex items-center gap-1 cursor-pointer shadow-sm"
              >
                {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedEmail ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-[11px] text-vanguard-blue font-mono font-bold truncate">{inboundEmail}</p>
            <p className="text-[10px] text-slate-500">
              Forward vendor proposals (AWS, Datadog) to auto-extract expenses directly into your ledger.
            </p>
          </div>

          {/* Autonomous Note */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong className="font-bold text-amber-950">Autonomous Intelligence:</strong> Vanguard continuously monitors discussions in your saved channels. When anyone mentions booking flights, upgrading cloud capacity, or renewing contracts, the AI extracts the predicted expense automatically into your ledger.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
