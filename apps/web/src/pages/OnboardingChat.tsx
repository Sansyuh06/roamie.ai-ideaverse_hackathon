import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { ChevronRight, Palmtree, Mountain, Landmark, Utensils, Briefcase, Heart, Users, Compass, Plane, Search, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useStore } from '../stores/useStore';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BRAND_ORANGE = '#EF5C00'; 

const TRIP_TYPES = [
  { id: 'Relaxation', icon: Palmtree },
  { id: 'Adventure', icon: Mountain },
  { id: 'Cultural', icon: Landmark },
  { id: 'Foodie', icon: Utensils },
  { id: 'Business', icon: Briefcase },
  { id: 'Romantic', icon: Heart },
  { id: 'Family', icon: Users },
  { id: 'Backpacking', icon: Compass },
];

const EXPERIENCES = [
  'Museums', 'Hiking', 'Fine Dining', 'Nightlife', 
  'Shopping', 'Beaches', 'History', 'Nature', 
  'Photography', 'Wellness', 'Local Markets', 'Theme Parks',
  'Wine Tasting', 'Architecture', 'Live Music', 'Art Galleries'
];

const QUESTIONS = [
  { id: 'origin', title: 'Where are you leaving from?', subtitle: 'Your home city or departure airport', type: 'text_simple' },
  { id: 'destination', title: 'Where is your next adventure?', subtitle: 'Search or click on the map to drop a pin', type: 'map' },
  { id: 'type', title: 'What kind of trip is this?', subtitle: 'Select the main vibe for your journey', type: 'choice' },
  { id: 'dates', title: 'When are you traveling?', subtitle: 'Select your ideal dates', type: 'date' },
  { id: 'travellers', title: 'Who is going?', subtitle: 'Number of travelers', type: 'number' },
  { id: 'budget', title: 'What is your budget?', subtitle: 'Let us know your spending comfort zone', type: 'budget' },
  { id: 'experiences', title: 'Any specific experiences?', subtitle: 'Select as many as you like', type: 'multiselect' },
];

const GENERATING_STEPS = [
  "Finding real flights from your origin...",
  "Searching hotels near your destination...",
  "Building your day-by-day itinerary...",
  "Optimizing routes & activities...",
  "Finalizing your perfect trip plan..."
];

// Custom Map Event component to handle clicks
function LocationSelector({ setLocation, currentLoc }: { setLocation: (loc: [number, number]) => void, currentLoc: [number, number] | null }) {
  useMapEvents({
    click(e) {
      setLocation([e.latlng.lat, e.latlng.lng]);
    },
  });
  return currentLoc ? <Marker position={currentLoc} /> : null;
}

export default function OnboardingChat() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [mapLocation, setMapLocation] = useState<[number, number] | null>(null);

  const currentQ = QUESTIONS[step];

  const handleNext = () => {
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      generateItinerary();
    }
  };

  const generateItinerary = async () => {
    setIsGenerating(true);
    let stepTimer: ReturnType<typeof setTimeout>;
    
    const advanceGenStep = (currentGen: number) => {
      if (currentGen < GENERATING_STEPS.length - 1) {
        stepTimer = setTimeout(() => {
          setGenStep(currentGen + 1);
          advanceGenStep(currentGen + 1);
        }, 1200);
      }
    };
    advanceGenStep(0);

    // Actually create the trip via the store
    try {
      const store = useStore.getState();
      const tripData = {
        destination: answers.destination || answers['destination'] || 'My Trip',
        startDate: answers.startDate || answers.start || new Date().toISOString().split('T')[0],
        endDate: answers.endDate || answers.end || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      };
      const result = await store.createTrip(tripData);

      // Store budget + origin in localStorage for other pages
      const budgetAmount = parseFloat(answers.budgetAmount || answers.budget) || 2000;
      const currency = answers.currency || 'USD';
      const budgetData = {
        total: budgetAmount,
        currency,
        symbol: currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$',
        breakdown: {
          accommodation: Math.round(budgetAmount * 0.35),
          food: Math.round(budgetAmount * 0.20),
          activities: Math.round(budgetAmount * 0.20),
          transport: Math.round(budgetAmount * 0.15),
          misc: Math.round(budgetAmount * 0.10),
        },
        preferences: (answers.experiences || []).join(', '),
        origin: answers.origin || '',
      };
      localStorage.setItem(`rb-${result.tripId}`, JSON.stringify(budgetData));
      // Store origin separately for booking suggestions
      localStorage.setItem(`roamie-origin`, answers.origin || '');

      // Navigate after a short delay for the animation
      setTimeout(() => {
        try {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#EF5C00', '#f43f5e', '#f59e0b']
          });
        } catch {}
        navigate('/itinerary');
      }, Math.max(0, GENERATING_STEPS.length * 1200 - 2000));
    } catch (e) {
      console.error('Trip creation failed:', e);
      // Still navigate even if creation fails
      setTimeout(() => navigate('/dashboard'), 2000);
    }

    return () => clearTimeout(stepTimer);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg p-4 overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] pointer-events-none" style={{ background: 'rgba(239,92,0,0.1)' }} />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(245,158,11,0.08)' }} />

      {/* GENERATING OVERLAY */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center p-12 text-center max-w-lg w-full">
              {/* Custom Plane Animation */}
              <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-[3px] border-dashed border-brand-primary/30"
                />
                <motion.div 
                  animate={{ rotate: -360 }} 
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 rounded-full border-2 border-brand-primary/10"
                />
                <motion.div 
                  animate={{ y: [-10, 10, -10] }} 
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-brand-primary"
                >
                  <Plane size={48} fill="currentColor" />
                </motion.div>
              </div>

              <h2 className="mb-2 text-4xl font-black tracking-tight font-display text-text">Crafting your itinerary</h2>
              <p className="mb-10 text-lg font-medium text-text-secondary">Our AI is crunching millions of data points...</p>
              
              {/* Progress Bar */}
              <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden mb-6">
                <motion.div 
                  className="h-full bg-brand-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((genStep + 1) / GENERATING_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={genStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="font-bold text-brand-primary text-xl"
                >
                  {GENERATING_STEPS[genStep]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <div className="w-full max-w-3xl relative z-10 flex flex-col min-h-[600px]">
        {/* Header / Progress */}
        <div className="mb-8 flex flex-col items-center justify-center">
          <div className="flex gap-2 mb-6">
            {QUESTIONS.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-brand-primary' : 'bg-brand-primary/20'}`}
                style={{ width: i === step ? '40px' : '16px' }}
              />
            ))}
          </div>
          <span className="font-bold text-sm tracking-widest uppercase text-text-muted">
            Step {step + 1} of {QUESTIONS.length}
          </span>
        </div>

        {/* Card Container */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-surface rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border-2 border-border/50"
            >
              <div className="text-center mb-10">
                <h2 className="text-4xl font-black font-display mb-3 text-text">{currentQ.title}</h2>
                <p className="text-xl font-medium text-text-secondary">{currentQ.subtitle}</p>
              </div>
              
              <div className="mb-12">
                {/* 0. ORIGIN (simple text) */}
                {currentQ.type === 'text_simple' && (
                  <div className="space-y-6">
                    <div className="relative">
                      <Plane className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                      <Input
                        autoFocus
                        placeholder="e.g., Chennai, Mumbai, Singapore, London..."
                        value={answers[currentQ.id] || ''}
                        onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && answers[currentQ.id] && handleNext()}
                        className="pl-12 text-xl py-6 rounded-2xl bg-surface-hover border-transparent focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                  </div>
                )}

                {/* 1. MAP DESTINATION */}
                {currentQ.type === 'map' && (
                  <div className="space-y-6">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                      <Input
                        autoFocus
                        placeholder="Search for a city, country, or landmark..."
                        value={answers[currentQ.id] || ''}
                        onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                        className="pl-12 text-xl py-6 rounded-2xl bg-surface-hover border-transparent focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                    <div className="w-full h-[300px] rounded-3xl overflow-hidden border-2 border-border relative">
                      <MapContainer 
                        center={[48.8566, 2.3522]} // Default Paris
                        zoom={3} 
                        style={{ height: '100%', width: '100%', zIndex: 10 }}
                        zoomControl={false}
                      >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        <LocationSelector setLocation={setMapLocation} currentLoc={mapLocation} />
                      </MapContainer>
                      {!mapLocation && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg pointer-events-none flex items-center gap-2 text-sm font-bold text-text-secondary">
                          <MapPin size={16} className="text-brand-primary" /> Click on map to select
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 2. TRIP TYPE CHOICE */}
                {currentQ.type === 'choice' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {TRIP_TYPES.map((type, i) => {
                      const isSelected = answers[currentQ.id] === type.id;
                      const Icon = type.icon;
                      return (
                        <motion.button
                          key={type.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => {
                            setAnswers({ ...answers, [currentQ.id]: type.id });
                            setTimeout(handleNext, 400);
                          }}
                          className={`relative flex flex-col items-center justify-center p-6 rounded-3xl transition-all duration-300 border-2 ${
                            isSelected 
                              ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_20px_rgba(239,92,0,0.15)] scale-105' 
                              : 'bg-surface-hover border-transparent text-text-secondary hover:bg-surface-hover/80 hover:scale-105 hover:shadow-lg'
                          }`}
                        >
                          <Icon size={32} className={`mb-3 ${isSelected ? 'text-brand-primary' : 'text-text-muted'}`} />
                          <span className="font-bold text-sm">{type.id}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
                
                {/* 3. DATES */}
                {currentQ.type === 'date' && (
                  <div className="flex flex-col gap-6 sm:flex-row items-center justify-center px-4">
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wider">Start Date</label>
                      <Input type="date" className="w-full text-lg py-5 rounded-2xl bg-surface-hover border-transparent" onChange={(e) => setAnswers({...answers, start: e.target.value})} />
                    </div>
                    <div className="text-text-muted font-bold text-xl pt-6 hidden sm:block">→</div>
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wider">End Date</label>
                      <Input type="date" className="w-full text-lg py-5 rounded-2xl bg-surface-hover border-transparent" onChange={(e) => setAnswers({...answers, end: e.target.value})} />
                    </div>
                  </div>
                )}

                {/* 4. TRAVELLERS NUMBER */}
                {currentQ.type === 'number' && (
                  <div className="flex items-center justify-center gap-8 py-8">
                    <button
                      className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center text-3xl font-bold text-brand-primary hover:bg-brand-primary/10 transition-colors"
                      onClick={() => setAnswers({...answers, [currentQ.id]: Math.max(1, (answers[currentQ.id] || 2) - 1)})}
                    >-</button>
                    <div className="text-7xl font-black font-display w-24 text-center">
                      {answers[currentQ.id] || 2}
                    </div>
                    <button
                      className="w-16 h-16 rounded-full bg-brand-primary text-white flex items-center justify-center text-3xl font-bold hover:bg-orange-600 shadow-lg shadow-brand-primary/30 transition-all hover:scale-105"
                      onClick={() => setAnswers({...answers, [currentQ.id]: (answers[currentQ.id] || 2) + 1})}
                    >+</button>
                  </div>
                )}
                
                {/* 5. BUDGET */}
                {currentQ.type === 'budget' && (
                  <div className="flex max-w-md mx-auto gap-4 items-center bg-surface-hover p-2 rounded-3xl">
                    <select
                      className="h-16 px-6 rounded-2xl bg-white border-none font-bold text-lg outline-none cursor-pointer"
                      value={answers.currency || 'USD'}
                      onChange={(e) => setAnswers({...answers, currency: e.target.value})}
                    >
                      <option value="USD">$ USD</option>
                      <option value="EUR">€ EUR</option>
                      <option value="GBP">£ GBP</option>
                    </select>
                    <Input
                      type="number"
                      placeholder="e.g. 2000"
                      className="flex-1 text-3xl font-bold bg-transparent border-none focus:ring-0 px-4 placeholder:text-text-muted"
                      value={answers.budgetAmount || ''}
                      onChange={(e) => setAnswers({...answers, budgetAmount: e.target.value})}
                    />
                  </div>
                )}
                
                {/* 6. EXPERIENCES MULTISELECT */}
                {currentQ.type === 'multiselect' && (
                  <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-2xl mx-auto">
                    {EXPERIENCES.map((opt, i) => {
                      const isSelected = (answers[currentQ.id] || []).includes(opt);
                      return (
                        <motion.button
                          key={opt}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.03 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const curr = answers[currentQ.id] || [];
                            setAnswers({
                              ...answers,
                              [currentQ.id]: isSelected ? curr.filter((x: string) => x !== opt) : [...curr, opt]
                            });
                          }}
                          className={`rounded-full px-6 py-3 font-bold text-sm transition-all duration-300 border-2 ${
                            isSelected
                              ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/30'
                              : 'bg-surface-hover border-transparent text-text-secondary hover:border-brand-primary/30'
                          }`}
                        >
                          {opt}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="flex justify-between items-center pt-8 mt-4 border-t border-border/50">
                <button 
                  onClick={() => setStep(s => Math.max(0, s - 1))}
                  className={`font-bold text-text-muted hover:text-text transition-colors px-4 py-2 ${step === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                  Back
                </button>
                <Button 
                  size="lg" 
                  onClick={handleNext}
                  className="rounded-full px-8 py-6 text-xl font-bold shadow-xl shadow-brand-primary/20 hover:scale-105 transition-transform"
                >
                  {step === QUESTIONS.length - 1 ? 'Generate Itinerary ✨' : 'Continue'}
                  {step !== QUESTIONS.length - 1 && <ChevronRight className="ml-2 h-6 w-6" />}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
