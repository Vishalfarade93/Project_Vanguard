import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Mail,
  Send,
  Sparkles,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Radio,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  Square,
  Building,
  Save,
} from 'lucide-react';
import {
  connectSlackWorkspace,
  getSlackChannels,
  syncSlackChannels,
  ingestEmail,
  getIntegrationStatus,
  saveMonitoredChannels,
} from '../api/expenses';
import { SlackChannel, TenantIntegrationStatus } from '../types';
import { useAuth } from '../context/AuthContext';

interface IntegrationsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtractionSuccess: () => void;
  onRunExtraction: () => Promise<{ count: number; message: string }>;
}

export const IntegrationsHubModal: React.FC<IntegrationsHubModalProps> = ({
  isOpen,
  onClose,
  onExtractionSuccess,
  onRunExtraction,
}) => {
  const { workspace } = useAuth();
  const [activeTab, setActiveTab] = useState<'SLACK' | 'GMAIL'>('SLACK');

  // Integration Status
  const [status, setStatus] = useState<TenantIntegrationStatus | null>(null);

  // Slack Connection State
  const [slackToken, setSlackToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedWorkspace, setConnectedWorkspace] = useState<{
    team: string;
    user: string;
    url?: string;
    isDemo?: boolean;
  } | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Channel Discovery & Selection
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannelNames, setSelectedChannelNames] = useState<string[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [isSyncingChannels, setIsSyncingChannels] = useState(false);
  const [isSavingChannels, setIsSavingChannels] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [channelsSavedNotice, setChannelsSavedNotice] = useState(false);

  // Copy state
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Gmail State
  const [emailSender, setEmailSender] = useState('enterprise-accounts@aws.amazon.com');
  const [emailSubject, setEmailSubject] = useState('AWS S3 Data Lake 60TB Storage Capacity Proposal');
  const [emailBody, setEmailBody] = useState(
    'Hi Team, following up on our call regarding your Q4 data expansion: reserving 60 TB of S3 Standard storage with Intelligent Tiering will add approximately $1,620/month to your current AWS billing commitment starting next month.'
  );
  const [isIngestingEmail, setIsIngestingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const webhookUrl = `${window.location.origin}/api/slack/events?workspaceId=${workspace?.id || 1}`;
  const inboundEmailAddress = `inbox-${status?.inboundEmailSlug || workspace?.slug || 'company'}@vanguardbudget.com`;

  // Fetch status and channels when modal opens
  useEffect(() => {
    if (isOpen) {
      loadIntegrationStatus();
    }
  }, [isOpen]);

  const loadIntegrationStatus = async () => {
    try {
      setIsLoadingChannels(true);
      const data = await getIntegrationStatus();
      setStatus(data);

      if (data.slackConnected) {
        setConnectedWorkspace({
          team: data.workspaceName + ' Slack',
          user: data.slackBotName || 'vanguard_budget_bot',
        });
      }

      if (data.monitoredChannels && data.monitoredChannels.length > 0) {
        setSelectedChannelNames(data.monitoredChannels);
      }

      // Load channels list
      const channelList = await getSlackChannels();
      setChannels(channelList);

      if ((!data.monitoredChannels || data.monitoredChannels.length === 0) && channelList.length > 0) {
        setSelectedChannelNames(channelList.slice(0, 3).map((c) => c.name));
      }
    } catch (err: any) {
      console.error('Failed to load integration status:', err);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  const handleConnectToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slackToken.trim()) return;
    try {
      setIsConnecting(true);
      setConnectionError(null);
      const res = await connectSlackWorkspace(slackToken.trim());
      if (res.ok) {
        setConnectedWorkspace({
          team: res.team || `${workspace?.name || 'Company'} Slack`,
          user: res.user || 'budget_bot',
          url: res.url,
          isDemo: res.isDemo,
        });
        await loadIntegrationStatus();
      } else {
        setConnectionError(res.error || 'Failed to authenticate Slack Bot Token');
      }
    } catch (err: any) {
      setConnectionError(err.response?.data?.error || err.message || 'Authentication error');
    } finally {
      setIsConnecting(false);
    }
  };

  const toggleChannelSelection = (name: string) => {
    setSelectedChannelNames((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const selectAllChannels = () => {
    if (selectedChannelNames.length === channels.length) {
      setSelectedChannelNames([]);
    } else {
      setSelectedChannelNames(channels.map((c) => c.name));
    }
  };

  const handleSaveChannels = async () => {
    try {
      setIsSavingChannels(true);
      await saveMonitoredChannels(selectedChannelNames);
      setChannelsSavedNotice(true);
      setTimeout(() => setChannelsSavedNotice(false), 3000);
    } catch (err: any) {
      alert('Failed to save monitored channels: ' + (err.message || 'Error'));
    } finally {
      setIsSavingChannels(false);
    }
  };

  const handleSyncSelected = async () => {
    try {
      setIsSyncingChannels(true);
      setSyncResult(null);
      const targets = channels.filter((c) => selectedChannelNames.includes(c.name));
      const res = await syncSlackChannels(slackToken, targets, 20);
      setSyncResult(
        `Synced ${res.syncedChannelsCount} channels. Ingested ${res.messagesIngested} messages and extracted ${res.expensesExtracted} predictions!`
      );
      // Auto save selected channels
      await saveMonitoredChannels(selectedChannelNames);
      onExtractionSuccess();
    } catch (err: any) {
      alert('Sync failed: ' + (err.message || 'Check backend logs'));
    } finally {
      setIsSyncingChannels(false);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(inboundEmailAddress);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleIngestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsIngestingEmail(true);
      setEmailSuccess(null);
      await ingestEmail(emailSender, emailSubject, emailBody);
      setEmailSuccess('Email quote ingested into raw processing queue.');
      await onRunExtraction();
      onExtractionSuccess();
    } catch (err: any) {
      alert('Failed to ingest email: ' + (err.message || 'Unknown error'));
    } finally {
      setIsIngestingEmail(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#0B101E] border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Company Communication Integrations</h3>
                {workspace && (
                  <span className="text-[11px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {workspace.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Connect your actual company Slack workspace or ingest vendor quotes from company email
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800/80 bg-slate-950/40 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('SLACK')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center border-b-2 cursor-pointer ${
              activeTab === 'SLACK'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 mr-1.5" />
            Real Slack Workspace
          </button>

          <button
            onClick={() => setActiveTab('GMAIL')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center border-b-2 cursor-pointer ${
              activeTab === 'GMAIL'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4 mr-1.5" />
            Gmail &amp; Vendor Quotes
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: SLACK WORKSPACE INTEGRATION */}
          {activeTab === 'SLACK' && (
            <div className="space-y-5">
              
              {/* Token Input & Connection Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    1. Slack Bot User OAuth Token (`xoxb-...`)
                  </span>
                  <a
                    href="https://api.slack.com/apps"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-400 hover:underline flex items-center"
                  >
                    Create Slack App / Get Token <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>

                <form onSubmit={handleConnectToken} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={slackToken}
                      onChange={(e) => setSlackToken(e.target.value)}
                      placeholder="xoxb-your-slack-bot-token"
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <button
                      type="submit"
                      disabled={isConnecting}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow transition disabled:opacity-50 flex items-center cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isConnecting ? 'animate-spin' : ''}`} />
                      {isConnecting ? 'Verifying...' : 'Save & Connect'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Required Bot Scopes: <code className="text-emerald-400">channels:history</code>, <code className="text-emerald-400">channels:read</code>, <code className="text-emerald-400">groups:history</code>.
                  </p>
                </form>

                {connectionError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                    {connectionError}
                  </div>
                )}

                {connectedWorkspace && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-emerald-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div>
                        <span className="font-bold">{connectedWorkspace.team}</span>
                        <span className="text-slate-400 ml-2">(@{connectedWorkspace.user})</span>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                      Connected
                    </span>
                  </div>
                )}
              </div>

              {/* Channel Selector */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    2. Select Channels to Monitor
                  </span>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={selectAllChannels}
                      className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      {selectedChannelNames.length === channels.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveChannels}
                      disabled={isSavingChannels}
                      className="inline-flex items-center text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 px-2.5 py-1 rounded transition cursor-pointer"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      {channelsSavedNotice ? 'Saved!' : 'Save Channels'}
                    </button>
                  </div>
                </div>

                {isLoadingChannels ? (
                  <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                    <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span>Loading channels from Slack API...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {channels.map((ch) => {
                      const isSelected = selectedChannelNames.includes(ch.name);
                      return (
                        <div
                          key={ch.id}
                          onClick={() => toggleChannelSelection(ch.name)}
                          className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex items-start justify-between ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500/60 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-0.5 pr-2">
                            <div className="text-xs font-bold font-mono text-emerald-300">
                              {ch.name}
                            </div>
                            <div className="text-[10px] text-slate-400 line-clamp-1">
                              {ch.topic || 'Team conversations'}
                            </div>
                          </div>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                  <span className="text-[11px] text-slate-400">
                    {selectedChannelNames.length} of {channels.length} channels selected
                  </span>
                  <button
                    type="button"
                    onClick={handleSyncSelected}
                    disabled={isSyncingChannels || selectedChannelNames.length === 0}
                    className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncingChannels ? 'animate-spin' : ''}`} />
                    {isSyncingChannels ? 'Syncing Channels...' : 'Sync Selected Channels'}
                  </button>
                </div>

                {syncResult && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                    <span>{syncResult}</span>
                    <button
                      onClick={onClose}
                      className="ml-3 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                    >
                      View Ledger
                    </button>
                  </div>
                )}
              </div>

              {/* Webhook Configuration for Automatic Live Ingestion */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    3. Tenant-Dedicated Slack Webhook (Live Ingestion)
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Add this Request URL to your Slack App to automatically route real-time team messages into {workspace?.name || 'your'} company ledger:
                </p>

                <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200">
                  <span className="flex-1 truncate">{webhookUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopyWebhook}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 transition cursor-pointer"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWebhook ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <div>• Slack App Dashboard → <strong>Event Subscriptions</strong> → Enable Events.</div>
                  <div>• Paste your workspace Request URL above (verified automatically via challenge).</div>
                  <div>• Under <strong>Subscribe to bot events</strong>, add <code className="text-purple-400">message.channels</code>.</div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: GMAIL & VENDOR QUOTE INGESTION */}
          {activeTab === 'GMAIL' && (
            <div className="space-y-5">
              {/* Dedicated Inbound Email Forwarding Box */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-900/40 space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Dedicated Company Quote Forwarding Address
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Forward any vendor proposal, contract renewal, or storage quote to this address to parse it automatically into {workspace?.name || 'your'} ledger:
                </p>

                <div className="flex items-center space-x-2 bg-slate-900 border border-blue-900/50 rounded-lg p-2 font-mono text-xs text-blue-200">
                  <span className="flex-1 truncate">{inboundEmailAddress}</span>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="px-2.5 py-1 rounded bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 text-xs flex items-center space-x-1 transition cursor-pointer"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmail ? 'Copied' : 'Copy Email'}</span>
                  </button>
                </div>
              </div>

              {/* Direct Ingestion Simulation Form */}
              <form onSubmit={handleIngestEmail} className="space-y-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Simulate Inbound Vendor Email
                </span>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        From (Vendor / Account Rep):
                      </label>
                      <input
                        type="text"
                        value={emailSender}
                        onChange={(e) => setEmailSender(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Subject Line:
                      </label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Thread Body / Storage Proposal Excerpt:
                    </label>
                    <textarea
                      rows={4}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {emailSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="text-xs text-emerald-300 flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{emailSuccess}</span>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="ml-3 inline-flex items-center px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow cursor-pointer"
                    >
                      View Ledger
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isIngestingEmail}
                    className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {isIngestingEmail ? 'Ingesting Email...' : 'Ingest Vendor Email Thread'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
