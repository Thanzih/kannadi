import { motion } from 'framer-motion';
import { ShieldCheck, LogOut, Trophy, Zap, Award, ShieldAlert } from 'lucide-react';
import { MirrorIcon } from '../common/MirrorIcon';
import { useAuth } from '../../context/AuthContext';

interface ProfileViewProps {
  onOpenAdmin?: () => void;
}

export function ProfileView({ onOpenAdmin }: ProfileViewProps) {
  const { profile, signOut } = useAuth();

  if (!profile) return null;

  const winRate =
    profile.matches_played > 0
      ? Math.round((profile.wins / profile.matches_played) * 100)
      : 0;

  return (
    <div className="flex-1 w-full max-w-md mx-auto px-4 py-6 pb-28 space-y-6">
      {/* Hero Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative aspect-[3/4] w-full rounded-[28px] overflow-hidden border border-slate-200/90 shadow-xl shadow-slate-200/80 bg-white group"
      >
        <img
          src={profile.photo_url}
          alt={profile.name}
          className="w-full h-full object-cover"
        />

        {/* Top Gradient */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/75 via-black/35 to-transparent pointer-events-none" />

        {/* Bottom Scrim Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/95 via-black/65 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs shadow-md">
            <ShieldCheck className="w-3.5 h-3.5 fill-slate-950" />
            <span>Verified Student</span>
          </span>

          <span className="px-3 py-1 rounded-full bg-black/60 border border-white/20 text-white font-mono font-bold text-xs backdrop-blur-md shadow-md">
            {profile.elo_rating} Elo
          </span>
        </div>

        {/* Bottom Student Details */}
        <div className="absolute bottom-0 inset-x-0 p-6 space-y-1.5 pointer-events-none">
          <div className="flex items-baseline space-x-2">
            <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
              {profile.name}
            </h2>
            <span className="text-sm font-mono text-slate-200 drop-shadow">
              {profile.college_id}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-200 font-medium drop-shadow">
            <span>{profile.department || 'General Department'}</span>
            {profile.gender && (
              <>
                <span>&bull;</span>
                <span className="capitalize">{profile.gender}</span>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="w-7 h-7 mx-auto rounded-lg bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mb-1">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <span className="block text-base font-black text-slate-900 font-mono">{profile.elo_rating}</span>
          <span className="text-[10px] text-slate-500 uppercase font-bold">Elo</span>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="w-7 h-7 mx-auto rounded-lg bg-rose-50 text-[#ff5864] border border-rose-100 flex items-center justify-center mb-1">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span className="block text-base font-black text-slate-900 font-mono">{profile.matches_played}</span>
          <span className="text-[10px] text-slate-500 uppercase font-bold">Matches</span>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <MirrorIcon className="w-7 h-7 mb-1" useGradient />
          <span className="block text-base font-black text-[#ff5864] font-mono">{profile.wins}</span>
          <span className="text-[10px] text-slate-500 uppercase font-bold">Victories</span>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-1">
            <Award className="w-3.5 h-3.5" />
          </div>
          <span className="block text-base font-black text-emerald-600 font-mono">{winRate}%</span>
          <span className="text-[10px] text-slate-500 uppercase font-bold">Win Rate</span>
        </div>
      </div>

      {/* Irrevocable Status Box */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center space-x-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <p>
          You are an active participant in campus showdowns. Profile entry is permanent and calibrated in real-time.
        </p>
      </div>

      {/* Admin Action (if admin) */}
      {profile.is_admin && onOpenAdmin && (
        <button
          onClick={onOpenAdmin}
          className="w-full py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#ff5864] font-black text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
        >
          <ShieldAlert className="w-4 h-4 text-[#ff5864]" />
          <span>Open Admin Moderation Center</span>
        </button>
      )}

      {/* Sign Out Button */}
      <button
        onClick={signOut}
        className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
