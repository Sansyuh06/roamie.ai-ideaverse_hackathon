import { type LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: { value: number; label?: string };
  iconColor?: string;
  iconBg?: string;
}

/**
 * StatCard — PRD Section 4.5
 * Reusable metric display card with icon, value, label, optional delta badge.
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  iconColor = 'var(--color-brand-purple)',
  iconBg = 'var(--color-brand-purple-light)',
}: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Icon Container */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconBg, color: iconColor }}
      >
        <Icon size={24} strokeWidth={1.5} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="font-display font-bold text-[28px] leading-tight" style={{ color: 'var(--color-text-primary)' }}>
          {value}
        </div>
        <div
          className="text-xs font-medium uppercase tracking-wider mt-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {label}
        </div>

        {/* Delta badge */}
        {delta && (
          <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[11px] font-bold ${
            delta.value >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            {delta.value >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta.value >= 0 ? '+' : ''}{delta.value}%
            {delta.label && <span className="font-medium ml-0.5">{delta.label}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
