import { motion } from 'framer-motion';
import type { MatchupCandidate } from '../../types';

interface MatchupCardProps {
  candidate: MatchupCandidate;
  onSelect: () => void;
  disabled?: boolean;
  slot?: 'A' | 'B';
  isLargeScreen?: boolean;
  isWinner?: boolean;
}

export function MatchupCard({
  candidate,
  onSelect,
  disabled = false,
  slot = 'A',
  isLargeScreen = false,
  isWinner = false,
}: MatchupCardProps) {
  // Ultra-smooth offset distances: horizontal on small screens, vertical on large
  const offsetDistance = 85;
  const initialX = !isLargeScreen ? (slot === 'A' ? -offsetDistance : offsetDistance) : 0;
  const exitX = !isLargeScreen ? (slot === 'A' ? -offsetDistance : offsetDistance) : 0;
  const initialY = isLargeScreen ? offsetDistance : 0;
  const exitY = isLargeScreen ? -offsetDistance : 0;

  return (
    <motion.div
      key={candidate.id}
      initial={{
        opacity: 0,
        x: initialX,
        y: initialY,
        scale: 0.95,
        filter: 'blur(3px)',
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: isWinner ? [1, 1.028, 1] : 1,
        filter: 'blur(0px)',
      }}
      exit={{
        opacity: 0,
        x: exitX,
        y: exitY,
        scale: 0.94,
        filter: 'blur(3px)',
        transition: {
          duration: 0.26,
          ease: [0.36, 0, 0.66, -0.04],
        },
      }}
      transition={{
        type: 'spring',
        damping: 28,
        stiffness: 220,
        mass: 0.75,
      }}
      whileHover={!disabled ? { scale: 1.018, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.975 } : {}}
      onClick={() => {
        if (!disabled) onSelect();
      }}
      style={{ backfaceVisibility: 'hidden' }}
      className={`absolute inset-0 w-full h-full rounded-2xl sm:rounded-[28px] overflow-hidden cursor-pointer select-none border-2 shadow-lg hover:shadow-2xl hover:shadow-rose-500/20 transition-colors duration-200 bg-slate-900 transform-gpu will-change-transform ${
        isWinner
          ? 'border-[#ff5864] ring-2 ring-[#ff5864]/50'
          : 'border-slate-200/90 hover:border-[#ff5864]'
      }`}
    >
      {/* Full-Bleed 1:1 Square Image */}
      <img
        src={candidate.photo_url}
        alt={candidate.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="eager"
        decoding="async"
      />

      {/* Top subtle scrim gradient */}
      <div className="absolute inset-x-0 top-0 h-16 sm:h-24 bg-gradient-to-b from-black/55 via-black/20 to-transparent pointer-events-none" />

      {/* Bottom Scrim Gradient for Typographic Contrast */}
      <div className="absolute inset-x-0 bottom-0 h-28 sm:h-44 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

      {/* Bottom Student Information */}
      <div className="absolute bottom-0 inset-x-0 p-3 sm:p-5 space-y-0.5 sm:space-y-1 pointer-events-none">
        <h3 className="text-sm sm:text-2xl font-black text-white tracking-tight drop-shadow truncate">
          {candidate.name}
        </h3>
        <div className="flex items-center space-x-1 sm:space-x-2 text-[10px] sm:text-xs text-slate-200 font-mono drop-shadow truncate">
          <span>{candidate.college_id}</span>
          {candidate.department && (
            <>
              <span className="text-slate-400">&bull;</span>
              <span className="font-sans truncate">{candidate.department}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
