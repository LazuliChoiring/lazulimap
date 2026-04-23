import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { EnvironmentState } from '../hooks/useEnvironment';
import { useMediaQuery } from '../hooks/useMediaQuery';
import DailyZenFloating from './DailyZenFloating';

interface EnvironmentIndicatorProps {
  environment: EnvironmentState;
  onClick: () => void;
}

const EnvironmentIndicator: React.FC<EnvironmentIndicatorProps> = ({ environment, onClick }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  if (!environment?.weather || isMobile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ 
        scale: 1.02,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "rgba(212, 175, 85, 0.5)"
      }}
      onClick={onClick}
      className="fixed top-24 right-6 z-[100] w-72 bg-white/40 backdrop-blur-xl border border-[#D4AF37]/20 shadow-lg rounded-sm p-5 cursor-pointer group overflow-hidden transition-all"
    >
      {/* Subtle background calligraphy character */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
        <span className="text-8xl font-bold calligraphy text-[#B22222]">时</span>
      </div>

      <div className="flex flex-col gap-4 relative z-10">
        {/* Top Row: Weather & Poetic Time */}
        <div className="flex items-center gap-4">
          {/* Traditional Seal-like Icon */}
          <div className="w-12 h-12 border border-[#B22222]/30 flex items-center justify-center relative shrink-0 bg-white/40 shadow-sm group-hover:border-[#B22222] transition-colors">
            <div className="absolute inset-0.5 border border-[#B22222]/10" />
            <span className="calligraphy text-2xl text-[#B22222]">
              {environment.weather?.weather?.includes('雨') ? '雨' : 
               environment.weather?.weather?.includes('云') ? '云' : 
               environment.weather?.weather?.includes('阴') ? '阴' : '晴'}
            </span>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-[#B22222] tracking-[0.3em] uppercase whitespace-nowrap">
                  {environment.timeOfDay === 'dawn' ? '晨曦初露' : 
                   environment.timeOfDay === 'day' ? '正午阳光' : 
                   environment.timeOfDay === 'dusk' ? '南屏晚钟' : '月明星稀'}
                </span>
                <div className="w-1 h-1 rounded-full bg-[#D4AF37] shrink-0" />
                <span className="text-[10px] font-bold text-slate-400 tracking-widest">
                  {environment.weather?.temperature}°C
                </span>
              </div>
              <ExternalLink className="w-3 h-3 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-base font-bold text-[#1A1A1A] calligraphy mt-0.5 truncate">
              {environment.weather?.weather?.includes('雨') ? '烟雨江南 · 此时微雨' : 
               environment.weather?.weather?.includes('云') ? '浮云蔽日 · 气象万千' : 
               environment.weather?.weather?.includes('阴') ? '水光潋滟 · 晴方好' : '金光普照 · 佛日增辉'}
            </span>
          </div>
        </div>

        {/* Bottom Row: Detailed Calendar */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#D4AF37]/10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-[#D4AF37]/40" />
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">公历纪时</span>
            </div>
            <span className="text-[10px] font-mono text-slate-600 font-medium">
              {environment.calendar.gregorian}
            </span>
          </div>

          <div className="flex flex-col gap-1 border-l border-[#D4AF37]/10 pl-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-[#B22222]/40" />
              <span className="text-[10px] font-bold text-[#B22222]/60 tracking-widest uppercase">农历岁次</span>
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-[#1A1A1A] calligraphy">
                {environment.calendar.lunar}
              </span>
              <div className="flex gap-1">
                <span className="text-[9px] font-bold text-[#B22222] bg-[#B22222]/5 px-1 rounded-sm">
                  {environment.calendar.shichen}
                </span>
                {environment.calendar.solarTerm && (
                  <span className="text-[9px] font-bold text-[#D4AF37] bg-[#D4AF37]/5 px-1 rounded-sm">
                    {environment.calendar.solarTerm}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EnvironmentIndicator;
