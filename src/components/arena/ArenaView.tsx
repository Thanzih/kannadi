import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, Loader2, Users, Share2, Check, ArrowRight } from 'lucide-react';
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
    kingStreak,
    isLoading,
    isVoting,
    isComplete,
    insufficientParticipants,
    handleVote,
    resetSession,
  } = useMatchup(15);

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 pb-28 flex flex-col justify-between selection:bg-[#ff5864] selection:text-white">
      {/* Top Story Progress Bar (15 Segmented Ticks) */}
      {!isComplete && !insufficientParticipants && (
        <div className="w-full max-w-xl mx-auto space-y-2 mb-4">
          <div className="flex items-center space-x-1.5">
            {Array.from({ length: maxRounds }).map((_, idx) => {
              const isPassed = idx < currentRound - 1;
              const isCurrent = idx === currentRound - 1;

              return (
                <div
                  key={idx}
                  className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-200 transition-all"
                >
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isPassed
                        ? 'bg-gradient-to-r from-[#fd297b] to-[#ff5864]'
                        : isCurrent
                        ? 'bg-slate-900 shadow-sm'
                        : 'bg-transparent'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-0.5">
            <span className="flex items-center space-x-1 text-slate-600">
              <span>Round</span>
              <strong className="text-slate-900 font-mono">{currentRound}</strong>
              <span className="text-slate-400">of</span>
              <span className="font-mono text-slate-700">{maxRounds}</span>
            </span>

            {kingStreak > 1 ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold shadow-sm">
                <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>King Streak: {kingStreak}</span>
              </span>
            ) : (
              <span className="text-slate-400 text-[10px] font-medium">Winner stays as King</span>
            )}
          </div>
        </div>
      )}

      {/* Main Duel Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center w-full my-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="py-24 flex flex-col items-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#fd297b] via-[#ff5864] to-[#ff655b] flex items-center justify-center animate-pulse shadow-xl shadow-rose-500/20">
              <Sparkles className="w-6 h-6 text-white" />
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
          <div className="w-full flex flex-col items-center space-y-6">
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center justify-items-center max-w-2xl relative">
              {/* Card 1: Reigning King */}
              <AnimatePresence mode="popLayout">
                <MatchupCard
                  key={king.id}
                  candidate={king}
                  isKing={true}
                  streak={kingStreak}
                  onSelect={() => handleVote('king')}
                  disabled={isVoting}
                  role="king"
                />
              </AnimatePresence>

              {/* Card 2: Challenger */}
              <AnimatePresence mode="popLayout">
                <MatchupCard
                  key={challenger.id}
                  candidate={challenger}
                  isKing={false}
                  onSelect={() => handleVote('challenger')}
                  disabled={isVoting}
                  role="challenger"
                />
              </AnimatePresence>
            </div>

            {/* Bottom Tactile Action Circles */}
            <div className="flex items-center space-x-6 pt-2">
              <button
                onClick={() => handleVote('king')}
                disabled={isVoting}
                className="w-14 h-14 rounded-full bg-white border-2 border-amber-400 text-amber-500 hover:bg-amber-400 hover:text-slate-950 shadow-xl shadow-amber-500/15 hover:shadow-amber-500/30 transition-all flex items-center justify-center cursor-pointer active:scale-90 disabled:opacity-50"
                title={`Vote for ${king.name}`}
              >
                <Check className="w-6 h-6 stroke-[3]" />
              </button>

              <div className="px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-mono font-extrabold text-slate-400 uppercase tracking-widest shadow-sm">
                VS
              </div>

              <button
                onClick={() => handleVote('challenger')}
                disabled={isVoting}
                className="w-14 h-14 rounded-full bg-white border-2 border-slate-200 hover:border-[#ff5864] hover:bg-gradient-to-tr hover:from-[#fd297b] hover:to-[#ff5864] text-slate-700 hover:text-white shadow-xl shadow-slate-200 hover:shadow-rose-500/25 transition-all flex items-center justify-center cursor-pointer active:scale-90 disabled:opacity-50"
                title={`Vote for ${challenger.name}`}
              >
                <ArrowRight className="w-6 h-6 stroke-[3]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
