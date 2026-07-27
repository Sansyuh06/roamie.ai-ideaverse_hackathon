import { useState } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export default function AdminPanel({ trips }: { trips: any[] }) {
  const [selectedTrip, setSelectedTrip] = useState('');
  const [selectedFlight, setSelectedFlight] = useState('');
  const [status, setStatus] = useState('');

  const injectDisruption = async () => {
    setStatus('Injecting...');
    try {
      const res = await fetch('/api/admin/inject-disruption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tripId: selectedTrip,
          flightId: selectedFlight,
          disruptionType: 'cancelled'
        })
      });
      if (res.ok) {
        // Trigger the real pipeline now that it's "cancelled" in DB
        await fetch('/api/disruption/trigger', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            tripId: selectedTrip,
            flightId: selectedFlight,
            disruptionType: 'cancelled'
          })
        });
        setStatus('Injected successfully');
      } else {
        setStatus('Failed');
      }
    } catch {
      setStatus('Error');
    }
  };

  const resetState = async () => {
    setStatus('Resetting...');
    await fetch('/api/admin/reset', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    setStatus('Reset complete');
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-surface shadow-2xl border-2 border-red-500 rounded-xl p-4 w-80 z-50">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-red-500 uppercase tracking-wider flex items-center gap-1"><AlertOctagon size={16} /> Demo Controls</h4>
      </div>
      
      <div className="space-y-3">
        <select 
          className="w-full bg-border-light border border-border rounded p-2 text-xs text-text"
          value={selectedTrip}
          onChange={(e) => {
            setSelectedTrip(e.target.value);
            setSelectedFlight('');
          }}
        >
          <option value="">Select Trip</option>
          {trips.map(t => <option key={t.id} value={t.id}>{t.destination}</option>)}
        </select>

        {selectedTrip && (
          <select 
            className="w-full bg-border-light border border-border rounded p-2 text-xs text-text"
            value={selectedFlight}
            onChange={(e) => setSelectedFlight(e.target.value)}
          >
            <option value="">Select Flight</option>
            {trips.find(t => t.id === selectedTrip)?.flights?.map((f: any) => 
              <option key={f.id} value={f.id}>{f.airline} {f.flightNumber}</option>
            )}
          </select>
        )}

        <button 
          onClick={injectDisruption}
          disabled={!selectedFlight}
          className="w-full bg-red-500 hover:bg-red-600 text-white rounded p-2 text-xs font-bold disabled:opacity-50"
        >
          Inject Cancellation
        </button>

        <button 
          onClick={resetState}
          className="w-full bg-surface border border-border hover:bg-border-light text-text rounded p-2 text-xs font-bold flex items-center justify-center gap-1"
        >
          <RotateCcw size={14} /> Reset State
        </button>
      </div>

      {status && <p className="text-[10px] mt-2 text-center font-semibold text-text-muted">{status}</p>}
    </div>
  );
}
