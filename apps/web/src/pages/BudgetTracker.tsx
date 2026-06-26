import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Camera, Plus, Trash2, Coffee, Train, Home, Map, ShoppingBag, MoreHorizontal } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressBar';

const CATEGORIES = [
  { id: 'Food', icon: Coffee, color: '#f97316' },
  { id: 'Transport', icon: Train, color: '#3b82f6' },
  { id: 'Accommodation', icon: Home, color: '#10b981' },
  { id: 'Activity', icon: Map, color: '#f43f5e' },
  { id: 'Shopping', icon: ShoppingBag, color: '#8b5cf6' },
  { id: 'Other', icon: MoreHorizontal, color: '#64748b' },
];

const MOCK_DATA = [
  { name: 'Food', value: 450 },
  { name: 'Transport', value: 200 },
  { name: 'Accommodation', value: 800 },
  { name: 'Activity', value: 350 },
];

const CHART_DATA = [
  { day: 'Day 1', spent: 150, budget: 2000 },
  { day: 'Day 2', spent: 300, budget: 1850 },
  { day: 'Day 3', spent: 550, budget: 1550 },
  { day: 'Day 4', spent: 800, budget: 1300 },
  { day: 'Day 5', spent: 1200, budget: 1050 },
  { day: 'Day 6', spent: 1400, budget: 800 },
  { day: 'Day 7', spent: 1800, budget: 600 },
];

export default function BudgetTracker() {
  const [activeCategory, setActiveCategory] = useState('Food');
  const [isScanning, setIsScanning] = useState(false);
  const [receiptText, setReceiptText] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);

  const budget = { total: 3000, spent: 1800 };

  const handleScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        merchant: 'Sushi Zanmai',
        amount: 85.50,
        category: 'Food',
        date: 'Oct 16, 2026'
      });
    }, 2000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold md:text-4xl">Budget Tracker</h1>
        <select className="rounded-xl border-2 border-border bg-surface px-4 py-2 font-bold outline-none focus:border-brand-primary">
          <option>USD</option><option>EUR</option><option>JPY</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* LEFT COLUMN: OVERVIEW & CHARTS */}
        <div className="space-y-8 lg:col-span-2">
          <Card className="p-8">
            <h2 className="mb-2 text-2xl font-bold">Spent ${budget.spent} of ${budget.total} USD</h2>
            <ProgressBar value={budget.spent} max={budget.total} className="mb-8 mt-4 h-3" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-64">
                <h3 className="mb-4 text-sm font-bold uppercase text-text-muted">Category Breakdown</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={MOCK_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {MOCK_DATA.map((entry, index) => {
                        const cat = CATEGORIES.find(c => c.id === entry.name);
                        return <Cell key={`cell-${index}`} fill={cat?.color || '#000'} />;
                      })}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="h-64">
                <h3 className="mb-4 text-sm font-bold uppercase text-text-muted">Burn-down Chart</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={CHART_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a8a29e' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a8a29e' }} width={40} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    />
                    <Line type="monotone" dataKey="spent" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* RECEIPT SCANNER */}
          <Card className="p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-brand-primary/10 p-3 text-brand-primary">
                <Camera className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">AI Receipt Scanner</h2>
            </div>
            
            <div className="flex gap-4 mb-6">
              <Input 
                placeholder="Paste receipt text here and let AI extract the details..." 
                value={receiptText}
                onChange={(e) => setReceiptText(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleScan} isLoading={isScanning} className="shrink-0">
                Scan with AI ✨
              </Button>
            </div>

            <AnimatePresence>
              {scanResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-xl border border-success/20 bg-success/5 p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-success">Extraction Successful!</span>
                    <Button size="sm" variant="primary" className="bg-success hover:bg-success/90">Add to Expenses</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm font-medium sm:grid-cols-4">
                    <div>
                      <p className="text-text-muted">Merchant</p>
                      <p>{scanResult.merchant}</p>
                    </div>
                    <div>
                      <p className="text-text-muted">Amount</p>
                      <p className="font-mono">${scanResult.amount}</p>
                    </div>
                    <div>
                      <p className="text-text-muted">Category</p>
                      <p>{scanResult.category}</p>
                    </div>
                    <div>
                      <p className="text-text-muted">Date</p>
                      <p>{scanResult.date}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* RIGHT COLUMN: QUICK ADD & LIST */}
        <div className="space-y-8">
          {/* QUICK ADD */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-bold">Quick Add</h2>
            <div className="mb-6 flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      active ? 'bg-text text-surface' : 'bg-surface-hover text-text-secondary hover:bg-border'
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {cat.id}
                  </button>
                );
              })}
            </div>
            
            <div className="flex gap-3 mb-4">
              <Input type="number" placeholder="Amount" className="flex-1" />
            </div>
            <Input placeholder="Description (optional)" className="mb-4" />
            
            <Button className="w-full">
              <Plus className="mr-2 h-5 w-5" /> Add Entry
            </Button>
          </Card>

          {/* EXPENSE LIST */}
          <Card className="p-6 h-[500px] overflow-y-auto">
            <h2 className="mb-4 text-xl font-bold">Recent Expenses</h2>
            
            <div className="space-y-6">
              {[
                { date: 'Today', items: [
                  { id: 1, merchant: 'Uber', cat: 'Transport', amount: 24.50 },
                  { id: 2, merchant: 'Starbucks', cat: 'Food', amount: 8.75 },
                ]},
                { date: 'Yesterday', items: [
                  { id: 3, merchant: 'Museum Ticket', cat: 'Activity', amount: 35.00 },
                  { id: 4, merchant: 'Hotel Stay', cat: 'Accommodation', amount: 150.00 },
                ]}
              ].map((group, i) => (
                <div key={group.date}>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">{group.date}</h3>
                  <div className="space-y-2">
                    {group.items.map((item, j) => {
                      const CatIcon = CATEGORIES.find(c => c.id === item.cat)?.icon || MoreHorizontal;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (i * 0.1) + (j * 0.1) }}
                          className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-surface-hover"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-border">
                              <CatIcon className="h-5 w-5 text-text-secondary" />
                            </div>
                            <div>
                              <p className="font-bold">{item.merchant}</p>
                              <p className="text-xs text-text-secondary">{item.cat}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold">${item.amount.toFixed(2)}</span>
                            <button className="hidden text-error opacity-0 group-hover:block group-hover:opacity-100">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
