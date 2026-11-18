import { useState, useEffect, useCallback } from 'react';
import { Sliders, Trophy, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function AdminSettingsView() {
  const [topCount, setTopCount] = useState<number>(20);
  const [roundsPerSession, setRoundsPerSession] = useState<number>(15);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('app_settings').select('*');
      if (error) {
        console.warn('app_settings table query warning (using defaults):', error.message);
      } else if (data) {
        data.forEach((row: { key: string; value: unknown }) => {
          if (row.key === 'leaderboard_top_count' && typeof row.value === 'number') {
            setTopCount(row.value);
          }
          if (row.key === 'rounds_per_session' && typeof row.value === 'number') {
            setRoundsPerSession(row.value);
          }
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const safeTopCount = Math.max(1, Math.min(500, Math.round(Number(topCount))));
    const safeRounds = Math.max(2, Math.min(100, Math.round(Number(roundsPerSession))));

    try {
      const { error: err1 } = await supabase.from('app_settings').upsert({
        key: 'leaderboard_top_count',
        value: safeTopCount,
        updated_at: new Date().toISOString(),
      });

      const { error: err2 } = await supabase.from('app_settings').upsert({
        key: 'rounds_per_session',
        value: safeRounds,
        updated_at: new Date().toISOString(),
      });

      if (err1 || err2) {
        throw new Error((err1 || err2)?.message || 'Failed to save settings');
      }

      setTopCount(safeTopCount);
      setRoundsPerSession(safeRounds);
      setSuccessMsg('Settings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Save error:', error);
      setErrorMsg(error.message || 'Could not save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400 font-medium flex items-center justify-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin text-[#ff5864]" />
        <span>Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-[#ff5864]" />
          <span>Platform Governance Settings</span>
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Configure matchmaking parameters and leaderboard visibility for all students.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm">
        {/* Leaderboard Top Ranks Count */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-500" />
            <label htmlFor="topCount">Leaderboard Display Depth</label>
          </div>
          <p className="text-xs text-slate-500">
            Number of top-ranked participants shown on the campus leaderboard.
          </p>
          <div className="flex items-center space-x-3">
            <input
              id="topCount"
              type="number"
              min={1}
              max={500}
              required
              value={topCount}
              onChange={(e) => setTopCount(Number(e.target.value))}
              className="w-32 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-mono font-bold focus:bg-white focus:border-[#ff5864] outline-none transition"
            />
            <div className="flex items-center space-x-1.5">
              {[5, 10, 20, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTopCount(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
                    topCount === preset
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Rounds Per Session */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <Play className="w-4 h-4 text-[#ff5864]" />
            <label htmlFor="roundsPerSession">Rounds Per Session</label>
          </div>
          <p className="text-xs text-slate-500">
            Target number of head-to-head voting rounds per session. If registered participants are fewer than this setting, the session limit automatically adapts to the member count so that every card shown in a session is guaranteed unique.
          </p>
          <div className="flex items-center space-x-3">
            <input
              id="roundsPerSession"
              type="number"
              min={2}
              max={100}
              required
              value={roundsPerSession}
              onChange={(e) => setRoundsPerSession(Number(e.target.value))}
              className="w-32 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-mono font-bold focus:bg-white focus:border-[#ff5864] outline-none transition"
            />
            <div className="flex items-center space-x-1.5">
              {[5, 10, 15, 20].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRoundsPerSession(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
                    roundsPerSession === preset
                      ? 'bg-[#ff5864] text-white border-[#ff5864]'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#fd297b] via-[#ff5864] to-[#ff655b] hover:opacity-95 text-white font-extrabold text-xs transition shadow-md shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <span>Save Configuration</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
