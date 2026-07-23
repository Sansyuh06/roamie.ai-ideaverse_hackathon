import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  onClose: (id: string) => void;
}

export function Toast({ id, type, message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-success" />,
    error: <AlertCircle className="h-5 w-5 text-error" />,
    warning: <AlertCircle className="h-5 w-5 text-warning" />,
    info: <Info className="h-5 w-5 text-info" />,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-surface p-4 shadow-xl border border-border"
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1 text-sm font-medium text-text">{message}</div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 rounded-lg p-1 text-text-muted hover:bg-border-light hover:text-text transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// Global Toast Container (Simple implementation without external store)
let toastCount = 0;
type ToastItem = { id: string; type: ToastType; message: string };
let toasts: ToastItem[] = [];
let listeners: ((toasts: ToastItem[]) => void)[] = [];

export const toast = {
  success: (message: string) => addToast('success', message),
  error: (message: string) => addToast('error', message),
  warning: (message: string) => addToast('warning', message),
  info: (message: string) => addToast('info', message),
};

function addToast(type: ToastType, message: string) {
  const id = (++toastCount).toString();
  toasts = [...toasts, { id, type, message }];
  emit();
}

function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  emit();
}

function emit() {
  listeners.forEach(listener => listener(toasts));
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.push(setCurrentToasts);
    return () => {
      listeners = listeners.filter(l => l !== setCurrentToasts);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
      <AnimatePresence mode="popLayout">
        {currentToasts.map(t => (
          <Toast key={t.id} id={t.id} type={t.type} message={t.message} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
