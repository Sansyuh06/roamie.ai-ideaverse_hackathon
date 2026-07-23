import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Camera, Plus, Upload, Lightbulb, CheckCircle2, Coffee, Train, Home, Map, ShoppingBag, MoreHorizontal, Sparkles, AlertTriangle } from 'lucide-react';
import { useStore } from '../stores/useStore';
import api from '../lib/api';

const spring = { type: "spring" as const, stiffness: 260, damping: 20 };

const CATEGORIES = [
  { id: 'Food', icon: Coffee, color: '#f97316' },
  { id: 'Transport', icon: Train, color: '#3b82f6' },
  { id: 'Accommodation', icon: Home, color: '#10b981' },
  { id: 'Activity', icon: Map, color: '#f43f5e' },
  { id: 'Shopping', icon: ShoppingBag, color: '#8b5cf6' },
  { id: 'Other', icon: MoreHorizontal, color: '#64748b' },
];

export default function BudgetTracker() {
  const { currentTrip } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Scanner state
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Expense list
  const [expenses, setExpenses] = useState<any[]>([]);

  // Quick add
  const [quickAmount, setQuickAmount] = useState('');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickCategory, setQuickCategory] = useState('Food');
  const [adding, setAdding] = useState(false);

  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const budget = 3000; // Would come from trip data

  // Handle image selection (camera or file)
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanResult(null);
    setScanError(null);
    setScanning(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]; // Remove data:image/...;base64, prefix
      try {
        const response = await api.post('/receipt/scan', {
          imageBase64: base64,
          mimeType: file.type,
          tripId: currentTrip?.id || '',
        });
        setScanResult(response.data);
        // Add to local expenses list
        setExpenses(prev => [{
          id: response.data.id,
          amount: response.data.amount,
          currency: response.data.currency,
          merchant: response.data.merchant,
          category: response.data.category,
          description: response.data.description,
          date: response.data.date || new Date().toISOString().split('T')[0],
        }, ...prev]);
      } catch (err: any) {
        setScanError(err.response?.data?.message || 'Failed to scan receipt. Please try again.');
      }
      setScanning(false);
    };
    reader.readAsDataURL(file);
  };

  // Quick add expense
  const handleQuickAdd = async () => {
    if (!quickAmount) return;
    setAdding(true);
    try {
      await api.post('/expense', {
        amount: parseFloat(quickAmount),
        currency: 'USD',
        category: quickCategory,
        description: quickDesc || quickCategory,
        tripId: currentTrip?.id,
      });
      setExpenses(prev => [{
        id: Date.now().toString(),
        amount: parseFloat(quickAmount),
        currency: 'USD',
        merchant: quickDesc || quickCategory,
        category: quickCategory,
        description: quickDesc || quickCategory,
        date: new Date().toISOString().split('T')[0],
      }, ...prev]);
      setQuickAmount('');
      setQuickDesc('');
    } catch {}
    setAdding(false);
  };

  const categoryData = CATEGORIES.map(cat => ({
    name: cat.id,
    value: expenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
  })).filter(d => d.value > 0);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-text">Budget Tracker</h1>
        <p className="text-text-muted text-sm mt-1">Scan receipts with AI • Track every expense</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Scanner + Chart */}
        <div className="lg:col-span-2 space-y-6">

          {/* Receipt Scanner — THE MAIN FEATURE */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.05 }}
            className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-sm">
                <Camera size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-text">AI Receipt Scanner</h2>
                <p className="text-xs text-text-muted">Take a photo or upload — Bedrock Vision extracts everything</p>
              </div>
            </div>

            {/* Upload buttons */}
            <div className="flex gap-3 mb-5">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-br from-orange-50 to-rose-50 border-2 border-dashed border-brand/30 rounded-xl text-sm font-semibold text-brand hover:border-brand transition-colors">
                <Camera size={18} /> Take Photo
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-border-light border-2 border-dashed border-border rounded-xl text-sm font-semibold text-text-secondary hover:border-text-muted transition-colors">
                <Upload size={18} /> Upload Image
              </motion.button>

              {/* Hidden inputs */}
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </div>

            {/* Preview + Results */}
            <AnimatePresence mode="wait">
              {scanning && (
                <motion.div key="scanning" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-bg rounded-xl p-6 text-center border border-border">
                  {previewUrl && <img src={previewUrl} alt="Receipt" className="w-32 h-32 object-cover rounded-xl mx-auto mb-4 border border-border" />}
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-8 h-8 border-3 border-brand border-t-transparent rounded-full mb-3" />
                  <p className="text-sm font-medium text-text">Analyzing with AWS Bedrock Vision...</p>
                  <div className="mt-3 space-y-1 text-xs text-text-muted">
                    <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>→ Uploading to S3</motion.p>
                    <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}>→ Claude Sonnet 4.6 Vision OCR</motion.p>
                    <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}>→ Generating savings tips</motion.p>
                  </div>
                </motion.div>
              )}

              {scanResult && !scanning && (
                <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-4">
                  {/* Extracted data */}
                  <div className="bg-success/5 border border-success/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 size={16} className="text-success" />
                      <span className="text-sm font-bold text-success">Extraction Successful</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase">Merchant</p>
                        <p className="font-semibold text-text">{scanResult.merchant}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase">Amount</p>
                        <p className="font-bold text-text font-mono">{scanResult.currency} {scanResult.amount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase">Category</p>
                        <p className="font-semibold text-text">{scanResult.category}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase">Date</p>
                        <p className="font-semibold text-text">{scanResult.date || 'Today'}</p>
                      </div>
                    </div>
                    {scanResult.items && scanResult.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-success/10">
                        <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Line Items</p>
                        {scanResult.items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-text-secondary">{item.name}</span>
                            <span className="font-mono text-text">{scanResult.currency} {item.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI Savings Suggestion */}
                  {scanResult.suggestion && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Lightbulb size={16} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-amber-800 uppercase mb-1">💡 Savings Tip for Next Time</p>
                        <p className="text-sm text-amber-900 leading-relaxed">{scanResult.suggestion}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* S3 + Bedrock badge */}
                  <div className="flex items-center gap-2 text-[10px] text-text-muted">
                    <Sparkles size={10} /> Powered by AWS Bedrock Vision (Claude Sonnet 4.6) • Stored in S3
                  </div>
                </motion.div>
              )}

              {scanError && !scanning && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertTriangle size={16} className="text-red-500" />
                  <p className="text-sm text-red-700">{scanError}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Charts */}
          {expenses.length > 0 && categoryData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}
              className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Spending by Category</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                      {categoryData.map((entry, index) => {
                        const cat = CATEGORIES.find(c => c.id === entry.name);
                        return <Cell key={index} fill={cat?.color || '#64748b'} />;
                      })}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT: Quick Add + Expense List */}
        <div className="space-y-6">
          {/* Quick Add */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}
            className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-display font-bold text-text mb-4">Quick Add</h3>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <button key={cat.id} onClick={() => setQuickCategory(cat.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      quickCategory === cat.id ? 'bg-text text-surface' : 'bg-border-light text-text-secondary hover:bg-border'
                    }`}>
                    <Icon size={12} /> {cat.id}
                  </button>
                );
              })}
            </div>
            <input type="number" placeholder="Amount" value={quickAmount} onChange={e => setQuickAmount(e.target.value)}
              className="w-full px-4 py-3 bg-bg border-2 border-border rounded-xl text-sm mb-3 focus:border-brand outline-none" />
            <input placeholder="Description (optional)" value={quickDesc} onChange={e => setQuickDesc(e.target.value)}
              className="w-full px-4 py-3 bg-bg border-2 border-border rounded-xl text-sm mb-4 focus:border-brand outline-none" />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleQuickAdd} disabled={!quickAmount || adding}
              className="w-full py-3 btn-gradient rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
              <Plus size={16} /> Add Expense
            </motion.button>
          </motion.div>

          {/* Expense List */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.15 }}
            className="bg-surface border border-border rounded-2xl p-5 shadow-sm max-h-[400px] overflow-y-auto">
            <h3 className="text-base font-display font-bold text-text mb-3">Recent Expenses</h3>
            {expenses.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">No expenses yet. Scan a receipt or add manually.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((exp, i) => {
                  const cat = CATEGORIES.find(c => c.id === exp.category);
                  const Icon = cat?.icon || MoreHorizontal;
                  return (
                    <motion.div key={exp.id || i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-border-light transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat?.color}15` }}>
                        <Icon size={14} style={{ color: cat?.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{exp.merchant || exp.description}</p>
                        <p className="text-[11px] text-text-muted">{exp.date}</p>
                      </div>
                      <span className="text-sm font-bold text-text font-mono">{exp.currency} {exp.amount}</span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
