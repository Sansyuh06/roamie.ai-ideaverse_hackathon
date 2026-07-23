import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Plane, Building2, MapPin, Clock, Calendar,
  ChevronDown, AlertTriangle, Zap, Check,
  Utensils, Eye, ShoppingBag, Bus, Coffee, Briefcase,
  Sparkles, Shield, ArrowRight, ExternalLink, Plus,
  RotateCcw, RefreshCw, Wallet
} from 'lucide-react';
import { useStore } from '../stores/useStore';
import api from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import ItineraryMap from '../components/ItineraryMap';

type NodeType = 'home' | 'flight' | 'hotel' | 'day' | 'activity' | 'disruption' | 'return';

interface TimelineNode {
  id: string;
  type: NodeType;
  title: string;
  subtitle?: string;
  time?: string;
  details?: any;
  children?: TimelineNode[];
  status?: 'upcoming' | 'active' | 'completed' | 'disrupted';
}

const EVENT_ICONS: Record<string, typeof Utensils> = {
  food: Utensils, sightseeing: Eye, activity: Sparkles,
  shopping: ShoppingBag, transport: Bus, break: Coffee, meeting: Briefcase,
};

const NODE_ICONS: Record<NodeType, typeof Home> = {
  home: Home, flight: Plane, hotel: Building2, day: Calendar,
  activity: MapPin, disruption: AlertTriangle, return: Home,
};

// Adjusted for new theme (Orange focused)
const NODE_THEME: Record<NodeType, { bg: string; border: string; icon: string }> = {
  home:       { bg: 'bg-brand-primary/10', border: 'border-brand-primary/20', icon: 'text-brand-primary' },
  flight:     { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
  hotel:      { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600' },
  day:        { bg: 'bg-surface-hover', border: 'border-border', icon: 'text-text-secondary' },
  activity:   { bg: 'bg-brand-primary/10', border: 'border-brand-primary/20', icon: 'text-brand-primary' },
  disruption: { bg: 'bg-error/10', border: 'border-error/20', icon: 'text-error' },
  return:     { bg: 'bg-brand-primary/10', border: 'border-brand-primary/20', icon: 'text-brand-primary' },
};

function StepItem({ step, index }: { step: { icon: string; label: string; detail: string }; index: number }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setActive(true), index * 2500);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <motion.div
      initial={{ opacity: 0.3, x: -10 }}
      animate={active ? { opacity: 1, x: 0 } : { opacity: 0.3, x: -10 }}
      transition={{ duration: 0.5 }}
      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${active ? 'bg-surface border-brand-primary/20 shadow-md' : 'border-transparent'}`}
    >
      <span className="text-2xl w-8 text-center">{step.icon}</span>
      <div className="flex-1">
        <p className={`text-sm font-bold ${active ? 'text-text' : 'text-text-muted'}`}>{step.label}</p>
        {active && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-text-secondary mt-0.5">
            {step.detail}
          </motion.p>
        )}
      </div>
      {active && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center shrink-0 shadow-lg shadow-brand-primary/30"
        >
          <Check size={14} className="text-white" />
        </motion.div>
      )}
    </motion.div>
  );
}

const CURR_SYMS: Record<string,string> = { INR:'₹',USD:'$',EUR:'€',GBP:'£',SGD:'S$',JPY:'¥',AED:'د.إ',AUD:'A$' };
function getTripBudget(tid: string) { try { return JSON.parse(localStorage.getItem('rb-'+tid)||'null'); } catch { return null; } }

export default function Itinerary() {
  const navigate = useNavigate();
  const { currentTrip, cart, triggerDisruption, buildItinerary, itineraryBuilding, addCustomEvent, regenerateDay, undoDay, recommendedPlan, fetchTrips, fetchTrip } = useStore();

  // Auto-load trips if none selected
  useEffect(() => {
    if (!currentTrip) {
      fetchTrips().then(() => {
        const t = useStore.getState().trips;
        if (t.length > 0) fetchTrip(t[0].id);
      });
    }
  }, []);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['day-0']));
  const [disrupting, setDisrupting] = useState(false);
  const [disruptionResult, setDisruptionResult] = useState<any>(null);
  const [disruptionStep, setDisruptionStep] = useState(-1);
  const [building, setBuilding] = useState(false);
  const [energyLevel, setEnergyLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const hasBuiltRef = useRef(false);

  const [addingToDayId, setAddingToDayId] = useState<string | null>(null);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanTime, setNewPlanTime] = useState('14:00');
  const [newPlanDuration, setNewPlanDuration] = useState(60);
  const [newPlanType, setNewPlanType] = useState('activity');
  const [newPlanLocation, setNewPlanLocation] = useState('');
  const [regeneratingDayId, setRegeneratingDayId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTrip) return;
    if (hasBuiltRef.current) return;
    if (currentTrip.itinerary && currentTrip.itinerary.length > 0) {
      hasBuiltRef.current = true;
      return;
    }
    if (itineraryBuilding || building) return;

    hasBuiltRef.current = true;
    setBuilding(true);
    buildItinerary(currentTrip.id)
      .catch(console.error)
      .finally(() => setBuilding(false));
  }, [currentTrip?.id, currentTrip?.itinerary?.length, itineraryBuilding]);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const buildTimeline = (): TimelineNode[] => {
    if (!currentTrip) return [];
    const nodes: TimelineNode[] = [];

    nodes.push({
      id: 'home-start', type: 'home', title: 'Depart from Home', subtitle: 'Start of your journey',
      time: new Date(currentTrip.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      status: 'completed',
    });

    const outboundFlight = currentTrip.flights?.[0];
    const cartFlights = cart.filter(c => c.type === 'flight' && c.tripId === currentTrip.id);

    if (outboundFlight) {
      nodes.push({
        id: `flight-${outboundFlight.id}`, type: 'flight',
        title: `${outboundFlight.airline || 'Flight'} ${outboundFlight.flightNumber}`,
        subtitle: `${outboundFlight.origin || 'Home'} → ${outboundFlight.destination || currentTrip.destination}`,
        time: outboundFlight.departureTime ? new Date(outboundFlight.departureTime).toLocaleString() : undefined,
        details: outboundFlight,
        status: outboundFlight.status === 'cancelled' ? 'disrupted' : 'active',
      });
    } else if (cartFlights.length > 0) {
      cartFlights.forEach((cf, i) => {
        nodes.push({
          id: `cart-flight-${i}`, type: 'flight', title: cf.name, subtitle: cf.details, time: cf.details, details: cf, status: 'upcoming',
        });
      });
    }

    const hotel = currentTrip.hotels?.[0];
    const cartHotels = cart.filter(c => c.type === 'hotel' && c.tripId === currentTrip.id);

    if (hotel) {
      nodes.push({
        id: `hotel-${hotel.id}`, type: 'hotel', title: hotel.hotelName || 'Hotel Check-in',
        subtitle: `Check-in: ${new Date(hotel.checkIn).toLocaleDateString()}`, details: hotel, status: 'active',
      });
    } else if (cartHotels.length > 0) {
      cartHotels.forEach((ch, i) => {
        nodes.push({
          id: `cart-hotel-${i}`, type: 'hotel', title: ch.name, subtitle: ch.details, details: ch, status: 'upcoming',
        });
      });
    }

    const itinerary = currentTrip.itinerary || [];
    itinerary.forEach((day: any, dayIdx: number) => {
      const dayDate = day.date ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : `Day ${dayIdx + 1}`;
      const events = day.events || [];

      nodes.push({
        id: `day-${dayIdx}`, type: 'day', title: `Day ${dayIdx + 1} — ${dayDate}`,
        subtitle: `${events.length} activities planned`, details: { dayId: day.id },
        children: events.map((evt: any, evtIdx: number) => ({
          id: `day-${dayIdx}-evt-${evtIdx}`, type: 'activity', title: evt.title, subtitle: evt.location || evt.description,
          time: evt.time, details: { ...evt, userAdded: evt.userAdded }, status: 'upcoming',
        })),
        status: dayIdx === 0 ? 'active' : 'upcoming',
      });
    });

    nodes.push({
      id: 'disruption-shield', type: 'disruption', title: 'Disruption Shield', subtitle: 'Simulate a flight cancellation in real-time', status: 'upcoming',
    });

    nodes.push({
      id: 'home-return', type: 'return', title: `Return Home`, subtitle: `End of your journey from ${currentTrip.destination}`,
      time: new Date(currentTrip.endDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      status: 'upcoming',
    });

    return nodes;
  };

  const timeline = buildTimeline();

  const handleSimulateDisruption = async () => {
    if (!currentTrip) return;
    const flight = currentTrip.flights?.[0] || cart.find(c => c.type === 'flight');
    if (!flight) return;

    setDisrupting(true);
    setDisruptionStep(0);
    setDisruptionResult(null);

    try {
      const flightIdToDisrupt = flight.id;
      const result = await triggerDisruption(currentTrip.id, flightIdToDisrupt, 'cancelled', false);
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 400));
        setDisruptionStep(i + 1);
      }
      setDisruptionResult(result);
    } catch (e) {
      console.error(e);
    }
    setDisrupting(false);
  };

  // EMPTY STATE: NO TRIP
  if (!currentTrip) {
    return (
      <div className="flex flex-col items-center justify-center p-12 mt-20 max-w-lg mx-auto bg-surface rounded-3xl shadow-xl text-center border border-border">
        <Calendar size={64} className="text-text-muted mb-6" />
        <h2 className="font-display font-black text-3xl text-text mb-3">No Trip Selected</h2>
        <p className="text-text-secondary mb-8 font-medium">Go to the Dashboard and create or select a trip to see your full interactive itinerary here.</p>
        <Button size="lg" onClick={() => navigate('/dashboard')} className="px-8 rounded-full">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const tripBudget = currentTrip ? getTripBudget(currentTrip.id) : null;

  // Budget is optional — proceed to itinerary building regardless

  // BUILDING STATE
  if (building || itineraryBuilding) {
    const steps = [
      { icon: '🌍', label: 'Discovering places', detail: `Finding top attractions in ${currentTrip?.destination || 'your destination'}...` },
      { icon: '📅', label: 'Optimizing schedule', detail: 'Arranging activities for the best experience...' },
      { icon: '🚕', label: 'Adding travel segments', detail: 'Inserting transit between locations...' },
      { icon: '☕', label: 'Planning breaks', detail: 'Adding breathing room so you do not burn out...' },
      { icon: '✨', label: 'Finalizing itinerary', detail: 'Polishing your personalized travel plan...' },
    ];

    return (
      <div className="flex flex-col items-center justify-center p-8 mt-12 max-w-xl mx-auto text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-full bg-brand-primary flex items-center justify-center text-4xl shadow-2xl shadow-brand-primary/40 mb-8"
        >
          🗺️
        </motion.div>
        <h2 className="font-display font-black text-3xl text-text mb-2">
          Crafting Your {currentTrip?.destination || ''} Adventure
        </h2>
        <p className="text-text-secondary font-medium mb-10">AI is building a personalized itinerary just for you...</p>

        <div className="w-full bg-surface-hover rounded-full h-3 mb-10 overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-brand-primary rounded-full"
            initial={{ width: '5%' }} animate={{ width: '90%' }} transition={{ duration: 15, ease: 'easeOut' }}
          />
        </div>

        <div className="w-full space-y-4 text-left">
          {steps.map((step, idx) => <StepItem key={idx} step={step} index={idx} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 pb-24">
      {/* HEADER */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display font-black text-4xl md:text-5xl text-text mb-3">My Itinerary</h1>
          <p className="text-lg font-medium text-text-secondary">
            Master plan for <strong className="text-brand-primary">{currentTrip.destination}</strong>
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <span className="px-4 py-1.5 rounded-full bg-surface border border-border text-text font-bold text-sm shadow-sm">
              {new Date(currentTrip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(currentTrip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="px-4 py-1.5 rounded-full bg-success/10 border border-success/30 text-success font-bold text-sm shadow-sm">
              {timeline.filter(n => n.type === 'day').length} days total
            </span>
            {cart.filter(c => c.tripId === currentTrip.id).length > 0 && (
              <span className="px-4 py-1.5 rounded-full bg-warning/10 border border-warning/30 text-warning font-bold text-sm shadow-sm">
                {cart.filter(c => c.tripId === currentTrip.id).length} bookings in cart
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-4">
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" className="rounded-full" onClick={async () => {
              try {
                const response = await api.get(`/itinerary/${currentTrip.id}/export`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a'); link.href = url;
                link.setAttribute('download', `itinerary-${currentTrip.destination}.txt`);
                document.body.appendChild(link); link.click(); link.remove();
              } catch (e) { console.error('Export failed', e); }
            }}>
              <ExternalLink size={16} className="mr-2" /> Export
            </Button>
            <Button size="sm" className="rounded-full shadow-lg shadow-brand-primary/30" disabled={building} onClick={() => {
              if (!currentTrip || building) return;
              hasBuiltRef.current = false; setBuilding(true);
              buildItinerary(currentTrip.id, [], [], energyLevel).catch(console.error).finally(() => setBuilding(false));
            }}>
              <Sparkles size={16} className="mr-2" /> {building ? 'Rebuilding...' : 'Rebuild'}
            </Button>
          </div>
          
          <div className="flex items-center gap-2 bg-surface p-1.5 rounded-full shadow-sm border border-border">
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest pl-3 pr-2">Energy</span>
            {(['low', 'medium', 'high'] as const).map(level => (
              <button key={level} onClick={() => setEnergyLevel(level)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${energyLevel === level ? 'bg-brand-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface-hover'}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BUDGET TRACKER */}
      {tripBudget && (() => {
        const sym = CURR_SYMS[tripBudget.currency] || '';
        const cats = [
          { label:'Accommodation', amount:tripBudget.breakdown.accommodation, color:'#6366f1' },
          { label:'Food',          amount:tripBudget.breakdown.food,          color:'#10b981' },
          { label:'Activities',    amount:tripBudget.breakdown.activities,    color:'#EF5C00' },
          { label:'Transport',     amount:tripBudget.breakdown.transport,     color:'#f59e0b' },
          { label:'Misc',          amount:tripBudget.breakdown.misc,          color:'#a855f7' },
        ];
        return (
          <Card className="p-6 md:p-8 mb-12 border-2 border-border/50 shadow-xl relative overflow-hidden">
            {/* Glow effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 relative z-10">
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Total Trip Budget</p>
                <p className="font-display font-black text-4xl text-text">
                  {sym}{tripBudget.total.toLocaleString()} <span className="text-lg font-bold text-text-secondary ml-1">{tripBudget.currency}</span>
                </p>
                {tripBudget.preferences && <p className="text-sm font-medium text-brand-primary mt-2 flex items-center gap-2"><Sparkles size={14}/> {tripBudget.preferences}</p>}
              </div>
              <div className="px-4 py-2 rounded-full bg-success/10 border border-success/30 text-success font-bold text-xs uppercase tracking-widest shadow-sm">
                Budget-Locked Itinerary
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
              {cats.map(c => (
                <div key={c.label} className="bg-surface-hover rounded-2xl p-4 border border-border">
                  <div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: c.color }} />
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">{c.label}</p>
                  <p className="font-display font-bold text-xl text-text">{sym}{c.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}

      {/* RECOMMENDED ITINERARY ALERT */}
      {recommendedPlan && (
        <Card className="mb-12 p-6 md:p-8 bg-brand-primary/5 border-2 border-brand-primary/20 shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <Sparkles className="text-brand-primary w-6 h-6" />
            </div>
            <div>
              <p className="font-display font-bold text-2xl text-text">AI Recommended Itinerary</p>
              <p className="text-sm font-medium text-text-secondary">Drafted from your chat profile</p>
            </div>
          </div>
          <div className="space-y-4">
            {recommendedPlan.itinerary?.map((day: any) => (
              <div key={day.dayNum} className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                <p className="font-bold text-text mb-3">Day {day.dayNum} — {day.dateLabel}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-4"><span className="w-20 font-bold text-text-muted">Morning:</span><span className="font-medium text-text-secondary">{day.morning}</span></div>
                  <div className="flex gap-4"><span className="w-20 font-bold text-text-muted">Afternoon:</span><span className="font-medium text-text-secondary">{day.afternoon}</span></div>
                  <div className="flex gap-4"><span className="w-20 font-bold text-text-muted">Evening:</span><span className="font-medium text-text-secondary">{day.evening}</span></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TRIP MAP — all activity locations pinned */}
      {(() => {
        const allEvents = (currentTrip.itinerary || [])
          .flatMap((d: any) => Array.isArray(d.events) ? d.events : [])
          .filter((e: any) => e.location && !['transport', 'break'].includes(e.type));
        if (allEvents.length === 0) return null;
        return (
          <Card className="mb-12 p-4 md:p-5 border-2 border-border/50 shadow-lg overflow-hidden">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                <MapPin className="text-brand-primary w-5 h-5" />
              </div>
              <div>
                <p className="font-display font-bold text-xl text-text">Trip Map</p>
                <p className="text-sm font-medium text-text-secondary">Your itinerary locations in {currentTrip.destination}</p>
              </div>
            </div>
            <ItineraryMap destination={currentTrip.destination} events={allEvents} />
          </Card>
        );
      })()}

      {/* TIMELINE */}
      <div className="relative">
        <div className="absolute left-[39px] top-8 bottom-8 w-1 rounded-full bg-gradient-to-b from-brand-primary/40 via-brand-primary/20 to-transparent" />

        <div className="space-y-8">
          {timeline.map((node, idx) => {
            const Icon = NODE_ICONS[node.type];
            const theme = NODE_THEME[node.type];
            const isExpanded = expandedNodes.has(node.id);
            const hasChildren = node.children && node.children.length > 0;
            const isDisruptionNode = node.type === 'disruption';

            return (
              <div key={node.id} className="relative pl-24">
                {/* Node Icon */}
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: idx * 0.05 }}
                  className={`absolute left-[20px] top-6 w-10 h-10 rounded-full border-[3px] border-surface flex items-center justify-center z-10 ${theme.bg} shadow-md`}
                >
                  <Icon size={18} className={theme.icon} />
                </motion.div>

                {/* Node Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  className={`bg-surface rounded-3xl overflow-hidden relative z-10 transition-all border-2 ${node.status === 'disrupted' ? 'border-error shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 'border-border/50 shadow-lg'}`}
                >
                  <div
                    onClick={() => (hasChildren || isDisruptionNode) && toggleNode(node.id)}
                    className={`p-6 md:p-8 flex items-center justify-between gap-4 ${(hasChildren || isDisruptionNode) ? 'cursor-pointer hover:bg-surface-hover/50' : ''} transition-colors`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span className="font-display font-bold text-2xl text-text">{node.title}</span>
                        {node.status === 'disrupted' && <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-error/10 text-error border border-error/20">Action Required</span>}
                        {node.status === 'active' && <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-success/10 text-success border border-success/20">Active Stage</span>}
                      </div>
                      {node.subtitle && <p className="text-base font-medium text-text-secondary">{node.subtitle}</p>}
                      {node.time && (
                        <div className="flex items-center gap-2 mt-3 text-brand-primary font-bold bg-brand-primary/10 inline-flex px-3 py-1 rounded-lg">
                          <Clock size={14} /> <span className="text-sm">{node.time}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {node.details?.bookingUrl && (
                        <Button variant="secondary" size="sm" className="hidden sm:flex rounded-full" onClick={(e) => { e.stopPropagation(); window.open(node.details.bookingUrl, '_blank'); }}>
                          <ExternalLink size={14} className="mr-2" /> Booking
                        </Button>
                      )}
                      
                      {node.type === 'day' && node.details?.dayId && (
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            disabled={regeneratingDayId === node.details.dayId}
                            onClick={async () => {
                              if (!currentTrip) return;
                              setRegeneratingDayId(node.details.dayId);
                              try { await regenerateDay(currentTrip.id, node.details.dayId, energyLevel); }
                              finally { setRegeneratingDayId(null); }
                            }}
                            className="w-10 h-10 rounded-full bg-surface-hover border border-border flex items-center justify-center text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                          >
                            <RefreshCw size={16} className={regeneratingDayId === node.details.dayId ? 'animate-spin' : ''} />
                          </button>
                          <button
                            onClick={async () => await undoDay(node.details.dayId)}
                            className="w-10 h-10 rounded-full bg-surface-hover border border-border flex items-center justify-center text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                          >
                            <RotateCcw size={16} />
                          </button>
                        </div>
                      )}

                      {(hasChildren || isDisruptionNode) && (
                        <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary ml-2">
                          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}><ChevronDown size={20} /></motion.div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && hasChildren && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-8 pb-8 pt-4 border-t border-border/50 space-y-4 bg-surface-hover/30">
                          {node.children!.map((child) => {
                            const evtType = child.details?.type || 'activity';
                            const EvtIcon = EVENT_ICONS[evtType] || MapPin;
                            const isGap = child.details?.isBreathingRoom;

                            return (
                              <div key={child.id} className={`flex gap-5 p-5 rounded-2xl transition-all border ${child.details?.userAdded ? 'bg-brand-primary/5 border-brand-primary/30 shadow-md' : isGap ? 'bg-surface border-dashed border-border' : 'bg-white border-border hover:shadow-md'}`}>
                                <div className={`w-12 h-12 rounded-2xl flex shrink-0 items-center justify-center border ${child.details?.userAdded ? 'bg-brand-primary text-white' : 'bg-surface-hover text-brand-primary border-border'}`}>
                                  <EvtIcon size={20} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start gap-4 mb-1">
                                    <h4 className="font-bold text-lg text-text flex items-center gap-3">
                                      {child.title}
                                      {child.details?.userAdded && <span className="px-2 py-1 rounded-md text-[10px] uppercase font-black tracking-widest bg-brand-primary text-white">Your Plan</span>}
                                    </h4>
                                    {child.time && <span className="text-sm font-bold bg-surface px-3 py-1 rounded-lg border border-border shadow-sm whitespace-nowrap">{child.time}</span>}
                                  </div>
                                  {child.subtitle && <p className="text-sm font-medium text-text-secondary">{child.subtitle}</p>}
                                  {child.details?.culturalNudge && (
                                    <div className="mt-4 p-3 rounded-xl bg-brand-secondary/10 border border-brand-secondary/30 flex gap-3 items-start">
                                      <Sparkles size={16} className="text-brand-secondary shrink-0 mt-0.5" />
                                      <span className="text-sm font-medium text-brand-secondary leading-relaxed">{child.details.culturalNudge}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Add Plan Form */}
                          {node.details?.dayId && (
                            addingToDayId === node.details.dayId ? (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-white border border-border shadow-xl space-y-5 mt-6">
                                <p className="text-sm font-bold text-text uppercase tracking-widest flex items-center gap-2"><Sparkles size={16} className="text-brand-primary" /> Add Your Plan</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <input value={newPlanTitle} onChange={e => setNewPlanTitle(e.target.value)} placeholder="What are you planning?" className="sm:col-span-2 px-4 py-3 bg-surface-hover border border-border rounded-xl font-medium outline-none focus:border-brand-primary transition-colors" />
                                  <input type="time" value={newPlanTime} onChange={e => setNewPlanTime(e.target.value)} className="px-4 py-3 bg-surface-hover border border-border rounded-xl font-medium outline-none focus:border-brand-primary transition-colors" />
                                  <select value={newPlanDuration} onChange={e => setNewPlanDuration(Number(e.target.value))} className="px-4 py-3 bg-surface-hover border border-border rounded-xl font-medium outline-none focus:border-brand-primary transition-colors cursor-pointer">
                                    <option value={30}>30 min</option>
                                    <option value={60}>1 hour</option>
                                    <option value={90}>1.5 hours</option>
                                    <option value={120}>2 hours</option>
                                    <option value={180}>3 hours</option>
                                  </select>
                                  <select value={newPlanType} onChange={e => setNewPlanType(e.target.value)} className="px-4 py-3 bg-surface-hover border border-border rounded-xl font-medium outline-none focus:border-brand-primary transition-colors cursor-pointer">
                                    <option value="activity">Activity</option>
                                    <option value="food">Food / Dining</option>
                                    <option value="sightseeing">Sightseeing</option>
                                    <option value="shopping">Shopping</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="transport">Transport</option>
                                  </select>
                                  <input value={newPlanLocation} onChange={e => setNewPlanLocation(e.target.value)} placeholder="Location (optional)" className="px-4 py-3 bg-surface-hover border border-border rounded-xl font-medium outline-none focus:border-brand-primary transition-colors" />
                                </div>
                                <div className="flex gap-3 pt-2">
                                  <Button className="flex-1 rounded-xl" onClick={async () => {
                                    if (!newPlanTitle.trim()) return;
                                    await addCustomEvent(node.details.dayId, { time: newPlanTime, duration_minutes: newPlanDuration, type: newPlanType, title: newPlanTitle.trim(), description: `Custom plan added by you`, location: newPlanLocation || currentTrip?.destination || '', isGapSuggestion: false, isBreathingRoom: false });
                                    setNewPlanTitle(''); setNewPlanLocation(''); setAddingToDayId(null);
                                  }}>
                                    <Plus size={18} className="mr-2" /> Add to Itinerary
                                  </Button>
                                  <Button variant="secondary" className="rounded-xl" onClick={() => setAddingToDayId(null)}>Cancel</Button>
                                </div>
                              </motion.div>
                            ) : (
                              <button onClick={() => setAddingToDayId(node.details.dayId)} className="w-full mt-6 py-4 rounded-2xl border-2 border-dashed border-border font-bold text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all flex items-center justify-center gap-2">
                                <Plus size={18} /> Add Your Plan
                              </button>
                            )
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Disruption Shield Action Panel */}
                  <AnimatePresence>
                    {isExpanded && isDisruptionNode && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="border-t border-error/20 p-8 bg-error/5">
                          {!disruptionResult ? (
                            <div className="text-center py-6">
                              <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                                <Shield size={40} className="text-error" />
                              </div>
                              <h3 className="font-display font-bold text-2xl text-text mb-2">AI Shield Active</h3>
                              <p className="text-text-secondary font-medium mb-8">AI monitors your trip 24/7. Want to see it in action?</p>
                              
                              <Button
                                disabled={disrupting || (!currentTrip?.flights?.[0] && !cart.find(c => c.type === 'flight'))}
                                onClick={handleSimulateDisruption}
                                className="px-8 py-4 rounded-full text-lg shadow-xl shadow-error/30 bg-error hover:bg-error-hover disabled:bg-surface-hover disabled:text-text-muted"
                              >
                                {disrupting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Zap size={20} className="mr-2" /></motion.div> : <Zap size={20} className="mr-2" />}
                                {disrupting ? 'Triggering Agents...' : 'Simulate Flight Cancellation'}
                              </Button>
                              
                              {disrupting && (
                                <div className="mt-10 max-w-sm mx-auto space-y-4 text-left">
                                  {['Coordinator Intercepted', 'Search Agent Executing', 'Booking Agent Isolating', 'Clawbot Securing Payment', 'Finalizing Recovery'].map((label, i) => (
                                    <div key={i} className={`flex items-center gap-4 font-bold transition-opacity duration-300 ${i <= disruptionStep ? 'opacity-100' : 'opacity-30'}`}>
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${i < disruptionStep ? 'bg-success/20 border-success text-success' : 'bg-surface border-border text-text-muted'}`}>
                                        {i < disruptionStep ? <Check size={12} strokeWidth={4} /> : <div className="w-2 h-2 rounded-full bg-border" />}
                                      </div>
                                      <span className={i < disruptionStep ? 'text-success' : i === disruptionStep ? 'text-error animate-pulse' : 'text-text-muted'}>{label}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                              <div className="flex items-center gap-4 bg-success/10 border border-success/30 p-5 rounded-2xl shadow-sm">
                                <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center shadow-lg shadow-success/30">
                                  <Check size={24} className="text-white" />
                                </div>
                                <div>
                                  <h4 className="font-display font-bold text-xl text-success">Crisis Averted</h4>
                                  <p className="font-medium text-success/80">AI agents found and secured alternatives instantly.</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {disruptionResult.alternativeFlights?.slice(0, 2).map((f: any, i: number) => (
                                  <div key={i} className="bg-white p-5 rounded-2xl border border-border shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                      <span className="font-bold text-brand-primary">{f.airline}</span>
                                      <span className="font-black text-lg text-text">${f.price}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-text-secondary">
                                      <span>{new Date(f.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      <ArrowRight size={14} className="text-text-muted" />
                                      <span>{new Date(f.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-end gap-3 mt-4">
                                <Button variant="secondary" className="rounded-xl">Review Changes</Button>
                                <Button className="rounded-xl bg-success hover:bg-success-hover shadow-lg shadow-success/30 border-none text-white">Approve Recovery</Button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
