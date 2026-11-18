import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Users, Share2 } from 'lucide-react';
import { MirrorIcon } from '../common/MirrorIcon';
import { useMatchup } from '../../hooks/useMatchup';
import { MatchupCard } from './MatchupCard';
import { SessionSummary } from './SessionSummary';

interface ArenaViewProps {
  onExit?: () => void;
  onViewLeaderboard?: () => void;
}

export function ArenaView({ onExit, onViewLeaderboard }: ArenaViewProps) {
  const {
    currentRound,
    maxRounds,
    candidateA,
    candidateB,
    lastWinnerSlot,
    isLoading,
    isVoting,
    isComplete,
    insufficientParticipants,
    handleVote,
    resetSession,
  } = useMatchup(15);

  // Screen size detection for responsive swap animation (horizontal on small, vertical on large)
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsLargeScreen(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const progressPercent = Math.min(100, Math.round(((currentRound - 1) / maxRounds) * 100));

  return (
    <div className="flex-1 min-h-0 h-full w-full max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-5 flex flex-col justify-between overflow-hidden selection:bg-[#ff5864] selection:text-white">
      {/* Sleek Minimal Progress Header */}
      {!isComplete && !insufficientParticipants && (
        <div className="w-full max-w-xl mx-auto space-y-1 mb-2 shrink-0">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-0.5">
            <span className="flex items-center space-x-1.5 text-slate-600">
              <span className="text-slate-400 font-medium">Round</span>
              <strong className="text-slate-900 font-mono text-xs">{currentRound}</strong>
              <span className="text-slate-400">/</span>
              <span className="font-mono text-slate-600">{maxRounds}</span>
            </span>

            <span className="text-[11px] text-slate-400 font-medium">
              Tap a card to choose
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-200/80">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#fd297b] to-[#ff5864]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Main Duel Viewport: Vertical stacked for small screens, horizontal side-by-side for desktop */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center w-full my-auto overflow-hidden">
        {/* Loading State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center space-y-4">
            <div className="animate-pulse flex items-center justify-center">
              <MirrorIcon className="w-14 h-14" useGradient />
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-[#ff5864]" />
              <span>Fetching campus matchup...</span>
            </div>
          </div>
        )}

        {/* Insufficient Participants Empty State */}
        {!isLoading && insufficientParticipants && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center p-6 sm:p-8 rounded-[28px] bg-white border border-slate-200 shadow-xl shadow-slate-200/60 space-y-4 sm:space-y-5"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#ff5864]">
              <Users className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Need More Candidates</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Voting requires at least 2 active student profiles in the database. Invite your college peers to join!
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin);
                  alert('Invite link copied to clipboard!');
                }}
                className="w-full py-3 sm:py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#fd297b] via-[#ff5864] to-[#ff655b] hover:opacity-95 text-white font-extrabold text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-rose-500/25 active:scale-98"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Copy Invite Link</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Session Complete Screen */}
        {!isLoading && isComplete && (
          <SessionSummary
            onRestart={resetSession}
            onExit={onExit || (() => {})}
            onViewLeaderboard={onViewLeaderboard}
            roundsPlayed={currentRound > maxRounds ? maxRounds : currentRound}
          />
        )}

        {/* Matchup Duel Cards:
            Small screens: Vertical layout (top card & bottom card), strictly constrained within available height
            Large screens: Side-by-side (2 columns)
        */}
        {!isLoading && !isComplete && !insufficientParticipants && candidateA && candidateB && (
          <div className="w-full flex-1 min-h-0 flex flex-col md:grid md:grid-cols-2 gap-2 sm:gap-6 items-center justify-center max-w-sm md:max-w-2xl my-auto py-1">
            {/* Slot A (Top on small screens, Left on desktop) */}
            <div className="relative h-[calc((100%-8px)/2)] md:h-auto w-auto md:w-full aspect-square rounded-2xl sm:rounded-[28px] overflow-hidden bg-slate-100 shadow-md shrink-0">
              <AnimatePresence mode="popLayout" initial={false}>
                <MatchupCard
                  key={candidateA.id}
                  candidate={candidateA}
                  slot="A"
                  isLargeScreen={isLargeScreen}
                  isWinner={lastWinnerSlot === 'A'}
                  onSelect={() => handleVote('A')}
                  disabled={isVoting}
                />
              </AnimatePresence>
            </div>

            {/* Slot B (Bottom on small screens, Right on desktop) */}
            <div className="relative h-[calc((100%-8px)/2)] md:h-auto w-auto md:w-full aspect-square rounded-2xl sm:rounded-[28px] overflow-hidden bg-slate-100 shadow-md shrink-0">
              <AnimatePresence mode="popLayout" initial={false}>
                <MatchupCard
                  key={candidateB.id}
                  candidate={candidateB}
                  slot="B"
                  isLargeScreen={isLargeScreen}
                  isWinner={lastWinnerSlot === 'B'}
                  onSelect={() => handleVote('B')}
                  disabled={isVoting}
                />
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
