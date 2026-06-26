import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    
    // Smooth transition-colors but let Framer handle the layout/transform animations
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap overflow-hidden relative";
    
    const variants = {
      primary: "bg-brand-primary text-white shadow-[0_8px_20px_rgba(239,92,0,0.3)] hover:shadow-[0_12px_25px_rgba(239,92,0,0.4)] border-none before:absolute before:inset-0 before:bg-white/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity",
      secondary: "bg-white/80 backdrop-blur-md text-text border border-white hover:bg-white hover:border-brand-primary/30 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]",
      ghost: "bg-transparent text-text-secondary hover:bg-black/5 hover:text-text shadow-none",
    };
    
    const sizes = {
      sm: "h-9 px-4 text-sm rounded-lg",
      md: "h-12 px-6 text-base rounded-xl",
      lg: "h-14 px-8 text-lg rounded-2xl",
    };

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        // The signature "squash and stretch" spring effect
        whileHover={!disabled && !isLoading ? { scale: 1.02, y: -2 } : undefined}
        whileTap={!disabled && !isLoading ? { scale: 0.94, y: 0 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 15, mass: 0.8 }}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
        {children as any}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
