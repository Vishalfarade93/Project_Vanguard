import React, { useState } from 'react';
import { X, Send, Sparkles, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react';
import { simulateSlackMessage } from '../api/expenses';

interface SlackSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtractionSuccess: () => void;
  onRunExtraction: () => Promise<{ count: number; message: string }>;
}

const PRESET_MESSAGES = [
  {
    sender: 'Sarah (Lead Infrastructure)',
    text: 'We need to spin up 4 dedicated GPU cluster instances on AWS next month for running customer models. Budgeting around $3,800.',
    category: 'Cloud Infrastructure',
  },
  {
    sender: 'Marcus (VP Design)',
    text: 'Figma Enterprise annual renewal is coming up in two months. Total bill will be around $4,200 for 15 designers.',
    category: 'SaaS License',
  },
  {
    sender: 'Elena (Head of Growth)',
    text: 'Let us book 3 flights and tickets for the SaaStr Annual Conference in September. Estimated cost about $2,650.',
    category: 'Travel & Events',
  },
  {
    sender: 'David (Engineering Manager)',
    text: 'We are bringing in a senior security penetration tester on a freelance contract next week. Quote came in at $5,500.',
    category: 'Contractor Services',
  },
  {
    sender: 'Chloe (Office Manager)',
    text: 'Offsite venue catering deposit for the team all-hands gathering is due next month: $1,800.',
    category: 'Team Catering',
  },
];

export const SlackSimulatorModal: React.FC<SlackSimulatorModalProps> = ({
  isOpen,
  onClose,
  onExtractionSuccess,
  onRunExtraction,
}) => {
  const [selectedSender, setSelectedSender] = useState(PRESET_MESSAGES[0].sender);
  const [messageText, setMessageText] = useState(PRESET_MESSAGES[0].text);
  const [isSending, setIsSending] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof PRESET_MESSAGES[0]) => {
    setSelectedSender(preset.sender);
    setMessageText(preset.text);
    setSuccessMessage(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      setIsSending(true);
      setSuccessMessage(null);
      await simulateSlackMessage(messageText, selectedSender);
      setSuccessMessage('Message ingested into RawMessage queue! Ready for AI extraction.');
    } catch (err: any) {
      alert('Failed to send message: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  const handleExtractAndClose = async () => {
    try {
      setIsExtracting(true);
      await onRunExtraction();
      onExtractionSuccess();
      onClose();
    } catch (err: any) {
      alert('AI Extraction error: ' + (err.message || 'Check backend logs'));
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Slack Chatter Simulator</h3>
              <p className="text-xs text-slate-400">
                Simulate employee communication to test early-warning expense detection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Chips */}
        <div className="px-6 pt-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Quick Realistic Presets:
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_MESSAGES.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  messageText === preset.text
                    ? 'bg-purple-600/30 border-purple-500/50 text-purple-200'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {preset.category}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSendMessage} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sender Name / Role:
            </label>
            <input
              type="text"
              value={selectedSender}
              onChange={(e) => setSelectedSender(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              placeholder="e.g. Alex (Design Lead)"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Slack Message Content (Discussing future plans, software, travel, contractors):
            </label>
            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              placeholder="e.g. We need to book 4 hotel rooms in Austin for the conference next month, will be $1,900 total."
              required
            />
          </div>

          {/* Success Notification */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start justify-between">
              <div className="flex items-center space-x-2 text-emerald-300 text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={handleExtractAndClose}
                disabled={isExtracting}
                className="ml-3 inline-flex items-center px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                {isExtracting ? 'Analyzing...' : 'Run AI Now'}
                <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-slate-500">
              Sends payload via <code className="text-purple-400 font-mono">POST /api/slack/events</code>
            </p>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/20 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {isSending ? 'Sending to Slack Webhook...' : 'Ingest Chatter Message'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
