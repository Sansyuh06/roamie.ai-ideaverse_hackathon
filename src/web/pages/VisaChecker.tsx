import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCheck, Globe, CheckCircle2, XCircle, Clock, DollarSign, Calendar, ExternalLink, FileText } from 'lucide-react';
import api from '../lib/api';
import { useStore } from '../stores/useStore';

const spring = { type: "spring" as const, stiffness: 260, damping: 20 };

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Singapore',
  'United Arab Emirates', 'Germany', 'France', 'Japan', 'China', 'Brazil', 'Nigeria', 'South Africa',
];

export default function VisaChecker() {
  const { currentTrip } = useStore();
  const [passportCountry, setPassportCountry] = useState('India');
  const [destination, setDestination] = useState(currentTrip?.destination || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    if (!destination.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const { data } = await api.post('/visa/check', { passportCountry, destination });
      setResult(data);
    } catch (e: any) {
      setError('Could not retrieve visa info. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FileCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-text">Visa Checker</h1>
            <p className="text-text-muted text-sm">Know exactly what you need before you fly</p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.05 }}
        className="bg-surface border border-border rounded-2xl p-6 shadow-sm mb-6">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">Your Passport</label>
            <select value={passportCountry} onChange={e => setPassportCountry(e.target.value)}
              className="w-full px-4 py-3 bg-bg border-2 border-border rounded-xl text-sm focus:border-brand outline-none">
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">Destination</label>
            <input value={destination} onChange={e => setDestination(e.target.value)}
              placeholder="e.g., Japan, Thailand, Bali"
              onKeyDown={e => e.key === 'Enter' && check()}
              className="w-full px-4 py-3 bg-bg border-2 border-border rounded-xl text-sm focus:border-brand outline-none" />
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={check} disabled={loading || !destination.trim()}
          className="w-full py-3.5 btn-gradient rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
          {loading ? (
            <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Checking…</>
          ) : (
            <><Globe size={16} /> Check Visa Requirements</>
          )}
        </motion.button>
      </motion.div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Status banner */}
            <div className={`rounded-2xl p-5 flex items-center gap-4 ${result.visaRequired ? 'bg-amber-50 border border-amber-200' : 'bg-success/5 border border-success/20'}`}>
              {result.visaRequired ? <FileText size={28} className="text-amber-600 shrink-0" /> : <CheckCircle2 size={28} className="text-success shrink-0" />}
              <div>
                <p className="font-display font-bold text-lg text-text">
                  {result.visaRequired ? `Visa Required: ${result.visaType}` : 'Visa-Free Entry 🎉'}
                </p>
                <p className="text-sm text-text-secondary">
                  {passportCountry} passport → {destination}
                </p>
              </div>
            </div>

            {/* Quick facts grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <FactCard icon={result.visaOnArrival ? CheckCircle2 : XCircle} label="Visa on Arrival" value={result.visaOnArrival ? 'Yes' : 'No'} good={result.visaOnArrival} />
              <FactCard icon={result.eVisaAvailable ? CheckCircle2 : XCircle} label="eVisa" value={result.eVisaAvailable ? 'Available' : 'No'} good={result.eVisaAvailable} />
              <FactCard icon={Clock} label="Processing" value={result.processingTime} />
              <FactCard icon={DollarSign} label="Cost" value={result.cost} />
              <FactCard icon={Calendar} label="Max Stay" value={result.maxStay} />
            </div>

            {/* Required documents */}
            {result.requiredDocuments?.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-text mb-3">Required Documents</h3>
                <div className="space-y-2">
                  {result.requiredDocuments.map((doc: string, i: number) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-text-secondary">
                      <CheckCircle2 size={15} className="text-success shrink-0" /> {doc}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {result.notes && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-sm text-blue-800"><strong>Note:</strong> {result.notes}</p>
              </div>
            )}

            {/* Official link */}
            {result.officialLink && (
              <a href={result.officialLink.startsWith('http') ? result.officialLink : `https://${result.officialLink}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-surface border-2 border-border rounded-xl text-sm font-semibold text-text hover:border-brand transition-colors no-underline">
                <ExternalLink size={16} /> Official Visa Application Site
              </a>
            )}

            <p className="text-[11px] text-text-muted text-center">
              ℹ️ AI-generated guidance. Always verify with the official embassy before traveling.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FactCard({ icon: Icon, label, value, good }: { icon: any; label: string; value: string; good?: boolean }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <Icon size={16} className={good === true ? 'text-success' : good === false ? 'text-text-muted' : 'text-brand-primary'} />
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-2">{label}</p>
      <p className="text-sm font-bold text-text mt-0.5">{value}</p>
    </div>
  );
}
