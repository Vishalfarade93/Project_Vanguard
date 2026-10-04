import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { VanguardLogo } from './VanguardLogo';
import {
  Building2, User as UserIcon, Mail, Lock, ArrowRight,
  AlertCircle, Eye, EyeOff,
  ArrowLeft, Sparkles, Check
} from 'lucide-react';

interface AuthPageProps {
  onBack?: () => void;
}

/* ─────────────────────────────────────────────────────────────
   Illustration: Tech Citadel & Cyber Hills (Matching Screenshot)
───────────────────────────────────────────────────────────── */
const TechLandscape = () => (
  <div className="relative w-full h-44 sm:h-52 lg:h-60 overflow-hidden select-none pointer-events-none mt-auto">
    <svg viewBox="0 0 500 220" className="w-full h-full object-cover" preserveAspectRatio="none">
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#001D3D" stopOpacity="0"/>
          <stop offset="100%" stopColor="#000814" stopOpacity="0.6"/>
        </linearGradient>
        <linearGradient id="hillBack" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#002855"/>
          <stop offset="100%" stopColor="#001833"/>
        </linearGradient>
        <linearGradient id="hillFront" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#003566"/>
          <stop offset="50%" stopColor="#0284c7"/>
          <stop offset="100%" stopColor="#001D3D"/>
        </linearGradient>
        <linearGradient id="citadelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFC300"/>
          <stop offset="100%" stopColor="#b45309"/>
        </linearGradient>
      </defs>

      {/* Cyber Grid Stars */}
      <circle cx="45" cy="25" r="1.5" fill="#FFD60A" opacity="0.7"/>
      <circle cx="120" cy="45" r="1.2" fill="#ffffff" opacity="0.6"/>
      <circle cx="210" cy="18" r="1.8" fill="#FFC300" opacity="0.8"/>
      <circle cx="340" cy="38" r="1.4" fill="#38bdf8" opacity="0.7"/>
      <circle cx="440" cy="22" r="1.5" fill="#ffffff" opacity="0.8"/>

      {/* Futuristic Clouds */}
      <g opacity="0.25" fill="#ffffff">
        <path d="M70,55 Q80,42 96,48 Q110,40 125,50 Q135,53 130,62 Q100,64 70,62 Z"/>
        <path d="M380,35 Q390,24 404,30 Q416,22 430,32 Q438,36 434,44 Q405,46 380,44 Z"/>
      </g>

      {/* Distant Cyber Hill */}
      <path d="M-20,180 Q140,110 290,150 T520,120 L520,220 L-20,220 Z" fill="url(#hillBack)"/>

      {/* Cyber Communication Tower */}
      <line x1="110" y1="120" x2="110" y2="160" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6"/>
      <circle cx="110" cy="120" r="3" fill="#FFD60A"/>
      <circle cx="110" cy="120" r="6" stroke="#FFD60A" strokeWidth="0.8" fill="none" opacity="0.5"/>

      {/* Tech Citadel / Vanguard Data Vault */}
      <g transform="translate(350, 95)">
        {/* Main Vault Building */}
        <polygon points="30,15 65,0 100,15 100,75 30,75" fill="#001428" stroke="#38bdf8" strokeWidth="1.2"/>
        {/* Golden Roof Trim */}
        <polyline points="30,15 65,0 100,15" stroke="#FFC300" strokeWidth="2.5" fill="none"/>
        {/* Server Rack Glowing Windows */}
        <rect x="42" y="28" width="12" height="18" rx="2" fill="#FFD60A" opacity="0.9"/>
        <rect x="76" y="28" width="12" height="18" rx="2" fill="#FFD60A" opacity="0.9"/>
        <line x1="42" y1="34" x2="54" y2="34" stroke="#000814" strokeWidth="1"/>
        <line x1="42" y1="40" x2="54" y2="40" stroke="#000814" strokeWidth="1"/>
        <line x1="76" y1="34" x2="88" y2="34" stroke="#000814" strokeWidth="1"/>
        <line x1="76" y1="40" x2="88" y2="40" stroke="#000814" strokeWidth="1"/>
        {/* Main Gateway Door */}
        <rect x="56" y="50" width="18" height="25" rx="1" fill="#003566" stroke="#FFC300" strokeWidth="1.2"/>
        <circle cx="65" cy="58" r="2.5" fill="#FFD60A"/>
      </g>

      {/* Front Rolling Hill with Cyber Wave */}
      <path d="M-10,220 Q120,150 260,175 Q380,195 510,140 L510,220 Z" fill="url(#hillFront)"/>

      {/* Digital Grid Fence / Circuit Lines */}
      <g stroke="#38bdf8" strokeWidth="1" opacity="0.65">
        <line x1="180" y1="185" x2="260" y2="175"/>
        <line x1="180" y1="195" x2="260" y2="185"/>
        <line x1="190" y1="180" x2="190" y2="202"/>
        <line x1="210" y1="178" x2="210" y2="200"/>
        <line x1="230" y1="176" x2="230" y2="198"/>
        <line x1="250" y1="174" x2="250" y2="196"/>
      </g>

      {/* Autonomous AI Agents / Data Sparks */}
      <g transform="translate(275, 172)">
        {/* Agent 1 */}
        <circle cx="10" cy="10" r="4" fill="#FFC300"/>
        <polygon points="10,4 14,8 10,12 6,8" fill="#FFD60A"/>
        <line x1="10" y1="14" x2="10" y2="19" stroke="#FFC300" strokeWidth="1.5"/>
        {/* Agent 2 */}
        <circle cx="26" cy="6" r="5" fill="#FFD60A"/>
        <polygon points="26,0 31,5 26,10 21,5" fill="#FFC300"/>
        <line x1="26" y1="11" x2="26" y2="18" stroke="#FFD60A" strokeWidth="1.5"/>
        {/* Agent 3 */}
        <circle cx="42" cy="11" r="3.5" fill="#38bdf8"/>
        <line x1="42" y1="14.5" x2="42" y2="19" stroke="#38bdf8" strokeWidth="1.5"/>
      </g>

      {/* Ambient Cyber Flowers / Data Nodes */}
      <circle cx="140" cy="195" r="2" fill="#ffffff"/>
      <circle cx="340" cy="190" r="2.5" fill="#FFD60A"/>
      <circle cx="440" cy="175" r="2" fill="#38bdf8"/>
    </svg>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   LOGIN VIEW: Full-page layout matching requested design
   Left: Clean White Form
   Right: Curved S-Wave with Deep Navy Panel & Tech Landscape
───────────────────────────────────────────────────────────── */
const LoginView = ({
  onSwitch,
  onBack,
  onSuccess
}: {
  onSwitch: () => void;
  onBack?: () => void;
  onSuccess?: () => void;
}) => {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = email.includes('@') && email.includes('.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (!err.response || (err.response.status === 500 && !err.response?.data?.error && !err.response?.data?.message)) {
        setError('Backend server on port 8080 is unreachable. Please ensure Spring Boot is running.');
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      await demoLogin();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Demo access failed');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row relative font-auth bg-white">
      {/* ── LEFT PANEL: Clean White Form (Full-page half) ── */}
      <div className="w-full md:w-1/2 lg:w-[48%] xl:w-[45%] bg-white p-6 sm:p-10 md:p-12 lg:p-16 flex flex-col justify-between z-10 min-h-screen">
        <div className="w-full max-w-md mx-auto my-auto py-6">
          {/* Top Row: Brand & Back */}
          <div className="flex items-center justify-between mb-8">
            <VanguardLogo size="md" />
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#003566] transition cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
          </div>

          {/* Heading */}
          <div className="mb-7">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              WELCOME TO
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-2 flex-wrap">
              <span className="text-[#000814]">Vanguard</span>
              <span className="text-[#003566]">Intelligence</span>
            </h1>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 font-medium leading-snug">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Username / Work Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="PaoloSpaz | name@company.com"
                  className={`w-full bg-slate-50/70 border text-sm text-slate-800 rounded-xl px-4 py-3.5 pr-10 outline-none transition-all ${
                    isValidEmail
                      ? 'border-emerald-400 ring-2 ring-emerald-400/15'
                      : 'border-slate-200 focus:border-[#003566] focus:ring-2 focus:ring-[#003566]/15'
                  }`}
                />
                {isValidEmail && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••"
                  className="w-full bg-slate-50/70 border border-slate-200 focus:border-[#003566] focus:ring-2 focus:ring-[#003566]/15 text-sm text-slate-800 rounded-xl px-4 py-3.5 pr-10 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#003566] focus:ring-[#003566] cursor-pointer"
                />
                <span className="text-xs text-slate-500 font-medium">Remember me</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => { e.preventDefault(); alert('Password reset link sent to demo administrator.'); }}
                className="text-xs font-semibold text-[#003566] hover:underline cursor-pointer"
              >
                Forgot Password ?
              </a>
            </div>

            {/* Big Bold LOGIN Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#003566] to-[#001D3D] hover:from-[#002855] hover:to-[#000814] text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-[#003566]/25 transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>LOGIN</span>
              )}
            </motion.button>

            {/* One-Click Acme Demo Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="w-full py-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-[#b45309] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
            >
              {demoLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-amber-500/30 border-t-amber-600 rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#FFC300]" />
                  <span>Explore Demo (Acme Corp)</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </>
              )}
            </motion.button>
          </form>

          {/* Switch to Register */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitch}
              className="font-bold text-[#003566] hover:underline cursor-pointer ml-1"
            >
              Sign up
            </button>
          </p>

          {/* Card Footer Links */}
          <div className="flex items-center justify-center gap-3 pt-8 border-t border-slate-100 mt-8 text-xs text-slate-400 font-medium">
            <a href="#faq" onClick={(e) => { e.preventDefault(); alert('Vanguard Intelligence: Real-time autonomous spend governance.'); }} className="hover:text-slate-600 transition">FAQ</a>
            <span>|</span>
            <a href="#features" onClick={(e) => { e.preventDefault(); onBack && onBack(); }} className="hover:text-slate-600 transition">Features</a>
            <span>|</span>
            <a href="#support" onClick={(e) => { e.preventDefault(); alert('Support team: support@vanguardintelligence.com'); }} className="hover:text-slate-600 transition">Support</a>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Deep Vanguard Blue with Organic Curved S-Wave (Full-page half) ── */}
      <div className="w-full md:w-1/2 lg:w-[52%] xl:w-[55%] relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#003566] via-[#001D3D] to-[#000814] text-white p-6 sm:p-10 md:p-12 lg:p-16 min-h-[520px] md:min-h-screen">
        {/* Organic Curved Wave Divider (Desktop) */}
        <div className="hidden md:block absolute top-0 bottom-0 -left-[1px] w-16 lg:w-24 h-full pointer-events-none z-20">
          <svg
            viewBox="0 0 100 800"
            preserveAspectRatio="none"
            className="w-full h-full fill-white"
          >
            {/* Smooth concave and convex curve from top to bottom */}
            <path d="M 0,0 L 15,0 C 85,220 5,380 75,560 C 105,640 65,720 0,800 Z" />
          </svg>
        </div>

        {/* Content Section */}
        <div className="relative z-10 w-full max-w-lg mx-auto my-auto md:pl-8 lg:pl-14 pt-8">
          <div className="mb-6">
            <div className="inline-flex items-center bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/40 shadow-sm">
              <VanguardLogo size="md" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
            About Vanguard Intelligence
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-blue-100/85 leading-relaxed mb-8 font-normal">
            Vanguard Intelligence is the autonomous multi-agent financial early-warning platform.
            Our Gemini AI agents monitor team communications in real-time, detecting
            spend commitments and liabilities <strong className="text-white font-bold">22+ days</strong> before invoices arrive.
          </p>

          <h3 className="text-base sm:text-lg font-bold text-[#FFD60A] tracking-tight mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FFC300] animate-ping" />
            Core Capabilities
          </h3>

          <ul className="space-y-3 text-xs sm:text-sm lg:text-base text-blue-100/90">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#FFC300] mt-1.5 flex-shrink-0 shadow-[0_0_8px_#FFC300]" />
              <span>Real-time autonomous spend intent extraction from Slack & email</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#FFC300] mt-1.5 flex-shrink-0 shadow-[0_0_8px_#FFC300]" />
              <span>Predictive financial impact runway with automatic benchmark pricing</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#FFC300] mt-1.5 flex-shrink-0 shadow-[0_0_8px_#FFC300]" />
              <span>Multi-tenant cryptographic workspace isolation for zero data leakage</span>
            </li>
          </ul>
        </div>

        {/* Bottom Tech Citadel & Cyber Hills Illustration */}
        <div className="relative z-10 w-full mt-auto pt-6">
          <TechLandscape />
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   REGISTER VIEW: Full-page layout matching requested design
   Opposite layout: Navy on Left, White Form on Right
   NO Slack token field!
───────────────────────────────────────────────────────────── */
const RegisterView = ({
  onSwitch,
  onBack,
  onSuccess
}: {
  onSwitch: () => void;
  onBack?: () => void;
  onSuccess?: () => void;
}) => {
  const { register } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register({ companyName, fullName, email, password });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (!err.response || (err.response.status === 500 && !err.response?.data?.error && !err.response?.data?.message)) {
        setError('Backend server on port 8080 is unreachable. Please ensure Spring Boot is running.');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row relative font-auth bg-white">
      {/* ── LEFT PANEL: Deep Vanguard Blue Brand Panel (Full-page half) ── */}
      <div className="w-full md:w-1/2 lg:w-[48%] xl:w-[45%] relative flex flex-col justify-between overflow-hidden bg-gradient-to-bl from-[#003566] via-[#001D3D] to-[#000814] text-white p-6 sm:p-10 md:p-12 lg:p-16 min-h-[520px] md:min-h-screen order-2 md:order-1">
        {/* Organic Curved Wave Divider (Desktop - pointing rightwards) */}
        <div className="hidden md:block absolute top-0 bottom-0 -right-[1px] w-16 lg:w-24 h-full pointer-events-none z-20">
          <svg
            viewBox="0 0 100 800"
            preserveAspectRatio="none"
            className="w-full h-full fill-white"
          >
            {/* Inverted curve carving into the navy panel from the right */}
            <path d="M 100,0 L 85,0 C 15,220 95,380 25,560 C -5,640 35,720 100,800 Z" />
          </svg>
        </div>

        {/* Content Section */}
        <div className="relative z-10 w-full max-w-lg mx-auto my-auto md:pr-8 lg:pr-14 pt-8">
          <div className="mb-6">
            <div className="inline-flex items-center bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/40 shadow-sm">
              <VanguardLogo size="md" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] text-xs font-bold mb-5">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" /> Enterprise Workspace Setup
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
            Why Vanguard Intelligence?
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-blue-100/85 leading-relaxed mb-8 font-normal">
            Gain complete clarity over upcoming software, contractor, and cloud commitments.
            Setup takes 60 seconds with instant workspace provisioning.
          </p>

          <h3 className="text-base sm:text-lg font-bold text-[#FFD60A] tracking-tight mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FFC300] animate-ping" />
            Workspace Highlights
          </h3>

          <ul className="space-y-3 text-xs sm:text-sm lg:text-base text-blue-100/90">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#FFC300] mt-1.5 flex-shrink-0 shadow-[0_0_8px_#FFC300]" />
              <span><strong>One-Click Slack Integration:</strong> Native OAuth connecting in seconds</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#FFC300] mt-1.5 flex-shrink-0 shadow-[0_0_8px_#FFC300]" />
              <span><strong>Isolated Multi-Tenancy:</strong> Complete cryptographic data partition</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#FFC300] mt-1.5 flex-shrink-0 shadow-[0_0_8px_#FFC300]" />
              <span><strong>Zero Friction:</strong> No credit card required for standard setup</span>
            </li>
          </ul>
        </div>

        {/* Bottom Tech Citadel & Cyber Hills */}
        <div className="relative z-10 w-full mt-auto pt-6">
          <TechLandscape />
        </div>
      </div>

      {/* ── RIGHT PANEL: Clean White Registration Form (Full-page half) ── */}
      <div className="w-full md:w-1/2 lg:w-[52%] xl:w-[55%] bg-white p-6 sm:p-10 md:p-12 lg:p-16 flex flex-col justify-between z-10 min-h-screen order-1 md:order-2">
        <div className="w-full max-w-md mx-auto my-auto py-6">
          {/* Top Row: Brand & Back */}
          <div className="flex items-center justify-between mb-6">
            <VanguardLogo size="md" />
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#003566] transition cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
          </div>

          {/* Heading */}
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              START YOUR FREE TRIAL
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-[#000814] tracking-tight">
              Create workspace
            </h1>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 font-medium leading-snug">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Company / Organization Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp, Linear, Vercel"
                  className="w-full bg-slate-50/70 border border-slate-200 focus:border-[#003566] focus:ring-2 focus:ring-[#003566]/15 text-sm text-slate-800 rounded-xl px-3.5 py-3 pl-9 outline-none transition-all"
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full bg-slate-50/70 border border-slate-200 focus:border-[#003566] focus:ring-2 focus:ring-[#003566]/15 text-sm text-slate-800 rounded-xl px-3.5 py-3 pl-9 outline-none transition-all"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Work Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Work Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50/70 border border-slate-200 focus:border-[#003566] focus:ring-2 focus:ring-[#003566]/15 text-sm text-slate-800 rounded-xl px-3.5 py-3 pl-9 outline-none transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full bg-slate-50/70 border border-slate-200 focus:border-[#003566] focus:ring-2 focus:ring-[#003566]/15 text-xs text-slate-800 rounded-xl px-3 py-2.5 pl-8 outline-none transition-all"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-slate-50/70 border border-slate-200 focus:border-[#003566] focus:ring-2 focus:ring-[#003566]/15 text-xs text-slate-800 rounded-xl px-3 py-2.5 pl-8 outline-none transition-all"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                required
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#003566] focus:ring-[#003566] cursor-pointer"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-500 cursor-pointer">
                I agree to Vanguard Intelligence's Terms of Service & Privacy Policy
              </label>
            </div>

            {/* Big Bold REGISTER Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#003566] to-[#001D3D] hover:from-[#002855] hover:to-[#000814] text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-[#003566]/25 transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>CREATE WORKSPACE</span>
              )}
            </motion.button>
          </form>

          {/* Switch to Login */}
          <p className="text-center text-xs text-slate-500 mt-5">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitch}
              className="font-bold text-[#003566] hover:underline cursor-pointer ml-1"
            >
              Sign in
            </button>
          </p>

          {/* Card Footer Links */}
          <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-100 mt-6 text-xs text-slate-400 font-medium">
            <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-slate-600 transition">Terms</a>
            <span>|</span>
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-slate-600 transition">Privacy</a>
            <span>|</span>
            <a href="#security" onClick={(e) => e.preventDefault()} className="hover:text-slate-600 transition">Security</a>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN AUTH PAGE WRAPPER:
   The whole page IS the design (Edge-to-Edge full viewport)
   No outer background wrapper or padding around the design!
───────────────────────────────────────────────────────────── */
export const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const [view, setView] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen w-full bg-white overflow-x-hidden font-auth">
      <AnimatePresence mode="wait">
        {view === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full min-h-screen"
          >
            <LoginView
              onSwitch={() => setView('register')}
              onBack={onBack}
            />
          </motion.div>
        ) : (
          <motion.div
            key="register"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full min-h-screen"
          >
            <RegisterView
              onSwitch={() => setView('login')}
              onBack={onBack}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
