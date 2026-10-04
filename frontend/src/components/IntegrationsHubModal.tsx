import React, { useState, useEffect } from 'react';
import {
  X, MessageSquare, Mail, Send, CheckCircle, ArrowRight, RefreshCw,
  Copy, Check, ShieldCheck, CheckSquare, Square, Save, Inbox, Trash2,
  Key, AlertCircle, CheckCircle2, KeyRound, Unlink, Zap, Settings2,
} from 'lucide-react';
import {
  connectSlackWorkspace, getSlackChannels, syncSlackChannels, ingestEmail,
  getIntegrationStatus, saveMonitoredChannels, disconnectSlackWorkspace, getSlackAuthorizeUrl,
} from '../api/expenses';
import {
  ConnectedInbox, getConnectedInboxes, getGoogleAuthUrl, connectSandboxInbox,
  syncMailboxes, disconnectInbox, getForwardingVerificationCode,
} from '../api/googleIntegration';
import { SlackChannel, TenantIntegrationStatus } from '../types';
import { useAuth } from '../context/AuthContext';

interface IntegrationsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtractionSuccess: () => void;
  onRunExtraction: () => Promise<{ count: number; message: string }>;
}

const SlackMark = () => (
  <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 122.8 122.8">
    <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#e01e5a"/>
    <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36c5f0"/>
    <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C77.6 5.8 83.4 0 90.5 0s12.9 5.8 12.9 12.9v32.3z" fill="#2eb67d"/>
    <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ecb22e"/>
  </svg>
);

interface CardProps { children: React.ReactNode; className?: string; }
const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 ${className}`}>
    {children}
  </div>
);

interface CardHeaderProps { icon?: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode; }
const CardHeader: React.FC<CardHeaderProps> = ({ icon, title, subtitle, action }) => (
  <div className="flex items-start justify-between gap-2">
    <div className="flex items-center gap-2 min-w-0">
      {icon && <span className="shrink-0 text-vanguard-blue">{icon}</span>}
      <div className="min-w-0">
        <p className="text-xs font-bold text-vanguard-black leading-none">{title}</p>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

interface CopyFieldProps { value: string; onCopy: () => void; copied: boolean; }
const CopyField: React.FC<CopyFieldProps> = ({ value, onCopy, copied }) => (
  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
    <span className="flex-1 truncate text-xs text-vanguard-navy font-semibold font-mono">{value}</span>
    <button
      type="button"
      onClick={onCopy}
      className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold border border-slate-200 transition cursor-pointer"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  </div>
);

export const IntegrationsHubModal: React.FC<IntegrationsHubModalProps> = ({
  isOpen, onClose, onExtractionSuccess, onRunExtraction,
}) => {
  const { workspace } = useAuth();
  const [activeTab, setActiveTab] = useState<'SLACK' | 'EMAIL'>('SLACK');

  const [status, setStatus] = useState<TenantIntegrationStatus | null>(null);
  const [slackToken, setSlackToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannelNames, setSelectedChannelNames] = useState<string[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [isSyncingChannels, setIsSyncingChannels] = useState(false);
  const [isSavingChannels, setIsSavingChannels] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [channelsSavedNotice, setChannelsSavedNotice] = useState(false);

  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedFilterQuery, setCopiedFilterQuery] = useState(false);

  const [connectedInboxes, setConnectedInboxes] = useState<ConnectedInbox[]>([]);
  const [isLoadingInboxes, setIsLoadingInboxes] = useState(false);
  const [isSyncingInboxes, setIsSyncingInboxes] = useState(false);
  const [syncInboxResult, setSyncInboxResult] = useState<string | null>(null);
  const [newInboxEmail, setNewInboxEmail] = useState('billing@acmecorp.com');
  const [newInboxLabel, setNewInboxLabel] = useState('Cloud & Procurement Billing');
  const [isConnectingInbox, setIsConnectingInbox] = useState(false);
  const [connectInboxError, setConnectInboxError] = useState<string | null>(null);

  const [forwardingCode, setForwardingCode] = useState<string | null>(null);
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  const [emailSender, setEmailSender] = useState('enterprise-accounts@aws.amazon.com');
  const [emailSubject, setEmailSubject] = useState('AWS S3 Data Lake 60TB Storage Proposal');
  const [emailBody, setEmailBody] = useState(
    'Hi Team, reserving 60 TB of S3 Standard storage will add approximately $1,620/month to your AWS billing commitment starting next month.'
  );
  const [isIngestingEmail, setIsIngestingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const webhookUrl = `${window.location.origin}/api/slack/events?workspaceId=${workspace?.id || 1}`;
  const inboundEmailAddress = `inbox-${status?.inboundEmailSlug || workspace?.slug || 'company'}@vanguardbudget.com`;
  const GMAIL_FILTER_QUERY = 'subject:(quote OR invoice OR proposal OR renewal OR "pricing plan") OR from:(aws OR amazon OR google OR datadog OR salesforce OR stripe OR snowflake)';

  const copy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2500);
  };

  useEffect(() => {
    if (isOpen) { loadIntegrationStatus(); loadEmailIntegrations(); }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'EMAIL') loadEmailIntegrations();
  }, [activeTab]);

  const loadIntegrationStatus = async () => {
    try {
      setIsLoadingChannels(true);
      const data = await getIntegrationStatus();
      setStatus(data);
      if (data.monitoredChannels?.length) setSelectedChannelNames(data.monitoredChannels);
      const list = await getSlackChannels();
      setChannels(list);
      if (!data.monitoredChannels?.length && list.length > 0)
        setSelectedChannelNames(list.slice(0, 3).map((c) => c.name));
    } catch (err) { console.error(err); }
    finally { setIsLoadingChannels(false); }
  };

  const loadEmailIntegrations = async () => {
    try {
      setIsLoadingInboxes(true);
      const inboxes = await getConnectedInboxes();
      setConnectedInboxes(inboxes);
      const codeData = await getForwardingVerificationCode();
      if (codeData.hasCode) setForwardingCode(codeData.verificationCode);
    } catch (err) { console.error(err); }
    finally { setIsLoadingInboxes(false); }
  };

  const handle1ClickSlackOAuth = async () => {
    try {
      setIsConnecting(true); setConnectionError(null);
      const res = await getSlackAuthorizeUrl(workspace?.id);
      if (res.isConfigured && res.authorizeUrl) { window.location.href = res.authorizeUrl; }
      else { setShowTokenInput(true); setConnectionError(res.message || 'OAuth not configured. Enter a Bot Token below.'); }
    } catch { setShowTokenInput(true); setConnectionError('OAuth failed. Enter a Bot Token below.'); }
    finally { setIsConnecting(false); }
  };

  const handleConnectToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slackToken.trim()) return;
    try {
      setIsConnecting(true); setConnectionError(null);
      const res = await connectSlackWorkspace(slackToken.trim());
      if (res.ok) { await loadIntegrationStatus(); setShowTokenInput(false); setSlackToken(''); }
      else setConnectionError(res.error || 'Invalid token');
    } catch (err: any) { setConnectionError(err.response?.data?.error || err.message || 'Error'); }
    finally { setIsConnecting(false); }
  };

  const handleDisconnectSlack = async () => {
    if (!confirm('Disconnect Slack? Ingested records will remain.')) return;
    try { await disconnectSlackWorkspace(); await loadIntegrationStatus(); }
    catch (err: any) { alert('Failed: ' + err.message); }
  };

  const toggleChannel = (name: string) =>
    setSelectedChannelNames((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);

  const toggleAllChannels = () =>
    setSelectedChannelNames(selectedChannelNames.length === channels.length ? [] : channels.map((c) => c.name));

  const handleSaveChannels = async () => {
    try {
      setIsSavingChannels(true);
      await saveMonitoredChannels(selectedChannelNames);
      setChannelsSavedNotice(true); onExtractionSuccess();
      setTimeout(() => setChannelsSavedNotice(false), 2500);
    } catch (err: any) { alert('Failed: ' + err.message); }
    finally { setIsSavingChannels(false); }
  };

  const handleSyncChannels = async () => {
    try {
      setIsSyncingChannels(true); setSyncResult(null);
      const targets = channels.filter((c) => selectedChannelNames.includes(c.name));
      const res = await syncSlackChannels(slackToken, targets, 20);
      setSyncResult(`Synced ${res.syncedChannelsCount} channels - ${res.expensesExtracted} predictions extracted`);
      await saveMonitoredChannels(selectedChannelNames); onExtractionSuccess();
      setTimeout(() => setSyncResult(null), 6000);
    } catch (err: any) { alert('Sync failed: ' + err.message); }
    finally { setIsSyncingChannels(false); }
  };

  const handleOAuthConnect = async () => {
    try {
      setIsConnectingInbox(true); setConnectInboxError(null);
      const res = await getGoogleAuthUrl(newInboxLabel || 'Billing');
      if (res.authUrl) window.location.href = res.authUrl;
    } catch (err: any) { setConnectInboxError(err.response?.data?.message || err.message || 'Error'); }
    finally { setIsConnectingInbox(false); }
  };

  const handleSandboxConnect = async () => {
    if (!newInboxEmail.trim()) return;
    try {
      setIsConnectingInbox(true); setConnectInboxError(null);
      await connectSandboxInbox(newInboxEmail.trim(), newInboxLabel.trim() || 'Billing');
      await loadEmailIntegrations(); await onRunExtraction(); onExtractionSuccess();
      setSyncInboxResult(`Connected ${newInboxEmail} and loaded sample vendor quotes.`);
      setTimeout(() => setSyncInboxResult(null), 5000);
    } catch (err: any) { setConnectInboxError(err.response?.data?.message || err.message || 'Error'); }
    finally { setIsConnectingInbox(false); }
  };

  const handleSyncInboxes = async (inboxId?: number) => {
    try {
      setIsSyncingInboxes(true); setSyncInboxResult(null);
      const res = await syncMailboxes(inboxId);
      const count = res.newMessagesIngested ?? res.newMessagesCount ?? 0;
      setSyncInboxResult(`Sync complete - ${count} new vendor email${count === 1 ? '' : 's'} processed.`);
      await loadEmailIntegrations(); await onRunExtraction(); onExtractionSuccess();
      setTimeout(() => setSyncInboxResult(null), 6000);
    } catch (err: any) { alert('Sync failed: ' + err.message); }
    finally { setIsSyncingInboxes(false); }
  };

  const handleDisconnectInbox = async (inboxId: number) => {
    if (!confirm('Remove this mailbox? Predictions will remain.')) return;
    try { await disconnectInbox(inboxId); await loadEmailIntegrations(); }
    catch (err: any) { alert('Failed: ' + err.message); }
  };

  const handleCheckVerificationCode = async () => {
    try {
      setIsLoadingCode(true);
      const codeData = await getForwardingVerificationCode();
      if (codeData.hasCode) setForwardingCode(codeData.verificationCode);
      else alert('No code yet. Add the forwarding address in Gmail first.');
    } catch (err) { console.error(err); }
    finally { setIsLoadingCode(false); }
  };

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsIngestingEmail(true); setEmailSuccess(null);
      await ingestEmail(emailSender, emailSubject, emailBody);
      setEmailSuccess('Email ingested successfully.');
      await onRunExtraction(); onExtractionSuccess();
    } catch (err: any) { alert('Failed: ' + err.message); }
    finally { setIsIngestingEmail(false); }
  };

  if (!isOpen) return null;

  const TABS = [
    { id: 'SLACK' as const, label: 'Slack', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'EMAIL' as const, label: 'Email', icon: <Mail className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm font-sans">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-vanguard-navy/10 border border-vanguard-navy/20 text-vanguard-navy">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-vanguard-black leading-none">Integrations</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {workspace?.name} - Connect data sources to auto-detect upcoming spend
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-1 pt-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activeTab === tab.id ? 'border-vanguard-blue text-vanguard-navy' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">

          {/* SLACK TAB */}
          {activeTab === 'SLACK' && (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="leading-relaxed">
                  Vanguard reads only the Slack channels you approve below. Your team manually shares vendor
                  quotes into those channels - we never access email or private messages.
                </p>
              </div>

              <Card>
                <CardHeader
                  icon={<MessageSquare className="w-4 h-4" />}
                  title="Slack Workspace"
                  subtitle="Connect via OAuth or enter a Bot Token manually"
                  action={
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowTokenInput(!showTokenInput)} className="flex items-center gap-1 text-[11px] text-vanguard-blue hover:text-vanguard-navy font-semibold cursor-pointer">
                        <KeyRound className="w-3 h-3" />
                        {showTokenInput ? 'Cancel' : status?.slackConnected ? 'Update Token' : 'Bot Token'}
                      </button>
                      {status?.slackConnected && (
                        <button onClick={handleDisconnectSlack} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-600 font-medium cursor-pointer">
                          <Unlink className="w-3 h-3" />Disconnect
                        </button>
                      )}
                    </div>
                  }
                />
                {status?.slackConnected ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-bold text-vanguard-black">{status.workspaceName}</span>
                      <span className="text-slate-500 font-mono text-[11px]">@{status.slackBotName || 'vanguard_bot'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">Connected</span>
                      <button onClick={handle1ClickSlackOAuth} className="text-[11px] text-slate-600 hover:text-vanguard-black px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-sm transition font-medium cursor-pointer">Reconnect</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200">
                    <div>
                      <p className="text-xs font-semibold text-vanguard-black">No workspace connected</p>
                      <p className="text-[11px] text-slate-500">Use Slack OAuth for a one-click setup.</p>
                    </div>
                    <button onClick={handle1ClickSlackOAuth} disabled={isConnecting} className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 shadow-sm transition cursor-pointer border border-amber-400 shrink-0 disabled:opacity-50">
                      <SlackMark />{isConnecting ? 'Connecting...' : 'Add to Slack'}
                    </button>
                  </div>
                )}
                {showTokenInput && (
                  <form onSubmit={handleConnectToken} className="pt-2 space-y-2 border-t border-slate-200">
                    <label className="text-[11px] font-semibold text-slate-600 block">Slack Bot Token (xoxb-...)</label>
                    <div className="flex gap-2">
                      <input type="password" placeholder="xoxb-your-bot-token" value={slackToken} onChange={(e) => setSlackToken(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-vanguard-blue" />
                      <button type="submit" disabled={isConnecting || !slackToken.trim()} className="px-4 py-1.5 bg-vanguard-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer">
                        {isConnecting ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                )}
                {connectionError && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{connectionError}</span>
                  </div>
                )}
              </Card>

              <Card>
                <CardHeader
                  icon={<CheckSquare className="w-4 h-4" />}
                  title="Monitored Channels"
                  subtitle="Select which channels Vanguard scans for vendor spend signals"
                  action={
                    <div className="flex items-center gap-3">
                      <button onClick={toggleAllChannels} className="text-[11px] text-slate-500 hover:text-vanguard-black font-medium underline cursor-pointer">
                        {selectedChannelNames.length === channels.length ? 'Deselect all' : 'Select all'}
                      </button>
                      <button onClick={loadIntegrationStatus} className="text-slate-400 hover:text-slate-600 cursor-pointer" title="Refresh">
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingChannels ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  }
                />
                {isLoadingChannels ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <RefreshCw className="w-4 h-4 text-vanguard-blue animate-spin" />Loading channels...
                  </div>
                ) : channels.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    {status?.slackConnected ? 'No public channels found.' : 'Connect a Slack workspace above to see channels.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {channels.map((ch) => {
                      const isSelected = selectedChannelNames.includes(ch.name);
                      return (
                        <div key={ch.id} onClick={() => toggleChannel(ch.name)}
                          className={`flex items-start justify-between p-2.5 rounded-xl border text-left cursor-pointer transition ${
                            isSelected ? 'bg-blue-50/70 border-blue-300 text-vanguard-navy' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-0.5 pr-2 min-w-0">
                            <p className="text-xs font-bold font-mono truncate">#{ch.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{ch.topic || 'Team channel'}</p>
                          </div>
                          {isSelected ? <CheckSquare className="w-4 h-4 text-vanguard-blue flex-shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500"><strong>{selectedChannelNames.length}</strong> of {channels.length} selected</span>
                  <div className="flex items-center gap-2">
                    <button onClick={handleSyncChannels} disabled={isSyncingChannels || selectedChannelNames.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition disabled:opacity-50 cursor-pointer">
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingChannels ? 'animate-spin' : ''}`} />
                      {isSyncingChannels ? 'Syncing...' : 'Sync History'}
                    </button>
                    <button onClick={handleSaveChannels} disabled={isSavingChannels}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-vanguard-navy hover:bg-slate-800 shadow-sm transition disabled:opacity-50 cursor-pointer">
                      <Save className="w-3.5 h-3.5" />{channelsSavedNotice ? 'Saved!' : 'Save'}
                    </button>
                  </div>
                </div>
                {syncResult && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    <span>{syncResult}</span>
                    <button onClick={onClose} className="ml-3 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer">View</button>
                  </div>
                )}
              </Card>

              <Card>
                <CardHeader icon={<Zap className="w-4 h-4" />} title="Slack Event Webhook" subtitle="Optional - add this URL to your Slack App for real-time ingestion" />
                <CopyField value={webhookUrl} onCopy={() => copy(webhookUrl, setCopiedWebhook)} copied={copiedWebhook} />
              </Card>
            </div>
          )}

          {/* EMAIL TAB */}
          {activeTab === 'EMAIL' && (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="leading-relaxed">
                  Vanguard never reads your inbox. Only emails you manually forward, or that your Gmail filter
                  routes automatically, are processed. Your company stays in full control.
                </p>
              </div>

              <Card>
                <CardHeader icon={<Mail className="w-4 h-4" />} title="Your Forwarding Address" subtitle="Forward any vendor quote or renewal to this address to have it parsed automatically" />
                <CopyField value={inboundEmailAddress} onCopy={() => copy(inboundEmailAddress, setCopiedEmail)} copied={copiedEmail} />
              </Card>

              <Card>
                <CardHeader icon={<Settings2 className="w-4 h-4" />} title="Set Up Gmail Auto-Forwarding" subtitle="Ask your IT admin to create a filter so matching emails forward automatically" />
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-800">Step 1 - Add forwarding address</p>
                      <span className="text-[10px] text-slate-400">Settings &gt; Forwarding &amp; POP/IMAP</span>
                    </div>
                    <CopyField value={inboundEmailAddress} onCopy={() => copy(inboundEmailAddress, setCopiedEmail)} copied={copiedEmail} />
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-500" />Step 2 - Verify the forwarding address
                      </p>
                      <button onClick={handleCheckVerificationCode} disabled={isLoadingCode} className="flex items-center gap-1 text-[11px] text-vanguard-blue hover:text-blue-700 font-semibold cursor-pointer">
                        <RefreshCw className={`w-3 h-3 ${isLoadingCode ? 'animate-spin' : ''}`} />Check code
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">Google sends a confirmation email to verify ownership. Vanguard captures the code automatically.</p>
                    {forwardingCode ? (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">Verification Code</p>
                            <p className="font-mono text-sm font-bold text-emerald-950 tracking-widest">{forwardingCode}</p>
                          </div>
                        </div>
                        <button onClick={() => copy(forwardingCode, setCopiedCode)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer">
                          {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copiedCode ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                        Waiting for confirmation email from Google...
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-800">Step 3 - Create a Gmail filter</p>
                      <span className="text-[10px] text-slate-400">Settings &gt; Filters &amp; Blocked Addresses</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <span className="flex-1 truncate text-[11px] font-mono text-slate-600">{GMAIL_FILTER_QUERY}</span>
                      <button onClick={() => copy(GMAIL_FILTER_QUERY, setCopiedFilterQuery)} className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200 transition cursor-pointer">
                        {copiedFilterQuery ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}{copiedFilterQuery ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      In Filter Actions: set <strong>Forward it to</strong> and choose {inboundEmailAddress}.
                      Also enable <strong>Never send to Spam</strong>.
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader
                  icon={<Inbox className="w-4 h-4" />}
                  title={`Connected Mailboxes (${connectedInboxes.length})`}
                  subtitle="Optional - directly connect billing mailboxes via Google OAuth"
                  action={connectedInboxes.length > 0 ? (
                    <button onClick={() => handleSyncInboxes()} disabled={isSyncingInboxes} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
                      <RefreshCw className={`w-3 h-3 ${isSyncingInboxes ? 'animate-spin' : ''}`} />{isSyncingInboxes ? 'Scanning...' : 'Sync All'}
                    </button>
                  ) : undefined}
                />
                {syncInboxResult && <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">{syncInboxResult}</div>}
                {isLoadingInboxes ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-vanguard-blue" />Loading...
                  </div>
                ) : connectedInboxes.length === 0 ? (
                  <p className="text-xs text-slate-400">No mailboxes connected. Use the form below, or use forwarding above (recommended).</p>
                ) : (
                  <div className="space-y-2">
                    {connectedInboxes.map((inbox) => (
                      <div key={inbox.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-semibold text-vanguard-navy truncate">{inbox.emailAddress}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">{inbox.inboxLabel}</span>
                          <span className="text-[10px] text-emerald-700 font-medium shrink-0">{inbox.messagesScannedCount} scanned</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => handleSyncInboxes(inbox.id)} disabled={isSyncingInboxes} className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition cursor-pointer">Sync</button>
                          <button onClick={() => handleDisconnectInbox(inbox.id)} className="p-1 rounded text-slate-400 hover:text-rose-600 transition cursor-pointer" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input type="email" value={newInboxEmail} onChange={(e) => setNewInboxEmail(e.target.value)} placeholder="billing@company.com"
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-vanguard-blue" />
                    <input type="text" value={newInboxLabel} onChange={(e) => setNewInboxLabel(e.target.value)} placeholder="e.g. AWS & Cloud Invoices"
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-vanguard-blue" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                      {['billing@', 'finance@', 'cloud@'].map((prefix) => (
                        <button key={prefix} type="button" onClick={() => setNewInboxEmail(`${prefix}${workspace?.slug || 'company'}.com`)}
                          className="text-[10px] bg-white hover:bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 cursor-pointer">{prefix}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleOAuthConnect} disabled={isConnectingInbox} className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 cursor-pointer disabled:opacity-50">Google OAuth</button>
                      <button onClick={handleSandboxConnect} disabled={isConnectingInbox || !newInboxEmail.trim()} className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-vanguard-blue rounded-lg text-[11px] font-bold cursor-pointer disabled:opacity-50">
                        {isConnectingInbox ? 'Connecting...' : 'Sandbox Connect'}
                      </button>
                    </div>
                  </div>
                  {connectInboxError && (
                    <div className="flex items-start gap-1.5 p-2 rounded bg-red-50 border border-red-200 text-xs text-red-600">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{connectInboxError}</span>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader icon={<Send className="w-4 h-4" />} title="Test Email Ingestion" subtitle="Send a sample vendor email to verify the pipeline is working" />
                <form onSubmit={handleTestEmail} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sender</label>
                      <input type="text" value={emailSender} onChange={(e) => setEmailSender(e.target.value)} required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-vanguard-blue" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subject</label>
                      <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-vanguard-blue" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email Body</label>
                    <textarea rows={3} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-vanguard-blue resize-none" />
                  </div>
                  {emailSuccess && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2 text-xs text-emerald-800">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /><span>{emailSuccess}</span>
                      </div>
                      <button type="button" onClick={onClose} className="flex items-center gap-1 ml-3 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer">
                        View <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button type="submit" disabled={isIngestingEmail} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-vanguard-navy hover:bg-slate-800 shadow-sm transition disabled:opacity-50 cursor-pointer">
                      <Send className="w-3.5 h-3.5" />{isIngestingEmail ? 'Ingesting...' : 'Send Test Email'}
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
