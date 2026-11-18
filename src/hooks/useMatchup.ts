import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { MatchupCandidate } from '../types';

export function useMatchup(defaultRounds = 15) {
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [maxRounds, setMaxRounds] = useState<number>(defaultRounds);
  const [candidateA, setCandidateA] = useState<MatchupCandidate | null>(null);
  const [candidateB, setCandidateB] = useState<MatchupCandidate | null>(null);
  const [nextCandidate, setNextCandidate] = useState<MatchupCandidate | null>(null);
  const [swappedSlot, setSwappedSlot] = useState<'A' | 'B' | null>(null);
  const [lastWinnerSlot, setLastWinnerSlot] = useState<'A' | 'B' | null>(null);
  const [sessionShownIds, setSessionShownIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [insufficientParticipants, setInsufficientParticipants] = useState<boolean>(false);

  // Ref to track shown IDs without stale closure issues
  const shownIdsRef = useRef<string[]>([]);
  shownIdsRef.current = sessionShownIds;

  // Preload image helper
  const preloadImage = (url: string) => {
    if (!url) return;
    const img = new Image();
    img.src = url;
  };

  // Fetch unique candidate that has NEVER appeared in this session
  const fetchUniqueCandidate = async (
    activeOpponentId: string,
    excludedIds: string[]
  ): Promise<MatchupCandidate | null> => {
    try {
      const { data, error } = await supabase.rpc('get_next_challenger', {
        p_king_id: activeOpponentId || '00000000-0000-0000-0000-000000000000',
        p_excluded_ids: excludedIds,
      });

      if (error) {
        console.error('Error fetching candidate:', error.message);
        return null;
      }

      if (Array.isArray(data) && data.length > 0) {
        return data[0] as MatchupCandidate;
      }

      // No more unique candidates available; strict uniqueness enforced
      return null;
    } catch (err) {
      console.error('Exception fetching candidate:', err);
      return null;
    }
  };

  // Initialize Matchup Session
  const initMatchup = useCallback(async () => {
    setIsLoading(true);
    setInsufficientParticipants(false);
    setIsComplete(false);
    setCurrentRound(1);
    setSwappedSlot(null);
    setLastWinnerSlot(null);
    setSessionShownIds([]);

    try {
      // 1. Fetch rounds_per_session setting from app_settings (if present)
      let sessionTargetRounds = defaultRounds;
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'rounds_per_session')
        .maybeSingle();

      if (settingsData && typeof settingsData.value === 'number') {
        sessionTargetRounds = settingsData.value;
      }

      // 2. Check total candidate pool size
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

      // Clamp limit: if fewer members than configured rounds, use member count
      const effectiveMax = Math.min(sessionTargetRounds, poolSize);
      setMaxRounds(effectiveMax);

      const zeroUuid = '00000000-0000-0000-0000-000000000000';

      // 3. Fetch initial Candidate A
      const firstA = await fetchUniqueCandidate(zeroUuid, []);
      if (!firstA) {
        setInsufficientParticipants(true);
        setIsLoading(false);
        return;
      }

      // 4. Fetch initial Candidate B (excluding candidate A)
      const firstB = await fetchUniqueCandidate(firstA.id, [firstA.id]);
      if (!firstB) {
        setInsufficientParticipants(true);
        setIsLoading(false);
        return;
      }

      setCandidateA(firstA);
      setCandidateB(firstB);
      preloadImage(firstA.photo_url);
      preloadImage(firstB.photo_url);

      const initialShown = [firstA.id, firstB.id];
      setSessionShownIds(initialShown);

      // 5. Pre-fetch subsequent unique candidate in the background
      fetchUniqueCandidate(firstA.id, initialShown).then((upcoming) => {
        if (upcoming) {
          setNextCandidate(upcoming);
          preloadImage(upcoming.photo_url);
        } else {
          setNextCandidate(null);
        }
      });
    } catch (err) {
      console.error('Error during initMatchup:', err);
    } finally {
      setIsLoading(false);
    }
  }, [defaultRounds]);

  useEffect(() => {
    initMatchup();
  }, [initMatchup]);

  // Vote Handler: 'A' or 'B'
  const handleVote = async (chosenSlot: 'A' | 'B') => {
    if (!candidateA || !candidateB || isVoting || isComplete) return;

    setIsVoting(true);

    const winner = chosenSlot === 'A' ? candidateA : candidateB;
    const loser = chosenSlot === 'A' ? candidateB : candidateA;

    // Fire RPC vote asynchronously (non-blocking)
    supabase
      .rpc('submit_matchup_vote', {
        p_winner_id: winner.id,
        p_loser_id: loser.id,
      })
      .then(({ error }) => {
        if (error) {
          console.error('submit_matchup_vote error:', error.message);
        }
      });

    // Check if session rounds reached max
    if (currentRound >= maxRounds) {
      setIsComplete(true);
      setIsVoting(false);
      return;
    }

    // Track winner slot for celebratory micro-feedback on stationary card
    setLastWinnerSlot(chosenSlot);

    // Determine the slot to swap:
    // If user chose 'A', Candidate A stays in place; Slot B is swapped.
    // If user chose 'B', Candidate B stays in place; Slot A is swapped.
    const slotToSwap = chosenSlot === 'A' ? 'B' : 'A';
    setSwappedSlot(slotToSwap);

    // Get the next candidate to replace the losing slot
    let incoming = nextCandidate;
    const allShownSoFar = shownIdsRef.current;

    // If pre-fetched candidate was not ready or already shown, fetch fresh
    if (!incoming || allShownSoFar.includes(incoming.id)) {
      incoming = await fetchUniqueCandidate(winner.id, allShownSoFar);
    }

    // If no more unique candidate can be found, gracefully complete session
    if (!incoming) {
      setIsComplete(true);
      setIsVoting(false);
      return;
    }

    preloadImage(incoming.photo_url);

    // Update session shown list
    const updatedShown = [...allShownSoFar, incoming.id];
    setSessionShownIds(updatedShown);

    // Keep the chosen candidate in their slot, swap only the other slot!
    if (slotToSwap === 'B') {
      setCandidateB(incoming);
    } else {
      setCandidateA(incoming);
    }

    setCurrentRound((prev) => prev + 1);

    // Smooth debounce on voting lock to prevent animation collision on rapid taps
    setTimeout(() => {
      setIsVoting(false);
      setLastWinnerSlot(null);
    }, 380);

    // Pipeline next candidate in the background
    fetchUniqueCandidate(winner.id, updatedShown).then((future) => {
      if (future) {
        setNextCandidate(future);
        preloadImage(future.photo_url);
      } else {
        setNextCandidate(null);
      }
    });
  };

  const resetSession = () => {
    initMatchup();
  };

  return {
    currentRound,
    maxRounds,
    candidateA,
    candidateB,
    swappedSlot,
    lastWinnerSlot,
    isLoading,
    isVoting,
    isComplete,
    insufficientParticipants,
    handleVote,
    resetSession,
  };
}
