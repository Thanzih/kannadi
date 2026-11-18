export interface Profile {
  id: string; // references auth.users UUID
  name: string;
  college_id: string; // Admission No.
  photo_url: string;
  department?: string | null;
  elo_rating: number; // Campus score
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
  action: 'DELETE_PROFILE' | 'TOGGLE_VISIBILITY' | string;
  target_user_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface MatchupCandidate {
  id: string;
  name: string;
  college_id: string; // Admission No.
  photo_url: string;
  department?: string | null;
  elo_rating: number;
}

export interface MatchupSessionState {
  currentRound: number;
  maxRounds: number;
  candidateA: MatchupCandidate | null;
  candidateB: MatchupCandidate | null;
  swappedSlot: 'A' | 'B' | null;
  isVoting: boolean;
  sessionShownIds: string[];
  isComplete: boolean;
}

export interface UserRankSummary {
  rank: number;
  totalParticipants: number;
  percentile: number;
  score: number;
  wins: number;
  matches: number;
  winRate: number;
}

export interface AppSettings {
  leaderboard_top_count: number;
  rounds_per_session: number;
}
