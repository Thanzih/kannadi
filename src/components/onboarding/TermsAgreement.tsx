import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, X, AlertTriangle, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function TermsAgreement() {
  const { user, signOut, setTermsAcceptedSession } = useAuth();
  const [hasAgreed, setHasAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-center items-center px-4 py-12 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-lg bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 shadow-2xl shadow-slate-200/70 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#ff5864] shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">The Rules of Kannadi</h2>
            <p className="text-xs text-rose-500 font-bold flex items-center mt-0.5">
              <Lock className="w-3 h-3 mr-1" />
              Point of No Return &bull; Irrevocable Entry
            </p>
          </div>
        </div>

        {/* User identification */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500 flex items-center justify-between">
          <span>Signed in: <strong className="text-slate-800 font-medium">{user?.email}</strong></span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-600">
            Pending
          </span>
        </div>

        {/* Terms Bullet Points */}
        <div className="space-y-3 text-xs leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
            <div className="flex items-center text-slate-900 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-[#ff5864]/10 text-[#ff5864] inline-flex items-center justify-center text-xs mr-2 font-black">1</span>
              Mutual Stake (Zero Lurkers)
            </div>
            <p className="text-slate-500 pl-7 text-[12px]">
              You can only vote if you upload an authentic photo of yourself and your College ID. Everyone voting is equally vulnerable in the pool.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1">
            <div className="flex items-center text-rose-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-500 mr-2 shrink-0" />
              Irrevocable Participation
            </div>
            <p className="text-rose-700/90 pl-6 text-[12px]">
              You may decline now without joining. However, if you register, <strong>you cannot delete or withdraw your profile later</strong>. Your photo permanently remains part of campus matchups.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
            <div className="flex items-center text-slate-900 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-[#ff5864]/10 text-[#ff5864] inline-flex items-center justify-center text-xs mr-2 font-black">3</span>
              Fair Play & Campus Spirit
            </div>
            <p className="text-slate-500 pl-7 text-[12px]">
              Only upload your real picture. Automated voting, bots, or impersonation will be purged by administrators.
            </p>
          </div>
        </div>

        {/* Checkbox Agreement */}
        <label className="flex items-start space-x-3 cursor-pointer select-none p-2 rounded-2xl hover:bg-slate-50 transition-colors">
          <input
            type="checkbox"
            checked={hasAgreed}
            onChange={(e) => setHasAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#ff5864] focus:ring-[#ff5864] cursor-pointer accent-[#ff5864]"
          />
          <span className="text-xs text-slate-600 font-medium leading-snug">
            I understand all the rules and explicitly agree that my entry is <strong className="text-slate-900">permanent and irrevocable</strong>.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={signOut}
            className="order-2 sm:order-1 flex-1 px-4 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Decline & Exit</span>
          </button>

          <button
            type="button"
            disabled={!hasAgreed}
            onClick={() => setTermsAcceptedSession(true)}
            className="order-1 sm:order-2 flex-1 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-[#fd297b] via-[#ff5864] to-[#ff655b] hover:opacity-95 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white text-xs font-extrabold transition shadow-lg shadow-[#ff5864]/25 disabled:shadow-none flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Accept & Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
