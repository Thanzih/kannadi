import { useState, useMemo } from 'react';
import { Search, Trash2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';
import { ConfirmPurgeModal } from './ConfirmPurgeModal';
import { PhotoInspectModal } from './PhotoInspectModal';

interface UserModerationTableProps {
  profiles: Profile[];
  onRefresh: () => void;
}

export function UserModerationTable({ profiles, onRefresh }: UserModerationTableProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('All');

  // Modals state
  const [inspectTarget, setInspectTarget] = useState<Profile | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<Profile | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Departments list
  const departments = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach((p) => {
      if (p.department) set.add(p.department.trim());
    });
    return ['All', ...Array.from(set)];
  }, [profiles]);

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.college_id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = selectedDept === 'All' || p.department === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [profiles, searchQuery, selectedDept]);

  // Toggle profile visibility
  const handleToggleOptIn = async (profile: Profile) => {
    setUpdatingId(profile.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_opted_in: !profile.is_opted_in })
        .eq('id', profile.id);

      if (error) {
        console.error('Error toggling opt-in:', error.message);
        alert(`Failed to update status: ${error.message}`);
      } else {
        onRefresh();
      }
    } catch (err) {
      console.error('Exception updating profile:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or admission no...."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:border-[#ff5864] outline-none shadow-sm transition"
          />
        </div>

        {departments.length > 1 && (
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 outline-none shadow-sm cursor-pointer"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Moderation Table */}
      <div className="bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4 text-center">Score</th>
                <th className="py-3.5 px-4 text-center">Record</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No matching student profiles found.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div
                          onClick={() => setInspectTarget(p)}
                          className="relative w-10 h-12 rounded-xl overflow-hidden border border-slate-200 cursor-pointer group shrink-0 shadow-xs"
                          title="Click to inspect photo"
                        >
                          <img
                            src={p.photo_url}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">{p.name}</span>
                          <span className="text-[11px] font-mono text-slate-500">{p.college_id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4">
                      <span className="block text-slate-700 font-medium">{p.department || '—'}</span>
                    </td>

                    {/* Score */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                        {p.elo_rating}
                      </span>
                    </td>

                    {/* Record */}
                    <td className="py-3 px-4 text-center text-[11px]">
                      <span className="text-emerald-600 font-bold">{p.wins}W</span>
                      <span className="text-slate-300 mx-1">/</span>
                      <span className="text-rose-600 font-bold">{p.matches_played - p.wins}L</span>
                    </td>

                    {/* Active Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleOptIn(p)}
                        disabled={updatingId === p.id}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition disabled:opacity-50"
                        title="Click to toggle matchmaking active state"
                      >
                        {p.is_opted_in ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-flex items-center">
                            <XCircle className="w-3 h-3 mr-1" />
                            Hidden
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleOptIn(p)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                          title={p.is_opted_in ? 'Hide from matchmaking' : 'Show in matchmaking'}
                        >
                          {p.is_opted_in ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => setPurgeTarget(p)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition cursor-pointer"
                          title="Emergency Purge Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <PhotoInspectModal
        target={inspectTarget}
        isOpen={Boolean(inspectTarget)}
        onClose={() => setInspectTarget(null)}
      />

      <ConfirmPurgeModal
        target={purgeTarget}
        isOpen={Boolean(purgeTarget)}
        onClose={() => setPurgeTarget(null)}
        onSuccess={onRefresh}
      />
    </div>
  );
}
