import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Clock, Link as LinkIcon, AlertTriangle, ArrowRight, ShieldAlert, Bell, MessageSquare } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import api from '../lib/api';

const SCENARIOS = [
  { id: 'cancelled', icon: Plane, label: 'Flight Cancelled', color: 'from-error/20 to-error/5 text-error', border: 'border-error/20' },
  { id: 'delayed', icon: Clock, label: 'Significant Delay', color: 'from-warning/20 to-warning/5 text-warning', border: 'border-warning/20' },
  { id: 'missed', icon: LinkIcon, label: 'Missed Connection', color: 'from-brand-primary/20 to-brand-primary/5 text-brand-primary', border: 'border-brand-primary/20' },
  { id: 'emergency', icon: AlertTriangle, label: 'Medical/Emergency', color: 'from-info/20 to-info/5 text-info', border: 'border-info/20' },
];

const GENERATING_STEPS = [
  "→ Searching same-airline alternatives",
  "→ Checking other airlines on route",
  "→ Finding connecting flights",
  "→ Ranking by value"
];

export default function DisruptionShield() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const handleScenario = async (id: string) => {
    setActiveScenario(id);
    setIsGenerating(true);
    setResults(null);
    setNotification(null);
    setAlertMessage(null);

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    try {
      const { data } = await api.post('/disruption/v2/simulate', {
        scenario: id,
        flight: { airline: "Garuda Indonesia", flightNumber: "GA714", origin: "SIN", destination: "DPS", date: "2026-07-01", departureTime: "08:30", price: 387 },
        remainingBudget: 1500,
      });

      setResults(data.alternatives || []);
      setNotification(data.notification || null);
      setAlertMessage(data.alertMessage || null);

      // Send browser push notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const best = data.alternatives?.[0];
        new Notification('⚠️ Flight Disruption Alert — Roamie', {
          body: best
            ? `${data.reason}. Best alternative: ${best.airline} ${best.flightNumber} at ${best.departure} — $${best.price}`
            : data.reason || 'Check app for details',
          icon: '/favicon.svg',
        });
      }
    } catch (e: any) {
      console.error('Disruption failed:', e);
      setResults([]);
    }
    setIsGenerating(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-2 flex items-center gap-3 text-3xl font-extrabold md:text-4xl">
          <ShieldAlert className="h-8 w-8 text-error" /> Disruption Shield
        </h1>
        <p className="text-text-secondary">What went wrong? Select an issue and our OpenClaw Agent will fix it.</p>
      </div>

      {!isGenerating && !results && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SCENARIOS.map((scenario) => {
            const Icon = scenario.icon;
            return (
              <motion.button
                key={scenario.id}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleScenario(scenario.id)}
                className={`group flex flex-col items-center justify-center gap-4 rounded-3xl border ${scenario.border} bg-gradient-to-b ${scenario.color} p-8 shadow-sm transition-shadow hover:shadow-xl`}
              >
                <Icon className="h-12 w-12" />
                <span className="font-bold">{scenario.label}</span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* GENERATING OVERLAY */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center rounded-3xl bg-surface p-12 text-center shadow-2xl border border-border"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mb-6 h-20 w-20 rounded-full border-4 border-brand-primary border-t-transparent" />
            <h2 className="mb-2 text-2xl font-bold">OpenClaw Agent Working</h2>
            <p className="mb-8 font-medium text-text-secondary">Simulating '{activeScenario}' • Searching alternatives</p>
            
            <div className="flex flex-col gap-3 text-left">
              {GENERATING_STEPS.map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                  className="font-mono text-sm font-medium text-text-secondary"
                >
                  {step}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULTS */}
      <AnimatePresence>
        {results && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Notification Banner */}
            {notification && (
              <Card className="flex items-center gap-4 border-brand-primary/30 bg-brand-primary/5 p-4">
                <Bell className="h-5 w-5 shrink-0 text-brand-primary" />
                <p className="text-sm font-medium text-brand-primary">{notification}</p>
              </Card>
            )}

            {/* Alert Message */}
            {alertMessage && (
              <Card className="p-4 border-warning/30 bg-warning/5">
                <pre className="text-sm font-medium text-text whitespace-pre-wrap font-sans">{alertMessage}</pre>
              </Card>
            )}

            {/* Flight alternatives */}
            <div className="space-y-4">
              {results.map((alt: any, i: number) => (
                <motion.div
                  key={alt.flightNumber || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <Card className={`relative overflow-hidden p-6 transition-shadow hover:shadow-2xl ${i === 0 ? 'border-l-8 border-l-brand-primary' : 'border-l-8 border-l-border'}`}>
                    {i === 0 && (
                      <div className="absolute right-6 top-6">
                        <Badge variant="brand" className="px-3 py-1 text-sm">✨ BEST MATCH</Badge>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      <div className="w-48 shrink-0">
                        <h3 className="font-bold text-text">{alt.airline}</h3>
                        <p className="text-sm font-medium text-text-secondary">{alt.flightNumber}</p>
                        <p className="text-xs text-text-muted mt-1">{alt.route}</p>
                      </div>
                      
                      <div className="flex flex-1 items-center gap-4">
                        <div>
                          <p className="text-lg font-bold text-text">{alt.departure?.split('T')[1]?.slice(0,5) || alt.departure}</p>
                          <p className="text-xs text-text-muted">Depart</p>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                          <div className="w-full h-px bg-border relative">
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-hover px-2 text-[10px] font-bold text-text-muted">
                              {alt.totalHours}h {alt.layover !== 'none' ? `• ${alt.layover}` : '• Direct'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-text">{alt.arrival?.split('T')[1]?.slice(0,5) || alt.arrival}</p>
                          <p className="text-xs text-text-muted">Arrive</p>
                        </div>
                      </div>

                      <div className="w-32 shrink-0 text-right">
                        <p className="text-2xl font-extrabold text-text">${alt.price}</p>
                        {alt.price > 387 && <p className="text-[11px] text-warning font-semibold">+${alt.price - 387} vs original</p>}
                        {alt.price < 387 && <p className="text-[11px] text-success font-semibold">Save ${387 - alt.price}</p>}
                      </div>
                      
                      <div className="shrink-0">
                        <Button variant={i === 0 ? 'primary' : 'secondary'} className="w-full"
                          onClick={() => window.open(`https://www.skyscanner.co.in/transport/flights/SIN/DPS/`, '_blank')}>
                          Book Now →
                        </Button>
                      </div>
                    </div>

                    {alt.reasoning && (
                      <p className="mt-4 text-xs text-text-muted bg-surface-hover rounded-xl px-4 py-2">{alt.reasoning}</p>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-8 text-center">
              <Button variant="ghost" onClick={() => setResults(null)}>
                Start Over
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Sparkles(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
}
