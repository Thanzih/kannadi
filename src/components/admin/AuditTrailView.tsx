import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { AdminLog } from '../../types';

export function AuditTrailView() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);

      if (error) {
        console.error('Error fetching admin logs:', error.message);
      } else if (data) {
        setLogs(data as AdminLog[]);
      }
    } catch (err) {
      console.error('Exception fetching admin logs:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLogs();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-[#ff5864]" />
            <span>Administrative Audit Trail</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">Immutable record of all purge, rating calibration, and policy events</p>
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
          <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading audit history...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">No moderation actions recorded yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const dateStr = new Date(log.created_at).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const isDelete = log.action === 'DELETE_PROFILE';

              return (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-start space-x-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isDelete
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      }`}
                    >
                      {isDelete ? <AlertCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </span>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded ${
                            isDelete
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          Target: {log.target_user_id?.slice(0, 8)}...
                        </span>
                      </div>

                      {log.details && (
                        <p className="text-slate-700 text-xs font-medium">
                          Reason:{' '}
                          <span className="italic text-slate-500 font-sans">
                            {String(log.details.reason || 'No reason provided')}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 shrink-0 self-end sm:self-auto">
                    {dateStr}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
