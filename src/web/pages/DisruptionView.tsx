import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Clock, Map, CreditCard, ChevronRight } from 'lucide-react';

export default function DisruptionView({ tripId, flightId }: { tripId: string, flightId: string }) {
  const [disruption, setDisruption] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const fetchDisruption = async () => {
    const res = await fetch(`/api/disruption/${flightId}`); // Simplified for demo
    if (res.ok) {
      const data = await res.json();
      setDisruption(data.disruption);
    }
  };

  useEffect(() => {
    fetchDisruption();

    const sub = supabase
      .channel('disruption-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Disruption', filter: `flightId=eq.${flightId}` }, fetchDisruption)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Alternative', filter: `disruptionId=eq.${disruption?.id}` }, fetchDisruption)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [flightId]);

  useEffect(() => {
    if (!disruption?.alternatives?.[0]?.holdExpiresAt) return;
    
    const interval = setInterval(() => {
      const expiry = new Date(disruption.alternatives[0].holdExpiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [disruption]);

  const confirmAlternative = async (altId: string) => {
    await fetch(`/api/disruption/${disruption.id}/confirm`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchDisruption();
  };

  if (!disruption) return <div className="p-4 text-center">Loading disruption data...</div>;

  const topPick = disruption.alternatives.find((a: any) => a.rank === 1);
  const others = disruption.alternatives.filter((a: any) => a.rank > 1 && !a.excluded);

  return (
    <div className="bg-surface rounded-2xl shadow-xl overflow-hidden border-2 border-error/50 relative">
      {/* Banner */}
      <div className="bg-gradient-to-r from-error to-rose-600 p-6 text-white flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <AlertTriangle size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-display">Your flight has been {disruption.type}</h2>
          <p className="text-sm text-white/80 mt-1">Don't worry, your Amex Platinum concierge has found alternatives.</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        {disruption.status === 'awaiting_confirmation' && topPick && timeLeft > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800">
              <Clock size={18} />
              <span className="font-semibold text-sm">Hold expires in:</span>
            </div>
            <div className="text-2xl font-bold font-display text-amber-600">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}

        {timeLeft === 0 && topPick && disruption.status !== 'resolved' && (
          <div className="mb-6 bg-error/10 text-error rounded-xl p-4 text-center font-bold">
            Offer expired. Please search again.
          </div>
        )}

        {topPick && (
          <div className="bg-white border-2 border-brand-primary rounded-2xl p-6 shadow-md mb-6 relative">
            <div className="absolute top-0 right-0 bg-brand-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase tracking-wider">
              Recommended
            </div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-text mb-1">{topPick.airline} {topPick.flightNumber}</h3>
                <p className="text-sm text-text-muted">Utility Score: {topPick.utilityScore}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold font-display text-text">₹{topPick.price}</p>
                <p className="text-xs text-brand font-semibold">+₹0 from original</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-text-secondary mb-6">
              <div className="flex-1">
                <p className="font-semibold text-text">{new Date(topPick.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                <p className="text-xs">{topPick.origin}</p>
              </div>
              <div className="w-16 h-px bg-border flex-shrink-0 relative">
                <Map size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-border bg-white px-1" />
              </div>
              <div className="flex-1 text-right">
                <p className="font-semibold text-text">{new Date(topPick.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                <p className="text-xs">{topPick.destination}</p>
              </div>
            </div>

            <button 
              onClick={() => confirmAlternative(topPick.id)}
              disabled={timeLeft === 0 || disruption.status === 'resolved'}
              className="w-full btn-gradient py-4 rounded-xl font-bold text-base shadow-lg shadow-brand/20 disabled:opacity-50"
            >
              {disruption.status === 'resolved' ? 'Confirmed' : 'Book This Flight'}
            </button>
          </div>
        )}

        {/* Other Options */}
        {others.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Other Available Options</h4>
            <div className="space-y-3">
              {others.map((alt: any) => (
                <div key={alt.id} className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl hover:border-brand/30 cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand/5 rounded-lg flex items-center justify-center">
                      <Map size={16} className="text-brand" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text">{alt.airline} {alt.flightNumber}</p>
                      <p className="text-xs text-text-muted">Arr: {new Date(alt.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-bold text-sm">₹{alt.price}</p>
                      <p className="text-[10px] text-text-muted">Score: {alt.utilityScore}</p>
                    </div>
                    <ChevronRight size={16} className="text-border group-hover:text-brand transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
