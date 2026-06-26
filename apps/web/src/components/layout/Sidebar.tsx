import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Map, Shield, Receipt, Package, Globe, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const SIDEBAR_LINKS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/itinerary', label: 'Itinerary', icon: Map },
  { path: '/budget', label: 'Budget', icon: Receipt },
  { path: '/disruption', label: 'Disruption', icon: Shield },
  { path: '/packing', label: 'Packing', icon: Package },
  { path: '/translate', label: 'Translate', icon: Globe },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-text/20 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-16 z-40 w-64 border-r border-border bg-surface transition-transform duration-300 ease-out lg:translate-x-0 lg:bg-transparent lg:border-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col lg:hidden py-4">
          <div className="mb-4 flex items-center justify-between px-6">
            <h2 className="font-display text-lg font-bold">Menu</h2>
            <button onClick={onClose} className="rounded-lg p-2 text-text-muted hover:bg-surface-hover">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {SIDEBAR_LINKS.map(link => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "text-text-secondary hover:bg-surface-hover hover:text-text"
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
