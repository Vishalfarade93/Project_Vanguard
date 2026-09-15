import { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  Calendar,
  DollarSign,
  User,
  Tag,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { simulateSlackMessage } from '../api/expenses';

interface ShadowPipelineVisualizerProps {
  onExtractionSuccess: () => void;
  onRunExtraction: () => Promise<{ count: number; message: string }>;
}

interface PitchPreset {
  channel: string;
  sender: string;
  avatar: string;
  text: string;
  extracted: {
    what: string;
    howMuch: string;
    when: string;
    who: string;
    leadTimeDays: number;
  };
}

const PITCH_PRESETS: PitchPreset[] = [
  {
    channel: '#sales-closers',
    sender: 'Sarah (Sales Director)',
    avatar: '💼',
    text: "Let's book those three flights to New York for next Tuesday, it should be around $1,200.",
    extracted: {
      what: 'Three Business Flights to New York',
      howMuch: '$1,200.00',
      when: 'Next Tuesday (In 7 Days)',
      who: 'Sales Team (Sarah)',
      leadTimeDays: 23,
    },
  },
  {
    channel: '#marketing-growth',
    sender: 'David (Growth Lead)',
    avatar: '🎨',
    text: 'We need to hire a freelance graphic designer for our rebranding campaign next month, roughly $3,500.',
    extracted: {
      what: 'Freelance Graphic Designer for Rebranding',
      howMuch: '$3,500.00',
      when: 'Next Month (In 30 Days)',
      who: 'Marketing Team (David)',
      leadTimeDays: 32,
    },
  },
  {
    channel: '#infrastructure-cloud',
    sender: 'Alex (Staff DevOps)',
    avatar: '☁️',
    text: 'Our data storage capacity needs to improve by 50TB in 15 days on AWS, about $1,500/mo.',
    extracted: {
      what: 'AWS S3 Cloud Storage Capacity Upgrade (50 TB)',
      howMuch: '$1,500.00 / mo',
      when: 'In 15 Days',
      who: 'Infrastructure Team (Alex)',
      leadTimeDays: 18,
    },
  },
  {
    channel: '#it-procurement',
    sender: 'Elena (IT Operations)',
    avatar: '🔑',
    text: 'Annual server subscription and tool licenses need upgrading in 15 days, quote came in at $4,200.',
    extracted: {
      what: 'Annual Server Subscription & Tool Licenses',
      howMuch: '$4,200.00',
      when: 'In 15 Days',
      who: 'IT Operations (Elena)',
      leadTimeDays: 15,
    },
  },
];

export const ShadowPipelineVisualizer: React.FC<ShadowPipelineVisualizerProps> = ({
  onExtractionSuccess,
  onRunExtraction,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PitchPreset>(PITCH_PRESETS[0]);
  const [customText, setCustomText] = useState(PITCH_PRESETS[0].text);
  const [customSender, setCustomSender] = useState(PITCH_PRESETS[0].sender);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleSelectPreset = (preset: PitchPreset) => {
    setSelectedPreset(preset);
    setCustomText(preset.text);
    setCustomSender(preset.sender);
    setActionSuccess(null);
  };

  const handleSimulateAndExtract = async () => {
    try {
      setIsProcessing(true);
      setActionSuccess(null);

      // 1. Ingest message into Slack queue
      await simulateSlackMessage(customText, customSender);

      // 2. Trigger AI extraction immediately
      await onRunExtraction();
      onExtractionSuccess();

      setActionSuccess(
        `✓ Caught spend intent! Extracted "${selectedPreset.extracted.what}" for ${selectedPreset.extracted.howMuch}. Added to proactive ledger with ${selectedPreset.extracted.leadTimeDays} days advance warning!`
      );
    } catch (err: any) {
      alert('Simulation error: ' + (err.message || 'Check backend logs'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#090D18] border border-slate-800/90 shadow-2xl p-6 space-y-6 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-slate-800/70 gap-3">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Interactive Pitch Demo
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center">
            How The "Shadow Pipeline" Works in Real Life
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a real-world Slack conversation below and watch the AI translate casual chatter into proactive budget forecasts.
          </p>
        </div>

        {/* Channel Scenario Selector */}
        <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {PITCH_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                selectedPreset.channel === preset.channel
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>{preset.avatar}</span>
              <span>{preset.channel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4-Step Pipeline Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Step 1 & 2: Slack Chatter & Intent Detection (5 Columns) */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <MessageSquare className="w-3.5 h-3.5 mr-1 text-purple-400" />
                Step 1: Slack Chatter ({selectedPreset.channel})
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Shadow Pipeline
              </span>
            </div>

            {/* Simulated Slack Chat Bubble */}
            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 text-xs space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs">
                  {selectedPreset.avatar}
                </div>
                <span className="font-bold text-slate-200">{customSender}</span>
                <span className="text-[10px] text-slate-500">10:42 AM</span>
              </div>
              <p className="text-slate-200 text-sm font-medium pl-8 italic">
                "{customText}"
              </p>
            </div>
          </div>

          {/* AI Trigger Scanner */}
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-emerald-300">
              <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span><strong>Step 2:</strong> Spending Intent Trigger Identified</span>
            </div>
            <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
              95% Confidence
            </span>
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="hidden lg:flex lg:col-span-1 items-center justify-center text-slate-600">
          <ArrowRight className="w-6 h-6 animate-pulse text-emerald-400" />
        </div>

        {/* Step 3: Translating Chat into 4 Core Data Points (6 Columns) */}
        <div className="lg:col-span-6 p-5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Step 3: Translating Chat into 4 Financial Truths
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                AI Extracted
              </span>
            </div>

            {/* 4 Answers Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* WHAT */}
              <div className="p-3 rounded-lg bg-[#0E1526] border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center mb-1">
                  <Tag className="w-3 h-3 mr-1 text-blue-400" />
                  1. What Is It?
                </span>
                <span className="font-semibold text-white text-xs block">
                  {selectedPreset.extracted.what}
                </span>
              </div>

              {/* HOW MUCH */}
              <div className="p-3 rounded-lg bg-[#0E1526] border border-emerald-500/30">
                <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center mb-1">
                  <DollarSign className="w-3 h-3 mr-1 text-emerald-400" />
                  2. How Much?
                </span>
                <span className="font-extrabold text-emerald-300 text-sm font-mono block">
                  {selectedPreset.extracted.howMuch}
                </span>
              </div>

              {/* WHEN */}
              <div className="p-3 rounded-lg bg-[#0E1526] border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center mb-1">
                  <Calendar className="w-3 h-3 mr-1 text-amber-400" />
                  3. When?
                </span>
                <span className="font-semibold text-slate-200 text-xs block">
                  {selectedPreset.extracted.when}
                </span>
              </div>

              {/* WHO */}
              <div className="p-3 rounded-lg bg-[#0E1526] border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center mb-1">
                  <User className="w-3 h-3 mr-1 text-purple-400" />
                  4. Who &amp; Channel?
                </span>
                <span className="font-semibold text-slate-200 text-xs block">
                  {selectedPreset.extracted.who}
                </span>
              </div>
            </div>
          </div>

          {/* Step 4: Proactive Action Button */}
          <div className="pt-2">
            <button
              onClick={handleSimulateAndExtract}
              disabled={isProcessing}
              className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
              {isProcessing
                ? 'Spotting Spend Intent & Extracting...'
                : `Step 4: Catch This Intent (${selectedPreset.extracted.leadTimeDays} Days Ahead of Invoice)`}
            </button>
          </div>
        </div>

      </div>

      {/* Success Callout */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider ml-2">
            View in Ledger Below ↓
          </span>
        </div>
      )}
    </div>
  );
};
