import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CheckInSealProps {
  isVisible: boolean;
  hook?: string;
  onComplete: () => void;
  duration?: number;
}

const CheckInSeal: React.FC<CheckInSealProps> = ({ 
  isVisible, 
  hook = '云游', 
  onComplete
}) => {
  // Handle 2 or 4 characters by showing them in grid
  const hookChars = hook.slice(0, 4);
  const charCount = hookChars.length;
  const gridCols = charCount === 1 ? 'grid-cols-1' : 'grid-cols-2';

  // Reading order: Top-Right -> Bottom-Right -> Top-Left -> Bottom-Left
  // Grid layout (left-to-right): [TL, TR, BL, BR]
  // To get traditional reading from [0, 1, 2, 3]:
  // Row 1: 2, 0
  // Row 2: 3, 1
  const displayChars = charCount === 4 
    ? [hookChars[2], hookChars[0], hookChars[3], hookChars[1]] 
    : hookChars.split('');

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <div 
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto cursor-pointer"
          onClick={onComplete}
        >
          <div className="flex flex-col items-center space-y-12 pointer-events-none">
            {/* The Square Seal */}
            <motion.div
              initial={{ opacity: 0, scale: 3, rotate: -20, y: -100 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                rotate: 0,
                y: 0,
                transition: { 
                  type: 'spring', 
                  damping: 12, 
                  stiffness: 200,
                  duration: 0.6 
                } 
              }}
              className="relative"
            >
              <div className="w-44 h-44 md:w-56 md:h-56 bg-[#B22222] border-4 border-[#D4AF37] shadow-[0_30px_70px_rgba(0,0,0,0.5)] flex items-center justify-center p-4 relative overflow-hidden">
                {/* Texture Overlay */}
                <div className="absolute inset-0 opacity-20 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
                <div className="absolute inset-1 border-2 border-[#D4AF37]/50" />
                
                <div className={`grid ${gridCols} w-full h-full p-2 gap-2 z-10`}>
                  {displayChars.map((char, idx) => (
                    <div key={idx} className="flex items-center justify-center text-white text-5xl md:text-6xl font-black calligraphy leading-none drop-shadow-xl select-none">
                      {char}
                    </div>
                  ))}
                </div>

                {/* Impact Reflection */}
                <motion.div
                  initial={{ x: '-100%', y: '-100%', rotate: 45 }}
                  animate={{ x: '100%', y: '100%', rotate: 45 }}
                  transition={{ delay: 0.4, duration: 1.2, ease: "easeInOut" }}
                  className="absolute inset-0 bg-white/10 w-[200%] h-20 -z-5"
                />
              </div>
            </motion.div>

            {/* Vertical Text Area */}
            <div className="flex flex-col items-center space-y-8">
              <div className="flex flex-col items-center space-y-3">
                {['到', '此', '雲', '遊'].map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.5 + (index * 0.1), duration: 0.3 }}
                    className="calligraphy text-white text-5xl md:text-6xl font-bold drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                  >
                    {char}
                  </motion.span>
                ))}
              </div>

              {/* Yin Yang Symbol at bottom */}
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: 360 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 1.2, type: 'spring', damping: 10, stiffness: 100 }}
                className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center"
              >
                <div className="w-full h-full bg-white rounded-full p-0.5 shadow-2xl flex items-center justify-center border-2 border-[#1A1A1A]">
                  <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
                    <path d="M50,0 A50,50 0 0,0 50,100 A25,25 0 0,1 50,50 A25,25 0 0,0 50,0" fill="#1A1A1A" />
                    <circle cx="50" cy="25" r="7" fill="white" />
                    <circle cx="50" cy="75" r="7" fill="#1A1A1A" />
                    <circle cx="50" cy="50" r="49" fill="none" stroke="#1A1A1A" strokeWidth="2" />
                  </svg>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CheckInSeal;
