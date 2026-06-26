import { forwardRef, MouseEvent, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  variant?: 'elevated' | 'flat' | 'interactive';
  /**
   * If true, enables the 3D parallax tilt effect on hover.
   * Only applicable when variant="interactive".
   */
  enableTilt?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'elevated', enableTilt = true, onMouseMove, onMouseLeave, style, ...props }, ref) => {
    
    // Core glassmorphic + soft UI styles
    const baseStyles = "bg-white/80 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]";
    
    const variants = {
      elevated: "shadow-[0_10px_40px_rgb(0,0,0,0.08)]",
      flat: "shadow-none border-border",
      interactive: "shadow-[0_10px_40px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.12)] hover:border-white transition-shadow duration-500 cursor-pointer",
    };

    // 3D Parallax Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Add strong spring physics to the mouse movement so it feels smooth
    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
      if (!enableTilt || variant !== 'interactive') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const xPct = mouseX / width - 0.5;
      const yPct = mouseY / height - 0.5;
      x.set(xPct);
      y.set(yPct);
      if (onMouseMove) onMouseMove(e);
    };

    const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
      if (enableTilt && variant === 'interactive') {
        x.set(0);
        y.set(0);
      }
      if (onMouseLeave) onMouseLeave(e);
    };

    return (
      <motion.div
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={variant === 'interactive' && !enableTilt ? { y: -6, scale: 1.01 } : undefined}
        whileTap={variant === 'interactive' ? { scale: 0.96 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        style={{
          rotateX: enableTilt && variant === 'interactive' ? rotateX : 0,
          rotateY: enableTilt && variant === 'interactive' ? rotateY : 0,
          transformPerspective: 1000,
          ...style,
        }}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";
