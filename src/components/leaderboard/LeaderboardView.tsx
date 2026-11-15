import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Play, RefreshCw, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Profile } from '../../types';

interface LeaderboardViewProps {
  onEnterArena: () => void;
  onBackToDashboard?: () => void;
}

export function LeaderboardView({ onEnterArena }: LeaderboardViewProps) {
  const { profile: currentProfile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_opted_in', true)
        .order('elo_rating', { ascending: false });

      if (error) {
        console.error('Error fetching leaderboard:', error.message);
      } else if (data) {
        setProfiles(data as Profile[]);
      }
    } catch (err) {
      console.error('Exception fetching leaderboard:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLeaderboard();
  };

  // Distinct departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach((p) => {
      if (p.department) set.add(p.department.trim());
    });
    return ['All', ...Array.from(set)];
  }, [profiles]);

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    if (selectedDept === 'All') return profiles;
    return profiles.filter((p) => p.department === selectedDept);
  }, [profiles, selectedDept]);

  // Personal standing
  const personalStanding = useMemo(() => {
    if (!currentProfile) return null;
    const overallIndex = profiles.findIndex((p) => p.id === currentProfile.id);
    if (overallIndex === -1) return null;

    const rank = overallIndex + 1;
    const total = profiles.length;
    const percentile = Math.max(1, Math.round(((total - rank + 1) / total) * 100));

    return { rank, total, percentile };
  }, [profiles, currentProfile]);

  const podiumProfiles = useMemo(() => filteredProfiles.slice(0, 3), [filteredProfiles]);
  const gridProfiles = useMemo(() => filteredProfiles.slice(3, 20), [filteredProfiles]);

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 pb-36 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-amber-500 fill-amber-500" />
            <span>Campus Standings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Calibrated rankings &bull; {profiles.length} registered students
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm transition cursor-pointer"
          title="Refresh Standings"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#ff5864]' : ''}`} />
        </button>
      </div>

      {/* Department Filter Chips */}
      {departments.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedDept === dept
                  ? 'bg-gradient-to-r from-[#fd297b] to-[#ff5864] text-white font-extrabold shadow-md shadow-rose-500/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 font-medium">Loading standings...</div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl bg-white border border-slate-200 shadow-lg space-y-2">
          <Users className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-xs text-slate-500">No participants found in this category.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          {podiumProfiles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-end pt-2">
              {/* 2nd Place */}
              {podiumProfiles[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="order-2 md:order-1 relative aspect-[3/4] rounded-3xl overflow-hidden border-2 border-slate-300 shadow-xl shadow-slate-200/80 group bg-white"
                >
                  <img
                    src={podiumProfiles[1].photo_url}
                    alt={podiumProfiles[1].name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-slate-200 text-slate-900 font-black text-xs flex items-center justify-center shadow">
                    2
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/60 border border-white/20 text-white font-mono font-bold text-xs backdrop-blur-md">
                    {podiumProfiles[1].elo_rating} Elo
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-4 space-y-0.5 pointer-events-none">
                    <h4 className="font-extrabold text-white text-base truncate drop-shadow">{podiumProfiles[1].name}</h4>
                    <p className="text-xs font-mono text-slate-200 drop-shadow">{podiumProfiles[1].college_id}</p>
                  </div>
                </motion.div>
              )}

              {/* 1st Place (Gold Crown) */}
              {podiumProfiles[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="order-1 md:order-2 relative aspect-[3/4] rounded-3xl overflow-hidden border-2 border-amber-400 shadow-2xl shadow-amber-500/25 md:-translate-y-2 group bg-white"
                >
                  <img
                    src={podiumProfiles[0].photo_url}
                    alt={podiumProfiles[0].name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow flex items-center space-x-1">
                    <span>👑 1</span>
                  </div>
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-mono font-black text-xs shadow">
                    {podiumProfiles[0].elo_rating} Elo
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-4 space-y-0.5 pointer-events-none">
                    <h4 className="font-black text-white text-lg truncate drop-shadow">{podiumProfiles[0].name}</h4>
                    <p className="text-xs font-mono text-amber-200 drop-shadow">{podiumProfiles[0].college_id}</p>
                  </div>
                </motion.div>
              )}

              {/* 3rd Place */}
              {podiumProfiles[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="order-3 relative aspect-[3/4] rounded-3xl overflow-hidden border-2 border-amber-700/60 shadow-xl shadow-slate-200/80 group bg-white"
                >
                  <img
                    src={podiumProfiles[2].photo_url}
                    alt={podiumProfiles[2].name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow">
                    3
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/60 border border-white/20 text-white font-mono font-bold text-xs backdrop-blur-md">
                    {podiumProfiles[2].elo_rating} Elo
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-4 space-y-0.5 pointer-events-none">
                    <h4 className="font-extrabold text-white text-base truncate drop-shadow">{podiumProfiles[2].name}</h4>
                    <p className="text-xs font-mono text-slate-200 drop-shadow">{podiumProfiles[2].college_id}</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Ranks 4 to 20 Grid Cards */}
          {gridProfiles.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block px-1">
                Top 20 Contenders
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {gridProfiles.map((p, idx) => {
                  const rank = idx + 4;
                  const isCurrentUser = currentProfile?.id === p.id;

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative aspect-[3/4] rounded-2xl overflow-hidden border shadow-md hover:shadow-xl transition-all group bg-white ${
                        isCurrentUser
                          ? 'border-[#ff5864] ring-2 ring-[#ff5864]/40'
                          : 'border-slate-200'
                      }`}
                    >
                      <img
                        src={p.photo_url}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent pointer-events-none" />

                      {/* Rank Tag */}
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 border border-white/20 text-white font-mono text-[11px] font-bold backdrop-blur-md">
                        #{rank}
                      </div>

                      {/* Rating */}
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 text-amber-300 font-mono text-[11px] font-bold border border-white/20 backdrop-blur-md">
                        {p.elo_rating}
                      </div>

                      {/* Name & Dept */}
                      <div className="absolute bottom-0 inset-x-0 p-3 pointer-events-none">
                        <h5 className="font-bold text-white text-xs truncate drop-shadow">{p.name}</h5>
                        <p className="text-[10px] font-mono text-slate-200 truncate drop-shadow">{p.college_id}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Personal Standing Card */}
      {personalStanding && (
        <div className="fixed bottom-20 inset-x-0 z-30 p-4 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <div className="p-3.5 rounded-2xl bg-white/95 border border-slate-200/90 shadow-2xl shadow-slate-300/70 backdrop-blur-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#fd297b] via-[#ff5864] to-[#ff655b] flex items-center justify-center text-white font-mono font-black text-xs shrink-0 shadow-md shadow-rose-500/20">
                  #{personalStanding.rank}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-900">Your Rank</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      Top {100 - personalStanding.percentile + 1}%
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {currentProfile?.elo_rating} Elo &bull; #{personalStanding.rank} of {personalStanding.total}
                  </span>
                </div>
              </div>

              <button
                onClick={onEnterArena}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#fd297b] via-[#ff5864] to-[#ff655b] hover:opacity-95 text-white font-extrabold text-xs transition cursor-pointer flex items-center space-x-1 shadow-md shadow-rose-500/20 active:scale-95"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>Vote Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
