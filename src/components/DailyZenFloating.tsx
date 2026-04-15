import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, Sparkles, X, Bell } from 'lucide-react';
import { ZEN_QUOTES } from '../data/zenQuotes';
import { useMediaQuery } from '../hooks/useMediaQuery';

const DailyZenFloating: React.FC<{ isMobileMode?: boolean }> = ({ isMobileMode = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const dailyQuote = useMemo(() => {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % ZEN_QUOTES.length;
    return ZEN_QUOTES[index];
  }, []);

  // If we are in the global floating position but on mobile, don't render (it will be in the sidebar)
  if (!isMobileMode && isMobile) return null;

  if (isMobileMode) {
    return (
      <>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 bg-white/40 backdrop-blur-md border border-[#B22222]/20 rounded-sm flex items-center justify-center text-[#B22222] shadow-sm relative group overflow-hidden"
        >
          {/* Subtle background texture */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
          
          <span className="text-lg font-black calligraphy leading-none">禅</span>
          
          {/* Subtle pulse indicator */}
          <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#B22222] rounded-full animate-pulse" />
        </motion.button>
        {/* Modal remains the same */}
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-[#1A1A1A]/70 backdrop-blur-sm"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40, rotate: 2 }}
                className="relative w-full max-w-[320px] bg-[#FDFBF7] shadow-[0_20px_60px_rgba(0,0,0,0.3)] flex flex-col items-center"
              >
                <div className="w-full h-3 bg-[#B22222]" />
                <div className="p-8 md:p-10 w-full relative flex flex-col items-center">
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute -top-16 right-0 md:-right-16 w-12 h-12 bg-white/20 hover:bg-[#B22222] text-white rounded-full flex items-center justify-center transition-all border border-white/30 backdrop-blur-md group/close"
                  >
                    <X className="w-7 h-7" />
                    <div className="absolute inset-[-20px] cursor-pointer" />
                  </button>
                  <div className="flex flex-col items-center gap-2 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-[1px] bg-[#D4AF37]/30" />
                      <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
                      <div className="w-8 h-[1px] bg-[#D4AF37]/30" />
                    </div>
                    <h3 className="text-[10px] font-black text-[#B22222] tracking-[0.5em] uppercase calligraphy mt-2">
                      每日 · 禅语
                    </h3>
                  </div>
                  <div className="relative py-8 px-6 border-x border-[#D4AF37]/20 bg-white/20">
                    <Quote className="absolute -left-3 -top-6 w-10 h-10 text-[#D4AF37]/10" />
                    <div className="flex justify-center items-center min-h-[240px]">
                      <p className="text-xl md:text-2xl text-[#1A1A1A] leading-[2.2] calligraphy italic font-bold text-center [writing-mode:vertical-rl] h-full py-2">
                        {dailyQuote.content}
                      </p>
                    </div>
                    <Quote className="absolute -right-3 -bottom-6 w-10 h-10 text-[#D4AF37]/10 rotate-180" />
                  </div>
                  <div className="mt-10 flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-[#B22222] flex items-center justify-center">
                      <span className="text-[#B22222] text-lg font-black calligraphy">禅</span>
                    </div>
                    <p className="text-[9px] text-slate-300 tracking-[0.3em] uppercase font-bold">
                      Inner Peace · 正念
                    </p>
                  </div>
                </div>
                <div className="w-full h-1 bg-[#B22222]/20" />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      {/* Floating "Jing Niao Ling" (Bird-Scaring Bell) Trigger - Web Only, Top Left */}
      <div className="fixed top-0 left-80 md:left-96 z-[110] pointer-events-none">
        {/* Hanging String - Ancient look */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[1.5px] h-16 bg-gradient-to-b from-[#1A1A1A] via-[#D4AF37]/40 to-transparent" />
        
        {/* The Bell Trigger */}
        <motion.button
          whileHover={{ scale: 1.05, y: 4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="absolute left-1/2 top-[52px] -translate-x-1/2 pointer-events-auto group"
        >
          {/* Bell Body - More ancient/bronze look */}
          <motion.div
            animate={{ 
              rotate: [0, 3, -3, 0],
              transition: { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative flex flex-col items-center"
          >
            {/* Ancient Bronze Bell Shape */}
            <div className="w-14 h-14 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                {/* Bell Body */}
                <path 
                  d="M20 80 C20 40, 30 10, 50 10 C70 10, 80 40, 80 80 L20 80" 
                  fill="#C5A059" 
                  stroke="#8B6B23" 
                  strokeWidth="2"
                />
                {/* Texture/Gradients */}
                <path 
                  d="M35 25 C40 20, 60 20, 65 25" 
                  fill="none" 
                  stroke="#8B6B23" 
                  strokeWidth="1" 
                  opacity="0.5"
                />
                <rect x="25" y="70" width="50" height="4" fill="#8B6B23" opacity="0.3" />
                {/* Clapper */}
                <circle cx="50" cy="82" r="6" fill="#4A3728" />
              </svg>
              
              <Bell className="absolute inset-0 m-auto w-5 h-5 text-[#4A3728]/40" />
            </div>
            
            {/* Fortune Slip (Hanging Tag) - Ancient Paper look */}
            <motion.div
              animate={{ 
                rotate: [0, 6, -6, 0],
                x: [0, 2, -2, 0],
                transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
              className="w-7 h-20 bg-[#B22222] mt-[-4px] rounded-b-sm flex flex-col items-center justify-center shadow-xl relative origin-top border border-black/20"
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-black/40" />
              <span className="text-[10px] calligraphy text-white/90 [writing-mode:vertical-rl] tracking-[0.5em] font-black py-2">
                每日一禅
              </span>
              {/* Ancient Tassel */}
              <div className="absolute top-[98%] left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-px h-8 bg-[#B22222]/60" />
                <div className="w-2 h-2 bg-[#D4AF37] rotate-45 shadow-sm" />
              </div>
            </motion.div>
          </motion.div>

          {/* Hover Hint - Ancient Style */}
          <div className="absolute top-full mt-32 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 whitespace-nowrap">
            <div className="relative">
              <span className="text-[11px] calligraphy text-[#B22222] bg-[#FDFBF7] px-4 py-2 rounded-sm border border-[#D4AF37]/30 shadow-xl block tracking-widest">
                击铃闻禅 · 开启今日正念
              </span>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-[#1A1A1A]/70 backdrop-blur-sm"
            />
            
            {/* Fortune Slip Design */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40, rotate: 2 }}
              className="relative w-full max-w-[320px] bg-[#FDFBF7] shadow-[0_20px_60px_rgba(0,0,0,0.3)] flex flex-col items-center"
            >
              {/* Top Red Border */}
              <div className="w-full h-3 bg-[#B22222]" />
              
              <div className="p-8 md:p-10 w-full relative flex flex-col items-center">
                {/* Decorative Pattern Background */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
                
                {/* Close Button - Enhanced Hit Area and Visibility */}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="absolute -top-16 right-0 md:-right-16 w-12 h-12 bg-white/20 hover:bg-[#B22222] text-white rounded-full flex items-center justify-center transition-all border border-white/30 backdrop-blur-md group/close"
                  aria-label="关闭"
                >
                  <X className="w-7 h-7 group-hover/close:rotate-90 transition-transform duration-300" />
                  {/* Invisible larger hit area */}
                  <div className="absolute inset-[-20px] cursor-pointer" />
                </button>

                {/* Header */}
                <div className="flex flex-col items-center gap-2 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-[1px] bg-[#D4AF37]/30" />
                    <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
                    <div className="w-8 h-[1px] bg-[#D4AF37]/30" />
                  </div>
                  <h3 className="text-[10px] font-black text-[#B22222] tracking-[0.5em] uppercase calligraphy mt-2">
                    每日 · 禅语
                  </h3>
                </div>

                {/* Content - Fortune Slip Style with vertical text */}
                <div className="relative py-8 px-6 border-x border-[#D4AF37]/20 bg-white/20">
                  <Quote className="absolute -left-3 -top-6 w-10 h-10 text-[#D4AF37]/10" />
                  <div className="flex justify-center items-center min-h-[240px]">
                    <p className="text-xl md:text-2xl text-[#1A1A1A] leading-[2.2] calligraphy italic font-bold text-center [writing-mode:vertical-rl] h-full py-2">
                      {dailyQuote.content}
                    </p>
                  </div>
                  <Quote className="absolute -right-3 -bottom-6 w-10 h-10 text-[#D4AF37]/10 rotate-180" />
                </div>

                {/* Footer Seal */}
                <div className="mt-10 flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-2 border-[#B22222] flex items-center justify-center">
                    <span className="text-[#B22222] text-lg font-black calligraphy">禅</span>
                  </div>
                  <p className="text-[9px] text-slate-300 tracking-[0.3em] uppercase font-bold">
                    Inner Peace · 正念
                  </p>
                </div>
              </div>

              {/* Bottom Red Border */}
              <div className="w-full h-1 bg-[#B22222]/20" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DailyZenFloating;
