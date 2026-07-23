import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Volume2, RotateCcw, Sparkles } from 'lucide-react';
import TravelChatbotV2 from '../components/TravelChatbotV2';

const LANGUAGES = [
  { code: 'hi', name: 'Hindi' },
  { code: 'ja', name: 'Japanese' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
];

export default function TranslatorPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [targetLang, setTargetLang] = useState('hi');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setSourceText('');
      setTranslatedText('');
      
      // Simulate real-time streaming translation
      setTimeout(() => setSourceText("Hello, I need to find the train station."), 1000);
      setTimeout(() => setTranslatedText("नमस्ते, मुझे रेलवे स्टेशन खोजना है।"), 2500);
      setTimeout(() => setIsRecording(false), 3000);
    }
  };

  const clearLog = () => {
    setSourceText('');
    setTranslatedText('');
    setIsRecording(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col gap-8 min-h-screen">
      
      {/* Live Interpreter Card */}
      <div className="flex-1 max-h-[800px] flex flex-col shadow-2xl rounded-2xl overflow-hidden bg-surface border border-border">
        
        {/* Dark Header */}
        <div className="bg-[#1a232c] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#2a343d] flex items-center justify-center text-brand-primary">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display leading-none mb-1">Live Interpreter</h2>
              <p className="text-xs font-bold tracking-widest text-white/50 uppercase">Real-Time Streaming</p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-2 border-b-2 border-surface-hover bg-white">
          <div className="p-4 px-6 border-r-2 border-surface-hover">
            <span className="text-sm font-bold text-text-muted tracking-widest uppercase">Source (Auto)</span>
          </div>
          <div className="p-4 px-6 flex items-center justify-between">
            <span className="text-sm font-bold text-brand-primary tracking-widest uppercase">Translation</span>
            <select 
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-brand-primary/10 border-2 border-brand-primary/20 text-brand-primary font-bold rounded-xl px-4 py-1.5 outline-none cursor-pointer"
            >
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
        </div>

        {/* Translation Content Area */}
        <div className="flex-1 grid grid-cols-2 bg-white min-h-[300px]">
          {/* Source Area */}
          <div className="p-8 border-r-2 border-surface-hover flex flex-col justify-center items-center relative overflow-y-auto">
            {!sourceText && !isRecording ? (
              <div className="flex flex-col items-center justify-center text-text-muted/50 gap-4">
                <Mic className="w-12 h-12" strokeWidth={1.5} />
                <p className="text-lg font-medium">Tap the microphone to begin speaking.</p>
              </div>
            ) : (
              <div className="w-full h-full text-2xl font-medium text-text leading-relaxed">
                {sourceText}
                {isRecording && <span className="inline-block w-2 h-6 ml-2 bg-text animate-pulse align-middle" />}
              </div>
            )}
          </div>

          {/* Target Area */}
          <div className="p-8 flex flex-col justify-center relative overflow-y-auto bg-surface-hover/30">
            <div className="w-full h-full text-3xl font-bold text-brand-primary leading-relaxed">
              {translatedText}
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="border-t-2 border-surface-hover bg-white p-6 flex items-center justify-center relative">
          
          {/* Visualizer (Left) */}
          <div className="absolute left-[20%] lg:left-[35%] flex items-center gap-1.5 h-8">
            <AnimatePresence>
              {isRecording ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={`vis-${i}`}
                    animate={{ height: ['20%', '100%', '30%', '80%', '20%'] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1, ease: "easeInOut" }}
                    className="w-1.5 bg-brand-primary/40 rounded-full"
                  />
                ))
              ) : (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={`vis-idle-${i}`} className="w-1.5 h-3 bg-text-muted/20 rounded-full" />
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Center Mic Button */}
          <button 
            onClick={toggleRecording}
            className="w-24 h-24 rounded-full border-[3px] border-brand-primary bg-brand-primary/10 flex items-center justify-center text-brand-primary hover:bg-brand-primary/20 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-primary/20"
          >
            <Mic className="w-10 h-10" />
          </button>

          {/* Actions (Right) */}
          <div className="absolute right-[20%] lg:right-[35%] flex items-center gap-4">
            <button className="w-12 h-12 rounded-full border-2 border-brand-primary/20 text-brand-primary flex items-center justify-center hover:bg-brand-primary/10 transition-colors">
              <Volume2 className="w-5 h-5" />
            </button>
            <button 
              onClick={clearLog}
              className="flex items-center gap-2 text-text-muted font-bold hover:text-text transition-colors px-4 py-2 rounded-xl hover:bg-surface-hover"
            >
              <RotateCcw className="w-5 h-5" /> Clear Log
            </button>
          </div>

        </div>
      </div>

      {/* AI Helper Section Below */}
      <div className="w-full">
        <h3 className="text-xl font-bold font-display text-text mb-4 flex items-center gap-2">
          <Sparkles className="text-brand-primary w-5 h-5" /> Translation Assistant
        </h3>
        <TravelChatbotV2 />
      </div>

    </div>
  );
}
