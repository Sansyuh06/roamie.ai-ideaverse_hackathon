import { useState, useEffect } from 'react';
import { ScrollText, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuditLogPanel({ disruptionId }: { disruptionId: string }) {
  const [logs, setLogs] = useState<any[]>([]);

  const fetchLogs = async () => {
    const res = await fetch(`/api/disruption/${disruptionId}/audit`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) {
      const data = await res.json();
      setLogs(data.audit);
    }
  };

  useEffect(() => {
    fetchLogs();
    const sub = supabase
      .channel('audit-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'AuditEntry', filter: `disruptionId=eq.${disruptionId}` }, fetchLogs)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [disruptionId]);

  if (!logs.length) return null;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <ScrollText size={16} className="text-text-muted" />
        <h4 className="text-sm font-bold text-text uppercase tracking-wider">Audit Trail</h4>
      </div>
      <div className="relative border-l-2 border-border/50 ml-3 pl-4 space-y-4">
        {logs.map((log: any, idx: number) => (
          <div key={log.id} className="relative">
            <div className={`absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-brand shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-border'}`} />
            <p className="text-xs font-bold text-text">{log.event.replace(/_/g, ' ').toUpperCase()}</p>
            <p className="text-xs text-text-secondary mt-0.5">{log.detail}</p>
            <p className="text-[10px] text-text-muted mt-1">{new Date(log.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
