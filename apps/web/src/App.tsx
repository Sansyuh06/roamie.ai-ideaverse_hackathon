import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './stores/useStore';
import { TopNav } from './components/layout/TopNav';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/ui/Toast';

import Dashboard from './pages/Dashboard';
import DisruptionShield from './pages/DisruptionShield';
import LandingPro from './pages/LandingPro';
import OnboardingChat from './pages/OnboardingChat';
import TranslatorPage from './pages/TranslatorPage';
import Itinerary from './pages/Itinerary';
import BudgetTracker from './pages/BudgetTracker';
import PackingList from './pages/PackingList';
import VisaChecker from './pages/VisaChecker';
import VoiceTranslateWidget from './components/VoiceTranslateWidget';

export default function App() {
  const { fetchMe } = useStore();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isFullscreen = location.pathname === '/' || location.pathname === '/onboarding';

  useEffect(() => {
    fetchMe().finally(() => setReady(true));
  }, [fetchMe]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-mesh">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <span className="text-4xl">✈️</span>
          </motion.div>
          <p className="font-medium text-text-secondary">Preparing your journey…</p>
        </div>
      </div>
    );
  }

  if (isFullscreen) {
    return (
      <>
        <ToastContainer />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<LandingPro />} />
            <Route path="/onboarding" element={<OnboardingChat />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-bg">
      <ToastContainer />
      <TopNav onMenuClick={() => setSidebarOpen(true)} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 overflow-y-auto w-full">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {[
                { path: '/dashboard', El: Dashboard },
                { path: '/itinerary', El: Itinerary },
                { path: '/budget', El: BudgetTracker },
                { path: '/disruption', El: DisruptionShield },
                { path: '/packing', El: PackingList },
                { path: '/translate', El: TranslatorPage },
                { path: '/visa', El: VisaChecker },
              ].map(({ path, El }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="min-h-full"
                    >
                      <El />
                    </motion.div>
                  }
                />
              ))}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

      <VoiceTranslateWidget />
    </div>
  );
}

