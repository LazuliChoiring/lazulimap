import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Send, Sparkles, BookOpen, Compass, User, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { geminiService, ChatMessage } from '../services/geminiService';
import { ReligiousSite } from '../data/sites';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface MasterSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: ReligiousSite[];
  onSelectSite: (site: ReligiousSite) => void;
  initialQuery?: string;
  initialSuggestions?: string[];
}

const MasterSearchModal: React.FC<MasterSearchModalProps> = ({ 
  isOpen, 
  onClose, 
  sites, 
  onSelectSite,
  initialQuery = '',
  initialSuggestions = []
}) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isInputExpanded, setIsInputExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const defaultSuggestions = [
    "梁思成林徽因去过的寺庙",
    "唐代木质结构的古建筑",
    "杭州1000年以上的古刹",
    "拜财神很灵验的道观"
  ];

  const initialQueryProcessed = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (initialQuery && !initialQueryProcessed.current) {
        handleSend(initialQuery);
        initialQueryProcessed.current = true;
        // Auto collapse after initial query to focus on reading
        setIsInputExpanded(false);
      }
      setSuggestions(initialSuggestions.length > 0 ? initialSuggestions : defaultSuggestions);
    } else {
      // Reset state when closing
      setHistory([]);
      setQuery('');
      setSuggestions(defaultSuggestions);
      initialQueryProcessed.current = false;
      setIsInputExpanded(true);
    }
  }, [isOpen, initialQuery, initialSuggestions]);

  useEffect(() => {
    if (history.length > 0 && !isThinking) {
      // Small delay before collapsing to let user see the query was sent
      const timer = setTimeout(() => setIsInputExpanded(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [history.length, isThinking]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isThinking]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isThinking) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setHistory(prev => [...prev, userMsg]);
    setQuery('');
    setIsThinking(true);

    const result = await geminiService.masterChat(text, history, sites);
    
    const modelMsg: ChatMessage = { role: 'model', content: result.answer };
    setHistory(prev => [...prev, modelMsg]);
    if (result.suggestions && result.suggestions.length > 0) {
      setSuggestions(result.suggestions);
    }
    setIsThinking(false);
  };

  const matchedSites = (content: string) => {
    return sites.filter(s => 
      content.includes(`【${s.name}】`) || 
      content.includes(s.name) ||
      (s.buildingName && (content.includes(`【${s.buildingName}】`) || content.includes(s.buildingName)))
    );
  };

  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const dragY = useMotionValue(0);

  const handleDragEnd = (event: any, info: any) => {
    if (!isMobile) return;
    if (info.offset.y > 200 || info.velocity.y > 500) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#1A1A1A]/85 backdrop-blur-md"
      />
      
      <motion.div
        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          backgroundColor: (isHovered || history.length > 0) ? "rgba(253, 251, 247, 1)" : "rgba(253, 251, 247, 0.85)",
          backdropFilter: (isHovered || history.length > 0) ? "blur(0px)" : "blur(20px)"
        }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
        drag={isMobile ? "y" : false}
        dragConstraints={{ top: 0, bottom: window.innerHeight }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative w-full max-w-4xl ${isMobile ? 'h-full rounded-t-[32px]' : 'h-[85vh] rounded-sm'} shadow-2xl border border-[#D4AF37]/30 flex flex-col overflow-hidden`}
      >
        {/* Mobile Drag Handle */}
        {isMobile && (
          <div className="w-full py-4 flex justify-center shrink-0">
            <div className="w-12 h-1.5 bg-[#D4AF37]/30 rounded-full" />
          </div>
        )}

        {/* Header */}
        <div className={`p-6 border-b border-[#D4AF37]/20 bg-[#F5F2ED] flex items-center justify-between relative overflow-hidden shrink-0 ${isMobile ? 'pt-2' : ''}`}>
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-[#B22222] rounded-full flex items-center justify-center text-white shadow-lg border-2 border-[#D4AF37]/30">
              <Compass className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold calligraphy tracking-widest text-[#1A1A1A]">云游上师 · 智慧接引</h2>
              <p className="text-[10px] text-[#B22222] font-black tracking-[0.3em] uppercase opacity-70">Master Scholar & Spiritual Guide</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#B22222]/10 rounded-full transition-colors relative z-10">
            <X className="w-6 h-6 text-[#1A1A1A]" />
          </button>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]">
          {history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-lg mx-auto">
              <div className="w-24 h-24 bg-[#D4AF37]/10 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 border border-[#D4AF37]/20 rounded-full animate-spin-slow" />
                <Sparkles className="w-12 h-12 text-[#D4AF37]" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold calligraphy text-[#1A1A1A] tracking-widest">见地决定视野</h3>
                <p className="text-lg text-slate-600 leading-relaxed font-serif italic">
                  “你好。我们不需要聊那些玄奥的辞令。无论是想聊聊古建筑的榫卯，还是想在这些千年古刹里找点现代人的共鸣，我都在这。”
                </p>
              </div>
            </div>
          )}

          {history.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-5 max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center shadow-md border-2 ${msg.role === 'user' ? 'bg-[#1A1A1A] border-white/20 text-white' : 'bg-[#B22222] border-[#D4AF37]/30 text-white'}`}>
                  {msg.role === 'user' ? <User className="w-6 h-6" /> : <Compass className="w-6 h-6" />}
                </div>
                <div className={`space-y-6 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`p-8 md:p-10 rounded-xl shadow-sm border relative ${msg.role === 'user' ? 'bg-[#F5F2ED] border-[#1A1A1A]/10 text-[#1A1A1A]' : 'bg-white border-[#D4AF37]/20 text-[#2C3E50]'}`}>
                    {msg.role === 'model' && (
                      <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                        <Compass className="w-24 h-24" />
                      </div>
                    )}
                    <div className={`markdown-body max-w-none text-lg md:text-xl`}>
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  
                  {/* Matched Sites Links */}
                  {msg.role === 'model' && matchedSites(msg.content).length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {matchedSites(msg.content).map(site => (
                        <button
                          key={site.id}
                          onClick={() => {
                            onSelectSite(site);
                            onClose();
                          }}
                          className="px-4 py-2 bg-[#B22222]/5 border border-[#B22222]/20 text-[#B22222] text-xs font-bold rounded-full hover:bg-[#B22222] hover:text-white transition-all flex items-center gap-2 shadow-sm"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          前往【{site.name}】
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="flex gap-5">
                <div className="w-12 h-12 rounded-full bg-[#B22222] border-2 border-[#D4AF37]/30 text-white flex items-center justify-center animate-pulse">
                  <Compass className="w-6 h-6" />
                </div>
                <div className="p-6 bg-white border border-[#D4AF37]/20 rounded-sm shadow-sm flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#B22222] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[#B22222] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[#B22222] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-slate-400 calligraphy tracking-widest">正在思考中...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Collapsible Drawer Concept */}
        <div className="relative bg-[#F5F2ED] border-t border-[#D4AF37]/20 transition-all duration-500 ease-in-out shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
          
          {/* Toggle Handle */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => setIsInputExpanded(!isInputExpanded)}
              className="px-6 py-1.5 bg-[#F5F2ED] border border-[#D4AF37]/20 border-b-0 rounded-t-xl flex items-center gap-2 text-[10px] font-bold text-[#B22222] calligraphy tracking-[0.2em] shadow-[-5px_-5px_15px_rgba(0,0,0,0.05)] hover:bg-white transition-colors group"
            >
              {isInputExpanded ? <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" /> : <ChevronUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />}
              <span>{isInputExpanded ? '专注阅读' : '开启对话'}</span>
            </button>
          </div>

          <motion.div
            animate={{ 
              height: isInputExpanded ? 'auto' : '70px',
              backgroundColor: isInputExpanded ? '#F5F2ED' : '#FDFBF7'
            }}
            className="overflow-hidden"
          >
            <div className={`p-4 md:p-6 space-y-4 relative z-10 ${isInputExpanded ? '' : 'flex items-center justify-center h-full'}`}>
              
              {/* Suggestions - Only show when expanded */}
              <AnimatePresence>
                {isInputExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex flex-wrap gap-2 justify-center"
                  >
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        className="px-4 py-2 bg-white border border-[#D4AF37]/20 text-[10px] md:text-xs text-slate-600 hover:border-[#B22222] hover:text-[#B22222] hover:shadow-md transition-all rounded-full calligraphy shadow-sm"
                      >
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={`relative flex gap-3 items-center ${isInputExpanded ? 'w-full' : 'w-full max-w-2xl'}`}>
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(query)}
                    onFocus={() => setIsInputExpanded(true)}
                    placeholder="请教上师..."
                    className={`w-full px-6 py-3 bg-white border border-[#D4AF37]/30 rounded-full text-sm focus:ring-2 focus:ring-[#B22222] focus:border-transparent transition-all shadow-inner font-serif group-hover:border-[#D4AF37]/60`}
                  />
                  {!isInputExpanded && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                      <Sparkles className="w-3 h-3 text-[#D4AF37] animate-pulse" />
                      <span className="text-[10px] text-slate-300 calligraphy tracking-widest">智慧接引中</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleSend(query)}
                  disabled={!query.trim() || isThinking}
                  className="w-10 h-10 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center hover:bg-[#B22222] transition-all shadow-lg disabled:opacity-30 group shrink-0"
                >
                  <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
              
              {isInputExpanded && (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[9px] text-[#B22222]/60 calligraphy tracking-[0.4em] uppercase font-black">
                    Right View · 正见
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default MasterSearchModal;
