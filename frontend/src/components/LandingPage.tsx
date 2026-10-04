import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { VanguardLogo, VanguardEmblem } from './VanguardLogo';
import {
  ArrowRight, Zap, Sparkles, MessageSquare,
  BarChart3, Clock, CheckCircle2,
  Layers, AlertTriangle,
  Cpu, Activity,
  ShieldCheck, ArrowDown, GitBranch, Inbox,
  BrainCircuit, TrendingUp, Bell, Lock, Star,
  Radio, Sliders
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

/* ── Utility: Animated Section Wrapper ── */
const FadeUp: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = ''
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ── Ambient Orbs ── */
const AmbientOrbs = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <motion.div
      animate={{ x: [0, 28, 0], y: [0, -18, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-40"
      style={{ background: 'radial-gradient(ellipse, rgba(255,195,0,0.15) 0%, transparent 70%)' }}
    />
    <motion.div
      animate={{ x: [0, -22, 0], y: [0, 28, 0] }}
      transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      className="absolute top-[30%] -left-40 w-[550px] h-[550px] rounded-full opacity-30"
      style={{ background: 'radial-gradient(ellipse, rgba(0,53,102,0.18) 0%, transparent 70%)' }}
    />
    <motion.div
      animate={{ x: [0, 18, 0], y: [0, -24, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
      className="absolute top-[55%] -right-40 w-[500px] h-[500px] rounded-full opacity-25"
      style={{ background: 'radial-gradient(ellipse, rgba(56,189,248,0.15) 0%, transparent 70%)' }}
    />
    <div
      className="absolute inset-0 opacity-[0.32]"
      style={{
        backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }}
    />
  </div>
);

/* ── Slack Message Mockup ── */
const SlackMockup = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.94, y: 24 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className="relative w-full max-w-lg mx-auto"
  >
    <motion.div
      animate={{ y: [0, -7, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute -top-6 -right-4 z-20 bg-white border border-emerald-200 shadow-xl shadow-emerald-100/50 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5"
    >
      <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
        <BrainCircuit className="w-4 h-4 text-emerald-600" />
      </div>
      <div>
        <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">AI Detected</p>
        <p className="text-xs font-black text-slate-900">₹4.2L Contractor Spend</p>
      </div>
    </motion.div>

    <motion.div
      animate={{ y: [0, 7, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      className="absolute -bottom-5 -left-4 z-20 bg-white border border-amber-200 shadow-xl shadow-amber-100/50 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5"
    >
      <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
        <Bell className="w-4 h-4 text-amber-600" />
      </div>
      <div>
        <p className="text-[9px] font-black text-amber-700 uppercase tracking-wider">22 Days Early</p>
        <p className="text-xs font-black text-slate-900">Finance Notified</p>
      </div>
    </motion.div>

    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl shadow-slate-200/60 overflow-hidden">
      <div className="bg-[#1a1d21] px-5 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
        </div>
        <div className="flex items-center gap-2 ml-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-slate-300 font-mono font-bold">#product-sprint</span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center font-bold text-xs text-white flex-shrink-0">DK</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-slate-900">David Kim</span>
              <span className="text-[10px] text-slate-400">VP Product</span>
              <span className="text-[10px] text-slate-400">10:22 AM</span>
            </div>
            <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-xl">
              Bringing on 3 senior React Native contractors for Q4 checkout redesign at ₹1.4L/mo each. Starting next sprint, approx 3 months of engagement.
            </div>
          </div>
        </div>
        <div className="ml-12 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm p-1">
            <VanguardEmblem size="sm" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-extrabold tracking-tight flex items-center gap-1.5">
                <span className="text-slate-900">Vanguard</span>
                <span className="text-[#003566]">Intelligence</span>
              </span>
              <span className="text-[9px] bg-blue-50 text-blue-700 font-black px-1.5 py-0.5 rounded border border-blue-200 font-mono">APP</span>
            </div>
            <div className="bg-blue-50/80 border border-blue-100 p-3 rounded-xl text-xs text-slate-700 leading-relaxed">
              ⚡ <strong className="text-[#003566]">Fiscal Alert:</strong> Detected uncommitted contractor spend of <strong>~₹4.2L/mo</strong> (3 contractors × ₹1.4L × 3 months = ₹12.6L total). <strong>25 days before any PO or invoice.</strong> Want me to route this through the finance approval workflow?
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

/* ── Dashboard Preview Mockup ── */
const DashboardPreview = () => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    className="relative w-full"
  >
    {/* Browser chrome */}
    <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/60 overflow-hidden">
      {/* Browser bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-1 text-[11px] text-slate-500 font-mono max-w-xs">
          app.vanguard.ai/dashboard
        </div>
      </div>

      {/* Dashboard Header */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <VanguardEmblem size="sm" />
          <div>
            <p className="text-xs font-extrabold text-[#000814] leading-none">Vanguard <span className="text-[#003566]">Intelligence</span></p>
            <p className="text-[9px] text-slate-400 leading-none mt-0.5">Acme Corp · Slack & Gmail</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg text-[10px] font-bold text-[#003566]">
            <Sliders className="w-3 h-3" /> Channels
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg text-[10px] text-emerald-700 font-bold">
            <Radio className="w-3 h-3 animate-pulse" /> Live
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="p-3 bg-[#F4F6FB]">
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Projected Outflow', val: '$84,300', tag: 'Primary', tagCls: 'bg-blue-50 text-blue-700 border-blue-200', accent: 'bg-[#003566]', sub: 'Predicted unbilled spend' },
            { label: 'Early Warning', val: '22.5 Days', tag: 'Proactive', tagCls: 'bg-amber-50 text-amber-800 border-amber-200', accent: 'bg-[#FFC300]', sub: 'Avg. lead before invoice' },
            { label: 'Spending Events', val: '14 Items', tag: 'Synthesized', tagCls: 'bg-violet-50 text-violet-700 border-violet-200', accent: 'bg-violet-600', sub: 'Detected via Slack & Gmail' },
            { label: 'Signal Listener', val: 'Live & On', tag: 'Real-Time', tagCls: 'bg-emerald-50 text-emerald-700 border-emerald-200', accent: 'bg-emerald-500', sub: 'Continuous webhook active' },
          ].map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="relative bg-white border border-slate-200 rounded-xl p-2.5 overflow-hidden"
            >
              <div className={`absolute top-0 inset-x-0 h-0.5 ${c.accent}`} />
              <div className="flex items-start justify-between mb-2">
                <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${c.tagCls}`}>{c.tag}</span>
              </div>
              <p className="text-[9px] text-slate-500 mb-0.5">{c.label}</p>
              <p className="text-sm font-black text-[#000814] leading-tight">{c.val}</p>
              <p className="text-[8px] text-slate-400 mt-0.5">{c.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-12 gap-2">
          {/* Expense Feed */}
          <div className="col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <p className="text-[10px] font-black text-[#000814] uppercase tracking-wider">Predicted Expenses</p>
              <span className="text-[9px] bg-blue-50 text-[#003566] font-bold px-2 py-0.5 rounded-full border border-blue-200">Next 30 Days</span>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                { desc: 'AWS H100 GPU Cluster Spin-Up', amt: '$9,600', conf: 97, src: 'Slack', cat: 'Cloud', status: 'PENDING', catColor: 'bg-blue-100 text-blue-700' },
                { desc: 'Figma Enterprise Seat Upgrade (16 seats)', amt: '$4,800/yr', conf: 94, src: 'Slack', cat: 'SaaS', status: 'APPROVED', catColor: 'bg-purple-100 text-purple-700' },
                { desc: 'React Native Contractor (₹1.4L×3)', amt: '$15,000/mo', conf: 92, src: 'Slack', cat: 'Contractors', status: 'PENDING', catColor: 'bg-amber-100 text-amber-700' },
                { desc: 'Postgres RDS r6g.8xlarge Upgrade', amt: '$7,200/mo', conf: 96, src: 'Gmail', cat: 'Infra', status: 'PENDING', catColor: 'bg-rose-100 text-rose-700' },
              ].map((exp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <div className={`text-[8px] font-black px-1.5 py-0.5 rounded ${exp.catColor} flex-shrink-0`}>{exp.cat}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-800 truncate">{exp.desc}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[8px] text-slate-400 font-mono">{exp.src}</span>
                      <span className="text-[8px] text-slate-300">·</span>
                      <span className="text-[8px] text-slate-400">{exp.conf}% conf.</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-black text-[#000814]">{exp.amt}</p>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                      exp.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>{exp.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Chart + Category */}
          <div className="col-span-5 flex flex-col gap-2">
            {/* Mini bar chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <p className="text-[9px] font-black text-[#000814] uppercase tracking-wider mb-2">Spend Horizon (30d)</p>
              <div className="flex items-end gap-1.5 h-16">
                {[40, 65, 45, 80, 55, 90, 60, 75, 50, 85, 70, 95].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    style={{ height: `${h}%`, transformOrigin: 'bottom' }}
                    className={`flex-1 rounded-t-sm ${i === 11 ? 'bg-[#FFC300]' : i % 3 === 0 ? 'bg-[#003566]/60' : 'bg-[#003566]/25'}`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[8px] text-slate-400 mt-1.5 font-mono">
                <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex-1">
              <p className="text-[9px] font-black text-[#000814] uppercase tracking-wider mb-2">Category Split</p>
              <div className="space-y-2">
                {[
                  { label: 'Cloud / Infra', pct: 38, color: 'bg-blue-500', amt: '$32K' },
                  { label: 'Contractors', pct: 28, color: 'bg-amber-500', amt: '$23K' },
                  { label: 'SaaS Tools', pct: 22, color: 'bg-violet-500', amt: '$18K' },
                  { label: 'Others', pct: 12, color: 'bg-slate-400', amt: '$11K' },
                ].map((cat, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${cat.color}`} />
                        <span className="text-[9px] font-semibold text-slate-700">{cat.label}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 font-mono">{cat.amt}</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${cat.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className={`h-full rounded-full ${cat.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Floating labels */}
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      className="absolute -left-8 top-1/3 bg-white border border-slate-200 rounded-xl shadow-xl px-3 py-2 text-[10px] font-bold text-slate-700 hidden lg:block"
    >
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        Slack connected
      </div>
    </motion.div>
    <motion.div
      animate={{ y: [0, 5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      className="absolute -right-8 top-2/3 bg-white border border-[#FFC300]/40 rounded-xl shadow-xl px-3 py-2 text-[10px] font-bold text-slate-700 hidden lg:block"
    >
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-amber-500" />
        Gemini AI Active
      </div>
    </motion.div>
  </motion.div>
);

/* ── Feature Card ── */
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge?: string;
  badgeColor?: string;
  delay?: number;
  status?: 'live' | 'planned';
}> = ({ icon, title, desc, badge, badgeColor = 'bg-slate-100 border-slate-200 text-slate-600', delay = 0, status = 'live' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.22 } }}
      className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-xl hover:shadow-slate-100/80 hover:border-slate-300 transition-all duration-300 group cursor-default"
    >
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[#003566] bg-[#003566]/5 border border-[#003566]/10 group-hover:scale-110 transition-all duration-300">
          {icon}
        </div>
        {status === 'live' ? (
          <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
            <Star className="w-2.5 h-2.5" /> PLANNED
          </span>
        )}
      </div>
      <div>
        <h3 className="text-sm font-bold text-[#000814] mb-1.5 group-hover:text-[#003566] transition-colors">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
      {badge && (
        <div className={`self-start px-2.5 py-1 rounded-lg border text-[9px] font-bold ${badgeColor}`}>
          {badge}
        </div>
      )}
    </motion.div>
  );
};

/* ── Pipeline Step ── */
const PipelineStep: React.FC<{ num: string; title: string; desc: string; icon: React.ReactNode; delay?: number; last?: boolean }> = ({
  num, title, desc, icon, delay = 0, last = false
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-5 group"
    >
      <div className="flex flex-col items-center">
        <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#003566] group-hover:border-[#FFC300]/60 group-hover:shadow-md transition-all duration-300">
          {icon}
        </div>
        {!last && <div className="w-px flex-1 bg-gradient-to-b from-slate-200 to-transparent mt-2 min-h-[28px]" />}
      </div>
      <div className={`${!last ? 'pb-8' : ''} pt-1 flex-1`}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-black text-slate-300 font-mono">{num}</span>
          <h3 className="text-sm font-bold text-[#000814]">{title}</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm">{desc}</p>
      </div>
    </motion.div>
  );
};

/* ── MAIN ── */
export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'planned'>('live');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900 font-landing overflow-x-hidden">
      <AmbientOrbs />

      {/* ── NAVBAR ── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-3 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm'
            : 'py-5'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <VanguardLogo size="md" />
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <a href="#how-it-works" className="hover:text-[#000814] transition-colors">How It Works</a>
            <a href="#dashboard" className="hover:text-[#000814] transition-colors">Dashboard</a>
            <a href="#platform" className="hover:text-[#000814] transition-colors">Platform</a>
            <a href="#roadmap" className="hover:text-[#000814] transition-colors">Roadmap</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onGetStarted} className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-[#000814] px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer">
              Sign In
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={onGetStarted}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#000814] hover:bg-[#001D3D] text-white text-sm font-bold shadow-lg shadow-slate-900/20 transition cursor-pointer"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center pt-28 pb-24 px-4 sm:px-6 text-center max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold mb-8 shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Early Access Open · Actively in Development
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-6xl md:text-[4.5rem] font-extrabold tracking-tight leading-[1.06] max-w-4xl text-[#000814] mb-6"
        >
          Know about every spend<br />
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(135deg, #003566 0%, #0052a3 45%, #d97706 100%)' }}
          >
            before it becomes a bill.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="text-lg text-slate-500 max-w-2xl mb-10 leading-relaxed"
        >
          Vanguard monitors your team's Slack and email conversations, uses Gemini AI to detect uncommitted spend intentions — cloud, SaaS, contractors, vendors — and surfaces them to your finance team weeks before any invoice arrives.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-20"
        >
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 12px 32px rgba(0,29,61,0.18)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onGetStarted}
            className="px-8 py-4 rounded-2xl bg-[#000814] text-white text-sm font-bold shadow-xl shadow-slate-900/20 flex items-center gap-2.5 cursor-pointer transition"
          >
            Request Early Access <ArrowRight className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onGetStarted}
            className="px-7 py-4 rounded-2xl bg-white border border-slate-200 text-[#000814] text-sm font-bold shadow-sm hover:shadow-md flex items-center gap-2.5 cursor-pointer transition"
          >
            <Sparkles className="w-4 h-4 text-amber-500" /> Try Live Demo
          </motion.button>
        </motion.div>

        {/* Hero mockup */}
        <div className="w-full max-w-lg">
          <SlackMockup />
        </div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-1 text-slate-400 cursor-default"
          >
            <span className="text-[9px] font-bold tracking-widest uppercase">Scroll</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="relative z-10 py-28 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <FadeUp>
              <p className="text-xs font-black text-[#003566] uppercase tracking-[0.18em] mb-4">How It Works</p>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-[#000814] leading-[1.1] mb-6">
                From team conversation to fiscal alert in seconds
              </h2>
              <p className="text-slate-500 leading-relaxed mb-10 max-w-lg text-sm">
                Your team talks about spend decisions every day in Slack — spinning up servers, hiring contractors, upgrading software plans. Vanguard reads those signals and gives finance the lead time they need.
              </p>
            </FadeUp>
            <div className="space-y-0">
              <PipelineStep delay={0.1} num="01" icon={<Inbox className="w-5 h-5" />} title="Connect Slack & Email"
                desc="1-click OAuth to your Slack workspace or email. No code, no infrastructure, no agents to host anywhere." />
              <PipelineStep delay={0.2} num="02" icon={<BrainCircuit className="w-5 h-5" />} title="Gemini AI Reads Every Message"
                desc="Google Gemini 1.5 Flash scans connected channels for spend intent — cloud spin-ups, contractor engagements, SaaS upgrades, vendor negotiations." />
              <PipelineStep delay={0.3} num="03" icon={<Bell className="w-5 h-5" />} title="Finance Gets Early Warning"
                desc="Structured predictions appear in your Vanguard dashboard — amount, category, confidence, and source — weeks before any invoice." />
              <PipelineStep delay={0.4} num="04" icon={<CheckCircle2 className="w-5 h-5" />} title="Act Before the Bill Arrives" last
                desc="Approve, renegotiate or cancel — all before the billing cycle closes. Stop fighting fires after the month-end statement." />
            </div>
          </div>

          {/* Pipeline visual */}
          <FadeUp delay={0.2}>
            <div className="relative bg-white border border-slate-200/80 rounded-3xl p-7 shadow-xl shadow-slate-100/60">
              <div className="absolute top-0 inset-x-0 h-[3px] rounded-t-3xl bg-gradient-to-r from-[#003566] via-[#FFC300] to-transparent" />
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-5">Processing Pipeline</p>
              <div className="space-y-2.5">
                {[
                  { icon: <MessageSquare className="w-4 h-4 text-blue-600" />, label: 'Message Ingested from Slack', bg: 'bg-blue-50 border-blue-100', dot: 'bg-blue-500', status: '< 140ms', sc: 'text-blue-600' },
                  { icon: <BrainCircuit className="w-4 h-4 text-amber-600" />, label: 'Gemini AI Extraction Running', bg: 'bg-amber-50 border-amber-100', dot: 'bg-amber-500', status: 'Analyzing...', sc: 'text-amber-600' },
                  { icon: <AlertTriangle className="w-4 h-4 text-violet-600" />, label: 'Spend Intent Classified', bg: 'bg-violet-50 border-violet-100', dot: 'bg-violet-500', status: '96% conf.', sc: 'text-violet-600' },
                  { icon: <ShieldCheck className="w-4 h-4 text-[#003566]" />, label: 'Prediction Stored Securely', bg: 'bg-indigo-50 border-indigo-100', dot: 'bg-indigo-500', status: 'AES-256', sc: 'text-indigo-600' },
                  { icon: <Bell className="w-4 h-4 text-emerald-600" />, label: 'Finance Team Alerted', bg: 'bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500', status: '22d early', sc: 'text-emerald-600' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${s.bg}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-white/80 flex items-center justify-center shadow-sm flex-shrink-0">{s.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{s.label}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25 }}
                        className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      <span className={`text-[10px] font-bold ${s.sc}`}>{s.status}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-mono">End-to-end latency</span>
                <span className="font-black text-[#000814] font-mono">&lt; 200ms</span>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section id="dashboard" className="relative z-10 py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-black text-[#003566] uppercase tracking-[0.18em] mb-4">The Dashboard</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#000814] leading-[1.1] mb-5">
              Your finance team's<br />fiscal early-warning centre
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed text-sm">
              Everything extracted from Slack and email surfaces in one unified view — categorised, confidence-scored, and horizon-filtered. Here's exactly what you'll see once you connect.
            </p>
          </FadeUp>

          <DashboardPreview />

          {/* Dashboard feature callouts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {[
              { icon: <BarChart3 className="w-4 h-4" />, label: '7 / 30 / 90 Day Views', desc: 'Toggle predictive horizons' },
              { icon: <Layers className="w-4 h-4" />, label: 'Category Breakdown', desc: 'Cloud, SaaS, Contractors, Infra' },
              { icon: <Activity className="w-4 h-4" />, label: 'Confidence Scoring', desc: 'AI certainty per prediction' },
              { icon: <ShieldCheck className="w-4 h-4" />, label: 'Source Traceability', desc: 'Slack channel or email thread' },
            ].map((f, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-all">
                  <div className="w-8 h-8 rounded-lg bg-[#003566]/5 border border-[#003566]/10 flex items-center justify-center text-[#003566] flex-shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#000814]">{f.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM ── */}
      <section id="platform" className="relative z-10 py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-xs font-black text-[#003566] uppercase tracking-[0.18em] mb-4">The Platform</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#000814] leading-[1.1] mb-5">
              What's live. What's coming.
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto text-sm">We're transparent about what exists today and what we're building. No vaporware.</p>
          </FadeUp>

          <FadeUp delay={0.1} className="flex justify-center mb-10">
            <div className="inline-flex bg-white border border-slate-200 rounded-2xl p-1.5 gap-1 shadow-sm">
              <button onClick={() => setActiveTab('live')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'live' ? 'bg-[#000814] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
                Live Today
              </button>
              <button onClick={() => setActiveTab('planned')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'planned' ? 'bg-[#000814] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
                <Star className="w-3.5 h-3.5 text-amber-400" /> Coming Next
              </button>
            </div>
          </FadeUp>

          <AnimatePresence mode="wait">
            {activeTab === 'live' ? (
              <motion.div key="live" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <FeatureCard status="live" delay={0} icon={<MessageSquare className="w-5 h-5" />} title="Slack Channel Monitoring"
                  desc="Passively monitors designated Slack channels for any spend-related intent — cloud resources, contractors, SaaS seats, vendor negotiations."
                  badge="Gemini 1.5 Flash" badgeColor="bg-blue-50 border-blue-200 text-blue-700" />
                <FeatureCard status="live" delay={0.07} icon={<BrainCircuit className="w-5 h-5" />} title="NLP Intent Extraction"
                  desc="Converts unstructured messages into structured expense predictions with amount, category, department, confidence score, and timeline."
                  badge="< 200ms latency" badgeColor="bg-indigo-50 border-indigo-200 text-indigo-700" />
                <FeatureCard status="live" delay={0.14} icon={<BarChart3 className="w-5 h-5" />} title="Multi-Horizon Dashboard"
                  desc="Finance-ready dashboard with 7, 30, and 90-day prediction windows, category breakdowns, spend charts, and approval status tracking."
                  badge="7 / 30 / 90d views" badgeColor="bg-slate-100 border-slate-200 text-slate-600" />
                <FeatureCard status="live" delay={0.21} icon={<Clock className="w-5 h-5" />} title="Pre-Invoice Early Warning"
                  desc="Surfaces predictions weeks before any invoice or PO is raised — giving finance teams the lead time to act, not react."
                  badge="22+ day average" badgeColor="bg-amber-50 border-amber-200 text-amber-700" />
                <FeatureCard status="live" delay={0.28} icon={<Lock className="w-5 h-5" />} title="Multi-Tenant Security"
                  desc="Cryptographically isolated per-organisation tenants. JWT-scoped authentication. No data co-mingling possible at the architecture level."
                  badge="AES-256 + JWT" badgeColor="bg-emerald-50 border-emerald-200 text-emerald-700" />
                <FeatureCard status="live" delay={0.35} icon={<ShieldCheck className="w-5 h-5" />} title="Zero-Config Setup"
                  desc="Slack OAuth in one click. No SDK, no agents, no infrastructure. Start receiving predictions within 60 seconds of connecting."
                  badge="1-click OAuth" badgeColor="bg-sky-50 border-sky-200 text-sky-700" />
              </motion.div>
            ) : (
              <motion.div key="planned" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <FeatureCard status="planned" delay={0} icon={<Inbox className="w-5 h-5" />} title="Email & Calendar Ingestion"
                  desc="Extend detection to Gmail, Outlook, and Google Calendar to surface spend commitments made outside Slack in email threads and meeting notes."
                  badge="In Development" badgeColor="bg-amber-50 border-amber-200 text-amber-700" />
                <FeatureCard status="planned" delay={0.07} icon={<Zap className="w-5 h-5" />} title="Autonomous Slack Bot"
                  desc="Vanguard bot replies in-thread with actionable recommendations — spot pricing, seat reallocation, rate card comparisons — with 1-click approvals."
                  badge="In Development" badgeColor="bg-amber-50 border-amber-200 text-amber-700" />
                <FeatureCard status="planned" delay={0.14} icon={<GitBranch className="w-5 h-5" />} title="Approval Workflow Engine"
                  desc="Configurable multi-step approval chains — thresholds, escalation paths, CFO routing — with a full audit trail per prediction."
                  badge="Roadmap Q1" badgeColor="bg-slate-100 border-slate-200 text-slate-600" />
                <FeatureCard status="planned" delay={0.21} icon={<TrendingUp className="w-5 h-5" />} title="Budget Scenario Modelling"
                  desc="Simulate the impact of detected spend intentions on quarterly and annual budget headroom. See cascading effects before they happen."
                  badge="Roadmap Q2" badgeColor="bg-slate-100 border-slate-200 text-slate-600" />
                <FeatureCard status="planned" delay={0.28} icon={<Cpu className="w-5 h-5" />} title="AWS / GCP Cost API Sync"
                  desc="Validate Vanguard predictions against actual cost APIs from AWS Cost Explorer and GCP Billing to continuously improve extraction accuracy."
                  badge="Roadmap Q2" badgeColor="bg-slate-100 border-slate-200 text-slate-600" />
                <FeatureCard status="planned" delay={0.35} icon={<Activity className="w-5 h-5" />} title="Spend Anomaly Intelligence"
                  desc="Build a behavioural baseline per organisation and flag statistically significant deviations beyond stated intentions — pattern-level detection."
                  badge="Roadmap Q3" badgeColor="bg-slate-100 border-slate-200 text-slate-600" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── ROADMAP ── */}
      <section id="roadmap" className="relative z-10 py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-black text-[#003566] uppercase tracking-[0.18em] mb-4">Roadmap</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#000814] leading-[1.1] mb-5">Where we are. Where we're going.</h2>
            <p className="text-slate-500 max-w-lg mx-auto text-sm">A transparent, honest view of Vanguard's build progress — no marketing spin.</p>
          </FadeUp>

          <div className="relative">
            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-emerald-400 via-amber-300 to-slate-200" />
            <div className="space-y-1">
              {[
                { phase: 'Now Live', label: 'Slack OAuth + multi-tenant architecture', desc: 'Core infrastructure: workspace isolation, JWT auth, Slack channel connection, Gemini extraction pipeline.', status: 'complete' },
                { phase: 'Now Live', label: 'Predictive dashboard with multi-horizon views', desc: 'Full finance dashboard: 7/30/90-day horizon views, confidence scoring, category breakdown, expense detail drawer.', status: 'complete' },
                { phase: 'In Progress', label: 'Email & calendar ingestion (Gmail / Outlook)', desc: 'Expanding beyond Slack to detect spend signals from email threads and meeting invites.', status: 'active' },
                { phase: 'In Progress', label: 'Autonomous Slack bot with 1-click approvals', desc: 'Bot replies in-thread with cost-saving recommendations and approval actions without leaving Slack.', status: 'active' },
                { phase: 'Next — Q1', label: 'Configurable approval workflow engine', desc: 'Multi-step approval chains with thresholds, escalation rules, CFO routing, and full audit trail.', status: 'planned' },
                { phase: 'Planned — Q2', label: 'AWS / GCP billing API correlation', desc: 'Close the prediction feedback loop via actual cloud cost APIs and improve accuracy over time.', status: 'planned' },
              ].map((item, i) => (
                <FadeUp key={i} delay={i * 0.07}>
                  <div className="flex items-start gap-5 pb-8">
                    <div className="flex-shrink-0 relative z-10 mt-1.5">
                      <div className={`w-[10px] h-[10px] rounded-full border-2 ${
                        item.status === 'complete' ? 'bg-emerald-500 border-emerald-400' :
                        item.status === 'active' ? 'bg-amber-400 border-amber-300' :
                        'bg-slate-200 border-slate-300'
                      }`} />
                    </div>
                    <div className={`flex-1 bg-white border rounded-2xl p-5 shadow-sm ${
                      item.status === 'complete' ? 'border-emerald-100' :
                      item.status === 'active' ? 'border-amber-100' : 'border-slate-200/70'
                    }`}>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          item.status === 'complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          item.status === 'active' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>{item.phase}</span>
                        <h3 className="text-sm font-bold text-[#000814]">{item.label}</h3>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-28 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <FadeUp>
            <div className="relative bg-[#000814] rounded-3xl p-10 sm:p-16 text-center overflow-hidden">
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(255,195,0,0.4) 0%, transparent 70%)' }} />
              <div className="absolute -bottom-20 -right-10 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(56,189,248,0.3) 0%, transparent 70%)' }} />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#FFD60A] text-xs font-bold mb-6">
                  <Sparkles className="w-3.5 h-3.5" /> Early Access — No Cost
                </div>
                <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-[1.1] mb-5">
                  Know before the bill.<br />Act before it's too late.
                </h2>
                <p className="text-slate-400 max-w-lg mx-auto mb-10 leading-relaxed text-sm">
                  If your team makes spend decisions in Slack before any PO or invoice exists — cloud, SaaS, contractors, or anything else — Vanguard was built for you.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(255,195,0,0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onGetStarted}
                    className="px-9 py-4 rounded-2xl bg-gradient-to-r from-[#FFC300] to-[#FFD60A] text-[#000814] text-sm font-black shadow-xl cursor-pointer flex items-center gap-2.5 border border-amber-300"
                  >
                    Request Early Access <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </motion.button>
                  <button onClick={onGetStarted}
                    className="px-7 py-4 rounded-2xl bg-white/10 border border-white/20 text-white text-sm font-bold hover:bg-white/15 cursor-pointer transition">
                    Sign In to Demo
                  </button>
                </div>
                <p className="text-slate-600 text-xs mt-6">No credit card. No hidden setup. A Slack workspace and 60 seconds.</p>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-slate-200/60 py-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <VanguardLogo size="xs" variant="dark" />
            <span className="text-slate-300">·</span>
            <span className="text-slate-500 text-xs">Fiscal Early-Warning for Modern Teams</span>
          </div>
          <div className="flex items-center gap-5 text-xs font-semibold text-slate-400">
            <a href="#how-it-works" className="hover:text-slate-700">How It Works</a>
            <a href="#dashboard" className="hover:text-slate-700">Dashboard</a>
            <a href="#platform" className="hover:text-slate-700">Platform</a>
            <a href="#roadmap" className="hover:text-slate-700">Roadmap</a>
            <button onClick={onGetStarted} className="hover:text-slate-700 cursor-pointer">Sign In</button>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> System Operational
          </div>
        </div>
        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-[10px] text-slate-400">
          © 2026 Vanguard Intelligence Inc. Built for FinOps and engineering teams.
        </div>
      </footer>
    </div>
  );
};
