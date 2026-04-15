import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Sparkles, Download, Share2, MapPin, Calendar } from 'lucide-react';
import { PilgrimageRoute } from '../data/routes';

interface RouteAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  route: PilgrimageRoute | null;
}

const RouteAchievementModal: React.FC<RouteAchievementModalProps> = ({ isOpen, onClose, userName, route }) => {
  if (!route) return null;

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-lg bg-[#FDFBF7] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden flex flex-col"
          >
            {/* Certificate Header */}
            <div className="h-3 bg-[#B22222]" />
            
            <div className="p-8 md:p-12 text-center space-y-8">
              <div className="relative inline-block">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto border-2 border-[#D4AF37]/30">
                  <Trophy className="w-12 h-12 md:w-16 md:h-16 text-[#D4AF37]" />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-dashed border-[#D4AF37]/40 rounded-full"
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold calligraphy text-[#1A1A1A] tracking-widest">结缘证</h2>
                <div className="h-0.5 w-16 bg-[#B22222] mx-auto" />
                <p className="text-xs md:text-sm text-[#B22222] font-black tracking-[0.5em] uppercase">Certificate of Connection</p>
              </div>

              <div className="space-y-6 py-8 border-y border-[#D4AF37]/20">
                <p className="text-base md:text-lg calligraphy text-slate-600 leading-relaxed">
                  兹证明同修 <span className="text-[#1A1A1A] font-bold border-b-2 border-[#B22222] px-2">{userName}</span><br />
                  于西湖之畔，循迹而行，圆满完成
                </p>
                <h3 className="text-2xl md:text-3xl font-bold calligraphy text-[#B22222]">《{route.rewardName}》</h3>
                <p className="text-sm md:text-base calligraphy text-slate-600">
                  寻访古迹 {route.steps.length} 处，感悟文脉，受持荣耀。
                </p>
              </div>

              <div className="flex justify-between items-end text-left">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    结缘日期：{today}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    发证地：杭州·问道云图
                  </div>
                </div>
                <div className="w-20 h-20 md:w-24 md:h-24 opacity-80 rotate-[-15deg]">
                  <img src="https://www.transparenttextures.com/patterns/natural-paper.png" className="absolute inset-0 mix-blend-multiply opacity-20" alt="" />
                  <div className="w-full h-full border-4 border-[#B22222] rounded-sm flex items-center justify-center p-1">
                    <div className="w-full h-full border-2 border-[#B22222] flex flex-col items-center justify-center">
                      <span className="calligraphy text-xl md:text-2xl text-[#B22222] font-bold">受持</span>
                      <span className="text-[8px] text-[#B22222] font-black tracking-tighter">VERIFIED</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 flex gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-[#1A1A1A] text-white text-xs font-black tracking-[0.3em] uppercase hover:bg-[#B22222] transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  受持这份荣耀
                </button>
                <button className="p-4 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Decorative Sparkles */}
            <div className="absolute top-12 left-12">
              <Sparkles className="w-6 h-6 text-[#D4AF37]/20 animate-pulse" />
            </div>
            <div className="absolute bottom-24 right-12">
              <Sparkles className="w-8 h-8 text-[#D4AF37]/30 animate-pulse" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RouteAchievementModal;
