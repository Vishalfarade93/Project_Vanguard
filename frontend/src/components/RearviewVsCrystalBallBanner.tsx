import { useState } from 'react';
import { AlertOctagon, Sparkles, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export const RearviewVsCrystalBallBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Narrative Headline */}
      <div className="p-6 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-950/40">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Proactive Finance Transformation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Stop Driving With The Rearview Mirror. <span className="text-emerald-400">Get A Crystal Ball.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
            Employees discuss purchases in Slack weeks in advance. We listen to the <strong className="text-slate-200">Shadow Pipeline</strong> and spot spending intent before the credit card is swiped or the invoice lands.
          </p>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-start md:self-center inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-850 border border-slate-700/80 transition"
        >
          <span>{isExpanded ? 'Collapse Narrative' : 'Show The Problem vs Solution'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </button>
      </div>

      {/* Comparison Grid */}
      {isExpanded && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/20">
          
          {/* The Problem: Rearview Mirror Finance */}
          <div className="p-5 rounded-xl bg-red-950/15 border border-red-500/20 relative space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-red-500/20 text-red-300 border border-red-500/30">
                <AlertOctagon className="w-3.5 h-3.5 mr-1 text-red-400" />
                The Old Way: Reactive &amp; Blind
              </span>
              <span className="text-[11px] font-mono text-red-400/80">Past Receipts</span>
            </div>

            <h3 className="text-base font-bold text-red-200">
              The 30-Day Information Gap &amp; Blown Budgets
            </h3>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start">
                <span className="text-red-400 font-bold mr-2">•</span>
                <span><strong>Silent Shadow Pipeline:</strong> Teams discuss hiring freelancers or booking flights in private channels weeks ahead. Finance is kept in the dark.</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 font-bold mr-2">•</span>
                <span><strong>The Element of Surprise:</strong> Finance only discovers expenses when an invoice lands or a company card statement arrives.</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 font-bold mr-2">•</span>
                <span><strong>Pain &amp; Overspending:</strong> Money is already spent. Teams scramble, cash flow panics occur, and uncomfortable arguments follow.</span>
              </li>
            </ul>
          </div>

          {/* The Solution: Crystal Ball Predictive Dashboard */}
          <div className="p-5 rounded-xl bg-emerald-950/15 border border-emerald-500/25 relative space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                The Vanguard Way: Proactive Intelligence
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">21+ Days Lead Time</span>
            </div>

            <h3 className="text-base font-bold text-emerald-200">
              Translating Slack Chatter Into Future Cash Flow
            </h3>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start">
                <span className="text-emerald-400 font-bold mr-2">✓</span>
                <span><strong>Listens to Slack Chatter:</strong> Quietly sits in #sales, #marketing, and #engineering to catch spending triggers in everyday conversation.</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-400 font-bold mr-2">✓</span>
                <span><strong>Extracts the 4 Core Truths:</strong> Answers <em>What is it?</em>, <em>How much?</em>, <em>When?</em>, and <em>Who?</em> automatically using AI.</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-400 font-bold mr-2">✓</span>
                <span><strong>Proactive Pre-Approval:</strong> Finance managers foresee costs, adjust budgets, and approve commitments weeks before the bill ever arrives.</span>
              </li>
            </ul>
          </div>

        </div>
      )}
    </div>
  );
};
