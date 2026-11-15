export type Gender = 'male' | 'female' | 'other';

export interface Profile {
  id: string; // references auth.users UUID
  name: string;
  college_id: string;
  photo_url: string;
  gender?: Gender | null;
  department?: string | null;
  elo_rating: number;
  matches_played: number;
  wins: number;
  is_opted_in: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: number;
  voter_id: string | null;
  winner_id: string;
  loser_id: string;
  created_at: string;
}

export interface AdminLog {
  id: number;
  admin_id: string | null;
  action: 'DELETE_PROFILE' | 'ADJUST_ELO' | 'TOGGLE_VISIBILITY' | string;
  target_user_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface MatchupCandidate {
  id: string;
  name: string;
  college_id: string;
  photo_url: string;
  department?: string | null;
  elo_rating: number;
}

export interface MatchupSessionState {
  currentRound: number;
  maxRounds: number; // default: 15
  currentKing: MatchupCandidate | null;
  currentChallenger: MatchupCandidate | null;
  kingStreak: number;
  isVoting: boolean;
  sessionVotedIds: string[];
  isComplete: boolean;
}

export interface UserRankSummary {
  rank: number;
  totalParticipants: number;
  percentile: number;
  elo: number;
  wins: number;
  matches: number;
  winRate: number;
}
