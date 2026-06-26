import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Package, Check, Sparkles } from "lucide-react";
import api from "../lib/api";
import { useStore } from "../stores/useStore";

const spring = { type: "spring" as const, stiffness: 260, damping: 20 };

interface PackingItem { category: string; item: string; quantity: number; essential: boolean; packed?: boolean; }

export default function PackingListPro() {
  const { currentTrip, trips, fetchTrips, fetchTrip } = useStore();
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Auto-load trip if none selected
  useEffect(() => {
    if (!currentTrip) {
      fetchTrips().then(() => {
        const storeTrips = useStore.getState().trips;
        if (storeTrips.length > 0) fetchTrip(storeTrips[0].id);
      });
    }
  }, []);

  const generateList = async () => {
    if (!currentTrip) return;
    setLoading(true);
    try {
      const start = new Date(currentTrip.startDate);
      const end = new Date(currentTrip.endDate);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
      const res = await api.post("/packing/v2/generate", { destination: currentTrip.destination, tripType: "leisure", days, activities: ["sightseeing", "dining"] });
      setItems((res.data.items || []).map((item: any) => ({ ...item, packed: false })));
      setGenerated(true);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const togglePacked = (idx: number) => setItems(prev => prev.map((item, i) => i === idx ? { ...item, packed: !item.packed } : item));
  const packedCount = items.filter(i => i.packed).length;
  const categories = [...new Set(items.map(i => i.category))];

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-brand/20">
            <Package size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-text">Packing List</h1>
            <p className="text-text-muted text-sm">{currentTrip ? `For ${currentTrip.destination}` : "Select a trip first"}</p>
          </div>
        </div>
      </motion.div>

      {!generated && (
        <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
          onClick={generateList} disabled={loading || !currentTrip}
          className="w-full py-5 btn-gradient rounded-2xl text-base font-semibold disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-brand/20">
          {loading ? (
            <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> Generating…</>
          ) : (
            <><Sparkles size={18} /> Generate AI Packing List</>
          )}
        </motion.button>
      )}

      {generated && items.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Progress */}
          <div className="bg-surface border border-border rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex justify-between text-sm mb-3">
              <span className="font-semibold text-text">Packing progress</span>
              <span className="font-mono text-text-secondary tabular-nums">{packedCount}/{items.length}</span>
            </div>
            <div className="h-2.5 bg-border-light rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-success to-emerald-400"
                animate={{ width: `${items.length ? (packedCount / items.length) * 100 : 0}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }} />
            </div>
          </div>

          {/* Items by category */}
          {categories.map((cat, ci) => (
            <motion.div key={cat} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: ci * 0.08 }} className="mb-5">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2.5 px-1">{cat}</h3>
              <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border shadow-sm">
                {items.filter(item => item.category === cat).map((item) => {
                  const idx = items.indexOf(item);
                  return (
                    <motion.div key={idx} whileHover={{ backgroundColor: "rgba(249,115,22,0.02)" }}
                      onClick={() => togglePacked(idx)}
                      className={`flex items-center gap-3.5 px-5 py-3.5 cursor-pointer transition-colors select-none ${item.packed ? 'bg-success/5' : ''}`}>
                      <motion.div animate={item.packed ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.3 }}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${item.packed ? 'bg-success border-success' : 'border-border'}`}>
                        {item.packed && <Check size={12} className="text-white" strokeWidth={3} />}
                      </motion.div>
                      <span className={`flex-1 text-sm transition-all duration-200 ${item.packed ? 'line-through text-text-muted' : 'text-text'}`}>{item.item}</span>
                      <span className="text-xs text-text-muted font-mono">×{item.quantity}</span>
                      {item.essential && !item.packed && (
                        <span className="text-[10px] px-2 py-0.5 bg-brand-light text-brand rounded-md font-bold">Essential</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
