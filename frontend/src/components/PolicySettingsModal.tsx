import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Settings2,
  DollarSign,
  Building2,
  Info,
  TriangleAlert,
} from 'lucide-react';

interface PolicySettings {
  threshold: number;
  companyName: string;
  autoCapUnspecified: boolean;
  allowManualPOAboveThreshold: boolean;
}

const STORAGE_KEY = 'vanguard_policy_settings';

export function loadPolicySettings(): PolicySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultPolicy(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultPolicy();
}

function defaultPolicy(): PolicySettings {
  return {
    threshold: 300,
    companyName: '',
    autoCapUnspecified: true,
    allowManualPOAboveThreshold: true,
  };
}

interface PolicySettingsModalProps {
  onClose: () => void;
  onSave: (settings: PolicySettings) => void;
}

export const PolicySettingsModal: React.FC<PolicySettingsModalProps> = ({ onClose, onSave }) => {
  const [settings, setSettings] = useState<PolicySettings>(loadPolicySettings());
  const [thresholdInput, setThresholdInput] = useState(String(loadPolicySettings().threshold));
  const [saved, setSaved] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  const handleSave = () => {
    const parsed = parseFloat(thresholdInput.replace(/[^0-9.]/g, ''));
    const final = { ...settings, threshold: isNaN(parsed) ? 300 : Math.max(50, Math.min(5000, parsed)) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(final));
    onSave(final);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  const presets = [100, 200, 300, 500, 1000, 2000];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(8,14,30,0.78)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: 'slideUp 0.22s cubic-bezier(.22,.68,0,1.2) both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-vanguard-navy to-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm leading-tight">Policy Settings</h2>
              <p className="text-slate-400 text-[11px]">Configure virtual card spend limits for your company</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Threshold */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-vanguard-blue" />
              Company-Wide Virtual Card Threshold
            </label>

            {/* Amount input */}
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input
                type="number"
                min={50}
                max={5000}
                step={50}
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                className="w-full pl-7 pr-4 py-3 rounded-xl border border-slate-200 focus:border-vanguard-blue focus:ring-2 focus:ring-vanguard-blue/20 text-lg font-bold font-mono text-slate-900 outline-none transition bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Quick preset pills */}
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setThresholdInput(String(p))}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    Number(thresholdInput) === p
                      ? 'bg-vanguard-navy text-amber-300 border-vanguard-navy shadow'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  ${p}
                </button>
              ))}
            </div>

            <p className="mt-2 text-[11px] text-slate-400 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
              Requests at or below this threshold generate a single-use virtual card automatically after manager approval. Requests above are flagged for manual PO or reimbursement.
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <label className="text-xs font-bold text-slate-700 block">Behavior Options</label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition select-none">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Auto-cap unspecified price requests</span>
                <span className="text-[11px] text-slate-500">When /buy has no price, cap at policy threshold</span>
              </div>
              <button
                role="switch"
                aria-checked={settings.autoCapUnspecified}
                onClick={() => setSettings(s => ({ ...s, autoCapUnspecified: !s.autoCapUnspecified }))}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${settings.autoCapUnspecified ? 'bg-vanguard-blue' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.autoCapUnspecified ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition select-none">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Allow manual PO above threshold</span>
                <span className="text-[11px] text-slate-500">Employees can submit traditional expense reports for large items</span>
              </div>
              <button
                role="switch"
                aria-checked={settings.allowManualPOAboveThreshold}
                onClick={() => setSettings(s => ({ ...s, allowManualPOAboveThreshold: !s.allowManualPOAboveThreshold }))}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${settings.allowManualPOAboveThreshold ? 'bg-vanguard-blue' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.allowManualPOAboveThreshold ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </div>

          {/* Info alert */}
          {parseFloat(thresholdInput) > 1000 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <TriangleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
              <span>Setting a high threshold increases financial exposure. Ensure manager oversight is in place for single-use cards above $1,000.</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                saved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-vanguard-navy hover:bg-slate-800 text-amber-300'
              }`}
            >
              {saved ? (
                <><ShieldCheck className="w-4 h-4" /> Saved!</>
              ) : (
                <><Building2 className="w-3.5 h-3.5" /> Save Policy</>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
};
