import { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';

interface VoteRecord {
  id: number;
  voter_id: string | null;
  winner_id: string;
  loser_id: string;
  created_at: string;
}

interface VoteStreamViewProps {
  profiles: Profile[];
}

export function VoteStreamView({ profiles }: VoteStreamViewProps) {
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Profile lookup map
  const profileMap = new Map<string, Profile>();
  profiles.forEach((p) => profileMap.set(p.id, p));

  const fetchVotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching votes stream:', error.message);
      } else if (data) {
        setVotes(data as VoteRecord[]);
      }
    } catch (err) {
      console.error('Exception fetching votes:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchVotes();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#ff5864]" />
            <span>Live Head-to-Head Feed</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">Stream of the latest 30 matchups evaluated on campus</p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#ff5864]' : ''}`} />
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading vote feed...</div>
        ) : votes.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">No votes recorded yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {votes.map((v) => {
              const winner = profileMap.get(v.winner_id);
              const loser = profileMap.get(v.loser_id);
              const voter = v.voter_id ? profileMap.get(v.voter_id) : null;
              const dateStr = new Date(v.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div key={v.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/80 transition-colors">
                  {/* Matchup details */}
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Trophy className="w-3.5 h-3.5" />
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">
                        {winner?.name || 'Unknown Student'}
                      </span>
                      <span className="text-emerald-700 font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                        Won
                      </span>
                      <span className="text-slate-400">vs</span>
                      <span className="text-slate-400 line-through">
                        {loser?.name || 'Unknown Student'}
                      </span>
                    </div>
                  </div>

                  {/* Metadata: Voter & Time */}
                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 self-end sm:self-auto font-mono">
                    <span>
                      Voter: <strong className="text-slate-700 font-sans">{voter?.name || 'Anonymous'}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>{dateStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
