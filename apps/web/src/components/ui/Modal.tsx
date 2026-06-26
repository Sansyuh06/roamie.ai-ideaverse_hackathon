import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from './Card';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Glassmorphic Backdrop */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-text/30"
            onClick={onClose}
          />
          
          {/* Organic Spring Scaling Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            // Fast acceleration out, with an overshoot and bounce/wobble effect
            transition={{ type: "spring", stiffness: 350, damping: 20, mass: 0.8 }}
            className={cn("relative w-full max-w-lg z-[101]", className)}
          >
            <Card variant="elevated" enableTilt={false} className="overflow-hidden shadow-2xl border-white/60 bg-white/95">
              {title && (
                <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-surface/50">
                  <h3 className="text-xl font-bold font-display">{title}</h3>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 text-text-muted transition-all hover:bg-black/5 hover:text-text hover:scale-110 active:scale-90"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              {!title && (
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 z-10 rounded-full bg-black/5 p-2 text-text-muted transition-all hover:bg-black/10 hover:text-text hover:scale-110 active:scale-90"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              <div className="p-6">
                {children}
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
