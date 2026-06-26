import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, Menu } from 'lucide-react';
import { useStore } from '../../stores/useStore';
import { Button } from '../ui/Button';

export const NAV_LINKS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/itinerary', label: 'Itinerary' },
  { path: '/budget', label: 'Budget' },
  { path: '/disruption', label: 'Disruption' },
  { path: '/packing', label: 'Packing' },
  { path: '/translate', label: 'Translate' },
];

export function TopNav({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-lg md:px-6">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">✈️</span>
          <span className="font-display text-lg font-bold">Roamie Pro</span>
        </div>
      </div>

      <nav className="hidden items-center gap-1 md:flex">
        {NAV_LINKS.map(link => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `relative px-3 py-2 text-sm font-medium transition-colors hover:text-brand-primary ${
                isActive ? 'text-brand-primary' : 'text-text-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="topnav-active"
                    className="absolute bottom-0 left-0 h-0.5 w-full bg-brand-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="hidden sm:flex px-2">
          <Settings className="h-5 w-5 text-text-secondary" />
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-brand text-xs font-bold text-white shadow-sm">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
