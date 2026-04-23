import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, Sparkles, X, Bell } from 'lucide-react';
import { ZEN_QUOTES } from '../data/zenQuotes';
import { useMediaQuery } from '../hooks/useMediaQuery';

const DailyZenFloating: React.FC<{ isMobileMode?: boolean }> = ({ isMobileMode = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isStriking, setIsStriking] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const dailyQuote = useMemo(() => {
    const today = new Date();
    // Daily seed logic remains to keep the quote consistent throughout the day
    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % ZEN_QUOTES.length;
    
    // Add lottery luck labels based on hash
    const luckLevels = ["大吉", "上吉", "中吉", "平安"];
    const tips = ["宜 · 寻访灵隐", "宜 · 闲坐冷泉", "宜 · 步入烟霞", "宜 · 龙坞吃茶"];
    
    return {
      ...ZEN_QUOTES[index],
      luck: luckLevels[hash % luckLevels.length],
      tip: tips[Math.abs(hash * 7) % tips.length]
    };
  }, []);

  const handleStartSticking = () => {
    setIsOpen(true);
    setIsStriking(true);
    setShowResult(false);
    
    // Simulate the shaking process
    setTimeout(() => {
      setIsStriking(false);
      setShowResult(true);
    }, 1800);
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowResult(false);
    setIsStriking(false);
  };

  // If we are in the global floating position on mobile, render it in a fixed bottom corner
  if (!isMobileMode && isMobile) {
    return (
      <div className="fixed bottom-36 right-4 z-[120]">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleStartSticking}
          className="w-12 h-12 bg-white/90 backdrop-blur-md border border-[#B22222]/30 rounded-full flex items-center justify-center text-[#B22222] shadow-xl relative group overflow-hidden"
        >
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
          <span className="text-lg font-black calligraphy leading-none">签</span>
          <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#B22222] rounded-full animate-pulse" />
        </motion.button>
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="absolute inset-0 bg-[#1A1A1A]/70 backdrop-blur-sm"
              />
              {!showResult ? (
                <div className="relative flex flex-col items-center">
                  <motion.div
                    animate={isStriking ? { 
                      rotate: [0, 10, -10, 10, -10, 0],
                      y: [0, -5, 5, -5, 5, 0],
                    } : {}}
                    transition={{ duration: 0.3, repeat: 6 }}
                    className="w-24 h-40 bg-[#4A3728] rounded-t-xl rounded-b-md relative shadow-2xl flex flex-col items-center justify-end pb-4 border-2 border-[#D4AF37]/30"
                  >
                    <div className="absolute -top-10 flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-1.5 h-16 bg-[#D4AF37]/60 rounded-full" />
                      ))}
                    </div>
                    <div className="w-10 h-10 border-2 border-[#D4AF37]/50 rounded-full flex items-center justify-center">
                      <span className="text-[#D4AF37] text-xs font-bold calligraphy">签</span>
                    </div>
                  </motion.div>
                  <p className="mt-8 text-white calligraphy tracking-[0.5em] text-sm animate-pulse">诚心求签中...</p>
                </div>
              ) : (
                <ResultContent dailyQuote={dailyQuote} handleClose={handleClose} />
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Common Trigger for Desktop or embedded mobile sidebar
  const TriggerButton = (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleStartSticking}
      className={`bg-white/40 backdrop-blur-md border border-[#B22222]/20 rounded-sm flex items-center justify-center text-[#B22222] shadow-sm relative group overflow-hidden ${
        isMobileMode ? 'w-10 h-10' : 'w-12 h-12'
      }`}
    >
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
      <span className="text-lg font-black calligraphy leading-none">签</span>
      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#B22222] rounded-full animate-pulse" />
    </motion.button>
  );

  if (isMobileMode) {
    return (
      <>
        {TriggerButton}
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="absolute inset-0 bg-[#1A1A1A]/70 backdrop-blur-sm"
              />
              
              {!showResult ? (
                <div className="relative flex flex-col items-center">
                  <motion.div
                    animate={isStriking ? { 
                      rotate: [0, 10, -10, 10, -10, 0],
                      y: [0, -5, 5, -5, 5, 0],
                    } : {}}
                    transition={{ duration: 0.3, repeat: 6 }}
                    className="w-24 h-40 bg-[#4A3728] rounded-t-xl rounded-b-md relative shadow-2xl flex flex-col items-center justify-end pb-4 border-2 border-[#D4AF37]/30"
                  >
                    {/* Sticks inside */}
                    <div className="absolute -top-10 flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-1.5 h-16 bg-[#D4AF37]/60 rounded-full" />
                      ))}
                    </div>
                    <div className="w-10 h-10 border-2 border-[#D4AF37]/50 rounded-full flex items-center justify-center">
                      <span className="text-[#D4AF37] text-xs font-bold calligraphy">签</span>
                    </div>
                  </motion.div>
                  <p className="mt-8 text-white calligraphy tracking-[0.5em] text-sm animate-pulse">诚心求签中...</p>
                </div>
              ) : (
                <ResultContent dailyQuote={dailyQuote} handleClose={handleClose} />
              )}
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <div className="absolute top-0 left-8 md:left-12 z-[110] pointer-events-none">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[1.5px] h-16 bg-gradient-to-b from-[#1A1A1A] via-[#D4AF37]/40 to-transparent" />
        <motion.button
          whileHover={{ scale: 1.05, y: 4 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartSticking}
          className="absolute left-1/2 top-[52px] -translate-x-1/2 pointer-events-auto group"
        >
          <motion.div
            animate={{ 
              rotate: [0, 2, -2, 0],
              transition: { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative flex flex-col items-center"
          >
            <div className="w-14 h-14 relative group">
               <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                <path 
                  d="M20 80 C20 40, 30 10, 50 10 C70 10, 80 40, 80 80 L20 80" 
                  fill="#4A3728" 
                  stroke="#8B6B23" 
                  strokeWidth="2"
                />
                <circle cx="50" cy="85" r="5" fill="#D4AF37" />
              </svg>
              <span className="absolute inset-x-0 top-3 text-[10px] text-[#D4AF37] text-center font-bold calligraphy">灵山</span>
            </div>
            
            <motion.div
              animate={{ 
                rotate: [0, 4, -4, 0],
                x: [0, 1, -1, 0],
                transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
              className="w-7 h-20 bg-[#B22222] mt-[-4px] rounded-b-sm flex flex-col items-center justify-center shadow-xl relative origin-top border border-black/20"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-black/30" />
              <span className="text-[10px] calligraphy text-white/90 [writing-mode:vertical-rl] tracking-[0.4em] font-black py-2">
                灵山一签
              </span>
              <div className="absolute top-[98%] left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-px h-6 bg-[#B22222]/60" />
                <div className="w-1.5 h-1.5 bg-[#D4AF37] rotate-45" />
              </div>
            </motion.div>
          </motion.div>

          {/* Hover Hint */}
          <div className="absolute top-full mt-24 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 whitespace-nowrap">
            <span className="text-[10px] calligraphy text-[#B22222] bg-[#FDFBF7] px-4 py-2 rounded-sm border border-[#D4AF37]/30 shadow-xl block tracking-widest">
              诚心求签 · 闻钟领悟
            </span>
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-[#1A1A1A]/75 backdrop-blur-sm"
            />
            
            {!showResult ? (
              <div className="relative flex flex-col items-center">
                <motion.div
                  animate={isStriking ? { 
                    rotate: [0, 8, -8, 8, -8, 0],
                    y: [0, -4, 4, -4, 4, 0],
                  } : {}}
                  transition={{ duration: 0.25, repeat: 6 }}
                  className="w-32 h-56 bg-[#3D2B1F] rounded-t-3xl rounded-b-lg relative shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex flex-col items-center justify-end pb-8 border-t-4 border-x-2 border-[#D4AF37]/40"
                >
                  {/* Sticks inside with movement */}
                  <div className="absolute -top-16 flex gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <motion.div 
                        key={i} 
                        animate={isStriking ? { y: [0, -10, 0] } : {}}
                        transition={{ delay: i * 0.1, duration: 0.3, repeat: 5 }}
                        className="w-2 h-24 bg-[#D4AF37]/50 rounded-full" 
                      />
                    ))}
                  </div>
                  <div className="w-14 h-14 border-2 border-[#D4AF37]/50 rounded-full flex items-center justify-center bg-black/20">
                    <span className="text-[#D4AF37] text-lg font-bold calligraphy">签</span>
                  </div>
                  <div className="absolute inset-x-0 top-12 flex justify-center opacity-10">
                    <span className="text-white text-4xl font-black calligraphy [writing-mode:vertical-rl]">灵山一签</span>
                  </div>
                </motion.div>
                <div className="mt-12 flex flex-col items-center gap-2">
                   <p className="text-[#D4AF37] calligraphy tracking-[0.8em] text-lg font-bold animate-pulse">诚心感应中</p>
                   <p className="text-white/40 text-[10px] tracking-widest uppercase">Spirit of West Lake</p>
                </div>
              </div>
            ) : (
              <ResultContent dailyQuote={dailyQuote} handleClose={handleClose} />
            )}
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// Sub-component for the actual slip results
const ResultContent = ({ dailyQuote, handleClose }: { dailyQuote: any, handleClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 100, rotateY: 90 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 100, rotateY: -90 }}
      transition={{ type: "spring", damping: 15 }}
      className="relative w-full max-w-[300px] xs:max-w-[320px] md:max-w-[340px] max-h-[88vh] bg-[#FDFBF7] shadow-[0_30px_90px_rgba(0,0,0,0.4)] flex flex-col items-center overflow-y-auto overflow-x-hidden mx-auto scrollbar-hide"
    >
      {/* Texture Layer */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
      
      {/* Red Header Bar */}
      <div className="w-full h-2.5 md:h-3 bg-[#B22222] shadow-sm flex-shrink-0" />

      <div className="p-5 md:p-8 w-full relative flex flex-col items-center">
        {/* Close Button - More compact on mobile */}
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 md:-top-14 md:right-2 w-8 h-8 md:w-10 md:h-10 bg-[#B22222]/80 hover:bg-[#B22222] text-white rounded-full flex items-center justify-center transition-all shadow-xl z-20"
        >
          <X className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        {/* Content Section - Grid for perfect horizontal balance */}
        <div className="w-full grid grid-cols-[40px_1fr_40px] md:grid-cols-[50px_1fr_50px] items-start mb-4 md:mb-6">
          {/* Left: Luck Label */}
          <div className="flex flex-col items-center pt-1 md:pt-2">
             <div className="px-1 py-2 md:py-3 border border-[#B22222] text-[#B22222] calligraphy font-bold text-xs md:text-sm [writing-mode:vertical-rl] leading-none bg-[#B22222]/5">
               {dailyQuote.luck}
             </div>
             <div className="w-px h-6 md:h-10 bg-gradient-to-b from-[#B22222] to-transparent mt-1.5 md:mt-2" />
          </div>

          {/* Center: Main Quote */}
          <div className="flex justify-center items-center overflow-visible">
            <div className="relative py-1 md:py-2">
              <p className="text-lg md:text-2xl text-[#1A1A1A] leading-[1.9] md:leading-[2.1] calligraphy italic font-bold [writing-mode:vertical-rl] min-h-[220px] md:min-h-[300px] text-center">
                {dailyQuote.content}
              </p>
            </div>
          </div>

          {/* Right: Date & Tip */}
          <div className="flex flex-col items-center gap-2 md:gap-3 pt-1 md:pt-2">
            <div className="text-[8px] md:text-[9px] text-slate-400 font-bold tracking-[0.15em] md:tracking-[0.2em] [writing-mode:vertical-rl] border-r border-slate-200 pr-1 md:pr-1.5 h-16 md:h-20">
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
            <div className="text-[8px] md:text-[10px] text-[#B22222] calligraphy font-bold [writing-mode:vertical-rl] tracking-widest bg-[#B22222]/5 p-1.5 md:p-2 rounded-sm ring-1 ring-[#B22222]/10 whitespace-nowrap leading-none">
              {dailyQuote.tip}
            </div>
          </div>
        </div>

        {/* Footer Seal */}
        <div className="mt-2 md:mt-4 flex flex-col items-center gap-1.5 md:gap-2">
          <div className="relative">
            <div className="w-8 h-8 md:w-10 md:h-10 border border-[#B22222] p-0.5">
              <div className="w-full h-full border border-[#B22222] flex flex-col items-center justify-center bg-[#B22222]/5 leading-none">
                <span className="text-[#B22222] text-[11px] md:text-[13px] font-black calligraphy">灵</span>
                <span className="text-[#B22222] text-[11px] md:text-[13px] font-black calligraphy">山</span>
              </div>
            </div>
            <Sparkles className="absolute -right-2 -top-2 md:-right-3 md:-top-3 w-3 h-3 text-[#D4AF37] animate-pulse" />
          </div>
          <p className="text-[8px] md:text-[9px] text-slate-300 tracking-[0.3em] md:tracking-[0.4em] font-medium mt-0.5 md:mt-1">
            A I 云 游 僧 题 撰
          </p>
        </div>
      </div>

      {/* Decorative Bottom Dots */}
      <div className="w-full flex justify-center py-2 px-4 gap-3 md:gap-4 opacity-[0.03] flex-shrink-0">
         {[1,2,3,4,5].map(i => <div key={i} className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-black" />)}
      </div>
    </motion.div>
  );
};

export default DailyZenFloating;
