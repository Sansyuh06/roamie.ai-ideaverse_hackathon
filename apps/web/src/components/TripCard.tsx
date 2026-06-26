import { motion } from 'framer-motion';
import { Calendar, Download, ShoppingCart, MapPin, Sparkles } from 'lucide-react';

interface TripCardProps {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
  priceEstimate?: number;
  currency?: string;
  isActive?: boolean;
  onSelect?: () => void;
  onDownload?: () => void;
  onBook?: () => void;
}

// Generate a gradient based on destination name for visual variety
function getDestinationGradient(dest: string): string {
  const gradients = [
    'from-violet-500/80 via-purple-500/60 to-indigo-600/80',
    'from-rose-400/80 via-pink-500/60 to-fuchsia-600/80',
    'from-amber-400/80 via-orange-500/60 to-red-500/80',
    'from-emerald-400/80 via-teal-500/60 to-cyan-600/80',
    'from-blue-400/80 via-indigo-500/60 to-violet-600/80',
    'from-sky-400/80 via-blue-500/60 to-indigo-500/80',
  ];
  const hash = dest.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

export default function TripCard({
  destination,
  startDate,
  endDate,
  status,
  priceEstimate,
  currency = 'INR',
  isActive = false,
  onSelect,
  onDownload,
  onBook,
}: TripCardProps) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const gradient = getDestinationGradient(destination);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onSelect}
      className={`rounded-2xl overflow-hidden bg-white cursor-pointer transition-shadow duration-200
        ${isActive
          ? 'border-l-4 border-l-[var(--color-brand-purple)] border-t border-r border-b border-[var(--color-border)] shadow-elevated'
          : 'border border-[var(--color-border)] hover:shadow-elevated'
        }
      `}
      style={{
        boxShadow: isActive
          ? undefined
          : '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Hero Image Banner */}
      <div className={`h-[180px] relative bg-gradient-to-br ${gradient}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display font-bold text-lg text-white leading-tight">
            {destination}
          </h3>
        </div>
        {/* Status badge */}
        {status === 'active' && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={10} /> Active
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 space-y-3">
        {/* Date range pill */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'var(--color-brand-amber-light)', color: '#92400E' }}>
            <Calendar size={12} />
            {formatDate(startDate)} – {formatDate(endDate)}
          </span>
        </div>

        {/* Price estimate */}
        {priceEstimate && (
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-xl" style={{ color: 'var(--color-text-primary)' }}>
              ~{currency === 'INR' ? '₹' : '$'}{priceEstimate.toLocaleString()}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Flights & Hotels incl.
            </span>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={(e) => { e.stopPropagation(); onDownload?.(); }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors"
            style={{
              borderColor: 'var(--color-brand-purple)',
              color: 'var(--color-brand-purple)',
            }}
          >
            <Download size={14} /> Download
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onBook?.(); }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
            style={{ background: 'var(--color-brand-purple)' }}
          >
            <ShoppingCart size={14} /> Book
          </button>
        </div>

        {/* Metadata chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ background: 'var(--color-brand-purple-light)', color: 'var(--color-brand-purple)' }}>
            <MapPin size={10} /> 1 city
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Skeleton version for loading states
export function TripCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
      <div className="h-[180px] skeleton" />
      <div className="p-5 space-y-3">
        <div className="h-6 w-24 skeleton rounded-full" />
        <div className="h-7 w-32 skeleton" />
        <div className="flex gap-2">
          <div className="flex-1 h-10 skeleton rounded-xl" />
          <div className="flex-1 h-10 skeleton rounded-xl" />
        </div>
      </div>
    </div>
  );
}
