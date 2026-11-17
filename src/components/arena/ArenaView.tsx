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
    king,
    challenger,
    isLoading,
    isVoting,
    isComplete,
    insufficientParticipants,
    handleVote,
    resetSession,
  } = useMatchup(15);

  const progressPercent = Math.min(100, Math.round(((currentRound - 1) / maxRounds) * 100));

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 pb-28 flex flex-col justify-between selection:bg-[#ff5864] selection:text-white">
      {/* Sleek Minimal Progress Header */}
      {!isComplete && !insufficientParticipants && (
        <div className="w-full max-w-xl mx-auto space-y-2 mb-4 sm:mb-6">
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
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Main Duel Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center w-full my-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="py-24 flex flex-col items-center space-y-4">
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
            className="max-w-md mx-auto text-center p-8 rounded-[28px] bg-white border border-slate-200 shadow-xl shadow-slate-200/60 space-y-5"
          >
            <div className="w-14 h-14 mx-auto rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#ff5864]">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Need More Candidates</h3>
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
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#fd297b] via-[#ff5864] to-[#ff655b] hover:opacity-95 text-white font-extrabold text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-rose-500/25 active:scale-98"
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
            roundsPlayed={maxRounds}
          />
        )}

        {/* Matchup Duel Cards */}
        {!isLoading && !isComplete && !insufficientParticipants && king && challenger && (
          <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center justify-items-center">
            {/* Candidate A */}
            <AnimatePresence mode="popLayout">
              <MatchupCard
                key={king.id}
                candidate={king}
                onSelect={() => handleVote('king')}
                disabled={isVoting}
              />
            </AnimatePresence>

            {/* Candidate B */}
            <AnimatePresence mode="popLayout">
              <MatchupCard
                key={challenger.id}
                candidate={challenger}
                onSelect={() => handleVote('challenger')}
                disabled={isVoting}
              />
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
