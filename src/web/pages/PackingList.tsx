import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';

const MOCK_CATEGORIES = [
  {
    id: 'clothing', title: 'Clothing',
    items: [
      { id: 'c1', name: 'T-shirts', qty: 5, essential: true },
      { id: 'c2', name: 'Jeans/Pants', qty: 2, essential: true },
      { id: 'c3', name: 'Light Jacket', qty: 1, essential: false },
      { id: 'c4', name: 'Walking Shoes', qty: 1, essential: true },
    ]
  },
  {
    id: 'toiletries', title: 'Toiletries',
    items: [
      { id: 't1', name: 'Toothbrush & Paste', qty: 1, essential: true },
      { id: 't2', name: 'Shampoo/Conditioner', qty: 2, essential: false },
      { id: 't3', name: 'Sunscreen', qty: 1, essential: true },
    ]
  },
  {
    id: 'electronics', title: 'Electronics',
    items: [
      { id: 'e1', name: 'Phone Charger', qty: 1, essential: true },
      { id: 'e2', name: 'Universal Adapter', qty: 1, essential: true },
      { id: 'e3', name: 'Power Bank', qty: 1, essential: false },
    ]
  }
];

export default function PackingList() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [packedItems, setPackedItems] = useState<Set<string>>(new Set());
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['clothing', 'toiletries', 'electronics']));

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
    }, 2000);
  };

  const toggleItem = (id: string) => {
    const next = new Set(packedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPackedItems(next);
  };

  const toggleCat = (id: string) => {
    const next = new Set(expandedCats);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCats(next);
  };

  const totalItems = MOCK_CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
  const packedCount = packedItems.size;

  if (!hasGenerated) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <Package className="h-12 w-12" />
          </div>
        </motion.div>
        <h1 className="mb-4 text-4xl font-extrabold md:text-5xl">Smart Packing List</h1>
        <p className="mb-10 max-w-lg text-text-secondary">
          Let AI analyze your destination, duration, and activities to generate the perfect packing list.
        </p>
        <Button size="lg" onClick={handleGenerate} isLoading={isGenerating} className="px-10 py-6 text-lg">
          <Sparkles className="mr-2 h-5 w-5" />
          Generate Packing List ✨
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-4 flex items-center gap-3 text-3xl font-extrabold md:text-4xl">
          <Package className="h-8 w-8 text-brand-primary" /> Packing List
        </h1>
        <Card className="p-6">
          <div className="mb-2 flex items-center justify-between font-bold">
            <span className="text-text-secondary">Progress</span>
            <span className="text-brand-primary">{packedCount}/{totalItems} packed</span>
          </div>
          <ProgressBar value={packedCount} max={totalItems} className="h-3" />
        </Card>
      </div>

      <div className="space-y-6">
        {MOCK_CATEGORIES.map((cat, i) => {
          const isExpanded = expandedCats.has(cat.id);
          const catPacked = cat.items.filter(item => packedItems.has(item.id)).length;
          
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
            >
              <Card className="overflow-hidden">
                <button
                  onClick={() => toggleCat(cat.id)}
                  className="flex w-full items-center justify-between bg-surface-hover px-6 py-4 hover:bg-border/50"
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">{cat.title}</h2>
                    <Badge variant="brand">{catPacked}/{cat.items.length}</Badge>
                  </div>
                  {isExpanded ? <ChevronUp className="text-text-muted" /> : <ChevronDown className="text-text-muted" />}
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="divide-y divide-border px-6 py-2">
                        {cat.items.map((item) => {
                          const isPacked = packedItems.has(item.id);
                          return (
                            <div key={item.id} className="flex cursor-pointer items-center gap-4 py-4 hover:bg-surface-hover" onClick={() => toggleItem(item.id)}>
                              <div
                                className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors ${
                                  isPacked ? 'border-brand-primary bg-brand-primary text-white' : 'border-border text-transparent'
                                }`}
                              >
                                <Check className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <span className={`font-medium transition-all ${isPacked ? 'text-text-muted line-through' : 'text-text'}`}>
                                  {item.name}
                                </span>
                              </div>
                              <span className="font-mono text-sm text-text-secondary">x{item.qty}</span>
                              {item.essential && !isPacked && (
                                <Badge variant="warning">Essential</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
