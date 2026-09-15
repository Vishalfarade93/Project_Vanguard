import React, { useState } from 'react';
import {
  Radio,
  MessageSquare,
  Mail,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { simulateSlackMessage, ingestEmail } from '../api/expenses';

interface LiveEventCapturePanelProps {
  onEventCaptured: () => void;
  onRunExtraction: () => Promise<{ count: number; message: string }>;
}

export const LiveEventCapturePanel: React.FC<LiveEventCapturePanelProps> = ({
  onEventCaptured,
  onRunExtraction,
}) => {
  const [sourceType, setSourceType] = useState<'SLACK' | 'GMAIL'>('SLACK');

  // Slack Event State
  const [slackSender, setSlackSender] = useState('Sarah (Sales Lead)');
  const [slackChannel, setSlackChannel] = useState('#sales-team');
  const [slackText, setSlackText] = useState(
    "Let's book those three flights to New York for next Tuesday, it should be around $1,200."
  );

  // Gmail Event State
  const [emailSender, setEmailSender] = useState('enterprise-accounts@aws.amazon.com');
  const [emailSubject, setEmailSubject] = useState('AWS S3 Data Lake 50TB Storage Capacity Proposal');
  const [emailBody, setEmailBody] = useState(
    'Hi Team, following up on our call regarding your Q4 data expansion: reserving 50 TB of S3 Standard storage will add approximately $1,500/month to your current AWS billing commitment starting next month.'
  );

  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<string | null>(null);

  const handleCaptureEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCapturing(true);
      setCaptureStatus(null);

      if (sourceType === 'SLACK') {
        // Ingest into Slack webhook queue
        await simulateSlackMessage(`[${slackChannel}] ${slackText}`, slackSender);
      } else {
        // Ingest into Gmail/email queue
        await ingestEmail(emailSender, emailSubject, emailBody);
      }

      // Automatically trigger AI extraction so finance gets immediate information
      const res = await onRunExtraction();
      onEventCaptured();

      setCaptureStatus(
        `✓ Captured event from ${sourceType === 'SLACK' ? 'Slack ' + slackChannel : 'Gmail'} and extracted ${res.count} upcoming financial item(s) into the information ledger.`
      );
    } catch (err: any) {
      alert('Event capture failed: ' + (err.message || 'Check backend logs'));
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSelectQuickSlackPreset = (sender: string, channel: string, text: string) => {
    setSlackSender(sender);
    setSlackChannel(channel);
    setSlackText(text);
    setCaptureStatus(null);
  };

  const handleSelectQuickEmailPreset = (from: string, subject: string, body: string) => {
    setEmailSender(from);
    setEmailSubject(subject);
    setEmailBody(body);
    setCaptureStatus(null);
  };

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl p-6 space-y-5">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center">
              Company Event Capture Terminal (Slack &amp; Gmail)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Captures live communication events from company servers and extracts upcoming expense information in real-time.
          </p>
        </div>

        {/* Source Toggle */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setSourceType('SLACK')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              sourceType === 'SLACK'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Slack Event API</span>
          </button>

          <button
            type="button"
            onClick={() => setSourceType('GMAIL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              sourceType === 'GMAIL'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Gmail Ingestion</span>
          </button>
        </div>
      </div>

      {/* Quick Event Presets */}
      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Select Company Chatter Event to Ingest:
        </label>

        {sourceType === 'SLACK' ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                handleSelectQuickSlackPreset(
                  'Sarah (Sales Lead)',
                  '#sales-team',
                  "Let's book those three flights to New York for next Tuesday, it should be around $1,200."
                )
              }
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 text-left transition"
            >
              ✈️ #sales-team: 3 Flights to New York ($1,200)
            </button>

            <button
              type="button"
              onClick={() =>
                handleSelectQuickSlackPreset(
                  'David (Growth Lead)',
                  '#marketing',
                  'We need to hire a freelance graphic designer for our campaign next month, roughly $3,500.'
                )
              }
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 text-left transition"
            >
              🎨 #marketing: Freelance Designer ($3,500)
            </button>

            <button
              type="button"
              onClick={() =>
                handleSelectQuickSlackPreset(
                  'Alex (Staff DevOps)',
                  '#engineering',
                  'We need data storage capacity to improve by 50TB in 15 days on AWS, about $1,500/mo.'
                )
              }
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 text-left transition"
            >
              ☁️ #engineering: 50TB Cloud Storage Upgrade ($1,500/mo)
            </button>

            <button
              type="button"
              onClick={() =>
                handleSelectQuickSlackPreset(
                  'Elena (IT Ops)',
                  '#it-tools',
                  'Annual server subscription and tool licenses need upgrading in 15 days, quote is $4,200.'
                )
              }
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 text-left transition"
            >
              🔑 #it-tools: Annual Software Subscription ($4,200)
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                handleSelectQuickEmailPreset(
                  'enterprise-accounts@aws.amazon.com',
                  'AWS S3 Data Lake 50TB Storage Capacity Proposal',
                  'Reserving 50 TB of S3 Standard storage will add approximately $1,500/month starting next month.'
                )
              }
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 text-left transition"
            >
              📨 AWS: 50TB Storage Expansion Proposal
            </button>

            <button
              type="button"
              onClick={() =>
                handleSelectQuickEmailPreset(
                  'renewals@datadoghq.com',
                  'Datadog Enterprise APM & Log Ingestion Renewal',
                  'Attached is the quarterly renewal contract reflecting 30-day host expansion: anticipated cost is $12,400.'
                )
              }
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 text-left transition"
            >
              📨 Datadog: Annual Observability Contract ($12,400)
            </button>
          </div>
        )}
      </div>

      {/* Ingestion Form */}
      <form onSubmit={handleCaptureEvent} className="space-y-4">
        {sourceType === 'SLACK' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Employee / Sender:
              </label>
              <input
                type="text"
                value={slackSender}
                onChange={(e) => setSlackSender(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Channel:
              </label>
              <input
                type="text"
                value={slackChannel}
                onChange={(e) => setSlackChannel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Captured Message Text:
              </label>
              <textarea
                rows={2}
                value={slackText}
                onChange={(e) => setSlackText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Vendor From:
                </label>
                <input
                  type="text"
                  value={emailSender}
                  onChange={(e) => setEmailSender(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Subject Line:
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Email Proposal Body:
              </label>
              <textarea
                rows={2}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>
        )}

        {/* Action button and live notification */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-400 flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>
              Connected to backend <code className="text-slate-300 font-mono">POST /api/slack/events</code> &amp; <code className="text-slate-300 font-mono">/api/integrations/email</code>
            </span>
          </div>

          <button
            type="submit"
            disabled={isCapturing}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
          >
            {isCapturing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Capturing &amp; Extracting...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Capture Event &amp; Forecast Outflow
              </>
            )}
          </button>
        </div>
      </form>

      {/* Capture Confirmation */}
      {captureStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2 text-xs text-emerald-300 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{captureStatus}</span>
        </div>
      )}
    </div>
  );
};
