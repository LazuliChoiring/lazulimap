import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CheckInSealProps {
  isVisible: boolean;
  username?: string;
  onComplete: () => void;
  duration?: number;
}

const CheckInSeal: React.FC<CheckInSealProps> = ({ 
  isVisible, 
  username = '同修', 
  onComplete,
  duration = 3000 
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete, duration]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 3, rotate: -20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              rotate: -15,
              transition: { 
                type: 'spring', 
                damping: 12, 
                stiffness: 200,
                duration: 0.4 
              } 
            }}
            exit={{ opacity: 0, scale: 1.2, transition: { duration: 0.5, delay: 1 } }}
            className="relative"
          >
            {/* The Seal Body */}
            <div className="w-48 h-48 md:w-64 md:h-64 border-[6px] border-[#B22222] rounded-sm flex items-center justify-center p-4 bg-transparent relative overflow-hidden">
              {/* Texture Overlay */}
              <div className="absolute inset-0 opacity-20 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
              
              <div className="border-4 border-[#B22222] w-full h-full flex flex-col items-center justify-center gap-2">
                <span className="calligraphy text-6xl md:text-8xl text-[#B22222] font-bold leading-none">受持</span>
                <div className="h-1 w-24 bg-[#B22222]" />
                <span className="text-[10px] md:text-xs font-black text-[#B22222] tracking-[0.5em] uppercase">Verified</span>
              </div>

              {/* Ink Splatter Effects */}
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#B22222] rounded-full opacity-40 blur-[1px]" />
              <div className="absolute -bottom-1 -right-3 w-3 h-3 bg-[#B22222] rounded-full opacity-30 blur-[1px]" />
            </div>

            {/* Impact Glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.5, 2] }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-[#B22222] rounded-full blur-3xl"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CheckInSeal;
