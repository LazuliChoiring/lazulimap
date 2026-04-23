import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, MapPin, ChevronRight, Sparkles, Settings, Calendar, Navigation2, History, Users, Compass, X, ExternalLink, Info, ChevronUp, ChevronDown, GripHorizontal } from 'lucide-react';
import { ReligiousSite } from '../data/sites';
import { motion, AnimatePresence, useDragControls, useMotionValue, useTransform } from 'motion/react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { EnvironmentState } from '../hooks/useEnvironment';
import { getUpcomingFestivals, SOLAR_TERMS_CULTURE } from '../utils/calendar';
import { useMediaQuery } from '../hooks/useMediaQuery';
import DailyZenFloating from './DailyZenFloating';

interface SidebarProps {
  sites: ReligiousSite[];
  onSelectSite: (site: ReligiousSite) => void;
  onSearch: (query: string, suggestions?: string[]) => void;
  onFilterChange: (filters: any) => void;
  isAiSearching: boolean;
  onChangeName: () => void;
  onOpenSocial: () => void;
  onOpenRoutes: () => void;
  userLocation: [number, number] | null;
  checkIns: { siteId: number, date: string }[];
  isGrandAchiever: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  environment: EnvironmentState;
}

// Helper for distance calculation
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sites, 
  onSelectSite, 
  onSearch, 
  onFilterChange, 
  isAiSearching, 
  onChangeName,
  onOpenSocial,
  onOpenRoutes,
  userLocation,
  checkIns,
  isGrandAchiever,
  isCollapsed,
  onToggleCollapse,
  environment
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'fate' | 'history' | 'filter'>('fate');
  const [religionFilter, setReligionFilter] = useState<string[]>([]);
  
  const userName = localStorage.getItem('user_name') || '同修';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const toggleReligion = (rel: string) => {
    const newFilter = religionFilter.includes(rel)
      ? religionFilter.filter(r => r !== rel)
      : [...religionFilter, rel];
    setReligionFilter(newFilter);
    onFilterChange({ religion: newFilter, status: [] });
  };

  // 1. "依次结缘" - Sites not visited, sorted by distance, with local filter
  const fateSites = useMemo(() => {
    let list = sites.filter(site => !checkIns.some(c => c.siteId === site.id));
    
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.district.toLowerCase().includes(q) ||
        s.buildingName?.toLowerCase().includes(q)
      );
    }
    
    let sorted = [...list];
    if (userLocation) {
      sorted.sort((a, b) => {
        const distA = getDistance(userLocation[1], userLocation[0], a.coordinates[1], a.coordinates[0]);
        const distB = getDistance(userLocation[1], userLocation[0], b.coordinates[1], b.coordinates[0]);
        return distA - distB;
      });
    }
    
    // Only show the top 20 "waiting for fate" sites
    return sorted.slice(0, 20);
  }, [sites, checkIns, userLocation]);

  // 2. "云游小册" - Sites visited, sorted by date
  const historySites = useMemo(() => {
    const visited = checkIns.map(ci => {
      const site = sites.find(s => s.id === ci.siteId);
      return site ? { ...site, checkInDate: ci.date } : null;
    }).filter(Boolean) as (ReligiousSite & { checkInDate: string })[];

    return visited.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());
  }, [sites, checkIns]);

  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Mobile Bottom Sheet State
  const [sheetState, setSheetState] = useState<'minimized' | 'half' | 'full'>('half');
  const dragY = useMotionValue(0);
  
  // Snap points for mobile: [Docked, Full]
  const snapPoints = {
    minimized: 0.92, // Fixed bottom dock height (~72px)
    full: 0.04      // Almost top
  };

  const currentSnapY = useMemo(() => {
    if (!isMobile) return 0;
    const height = window.innerHeight;
    return height * (sheetState === 'minimized' ? snapPoints.minimized : snapPoints.full);
  }, [sheetState, isMobile]);

  const handleDragEnd = (event: any, info: any) => {
    if (!isMobile) return;
    
    const velocity = info.velocity.y;
    const offset = info.offset.y;
    
    if (velocity > 400 || offset > 150) {
      setSheetState('minimized');
    } else if (velocity < -400 || offset < -150) {
      setSheetState('full');
    }
  };

  if (isMobile) {
    const height = window.innerHeight;
    const minimizedY = height * snapPoints.minimized;

    return (
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: minimizedY }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={{ y: currentSnapY }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-x-0 bottom-0 z-[100] h-[100vh] flex flex-col"
      >
        {/* The "Lily Pad" Sheet */}
        <div className="flex-1 bg-[#F5F2ED]/95 backdrop-blur-2xl border-t border-[#D4AF37]/30 shadow-[0_-20px_60px_rgba(0,0,0,0.15)] rounded-t-[40px] flex flex-col overflow-hidden">
          {/* Dock Area / Drag Handle */}
          <div className="w-full h-[72px] shrink-0 flex flex-col items-center relative cursor-grab active:cursor-grabbing">
            {/* Visual Handle */}
            <div className="w-12 h-1 bg-[#D4AF37]/30 rounded-full mt-3 mb-2" />
            
            {/* Navigation Icons Row (Only visible when minimized or as quick-nav) */}
            <div className="w-full px-6 flex items-center justify-between">
               <button 
                 onClick={(e) => { e.stopPropagation(); setSheetState('full'); setActiveTab('fate'); }}
                 className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'fate' ? 'text-[#B22222]' : 'text-slate-400'}`}
               >
                 <Compass className="w-5 h-5" />
                 <span className="text-[9px] font-bold calligraphy tracking-widest">结缘</span>
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); setSheetState('full'); setActiveTab('history'); }}
                 className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-[#B22222]' : 'text-slate-400'}`}
               >
                 <History className="w-5 h-5" />
                 <span className="text-[9px] font-bold calligraphy tracking-widest">小册</span>
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); setSheetState('full'); onOpenRoutes(); }}
                 className="flex flex-col items-center gap-1 text-slate-400"
               >
                 <Navigation2 className="w-5 h-5" />
                 <span className="text-[9px] font-bold calligraphy tracking-widest">灵感</span>
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); setSheetState('full'); onOpenSocial(); }}
                 className="flex flex-col items-center gap-1 text-slate-400"
               >
                 <Users className="w-5 h-5" />
                 <span className="text-[9px] font-bold calligraphy tracking-widest">同修</span>
               </button>
            </div>
          </div>

      {/* Content Area */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-300 ${sheetState === 'minimized' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Mobile Insight Area: Weather & Daily Zen (Now cleaner) */}
        {environment?.weather && (
          <div className="px-6 py-4 flex items-center justify-between bg-white/40 border-b border-[#D4AF37]/10 mb-2 shrink-0">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full border border-[#B22222]/30 flex items-center justify-center bg-white/60">
                  <span className="calligraphy text-xl text-[#B22222]">
                    {environment.weather?.weather?.includes('雨') ? '雨' : 
                     environment.weather?.weather?.includes('云') ? '云' : 
                     environment.weather?.weather?.includes('阴') ? '阴' : '晴'}
                  </span>
               </div>
               <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#B22222] tracking-widest uppercase mb-0.5">
                      {environment.timeOfDay === 'dawn' ? '晨曦' : 
                       environment.timeOfDay === 'day' ? '正午' : 
                       environment.timeOfDay === 'dusk' ? '晚钟' : '月明'}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-[#D4AF37]/40" />
                    <span className="text-[10px] font-bold text-slate-400">
                      {environment.weather?.temperature}°C
                    </span>
                  </div>
                  <span className="text-[10px] calligraphy text-slate-500 font-bold tracking-widest">
                    {environment.calendar.lunar} · {environment.calendar.shichen}
                  </span>
               </div>
            </div>
          </div>
        )}

        {/* Header Section */}
            <div className="px-6 pb-4 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-3 calligraphy">
                  {/* Mobile Logo: Refined White Dagoba Silhouette */}
                  <div className="w-10 h-10 bg-[#B22222] rounded-sm flex items-center justify-center text-white shadow-md shrink-0 relative overflow-hidden border border-white/10">
                    <svg viewBox="0 0 100 100" className="w-7 h-7 fill-current">
                      <path d="M25 88 L75 88 L72 80 L28 80 Z" opacity="0.8" />
                      <path d="M32 80 L68 80 L66 74 L34 74 Z" />
                      <path d="M50 74 C30 74 30 48 50 48 C70 48 70 74 50 74 Z" />
                      <rect x="44" y="44" width="12" height="4" />
                      <path d="M47 44 L53 44 L51 18 L49 18 Z" />
                      {[22, 26, 30, 34, 38].map(y => (
                        <rect key={y} x={50 - (42-y)/2} y={y} width={42-y} height="1.5" rx="0.5" />
                      ))}
                      <circle cx="50" cy="14" r="3" />
                    </svg>
                  </div>
                  <span className="tracking-widest">寻筑觅禅</span>
                </h1>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={onOpenRoutes} className="p-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full">
                  <Compass className="w-5 h-5" />
                </button>
                <button onClick={onOpenSocial} className="p-2 bg-[#B22222]/10 text-[#B22222] rounded-full">
                  <Users className="w-5 h-5" />
                </button>
                <button onClick={onChangeName} className="p-2 bg-slate-100 text-slate-500 rounded-full">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>

              {/* AI Search Trigger */}
              <button 
                onClick={() => onSearch('')}
                className="w-full flex items-center gap-3 px-6 py-3 bg-white/60 border border-[#D4AF37]/20 rounded-full text-sm hover:bg-white transition-all shadow-sm"
              >
                <Search className="w-4 h-4 text-[#D4AF37]" />
                <span className="flex-1 text-left text-slate-400 calligraphy truncate">开启智慧对话...</span>
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#D4AF37]/10 px-2">
              {[
                { id: 'fate', label: '山门', icon: Navigation2 },
                { id: 'history', label: '足迹', icon: History },
                { id: 'filter', label: '筛选', icon: Filter }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-bold tracking-widest transition-all relative ${activeTab === tab.id ? 'text-[#B22222]' : 'text-slate-400'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="calligraphy">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div layoutId="activeTabMobile" className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#B22222]" />
                  )}
                </button>
              ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === 'fate' && (
                  <motion.div key="fate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    {fateSites.map((site, index) => {
                      const distance = userLocation ? getDistance(userLocation[1], userLocation[0], site.coordinates[1], site.coordinates[0]) : null;
                      return (
                        <button
                          key={site.id}
                          onClick={() => onSelectSite(site)}
                          className="w-full text-left p-4 bg-white/50 border border-[#D4AF37]/10 rounded-xl flex items-center justify-between group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="text-base font-bold text-[#1A1A1A] calligraphy truncate">{site.name}</h3>
                              {distance !== null && (
                                <span className="text-[10px] font-bold font-mono text-white bg-[#B22222] px-2.5 py-0.5 rounded-full shrink-0 shadow-sm">
                                  {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">{site.address}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#D4AF37]/40 ml-2" />
                        </button>
                      );
                    })}
                  </motion.div>
                )}
                {activeTab === 'history' && (
                  <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    {historySites.length > 0 ? (
                      historySites.map(site => (
                        <button
                          key={site.id}
                          onClick={() => onSelectSite(site)}
                          className="w-full text-left p-4 bg-white/50 border border-[#D4AF37]/10 rounded-xl flex flex-col gap-1"
                        >
                          <h3 className="text-base font-bold text-[#1A1A1A] calligraphy">{site.name}</h3>
                          <span className="text-[10px] font-mono text-slate-400">
                            {format(new Date(site.checkInDate), 'yyyy年MM月dd日', { locale: zhCN })}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="py-12 text-center text-slate-400 italic calligraphy">尚未开启云游之旅</div>
                    )}
                  </motion.div>
                )}
                {activeTab === 'filter' && (
                  <motion.div key="filter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-4">
                    <h4 className="text-xs font-black text-[#B22222] tracking-widest uppercase calligraphy">教派分类</h4>
                    <div className="flex flex-wrap gap-2">
                      {['佛教', '道教', '民间信仰'].map(rel => (
                        <button
                          key={rel}
                          onClick={() => toggleReligion(rel)}
                          className={`px-4 py-2 text-xs font-bold transition-all border calligraphy rounded-full ${religionFilter.includes(rel) ? 'bg-[#B22222] text-white border-[#B22222]' : 'bg-white text-slate-600 border-[#D4AF37]/30'}`}
                        >
                          {rel}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div 
      className={`h-[40%] md:h-full z-[150] relative transition-all duration-500 ease-in-out ${isCollapsed ? 'w-0' : 'w-full md:w-[440px]'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background and Clipping Layer */}
      <motion.div 
        animate={{ 
          backgroundColor: isHovered ? "rgba(245, 242, 237, 1)" : "rgba(245, 242, 237, 0.85)",
          backdropFilter: isHovered ? "blur(0px)" : "blur(12px)"
        }}
        className="absolute inset-0 border-b md:border-b-0 md:border-r border-[#D4AF37]/30 shadow-2xl overflow-hidden"
      >
        {/* Content Layer (Fixed Width to prevent squishing) */}
        <div className="w-full md:w-[440px] h-full flex flex-col relative">
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
          
          {/* Content with its own opacity transition */}
          <div className={`w-full h-full flex flex-col transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {/* Header Section */}
      <div className="px-6 py-6 md:p-8 border-b border-[#D4AF37]/20 bg-[#F5F2ED] relative z-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-8">
                {/* Redesigned Logo: Enlarge and Center White Dagoba Silhouette */}
                <div className="w-20 h-20 md:w-24 md:h-24 bg-[#B22222] rounded-sm flex items-center justify-center text-white shadow-2xl shrink-0 relative group/logo overflow-hidden border-2 border-[#D4AF37]/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                  <svg viewBox="0 0 100 100" className="w-14 h-14 md:w-16 md:h-16 fill-current drop-shadow-lg">
                    {/* White Dagoba (Stupa) Silhouette - Enlarged and Centered */}
                    <path d="M20 88 L80 88 L76 78 L24 78 Z" opacity="0.8" />
                    <path d="M28 78 L72 78 L70 70 L30 70 Z" />
                    <path d="M50 70 C25 70 25 40 50 40 C75 40 75 70 50 70 Z" />
                    <rect x="42" y="38" width="16" height="5" />
                    <path d="M46 38 L54 38 L52 10 L48 10 Z" />
                    {[14, 19, 24, 29, 34].map(y => (
                      <rect key={y} x={50 - (40-y)/1.5} y={y} width={(40-y)*1.33} height="2" rx="0.5" />
                    ))}
                    <circle cx="50" cy="6" r="4" />
                  </svg>
                  <div className="absolute inset-0 border border-white/10" />
                  <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
                </div>
                
                <div className="flex flex-col justify-center">
                  <h1 className="flex flex-col text-3xl md:text-5xl font-bold text-[#1A1A1A] calligraphy leading-tight">
                    <div className="flex gap-3 tracking-[0.6em]">
                      <span>寻</span>
                      <span>筑</span>
                    </div>
                    <div className="flex gap-3 tracking-[0.6em] mt-2">
                      <span>觅</span>
                      <span>禅</span>
                    </div>
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Username as a small vertical seal/signature */}
                <div className="flex flex-col items-center gap-2">
                  <div className="[writing-mode:vertical-rl] text-[#B22222] text-sm font-bold tracking-[0.3em] calligraphy px-1 border-r border-[#B22222]/20">
                    {isGrandAchiever && <Sparkles className="w-3 h-3 mb-1 animate-pulse" />}
                    {userName}
                  </div>
                  <div className="w-4 h-4 bg-[#B22222] rounded-[1px] flex items-center justify-center text-[8px] text-white font-black calligraphy">
                    印
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={onOpenRoutes}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-3 bg-white/60 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white rounded-sm transition-all group shadow-sm overflow-hidden"
            >
              <Compass className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-700 shrink-0" />
              <span className="text-sm md:text-base font-bold tracking-widest calligraphy whitespace-nowrap">寻踪问道</span>
            </button>
            <button 
              onClick={onOpenSocial}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-3 bg-white/60 border border-[#B22222]/30 text-[#B22222] hover:bg-[#B22222] hover:text-white rounded-sm transition-all group shadow-sm overflow-hidden"
            >
              <Users className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform shrink-0" />
              <span className="text-sm md:text-base font-bold tracking-widest calligraphy whitespace-nowrap">同修录</span>
            </button>
            <button 
              onClick={onChangeName}
              className="p-3 text-[#D4AF37] hover:text-[#B22222] hover:bg-white/80 border border-[#D4AF37]/20 rounded-sm transition-all shadow-sm shrink-0"
              title="修改称呼"
            >
              <Settings className="w-6 h-6 animate-spin-slow hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>
      </div>

        {/* Search Bar - Now a trigger for AI Master Search */}
      <div className="p-4 md:p-6 bg-white/30 backdrop-blur-sm border-b border-[#D4AF37]/10 shrink-0 space-y-4">
        <button 
          onClick={() => onSearch('')}
          className="w-full flex items-center gap-4 px-8 py-4 bg-white/80 border border-[#D4AF37]/30 rounded-full text-base hover:border-[#B22222] hover:bg-white transition-all group shadow-sm"
        >
          <Search className="w-5 h-5 text-[#D4AF37] group-hover:text-[#B22222] transition-colors" />
          <span className="flex-1 text-left text-slate-400 calligraphy truncate font-medium">
            开启智慧对话，寻访古迹正见...
          </span>
          <Sparkles className="w-5 h-5 text-[#D4AF37] group-hover:text-[#B22222] group-hover:animate-pulse" />
        </button>

        {/* Local Quick Filter */}
        <div className="relative">
          <input 
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="在列表中快速检索名称或区域..."
            className="w-full pl-10 pr-4 py-2 bg-white/60 border border-[#D4AF37]/15 rounded-md text-sm outline-none focus:border-[#B22222]/30 transition-all font-medium calligraphy"
          />
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          {localSearch && (
            <button 
              onClick={() => setLocalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#B22222]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#D4AF37]/10 bg-white/10 shrink-0">
        {[
          { id: 'fate', label: '山门全录', icon: Navigation2 },
          { id: 'history', label: '云游小册', icon: History },
          { id: 'filter', label: '分类筛选', icon: Filter }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-5 flex flex-col items-center gap-2 text-sm md:text-base font-bold tracking-widest transition-all relative ${activeTab === tab.id ? 'text-[#B22222]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <tab.icon className={`w-5 h-5 md:w-6 md:h-6 ${activeTab === tab.id ? 'text-[#B22222]' : 'text-slate-300'}`} />
            <span className="calligraphy">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-[#B22222]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <AnimatePresence mode="wait">
          {activeTab === 'fate' && (
            <motion.div
              key="fate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 space-y-3"
            >
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-sm text-slate-400 font-bold uppercase tracking-tighter">静候结缘 ({fateSites.length})</span>
                {userLocation && <span className="text-sm text-[#B22222]/60 font-medium calligraphy">已开启距离感应</span>}
              </div>
              {fateSites.length > 0 ? (
                fateSites.map((site, index) => {
                  const distance = userLocation ? getDistance(userLocation[1], userLocation[0], site.coordinates[1], site.coordinates[0]) : null;
                  return (
                    <motion.button
                      key={site.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => onSelectSite(site)}
                      className="w-full text-left p-6 bg-white/50 border border-[#D4AF37]/10 hover:border-[#B22222]/30 hover:bg-white/90 hover:shadow-sm transition-all group relative overflow-hidden rounded-sm"
                    >
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg md:text-xl font-bold text-[#1A1A1A] group-hover:text-[#B22222] transition-all calligraphy">
                            {site.name}
                          </h3>
                          {distance !== null && (
                            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-sm">
                              {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 truncate w-full font-medium mb-3">{site.address}</p>
                        <div className="flex gap-3">
                          <span className="px-3 py-1 text-xs font-bold border border-[#D4AF37]/20 text-[#D4AF37] bg-[#D4AF37]/5">
                            {site.religion}
                          </span>
                          <span className="px-3 py-1 text-xs font-bold border border-slate-200 text-slate-400">
                            {site.district}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]/20 group-hover:text-[#B22222] group-hover:translate-x-1 transition-all" />
                    </motion.button>
                  );
                })
              ) : (
                <div className="py-16 text-center px-6 flex flex-col items-center">
                  <div className="relative flex flex-col items-center">
                    {/* Compass Icon - Closer to text */}
                    <div className="w-16 h-16 bg-[#B22222]/5 rounded-full flex items-center justify-center mb-6 relative z-10">
                      <Compass className="w-8 h-8 text-[#B22222]/20 animate-spin-slow" />
                      <div className="absolute inset-0 border border-[#B22222]/5 rounded-full animate-ping" />
                    </div>
                    
                    {/* Connecting decorative line */}
                    <div className="w-px h-8 bg-gradient-to-b from-[#B22222]/20 to-transparent mb-6" />

                    {/* Poem - Moved up and refined spacing */}
                    <div className="flex flex-row-reverse justify-center gap-6 md:gap-8 h-72 opacity-60 border-r border-[#D4AF37]/15 pr-8">
                      <span className="[writing-mode:vertical-rl] text-lg md:text-xl text-slate-400 calligraphy tracking-[0.5em] leading-none">悠然觅真意</span>
                      <span className="[writing-mode:vertical-rl] text-lg md:text-xl text-slate-400 calligraphy tracking-[0.5em] leading-none">禅隐石不言</span>
                      <span className="[writing-mode:vertical-rl] text-lg md:text-xl text-slate-400 calligraphy tracking-[0.5em] leading-none">尘霁灵光现</span>
                      <span className="[writing-mode:vertical-rl] text-lg md:text-xl text-slate-400 calligraphy tracking-[0.5em] leading-none">足下即心莲</span>
                    </div>
                  </div>
                  
                  <p className="text-[9px] text-slate-200 tracking-[0.4em] uppercase mt-10 opacity-50">
                    Seek and you shall find in the silence of stones
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 space-y-4"
            >
              <div className="px-3 py-2">
                <span className="text-sm text-slate-400 font-bold uppercase tracking-tighter">云游足迹 ({historySites.length})</span>
              </div>
              {historySites.length > 0 ? (
                <div className="relative border-l border-[#D4AF37]/20 ml-4 pl-8 space-y-8 py-3">
                  {historySites.map((site, index) => (
                    <motion.div
                      key={site.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[37px] top-1.5 w-3 h-3 rounded-full bg-[#B22222] border-2 border-[#F5F2ED] z-10" />
                      
                      <button
                        onClick={() => onSelectSite(site)}
                        className="w-full text-left group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-[#D4AF37]" />
                          <span className="text-sm font-mono text-slate-400">
                            {format(new Date(site.checkInDate), 'yyyy年MM月dd日', { locale: zhCN })}
                          </span>
                        </div>
                        <div className="p-4 bg-white/40 border border-transparent group-hover:border-[#B22222]/20 group-hover:bg-white/80 transition-all rounded-sm">
                          <h3 className="text-lg font-bold text-[#1A1A1A] group-hover:text-[#B22222] transition-all calligraphy">
                            {site.name}
                          </h3>
                          <p className="text-sm text-slate-500 mt-2 italic">已结缘</p>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-sm text-slate-400 italic calligraphy">尚未开启云游之旅</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'filter' && (
            <motion.div
              key="filter"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 space-y-10"
            >
              <div>
                <h4 className="text-sm md:text-base font-black text-[#B22222] mb-6 tracking-widest uppercase flex items-center gap-3 calligraphy">
                  <div className="w-1.5 h-4 bg-[#B22222]" />
                  教派分类
                </h4>
                <div className="flex flex-wrap gap-3">
                  {['佛教', '道教', '民间信仰'].map(rel => (
                    <button
                      key={rel}
                      onClick={() => toggleReligion(rel)}
                      className={`px-6 py-3 text-xs md:text-sm font-bold transition-all border calligraphy ${religionFilter.includes(rel) ? 'bg-[#B22222] text-white border-[#B22222] shadow-md' : 'bg-white text-slate-600 border-[#D4AF37]/30 hover:border-[#B22222]/50'}`}
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="p-6 bg-[#B22222]/5 border border-[#B22222]/10 rounded-sm">
                <p className="text-xs md:text-sm text-[#B22222]/70 leading-relaxed italic calligraphy">
                  “万法唯心，所见皆缘。根据您的步履，我们为您指引最近的灵山。”
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>

    {/* Collapse Toggle Button - Outside the clipping layer but inside the width-transitioning parent */}
    <button
      onClick={onToggleCollapse}
      className={`absolute top-1/2 -translate-y-1/2 z-20 w-8 h-24 bg-[#F5F2ED] border border-[#D4AF37]/30 border-l-0 flex items-center justify-center text-[#B22222] hover:bg-white transition-all shadow-md rounded-r-lg left-full`}
      title={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
    >
      <motion.div
        animate={{ rotate: isCollapsed ? 0 : 180 }}
        transition={{ duration: 0.5 }}
      >
        <ChevronRight className="w-6 h-6" />
      </motion.div>
    </button>
  </div>
  );
};

export default React.memo(Sidebar);
