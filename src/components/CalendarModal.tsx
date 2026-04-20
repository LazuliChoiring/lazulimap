import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { EnvironmentState } from '../hooks/useEnvironment';
import { getUpcomingFestivals, SOLAR_TERMS_CULTURE } from '../utils/calendar';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  environment: EnvironmentState;
  onSearch: (query: string, suggestions?: string[]) => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, environment, onSearch }) => {
  const upcomingFestivals = React.useMemo(() => getUpcomingFestivals(5), []);
  const [isHovered, setIsHovered] = React.useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleDragEnd = (event: any, info: any) => {
    if (!isMobile) return;
    if (info.offset.y > 200 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center ${isMobile ? 'p-0' : 'p-4 md:p-6'}`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1A1A1A]/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              backgroundColor: isHovered ? "rgba(245, 242, 237, 1)" : "rgba(245, 242, 237, 0.85)",
              backdropFilter: isHovered ? "blur(0px)" : "blur(20px)"
            }}
            exit={{ opacity: 0, scale: 1, y: 20 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative w-[92%] md:w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] rounded-sm"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#D4AF37]/20 bg-[#B22222] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6" />
                <h2 className="text-xl font-bold calligraphy tracking-widest">佛道岁时年历</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="space-y-8">
                {/* Current Status */}
                <div className="p-4 bg-white/60 border border-[#D4AF37]/20 rounded-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-[#B22222]" />
                    <span className="text-xs font-black text-[#1A1A1A] tracking-widest uppercase">今日岁次</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold text-[#1A1A1A] calligraphy">{environment.calendar.lunar}</p>
                      <p className="text-sm text-slate-500 font-mono mt-1">{environment.calendar.gregorian}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-[#B22222] calligraphy">{environment.calendar.shichen}</span>
                    </div>
                  </div>
                </div>

                {/* Upcoming Festivals */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-[#D4AF37]" />
                      <span className="text-xs font-black text-[#1A1A1A] tracking-widest uppercase">近期法会与节日</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {upcomingFestivals.map((fest, idx) => (
                      <div 
                        key={`${fest.name}-${idx}`}
                        className="flex items-center justify-between p-4 bg-white/40 border border-transparent hover:border-[#B22222]/20 hover:bg-white transition-all rounded-sm group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold calligraphy ${fest.type === 'solarTerm' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-[#B22222]/5 text-[#B22222]'}`}>
                            {fest.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-[#1A1A1A] group-hover:text-[#B22222] transition-colors calligraphy text-lg">{fest.name}</p>
                              {fest.type === 'solarTerm' && (
                                <span className="px-1.5 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[8px] font-black tracking-widest uppercase rounded">节气</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-medium">{fest.lunar} · {format(fest.date, 'MM月dd日')}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            onClose();
                            if (fest.type === 'solarTerm') {
                              const culture = SOLAR_TERMS_CULTURE[fest.name];
                              const query = `今天是${fest.name}节气，有哪些相关的民俗习惯和故事？推荐去哪些寺庙或名山感悟这个节气？`;
                              const suggestions = [
                                `${fest.name}的民俗习惯有哪些？`,
                                `${fest.name}推荐去哪些寺庙（如${culture?.sites.join('、')}）？`,
                                `${fest.name}节气对身心修持有什么建议？`,
                                `关于${fest.name}的传统民间故事`
                              ];
                              onSearch(query, suggestions);
                            } else {
                              const festivalQuery = `近期有哪些${fest.name}相关的法会，推荐去哪些寺庙参加？`;
                              const festivalSuggestions = [
                                `${fest.name}的民俗故事介绍`,
                                `${fest.name}有什么职责，可以保佑什么方向？`,
                                `杭州哪些场所可以参拜${fest.name}？`,
                                `参加${fest.name}法会有什么需要注意的礼仪？`
                              ];
                              onSearch(festivalQuery, festivalSuggestions);
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#B22222]/5 text-[#B22222] text-xs font-bold rounded-full transition-all hover:bg-[#B22222] hover:text-white shadow-sm"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>问智慧</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CalendarModal;
