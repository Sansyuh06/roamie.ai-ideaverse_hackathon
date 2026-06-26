import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plane, Map, Plus, Shield, Receipt, Package, Globe, ArrowRight, Building2, Clock, CheckCircle2, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../stores/useStore';
import BookingSuggestions from '../components/BookingSuggestions';

const spring = { type: "spring" as const, stiffness: 260, damping: 20 };

export default function Dashboard() {
  const navigate = useNavigate();
  const { trips, currentTrip, fetchTrips, fetchTrip, deleteTrip } = useStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrips().then(() => {
      const t = useStore.getState().trips;
      if (t.length === 0) setTimeout(() => fetchTrips(), 500);
    });
  }, []);

  useEffect(() => {
    if (trips.length > 0 && !currentTrip) fetchTrip(trips[0].id);
  }, [trips, currentTrip]);

  const handleDelete = async (tripId: string) => {
    await deleteTrip(tripId);
    setDeletingId(null);
    fetchTrips();
  };

  const daysUntil = currentTrip ? Math.max(0, Math.ceil((new Date(currentTrip.startDate).getTime() - Date.now()) / 86400000)) : 0;
  const tripDuration = currentTrip ? Math.max(1, Math.ceil((new Date(currentTrip.endDate).getTime() - new Date(currentTrip.startDate).getTime()) / 86400000)) : 0;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-text">Welcome back 👋</h1>
        <p className="text-text-secondary text-sm mt-1">Here's your trip overview at a glance.</p>
      </motion.div>

      {/* No trips */}
      {trips.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}
          className="bg-surface border border-border rounded-3xl p-10 md:p-14 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand/20">
            <Plane size={28} className="text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-text mb-3">No trips yet</h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto mb-8">
            Answer 6 quick questions and AI will build a personalized, budget-aware itinerary in seconds.
          </p>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/onboarding')}
            className="btn-gradient px-8 py-4 rounded-2xl text-base font-semibold inline-flex items-center gap-2">
            Plan Your First Trip <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      )}

      {/* Has trips */}
      {currentTrip && (
        <div className="space-y-6">
          {/* My Trips — Full Management */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.05 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider px-1">My Trips ({trips.length})</h3>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/onboarding')}
                className="btn-gradient px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-none">
                <Plus size={14} /> New Trip
              </motion.button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {trips.map((trip: any, i: number) => (
                <motion.div key={trip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: i * 0.05 }}
                  onClick={() => fetchTrip(trip.id)}
                  className={`relative bg-surface border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md group ${
                    currentTrip.id === trip.id ? 'border-brand-primary shadow-md' : 'border-border hover:border-brand-primary/30'
                  }`}>
                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingId(trip.id); }}
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-error/10 text-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/20">
                    <Trash2 size={13} />
                  </button>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shrink-0">
                      <Plane size={14} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text truncate">{trip.destination}</p>
                      <p className="text-[11px] text-text-muted">
                        {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${trip.status === 'active' ? 'bg-success/10 text-success' : 'bg-border text-text-muted'}`}>
                      {trip.status}
                    </span>
                    {trip.flights?.length > 0 && <span className="text-text-muted">✈️ {trip.flights.length}</span>}
                    {trip.hotels?.length > 0 && <span className="text-text-muted">🏨 {trip.hotels.length}</span>}
                    {trip.itinerary?.length > 0 && <span className="text-text-muted">📅 {trip.itinerary.length}d</span>}
                  </div>
                  {currentTrip.id === trip.id && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary rounded-full border-2 border-surface" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {deletingId && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setDeletingId(null)}>
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
                      <Trash2 size={18} className="text-error" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text">Delete Trip?</h3>
                      <p className="text-xs text-text-muted">This will permanently remove this trip and all its data.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setDeletingId(null)}
                      className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-text-secondary hover:bg-border-light transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => handleDelete(deletingId)}
                      className="flex-1 py-2.5 rounded-xl bg-error text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                      Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trip Hero Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}
            className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/20 text-brand text-xs font-bold mb-3">
                  <Plane size={11} /> Upcoming Trip
                </span>
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-1">{currentTrip.destination}</h2>
                <p className="text-white/50 text-sm flex items-center gap-2">
                  <Calendar size={13} />
                  {new Date(currentTrip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(currentTrip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  <span className="text-white/30">•</span> {tripDuration} nights
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 text-center border border-white/10">
                <p className="text-4xl font-display font-bold text-brand">{daysUntil}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mt-1">Days to go</p>
              </div>
            </div>
          </motion.div>

          {/* Bookings Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.15 }}>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 px-1">Your Bookings</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Flights */}
              {(currentTrip.flights || []).map((flight: any, i: number) => (
                <motion.div key={flight.id || i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.2 + i * 0.05 }}
                  className="bg-surface border border-border rounded-2xl p-5 hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                        <Plane size={18} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text">{flight.airline}</p>
                        <p className="text-xs text-text-muted">{flight.flightNumber} • {flight.seatClass}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase">
                      <CheckCircle2 size={10} /> {flight.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1">
                      <p className="text-xs text-text-muted">From</p>
                      <p className="text-sm font-semibold text-text truncate">{flight.origin}</p>
                    </div>
                    <div className="flex-shrink-0 px-2">
                      <ArrowRight size={14} className="text-text-muted" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-text-muted">To</p>
                      <p className="text-sm font-semibold text-text truncate">{flight.destination}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted pt-3 border-t border-border">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(flight.departureTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(flight.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-bold text-text">${flight.price}</span>
                  </div>
                </motion.div>
              ))}

              {/* Hotels */}
              {(currentTrip.hotels || []).map((hotel: any, i: number) => (
                <motion.div key={hotel.id || i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.25 + i * 0.05 }}
                  className="bg-surface border border-border rounded-2xl p-5 hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center">
                        <Building2 size={18} className="text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text">{hotel.hotelName}</p>
                        <p className="text-xs text-text-muted">{tripDuration} nights</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase">
                      <CheckCircle2 size={10} /> {hotel.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-text-muted">Check-in</p>
                      <p className="text-sm font-semibold text-text">
                        {new Date(hotel.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Check-out</p>
                      <p className="text-sm font-semibold text-text">
                        {new Date(hotel.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* No bookings fallback */}
              {(!currentTrip.flights || currentTrip.flights.length === 0) && (!currentTrip.hotels || currentTrip.hotels.length === 0) && (
                <div className="col-span-2 bg-surface border border-dashed border-border rounded-2xl p-8 text-center">
                  <p className="text-text-muted text-sm">No bookings yet. Flights and hotels will appear here once added.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* AI Deal Suggestions — Skyscanner-style */}
          <BookingSuggestions tripId={currentTrip.id} destination={currentTrip.destination} />

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.3 }}>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 px-1">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { icon: Map, title: "Itinerary", desc: "View plans", path: "/itinerary", gradient: "from-orange-500 to-rose-500" },
                { icon: Shield, title: "Disruption", desc: "Flight shield", path: "/disruption", gradient: "from-red-500 to-rose-500" },
                { icon: Receipt, title: "Budget", desc: "Track costs", path: "/budget", gradient: "from-emerald-500 to-green-500" },
                { icon: Package, title: "Packing", desc: "AI list", path: "/packing", gradient: "from-amber-500 to-orange-500" },
                { icon: Globe, title: "Translate", desc: "50+ langs", path: "/translate", gradient: "from-blue-500 to-violet-500" },
              ].map((item, i) => (
                <motion.button key={item.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.35 + i * 0.04 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(item.path)}
                  className="bg-surface border border-border rounded-2xl p-4 text-left hover:shadow-lg transition-shadow duration-500 group">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <item.icon size={16} className="text-white" />
                  </div>
                  <p className="text-xs font-bold text-text">{item.title}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{item.desc}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
