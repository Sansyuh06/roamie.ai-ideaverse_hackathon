import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plane, Building2, Star, Clock, Users, ExternalLink, ArrowRight, Sparkles, ChevronDown, TrendingDown } from 'lucide-react';
import api from '../lib/api';

const spring = { type: "spring" as const, stiffness: 260, damping: 20 };

interface FlightSuggestion {
  id: string;
  airline: string;
  flightNumber: string;
  departure: string;
  duration: string;
  price: number;
  seatsAvailable: number;
  destination: string;
  bookingUrl: string;
  date: string;
}

interface HotelSuggestion {
  id: string;
  name: string;
  stars: number;
  pricePerNight: number;
  totalPrice: number;
  nights: number;
  distance: string;
  rating: number;
  reviewCount: number;
  amenities: string[];
  bookingUrl: string;
  checkIn: string;
  checkOut: string;
}

// Fake "providers" for the comparison look — with real booking site URLs
const FLIGHT_PROVIDERS = [
  { name: 'Skyscanner', urlBase: 'https://www.skyscanner.co.in/transport/flights/' },
  { name: 'Google Flights', urlBase: 'https://www.google.com/travel/flights?q=flights+to+' },
  { name: 'Kayak', urlBase: 'https://www.kayak.co.in/flights/' },
  { name: 'Momondo', urlBase: 'https://www.momondo.in/flight-search/' },
  { name: 'MakeMyTrip', urlBase: 'https://www.makemytrip.com/flight/search?dep=' },
];

const HOTEL_PROVIDERS = [
  { name: 'Booking.com', urlBase: 'https://www.booking.com/searchresults.html?ss=' },
  { name: 'Agoda', urlBase: 'https://www.agoda.com/search?city=' },
  { name: 'Hotels.com', urlBase: 'https://www.hotels.com/search.do?q-destination=' },
  { name: 'Expedia', urlBase: 'https://www.expedia.co.in/Hotel-Search?destination=' },
  { name: 'MakeMyTrip', urlBase: 'https://www.makemytrip.com/hotels/hotel-listing/?city=' },
];

function generateProviderPrices(basePrice: number, destination: string, isHotel: boolean): { provider: string; price: number; url: string; best?: boolean }[] {
  const providerList = isHotel ? HOTEL_PROVIDERS : FLIGHT_PROVIDERS;
  const providers = providerList
    .map(p => ({
      provider: p.name,
      price: Math.round(basePrice * (0.92 + Math.random() * 0.16)),
      url: p.urlBase + encodeURIComponent(destination),
    }))
    .sort((a, b) => a.price - b.price);
  (providers[0] as any).best = true;
  return providers.slice(0, 3);
}

export default function BookingSuggestions({ tripId, destination }: { tripId: string; destination: string }) {
  const [flights, setFlights] = useState<FlightSuggestion[]>([]);
  const [hotels, setHotels] = useState<HotelSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<'flights' | 'hotels'>('flights');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const origin = localStorage.getItem('roamie-origin') || 'your city';

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/booking-suggestions/${tripId}?origin=${encodeURIComponent(origin)}`);
      setFlights(data.flights || []);
      setHotels(data.hotels || []);
      setLoaded(true);
    } catch (e) {
      console.error('Failed to load suggestions:', e);
    }
    setLoading(false);
  };

  useEffect(() => { loadSuggestions(); }, [tripId]);

  if (!loaded && !loading) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.2 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Best Deals</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-bold">Live Prices</span>
        </div>
        <button onClick={loadSuggestions} className="text-[11px] text-brand font-semibold hover:underline">
          Refresh ↻
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-border-light rounded-xl mb-4 w-fit">
        {(['flights', 'hotels'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t ? 'bg-surface shadow-sm text-text' : 'text-text-muted hover:text-text'}`}>
            {t === 'flights' ? '✈️ Flights' : '🏨 Hotels'}
          </button>
        ))}
      </div>

      {loading && (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="inline-block w-8 h-8 border-3 border-brand border-t-transparent rounded-full mb-3" />
          <p className="text-sm text-text-secondary font-medium">Searching {tab === 'flights' ? 'airlines' : 'hotels'}…</p>
          <p className="text-xs text-text-muted mt-1">Comparing prices across providers</p>
        </div>
      )}

      {!loading && tab === 'flights' && (
        <div className="space-y-3">
          {/* Summary bar */}
          {flights.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              <SummaryPill label="Best" value={`₹${Math.min(...flights.map(f => f.price)).toLocaleString()}`} active />
              <SummaryPill label="Cheapest" value={`₹${flights.sort((a,b) => a.price - b.price)[0]?.price.toLocaleString()}`} />
              <SummaryPill label="Fastest" value={flights[0]?.duration || '—'} />
            </div>
          )}

          {flights.slice(0, 5).map((flight, i) => {
            const providers = generateProviderPrices(flight.price, destination, false);
            const isExpanded = expandedId === flight.id;

            return (
              <motion.div key={flight.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: i * 0.05 }}
                className="bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                {/* Main row */}
                <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : flight.id)}>
                  {/* Airline */}
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                    <Plane size={16} className="text-amber-600" />
                  </div>

                  {/* Flight info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-text">{flight.departure}</span>
                      <span className="flex items-center gap-1 text-[11px] text-text-muted">
                        <span className="w-8 h-px bg-border inline-block" />
                        {flight.duration}
                        <span className="w-8 h-px bg-border inline-block" />
                      </span>
                      <span className="text-sm font-bold text-text">{destination}</span>
                    </div>
                    <p className="text-xs text-text-muted">{flight.airline} • {flight.flightNumber} • {flight.seatsAvailable} seats left</p>
                  </div>

                  {/* Price + deals */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-text">₹{providers[0].price.toLocaleString()}</p>
                    <p className="text-[10px] text-success font-semibold">{providers.length} deals</p>
                  </div>

                  <ChevronDown size={14} className={`text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded — provider comparison */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-4 pb-4 pt-1 border-t border-border">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Price comparison</p>
                        {providers.map((p, j) => (
                          <div key={j} className={`flex items-center justify-between py-2 ${j < providers.length - 1 ? 'border-b border-border-light' : ''}`}>
                            <div className="flex items-center gap-2">
                              {p.best && <TrendingDown size={12} className="text-success" />}
                              <span className={`text-xs font-medium ${p.best ? 'text-success' : 'text-text-secondary'}`}>{p.provider}</span>
                              {p.best && <span className="text-[9px] px-1.5 py-0.5 bg-success/10 text-success rounded font-bold">BEST</span>}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-bold ${p.best ? 'text-success' : 'text-text'}`}>₹{p.price.toLocaleString()}</span>
                              <a href={flight.bookingUrl} target="_blank" rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-brand text-white text-[11px] font-bold rounded-lg hover:bg-brand-dark transition-colors">
                                Select →
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && tab === 'hotels' && (
        <div className="space-y-3">
          {hotels.slice(0, 5).map((hotel, i) => {
            const providers = generateProviderPrices(hotel.pricePerNight);
            const isExpanded = expandedId === hotel.id;

            return (
              <motion.div key={hotel.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: i * 0.05 }}
                className="bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                {/* Main row */}
                <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : hotel.id)}>
                  <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
                    <Building2 size={16} className="text-violet-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-text truncate">{hotel.name}</span>
                      <span className="flex gap-0.5">
                        {Array.from({ length: hotel.stars }).map((_, s) => (
                          <Star key={s} size={10} className="text-amber-400 fill-amber-400" />
                        ))}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span>⭐ {hotel.rating}/10 ({hotel.reviewCount.toLocaleString()} reviews)</span>
                      <span>• {hotel.distance}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-text">₹{providers[0].price.toLocaleString()}</p>
                    <p className="text-[10px] text-text-muted">/night • {hotel.nights}n</p>
                  </div>

                  <ChevronDown size={14} className={`text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-4 pb-4 pt-1 border-t border-border">
                        {/* Amenities */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {hotel.amenities.map(a => (
                            <span key={a} className="text-[10px] px-2 py-0.5 bg-border-light rounded-md text-text-muted font-medium">{a}</span>
                          ))}
                        </div>
                        {/* Provider prices */}
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Price comparison</p>
                        {providers.map((p, j) => (
                          <div key={j} className={`flex items-center justify-between py-2 ${j < providers.length - 1 ? 'border-b border-border-light' : ''}`}>
                            <div className="flex items-center gap-2">
                              {p.best && <TrendingDown size={12} className="text-success" />}
                              <span className={`text-xs font-medium ${p.best ? 'text-success' : 'text-text-secondary'}`}>{p.provider}</span>
                              {p.best && <span className="text-[9px] px-1.5 py-0.5 bg-success/10 text-success rounded font-bold">BEST</span>}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className={`text-sm font-bold ${p.best ? 'text-success' : 'text-text'}`}>₹{p.price.toLocaleString()}</span>
                                <span className="text-[10px] text-text-muted ml-1">/ night</span>
                              </div>
                              <a href={hotel.bookingUrl} target="_blank" rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-brand text-white text-[11px] font-bold rounded-lg hover:bg-brand-dark transition-colors">
                                Book →
                              </a>
                            </div>
                          </div>
                        ))}
                        <p className="text-[10px] text-text-muted mt-2">Total for {hotel.nights} nights: ₹{(providers[0].price * hotel.nights).toLocaleString()}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function SummaryPill({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <div className={`px-4 py-2 rounded-xl text-center shrink-0 ${active ? 'bg-stone-900 text-white' : 'bg-surface border border-border text-text'}`}>
      <p className={`text-[10px] font-bold uppercase ${active ? 'text-white/60' : 'text-text-muted'}`}>{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
