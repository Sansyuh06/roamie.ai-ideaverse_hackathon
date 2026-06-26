import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  const sizes = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
    xl: "w-20 h-20 border-4",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className={cn(
          "rounded-full border-t-brand-primary border-r-brand-secondary border-b-brand-tertiary border-l-transparent",
          sizes[size]
        )}
      />
      {label && <p className="text-sm font-medium text-text-secondary animate-pulse">{label}</p>}
    </div>
  );
}
