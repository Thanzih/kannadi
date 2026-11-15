import { motion } from 'framer-motion';
import { Crown, Flame, Zap, Check } from 'lucide-react';
import type { MatchupCandidate } from '../../types';

interface MatchupCardProps {
  candidate: MatchupCandidate;
  isKing?: boolean;
  streak?: number;
  onSelect: () => void;
  disabled?: boolean;
  role: 'king' | 'challenger';
}

export function MatchupCard({
  candidate,
  isKing = false,
  streak = 1,
  onSelect,
  disabled = false,
  role,
}: MatchupCardProps) {
  return (
    <motion.div
      layout
      key={candidate.id}
      initial={{ opacity: 0, scale: 0.94, y: role === 'king' ? -12 : 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: 30, transition: { duration: 0.22 } }}
      transition={{ type: 'spring', damping: 26, stiffness: 300 }}
      whileHover={!disabled ? { scale: 1.012, y: -4 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      onClick={() => {
        if (!disabled) onSelect();
      }}
      className={`group relative w-full aspect-[3/4] sm:aspect-[4/5] rounded-[28px] overflow-hidden cursor-pointer select-none border-2 shadow-xl transition-all duration-300 bg-white ${
        isKing
          ? 'border-amber-400 shadow-amber-500/20 hover:shadow-2xl hover:shadow-amber-500/30'
          : 'border-slate-200/90 shadow-slate-200/70 hover:border-[#ff5864]/60 hover:shadow-2xl hover:shadow-[#ff5864]/20'
      }`}
    >
      {/* Full-Bleed Image */}
      <img
        src={candidate.photo_url}
        alt={candidate.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="eager"
      />

      {/* Top Gradient for Badge Legibility */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/75 via-black/35 to-transparent pointer-events-none" />

      {/* Deep Bottom Scrim Gradient for Typographic Contrast */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/95 via-black/65 to-transparent pointer-events-none" />

      {/* Top Pill Badges */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
        {isKing ? (
          <div className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-md">
            <Crown className="w-3.5 h-3.5 fill-slate-950" />
            <span>King</span>
            {streak > 1 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/20 text-slate-950 text-[11px] font-black inline-flex items-center">
                <Flame className="w-3 h-3 fill-slate-950 mr-0.5" />
                {streak}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white/90 text-slate-800 border border-slate-200/60 font-bold text-xs shadow-md backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-[#ff5864] fill-[#ff5864]" />
            <span>Challenger</span>
          </div>
        )}

        <span className="px-3 py-1 rounded-full bg-black/60 border border-white/20 text-white font-mono font-bold text-xs backdrop-blur-md shadow-md">
          {candidate.elo_rating} Elo
        </span>
      </div>

      {/* Bottom Information */}
      <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 space-y-2 pointer-events-none">
        <div>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
            {candidate.name}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs font-mono text-slate-200 drop-shadow">
              {candidate.college_id}
            </span>
            {candidate.department && (
              <>
                <span className="text-slate-400">&bull;</span>
                <span className="text-xs text-slate-200 font-medium drop-shadow truncate">
                  {candidate.department}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Tactile Tap Action Bar */}
        <div className="pt-2">
          <div className="w-full py-2.5 rounded-2xl bg-white/20 group-hover:bg-gradient-to-r group-hover:from-[#fd297b] group-hover:to-[#ff5864] text-white font-extrabold text-xs backdrop-blur-md border border-white/30 group-hover:border-transparent transition-all duration-200 flex items-center justify-center space-x-1.5 shadow-lg">
            <Check className="w-4 h-4 text-white transition-colors" />
            <span>Choose {candidate.name.split(' ')[0]}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
