import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plane, ArrowRight, ChevronDown, Map, Sparkles, Clock, Wallet, Shield, Star } from 'lucide-react';
import TravelIcon from '../components/TravelIcon';
import CloverGrid from '../components/CloverGrid';

const BRAND_ORANGE = '#EF5C00'; 
const WARM_CREAM = '#FAF3E0';  

const FEATURES = [
  { icon: Sparkles, title: "AI-Powered Itineraries", description: "Our Claude 3.5 Sonnet engine crafts perfect day-by-day plans in seconds.", span: "md:col-span-2 md:row-span-2", isLarge: true },
  { icon: Wallet, title: "Smart Budgeting", description: "Track expenses, scan receipts with OCR, and stay on budget effortlessly.", span: "md:col-span-1 md:row-span-1", isLarge: false },
  { icon: Shield, title: "Disruption Shield", description: "Flight cancelled? Our AI instantly finds and books the best alternatives.", span: "md:col-span-1 md:row-span-1", isLarge: false },
  { icon: Clock, title: "Time Saver", description: "Save an average of 15 hours of planning time per trip.", span: "md:col-span-1 md:row-span-1", isLarge: false },
  { icon: Map, title: "Interactive Maps", description: "Visualize your journey with rich, interactive maps and routing.", span: "md:col-span-2 md:row-span-1", isLarge: false },
];

export default function LandingPro() {
  const [phase, setPhase] = useState<'initial' | 'moving' | 'collided' | 'merged'>('initial');
  const navigate = useNavigate();

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('moving'), 800),
      setTimeout(() => setPhase('collided'), 2200),
      setTimeout(() => setPhase('merged'), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-bg">
      {/* HERO SECTION */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-mesh">
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
          <motion.div
            style={{ position: 'absolute', width: '80px', height: '80px', color: BRAND_ORANGE, top: '40%', left: '50%' }}
            animate={{
              x: [-900, -300, 300, -300, 900],
              y: [100, -250, 150, -350, 100],
              rotate: [15, -45, 60, -30, 15],
              scale: [0.6, 1.4, 0.7, 1.8, 0.6],
              opacity: [0, 1, 1, 1, 0]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plane size={52} fill="currentColor" strokeWidth={1} />
          </motion.div>
        </div>

        <div className="relative z-10 flex h-screen w-full flex-row items-center justify-center gap-[4vw] px-[5%]">
          
          <div className="flex flex-[1.4] flex-col justify-center">
            <div className="relative mb-4 flex h-auto items-center">
              <AnimatePresence mode="wait">
                {phase !== 'merged' ? (
                  <motion.div 
                    key="split"
                    className="flex items-center"
                    style={{ gap: phase === 'collided' ? '0' : '5rem' }}
                  >
                    <motion.h1
                      initial={{ x: -1400, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 70 }}
                      style={{ fontSize: 'min(11vw, 10rem)', fontWeight: 900, color: BRAND_ORANGE, margin: 0 }}
                    >
                      roam
                    </motion.h1>
                    <motion.h1
                      initial={{ x: 1400, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 70 }}
                      style={{ fontSize: 'min(11vw, 10rem)', fontWeight: 900, color: BRAND_ORANGE, margin: 0 }}
                    >
                      homie
                    </motion.h1>

                    {phase === 'collided' && (
                      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [1, 6], opacity: [1, 0] }}
                          transition={{ duration: 0.5 }}
                          style={{ width: 80, height: 80, background: BRAND_ORANGE, borderRadius: '50%', filter: 'blur(20px)' }}
                        />
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="merged"
                    initial={{ scale: 0.8, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                    className="flex items-end whitespace-nowrap"
                  >
                    <h1 style={{ 
                      fontSize: 'min(15vw, 13rem)', 
                      fontWeight: 900, 
                      color: BRAND_ORANGE, 
                      margin: 0, 
                      display: 'flex', 
                      alignItems: 'baseline',
                      lineHeight: 1
                    }}>
                      roam
                      <span className="relative inline-flex flex-col items-center">
                        <motion.div
                          initial={{ y: -60, opacity: 0, scale: 0.4 }}
                          animate={{ y: 0, opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3, type: 'spring' }}
                          className="absolute"
                          style={{ top: 'max(-5.5vw, -60px)' }}
                        >
                          <TravelIcon size={110} />
                        </motion.div>
                        <span>ı</span>
                      </span>
                      e
                    </h1>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={phase === 'merged' ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 }}
              style={{ 
                fontSize: 'min(4.3vw, 3.6rem)', 
                margin: '0',
                textAlign: 'left',
                lineHeight: 1.1,
                fontWeight: 800
              }}
              className="text-text"
            >
              Because planning shouldn't be the hardest part.
            </motion.h2>

            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={phase === 'merged' ? { scale: 1, opacity: 1 } : {}}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/onboarding')}
              style={{
                marginTop: '4rem',
                backgroundColor: BRAND_ORANGE,
                color: WARM_CREAM,
                boxShadow: '0 15px 35px rgba(239, 92, 0, 0.25)'
              }}
              className="flex w-fit items-center gap-4 rounded-full border-none px-10 py-5 text-2xl font-bold cursor-pointer transition-colors hover:bg-orange-600"
            >
              Start Exploring <ArrowRight size={26} />
            </motion.button>
          </div>

          <div className="flex flex-1 justify-center">
            <CloverGrid />
          </div>

        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-text-muted"
        >
          <ChevronDown className="h-8 w-8 text-brand-primary" />
        </motion.div>
      </section>

      {/* FEATURES SECTION (Bento Grid) */}
      <section className="mx-auto w-full max-w-[1400px] px-6 py-32">
        <div className="mb-20">
          <h2 className="text-5xl font-extrabold tracking-tight md:text-7xl mb-6 text-brand-primary">
            Supercharge <br/><span className="text-text">your journey.</span>
          </h2>
          <p className="text-2xl font-medium text-text-secondary max-w-2xl">
            We've completely reimagined travel planning. Say goodbye to spreadsheets and endless tabs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                className={`relative group overflow-hidden rounded-[2.5rem] bg-surface p-10 border-2 border-border/50 hover:border-brand-primary/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${feature.span}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className={`inline-flex rounded-3xl bg-brand-primary/10 text-brand-primary items-center justify-center ${feature.isLarge ? 'w-20 h-20' : 'w-16 h-16'}`}>
                    <Icon className={feature.isLarge ? 'h-10 w-10' : 'h-8 w-8'} />
                  </div>
                  <div>
                    <h3 className={`font-bold mb-4 ${feature.isLarge ? 'text-4xl' : 'text-2xl'}`}>{feature.title}</h3>
                    <p className={`text-text-secondary font-medium leading-relaxed ${feature.isLarge ? 'text-xl max-w-md' : 'text-lg'}`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
                {/* Decorative blob */}
                {feature.isLarge && (
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl group-hover:bg-brand-primary/20 transition-all duration-700" />
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS (Timeline) */}
      <section className="bg-surface-hover py-32 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-brand-primary/5 blur-[100px]" />
          <div className="absolute top-[60%] -right-[10%] w-[30%] h-[30%] rounded-full bg-brand-primary/5 blur-[80px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-extrabold md:text-7xl mb-6">How it works</h2>
            <p className="text-2xl text-text-secondary font-medium">Three simple steps to your perfect trip.</p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1.5 bg-brand-primary/20 rounded-full -translate-x-1/2 hidden md:block" />
            
            {[
              { num: "01", title: "Tell us your dreams", desc: "Chat with our AI. Share your destination, budget, and travel style. We understand natural language." },
              { num: "02", title: "AI crafts your plan", desc: "Within seconds, receive a highly optimized, day-by-day itinerary tailored perfectly to your preferences." },
              { num: "03", title: "Enjoy the journey", desc: "Manage everything from packing lists to disruptions in one place. Your ultimate travel companion." },
            ].map((step, i) => (
              <div key={i} className="relative flex flex-col md:flex-row w-full items-center justify-between mb-24 last:mb-0">
                
                {/* Content Left (or top on mobile) */}
                <motion.div 
                  initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
                  className={`w-full md:w-5/12 mb-8 md:mb-0 ${i % 2 === 0 ? 'md:text-right' : 'md:order-last md:text-left'}`}
                >
                  <h3 className="text-3xl font-bold mb-4">{step.title}</h3>
                  <p className="text-xl text-text-secondary font-medium leading-relaxed">{step.desc}</p>
                </motion.div>

                {/* Number Circle Center */}
                <motion.div 
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  className="w-24 h-24 rounded-full bg-brand-primary text-white flex items-center justify-center font-display text-4xl font-black shadow-[0_0_40px_rgba(239,92,0,0.4)] z-10 hidden md:flex"
                >
                  {step.num}
                </motion.div>

                {/* Mobile Number Indicator */}
                <div className="text-6xl font-black text-brand-primary/20 mb-4 md:hidden">
                  {step.num}
                </div>

                {/* Empty Spacer Right */}
                <div className="w-full md:w-5/12 hidden md:block" />
                
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative py-32 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-[1200px] rounded-[3rem] bg-brand-primary overflow-hidden relative shadow-2xl"
        >
          {/* Internal gradient/mesh */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

          <div className="relative z-10 px-6 py-24 md:py-32 text-center flex flex-col items-center">
            <motion.h2 
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="mb-8 text-5xl font-black md:text-7xl text-white max-w-4xl leading-tight"
            >
              Ready to travel like a <span className="text-[#FFD166]">pro?</span>
            </motion.h2>
            <p className="mb-12 text-2xl font-medium text-white/90 max-w-2xl">
              Join thousands of travelers who have upgraded their journey.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/onboarding')}
              className="bg-[#FAF3E0] text-brand-primary px-12 py-6 rounded-full text-2xl font-bold flex items-center gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-shadow"
            >
              Start Planning Free <ArrowRight size={28} />
            </motion.button>
          </div>
        </motion.div>
      </section>
      
      {/* FOOTER */}
      <footer className="border-t-2 border-border/50 bg-bg py-16 text-center text-text-muted">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-brand-primary/10 p-3 rounded-full text-brand-primary">
            <Plane size={24} />
          </div>
          <span className="font-display font-black text-2xl text-text tracking-tight">roamie</span>
        </div>
        <p className="font-medium text-lg">© 2026 Roamie. All rights reserved.</p>
      </footer>
    </div>
  );
}
