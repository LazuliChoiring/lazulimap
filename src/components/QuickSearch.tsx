import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReligiousSite } from '../data/sites';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface QuickSearchProps {
  sites: ReligiousSite[];
  onSelectSite: (site: ReligiousSite) => void;
  onAiSearch: (query: string) => void;
}

const QuickSearch: React.FC<QuickSearchProps> = ({ sites, onSelectSite, onAiSearch }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<ReligiousSite[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (query.trim().length > 0) {
      const filtered = sites
        .filter(s => 
          s.name.toLowerCase().includes(query.toLowerCase()) || 
          s.district.toLowerCase().includes(query.toLowerCase()) ||
          s.buildingName?.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8);
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [query, sites]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (site: ReligiousSite) => {
    onSelectSite(site);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`absolute top-6 left-1/2 -translate-x-1/2 z-[100] ${isMobile ? 'w-[85%]' : 'w-[90%] max-w-xl'}`}>
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative group"
      >
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/20 via-[#B22222]/10 to-[#D4AF37]/20 rounded-full blur opacity-40 group-hover:opacity-70 transition duration-1000" />
        
        <div className={`relative flex items-center bg-[#FDFBF7]/90 backdrop-blur-xl border-2 border-[#D4AF37]/30 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden ${isMobile ? 'h-10' : ''}`}>
          <div className={`${isMobile ? 'pl-3' : 'pl-6'} flex items-center`}>
            <Search className={`${isMobile ? 'w-3.5 h-3.5' : 'w-5 h-5'} text-[#D4AF37]`} />
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isMobile ? "搜胜迹、山门..." : "搜寻胜迹、山门或片区..."}
            className={`flex-1 bg-transparent border-none outline-none px-3 md:px-4 py-1.5 md:py-4 text-slate-800 placeholder-slate-400 font-medium calligraphy ${isMobile ? 'text-xs' : 'text-base md:text-lg'}`}
          />

          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={() => setQuery('')}
                className="p-2 mr-2 text-slate-400 hover:text-[#B22222]"
              >
                <X className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="h-8 w-px bg-[#D4AF37]/20" />

          <button 
            onClick={() => onAiSearch(query)}
            className="px-6 flex items-center gap-2 text-[#D4AF37] hover:text-[#B22222] transition-colors group/ai"
            title="开启AI深度搜索"
          >
            <Sparkles className="w-5 h-5 group-hover/ai:animate-pulse" />
            <span className="hidden md:block text-sm font-bold tracking-widest calligraphy">悟道</span>
          </button>
        </div>

        {/* Suggestions List */}
        <AnimatePresence>
          {isOpen && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 4 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`absolute top-full left-0 right-0 bg-[#FDFBF7]/95 backdrop-blur-2xl border-2 border-[#D4AF37]/30 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden ${isMobile ? 'max-h-[300px] overflow-y-auto' : ''}`}
            >
              <div className="p-2">
                <div className="px-4 py-2 flex items-center justify-between border-b border-[#D4AF37]/10 mb-2">
                  <span className="text-[10px] font-black text-[#B22222]/40 tracking-[0.4em] uppercase calligraphy">寻访索引</span>
                  <span className="text-[10px] text-slate-400 font-mono italic">Found {suggestions.length} sites</span>
                </div>
                
                {suggestions.map((site, index) => (
                  <motion.button
                    key={site.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSelect(site)}
                    className={`w-full text-left flex items-center justify-between group transition-all ${isMobile ? 'px-4 py-2.5' : 'px-5 py-4 hover:bg-[#D4AF37]/10'}`}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`rounded-full bg-[#B22222]/5 flex items-center justify-center text-[#B22222] group-hover:bg-[#B22222] group-hover:text-white transition-all ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}>
                        <MapPin className={`${isMobile ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
                      </div>
                      <div>
                        <h4 className={`font-bold text-slate-800 group-hover:text-[#B22222] calligraphy transition-colors ${isMobile ? 'text-sm' : 'text-base'}`}>
                          {site.name}
                        </h4>
                        <div className="flex items-center gap-2 md:gap-3 mt-0.5">
                          <span className="text-[9px] md:text-[10px] text-slate-400 font-medium">{site.district}</span>
                          <div className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-[9px] md:text-[10px] text-slate-400 font-medium">{site.religion}</span>
                        </div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-2 text-[#D4AF37] text-[10px] font-bold tracking-widest calligraphy">
                        <span>云游一顾</span>
                        <div className="w-4 h-px bg-[#D4AF37]" />
                      </div>
                    </div>
                  </motion.button>
                ))}

                {suggestions.length >= 8 && (
                  <div className="px-5 py-3 bg-[#D4AF37]/5 text-center">
                    <button 
                      onClick={() => onAiSearch(query)}
                      className="text-[10px] text-[#B22222] font-black tracking-widest uppercase hover:underline"
                    >
                      查看更多（由AI上师指引）
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default QuickSearch;
