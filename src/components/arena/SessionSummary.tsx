import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SessionSummaryProps {
  onRestart: () => void;
  onExit: () => void;
  onViewLeaderboard?: () => void;
  roundsPlayed: number;
}

export function SessionSummary({ onRestart, onViewLeaderboard, roundsPlayed }: SessionSummaryProps) {
  const { profile, refreshProfile } = useAuth();

  useEffect(() => {
    confetti({
      particleCount: 85,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#fd297b', '#ff5864', '#ff655b', '#eab308', '#6366f1'],
    });

    refreshProfile();
  }, [refreshProfile]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-md mx-auto bg-white border border-slate-200/80 rounded-[28px] p-6 sm:p-8 shadow-2xl shadow-slate-200/80 text-center space-y-6"
    >
      {/* Icon Badge */}
      <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#fd297b] via-[#ff5864] to-[#ff655b] flex items-center justify-center text-white shadow-xl shadow-rose-500/25">
        <Sparkles className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
          Rounds Calibrated
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Session Complete!
        </h2>
        <p className="text-slate-500 text-xs">
          {roundsPlayed} matchups evaluated &bull; Campus Elo ratings updated
        </p>
      </div>

      {/* Stats Preview */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="block text-2xl font-black text-slate-900 font-mono">{roundsPlayed}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Votes Cast</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="block text-2xl font-black text-[#ff5864] font-mono">
            {profile?.elo_rating || 1200}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Your Elo</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-2">
        {onViewLeaderboard && (
          <button
            onClick={onViewLeaderboard}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#fd297b] via-[#ff5864] to-[#ff655b] hover:opacity-95 text-white font-black text-xs transition-all shadow-xl shadow-rose-500/25 flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
          >
            <Trophy className="w-4 h-4" />
            <span>View Campus Standings</span>
          </button>
        )}

        <button
          onClick={onRestart}
          className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Start Another Session</span>
        </button>
      </div>
    </motion.div>
  );
}
