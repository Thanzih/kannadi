import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Users, Trophy, Activity, RefreshCw, Lock, CheckCircle2, Sliders } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Profile } from '../../types';
import { UserModerationTable } from './UserModerationTable';
import { AdminSettingsView } from './AdminSettingsView';
import { AuditTrailView } from './AuditTrailView';

type AdminTab = 'users' | 'settings' | 'audit';

export function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fetch all profiles and total vote counts
  const fetchAdminData = useCallback(async () => {
    try {
      // 1. Fetch all profiles (including opted-out)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching admin profiles:', profilesError.message);
      } else if (profilesData) {
        setProfiles(profilesData as Profile[]);
      }

      // 2. Fetch total votes count
      const { count: votesCount, error: votesError } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true });

      if (!votesError && typeof votesCount === 'number') {
        setTotalVotes(votesCount);
      }
    } catch (err) {
      console.error('Exception fetching admin data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchAdminData();
    }
  }, [profile?.is_admin, fetchAdminData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAdminData();
  };

  // KPIs
  const stats = useMemo(() => {
    const totalUsers = profiles.length;
    const activeUsers = profiles.filter((p) => p.is_opted_in).length;
    const avgElo =
      totalUsers > 0
        ? Math.round(profiles.reduce((acc, p) => acc + p.elo_rating, 0) / totalUsers)
        : 1200;

    return { totalUsers, activeUsers, avgElo };
  }, [profiles]);

  // Access Denied Screen if user is not an admin
  if (!profile?.is_admin) {
    return (
      <div className="min-h-svh bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 selection:bg-[#ff5864] selection:text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white border border-slate-200 rounded-[28px] p-6 sm:p-8 text-center space-y-5 shadow-xl shadow-slate-200/80"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-200 text-[#ff5864] flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">Administrator Access Required</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your account ({profile?.college_id || 'unregistered'}) does not have administrator privileges.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
              How to elevate your account:
            </span>
            <p className="text-slate-600 text-[11px]">Run this query in your Supabase SQL Editor:</p>
            <pre className="p-2.5 rounded-lg bg-slate-900 text-amber-300 font-mono text-[10px] overflow-x-auto">
              {`update public.profiles\nset is_admin = true\nwhere college_id = '${profile?.college_id || 'YOUR_ID'}';`}
            </pre>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-slate-50 text-slate-900 flex flex-col selection:bg-[#ff5864] selection:text-white">
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8 pb-28">
        {/* Top Admin Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#ff5864] text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
              Administrative Command Center
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Campus Moderation & Audit
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Community management, rating calibration, and live match inspection
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#ff5864]' : ''}`} />
          </button>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center space-x-1.5 text-indigo-600 text-xs font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>Enrolled Students</span>
            </div>
            <span className="text-2xl font-black text-slate-900 block font-mono">{stats.totalUsers}</span>
            <span className="text-[10px] text-slate-500 font-medium">{stats.activeUsers} actively voting</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center space-x-1.5 text-[#ff5864] text-xs font-bold">
              <Activity className="w-3.5 h-3.5" />
              <span>Total Votes</span>
            </div>
            <span className="text-2xl font-black text-slate-900 block font-mono">{totalVotes}</span>
            <span className="text-[10px] text-slate-500 font-medium">Head-to-head decisions</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center space-x-1.5 text-amber-600 text-xs font-bold">
              <Trophy className="w-3.5 h-3.5" />
              <span>Average Score</span>
            </div>
            <span className="text-2xl font-black text-slate-900 block font-mono">{stats.avgElo}</span>
            <span className="text-[10px] text-slate-500 font-medium">Baseline is 1200</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-600 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Database Health</span>
            </div>
            <span className="text-2xl font-black text-emerald-600 block text-sm sm:text-base pt-1 font-mono">
              ONLINE
            </span>
            <span className="text-[10px] text-slate-500 font-medium">RLS Enforced</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-[#fd297b] to-[#ff5864] text-white shadow-md shadow-rose-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Moderation ({profiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-[#fd297b] to-[#ff5864] text-white shadow-md shadow-rose-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Platform Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'audit'
                ? 'bg-gradient-to-r from-[#fd297b] to-[#ff5864] text-white shadow-md shadow-rose-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400 font-medium">Loading admin suite...</div>
        ) : (
          <>
            {activeTab === 'users' && (
              <UserModerationTable profiles={profiles} onRefresh={fetchAdminData} />
            )}

            {activeTab === 'settings' && <AdminSettingsView />}

            {activeTab === 'audit' && <AuditTrailView />}
          </>
        )}
      </main>
    </div>
  );
}
