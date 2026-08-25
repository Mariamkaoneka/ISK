import React, { useState, useEffect, useRef } from 'react';
import { Lock, Shield, Eye, EyeOff, X, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: () => void;
  currentPin: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticate,
  currentPin,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setError('Tafadhali ingiza nenosiri la utawala / Please enter admin passcode');
      return;
    }

    if (pinInput === currentPin || pinInput === 'admin2026' || pinInput === '1234') {
      setError(null);
      onAuthenticate();
    } else {
      setError('Nenosiri si sahihi / Incorrect passcode');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Administrative Portal</h3>
              <p className="text-[11px] text-slate-400">Restricted Staff & Clinic Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center space-y-1 py-1">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-2 border border-slate-200">
              <KeyRound className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Enter Admin Passcode</h4>
            <p className="text-xs text-slate-500">
              Ingiza nenosiri la utawala ili kufungua dashibodi ya usanidi.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Admin Passcode / PIN
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPin ? 'text' : 'password'}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter PIN (Default: 1234 or admin2026)"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-sm font-mono tracking-wider outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Default initial passcode is <strong>1234</strong> or <strong>admin2026</strong></span>
            </p>
          </div>

          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition"
            >
              Cancel / Ghairi
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Unlock / Fungua</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
