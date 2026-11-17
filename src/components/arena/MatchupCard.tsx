import { motion } from 'framer-motion';
import type { MatchupCandidate } from '../../types';

interface MatchupCardProps {
  candidate: MatchupCandidate;
  onSelect: () => void;
  disabled?: boolean;
}

export function MatchupCard({
  candidate,
  onSelect,
  disabled = false,
}: MatchupCardProps) {
  return (
    <motion.div
      layout
      key={candidate.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      whileHover={!disabled ? { scale: 1.015, y: -4 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={() => {
        if (!disabled) onSelect();
      }}
      className="group relative w-full aspect-[3/4] sm:aspect-[4/5] rounded-[28px] overflow-hidden cursor-pointer select-none border-2 border-slate-200/80 hover:border-[#ff5864] shadow-xl shadow-slate-200/70 hover:shadow-2xl hover:shadow-rose-500/20 transition-all duration-300 bg-white"
    >
      {/* Full-Bleed Image */}
      <img
        src={candidate.photo_url}
        alt={candidate.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="eager"
      />

      {/* Top subtle scrim gradient */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none" />

      {/* Bottom Scrim Gradient for Typographic Contrast */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

      {/* Bottom Information */}
      <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 space-y-1 pointer-events-none">
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
          {candidate.name}
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-200/90 drop-shadow">
            {candidate.college_id}
          </span>
          {candidate.department && (
            <>
              <span className="text-slate-400">&bull;</span>
              <span className="text-xs text-slate-200/90 font-medium drop-shadow truncate">
                {candidate.department}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
