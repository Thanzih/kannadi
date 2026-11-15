import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { MatchupCandidate } from '../types';

export function useMatchup(requestedRounds = 15) {
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [maxRounds, setMaxRounds] = useState<number>(requestedRounds);
  const [king, setKing] = useState<MatchupCandidate | null>(null);
  const [challenger, setChallenger] = useState<MatchupCandidate | null>(null);
  const [nextChallenger, setNextChallenger] = useState<MatchupCandidate | null>(null);
  const [kingStreak, setKingStreak] = useState<number>(1);
  const [sessionVotedIds, setSessionVotedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [insufficientParticipants, setInsufficientParticipants] = useState<boolean>(false);

  // Keep a ref of sessionVotedIds to avoid stale closures in callbacks
  const votedIdsRef = useRef<string[]>([]);
  votedIdsRef.current = sessionVotedIds;

  // Helper to preload image into browser cache
  const preloadImage = (url: string) => {
    if (!url) return;
    const img = new Image();
    img.src = url;
  };

  // Helper to fetch single candidate from RPC
  const fetchCandidate = async (kingId: string, excludedIds: string[]): Promise<MatchupCandidate | null> => {
    try {
      const { data, error } = await supabase.rpc('get_next_challenger', {
        p_king_id: kingId || '00000000-0000-0000-0000-000000000000',
        p_excluded_ids: excludedIds,
      });

      if (error) {
        console.error('Error fetching next challenger:', error.message);
        return null;
      }

      if (Array.isArray(data) && data.length > 0) {
        return data[0] as MatchupCandidate;
      }

      // If pool exhausted with excludedIds, fallback to allowing repeated candidates (excluding current king and voter)
      if (excludedIds.length > 0) {
        const { data: fallbackData } = await supabase.rpc('get_next_challenger', {
          p_king_id: kingId,
          p_excluded_ids: [],
        });
        if (Array.isArray(fallbackData) && fallbackData.length > 0) {
          return fallbackData[0] as MatchupCandidate;
        }
      }

      return null;
    } catch (err) {
      console.error('Exception fetching candidate:', err);
      return null;
    }
  };

  // Initialize Matchup Arena
  const initMatchup = useCallback(async () => {
    setIsLoading(true);
    setInsufficientParticipants(false);
    setIsComplete(false);
    setCurrentRound(1);
    setKingStreak(1);
    setSessionVotedIds([]);

    // 0. Check total candidate pool size to adapt session length
    try {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_opted_in', true);

      const poolSize = count || 0;
      if (poolSize < 2) {
        setInsufficientParticipants(true);
        setIsLoading(false);
        return;
      }

      // Adaptive rounds: never exceed unique candidates available minus the active king
      const adaptiveMax = Math.max(3, Math.min(requestedRounds, poolSize - 1));
      setMaxRounds(adaptiveMax);
    } catch (err) {
      console.error('Error fetching pool size:', err);
    }

    const zeroUuid = '00000000-0000-0000-0000-000000000000';

    // 1. Fetch initial King
    const firstKing = await fetchCandidate(zeroUuid, []);
    if (!firstKing) {
      setInsufficientParticipants(true);
      setIsLoading(false);
      return;
    }

    // 2. Fetch initial Challenger
    const firstChallenger = await fetchCandidate(firstKing.id, [firstKing.id]);
    if (!firstChallenger) {
      setInsufficientParticipants(true);
      setIsLoading(false);
      return;
    }

    setKing(firstKing);
    setChallenger(firstChallenger);
    preloadImage(firstKing.photo_url);
    preloadImage(firstChallenger.photo_url);

    // 3. Pre-fetch third candidate in background
    const initialExcluded = [firstKing.id, firstChallenger.id];
    setSessionVotedIds(initialExcluded);

    fetchCandidate(firstKing.id, initialExcluded).then((third) => {
      if (third) {
        setNextChallenger(third);
        preloadImage(third.photo_url);
      }
    });

    setIsLoading(false);
  }, []);

  useEffect(() => {
    initMatchup();
  }, [initMatchup]);

  // Vote Handler: 'king' or 'challenger'
  const handleVote = async (choice: 'king' | 'challenger') => {
    if (!king || !challenger || isVoting || isComplete) return;

    setIsVoting(true);

    const winner = choice === 'king' ? king : challenger;
    const loser = choice === 'king' ? challenger : king;

    // Fire RPC vote asynchronously (non-blocking)
    supabase.rpc('submit_matchup_vote', {
      p_winner_id: winner.id,
      p_loser_id: loser.id,
    }).then(({ error }) => {
      if (error) {
        console.error('submit_matchup_vote error:', error.message);
      }
    });

    // Check if session rounds complete
    if (currentRound >= maxRounds) {
      setIsComplete(true);
      setIsVoting(false);
      return;
    }

    // Update streak: increments if king stays, resets to 1 if challenger unseats king
    const newStreak = choice === 'king' ? kingStreak + 1 : 1;
    const newKing = winner;

    // Determine next challenger
    let incomingChallenger = nextChallenger;
    const updatedExcluded = [...votedIdsRef.current, loser.id];
    setSessionVotedIds(updatedExcluded);

    // If pre-fetched candidate wasn't ready or matches the new King, fetch immediately
    if (!incomingChallenger || incomingChallenger.id === newKing.id) {
      incomingChallenger = await fetchCandidate(newKing.id, updatedExcluded);
    }

    if (incomingChallenger) {
      preloadImage(incomingChallenger.photo_url);
    }

    // State transitions
    setKing(newKing);
    setKingStreak(newStreak);
    setChallenger(incomingChallenger);
    setCurrentRound((prev) => prev + 1);
    setIsVoting(false);

    // Prepare pipeline: pre-fetch the next candidate for the subsequent round
    if (incomingChallenger) {
      fetchCandidate(newKing.id, [...updatedExcluded, incomingChallenger.id]).then((future) => {
        if (future) {
          setNextChallenger(future);
          preloadImage(future.photo_url);
        } else {
          setNextChallenger(null);
        }
      });
    }
  };

  const resetSession = () => {
    initMatchup();
  };

  return {
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
  };
}
