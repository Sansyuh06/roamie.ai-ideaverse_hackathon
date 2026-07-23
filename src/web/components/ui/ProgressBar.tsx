import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export function ProgressBar({ value, max = 100, className, indicatorClassName }: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-border", className)}>
      <motion.div
        className={cn("h-full w-full flex-1 bg-gradient-brand", indicatorClassName)}
        initial={{ x: "-100%" }}
        animate={{ x: `-${100 - percentage}%` }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
      />
    </div>
  );
}
