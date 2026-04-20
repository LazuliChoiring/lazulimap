import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, ChevronRight, Clock, Star, MapPin, CheckCircle2, Trophy, ArrowLeft, Sparkles, Footprints, History } from 'lucide-react';
import { PilgrimageRoute, ROUTES_DATA } from '../data/routes';
import { ReligiousSite } from '../data/sites';

interface PilgrimageRoutesProps {
  isOpen: boolean;
  onClose: () => void;
  sites: ReligiousSite[];
  checkIns: number[];
  onSelectSite: (site: ReligiousSite) => void;
  activeRouteId: string | null;
  onStartRoute: (routeId: string) => void;
  onCancelRoute: () => void;
  userLocation: [number, number] | null;
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

const PilgrimageRoutes: React.FC<PilgrimageRoutesProps> = ({ 
  isOpen, 
  onClose, 
  sites, 
  checkIns, 
  onSelectSite,
  activeRouteId,
  onStartRoute,
  onCancelRoute,
  userLocation
}) => {
  const [selectedRoute, setSelectedRoute] = useState<PilgrimageRoute | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('全部');

  if (!isOpen) return null;

  const categories = ['全部', ...Array.from(new Set(ROUTES_DATA.map(r => r.category)))];
  
  const filteredRoutes = activeCategory === '全部' 
    ? ROUTES_DATA 
    : ROUTES_DATA.filter(r => r.category === activeCategory);

  const getRouteProgress = (route: PilgrimageRoute) => {
    const completedSteps = route.steps.filter(step => checkIns.includes(step.siteId)).length;
    return {
      completed: completedSteps,
      total: route.steps.length,
      isFinished: completedSteps === route.steps.length,
      percent: (completedSteps / route.steps.length) * 100
    };
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl h-[85vh] bg-[#FDFBF7] shadow-2xl rounded-sm border border-[#D4AF37]/30 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 border-b border-[#D4AF37]/20 bg-[#F5F2ED] flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center text-white shadow-lg">
              <Compass className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold calligraphy tracking-widest text-[#1A1A1A]">寻踪问道</h2>
              <p className="text-xs text-[#D4AF37] font-black tracking-[0.3em] uppercase opacity-70">Pilgrimage Routes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-[#B22222]/10 rounded-full transition-colors">
            <MapPin className="w-7 h-7 text-[#1A1A1A]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <AnimatePresence mode="wait">
            {!selectedRoute ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-[#B22222]/5 border border-[#B22222]/10 p-8 rounded-sm mb-10 shadow-sm relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="calligraphy text-2xl text-[#B22222] italic mb-4">“夫道者，路也。寻迹而往，方得始终。”</p>
                    <p className="text-base text-slate-600 font-medium leading-relaxed">
                      精选官方问道路径，追随先贤足迹，在山水古迹间感悟千年文脉。完成整条路线可获得专属“结缘证”。
                    </p>
                  </div>
                  {activeRouteId && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelRoute();
                      }}
                      className="mt-6 flex items-center gap-2 text-xs font-black tracking-widest text-[#B22222] hover:text-[#8B0000] transition-colors group"
                    >
                      <History className="w-4 h-4 group-hover:rotate-[-180deg] transition-transform duration-500" />
                      回归本源 · 止步归心
                    </button>
                  )}
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-4 mb-8">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-6 py-2.5 rounded-sm text-sm font-bold tracking-widest transition-all calligraphy border-b-2 ${
                        activeCategory === category 
                        ? 'border-[#B22222] text-[#B22222] bg-[#B22222]/5' 
                        : 'border-transparent text-slate-400 hover:text-[#D4AF37] hover:bg-slate-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {filteredRoutes.map((route) => {
                    const progress = getRouteProgress(route);
                    const isActive = activeRouteId === route.id;

                    return (
                      <button
                        key={route.id}
                        onClick={() => setSelectedRoute(route)}
                        className="group relative bg-white border border-[#D4AF37]/20 p-6 rounded-sm text-left hover:border-[#B22222] transition-all shadow-sm hover:shadow-md overflow-hidden"
                      >
                        {isActive && (
                          <div className="absolute top-0 right-0 bg-[#B22222] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
                            进行中
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-2xl font-bold calligraphy text-[#1A1A1A] group-hover:text-[#B22222] transition-colors mb-2">
                              {route.title}
                            </h3>
                            <p className="text-base text-slate-500 font-medium">{route.subtitle}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                              route.difficulty === '初级' ? 'border-green-200 text-green-600 bg-green-50' :
                              route.difficulty === '中级' ? 'border-orange-200 text-orange-600 bg-orange-50' :
                              'border-red-200 text-red-600 bg-red-50'
                            }`}>
                              {route.difficulty}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-8 text-sm text-slate-400 font-medium mb-8">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {route.estimatedTime}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {route.steps.length} 个站点
                          </div>
                          {route.figure && (
                            <div className="flex items-center gap-2 text-[#D4AF37]">
                              <Star className="w-4 h-4 fill-current" />
                              {route.figure} 寻迹
                            </div>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-3">
                          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                            <span>问道进度</span>
                            <span>{progress.completed} / {progress.total}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress.percent}%` }}
                              className="h-full bg-[#B22222]"
                            />
                          </div>
                        </div>

                        <div className="mt-8 flex justify-between items-center">
                          <div className="flex gap-3">
                            {route.tags.map(tag => (
                              <span key={tag} className="text-xs text-slate-400 bg-slate-50 px-3 py-1 border border-slate-100 rounded-sm">
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <ChevronRight className="w-6 h-6 text-[#D4AF37]/30 group-hover:text-[#B22222] group-hover:translate-x-2 transition-all" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <button 
                  onClick={() => setSelectedRoute(null)}
                  className="flex items-center gap-2 text-base text-slate-500 hover:text-[#B22222] calligraphy group font-medium"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 返回路径列表
                </button>

                <div className="relative p-10 border border-[#D4AF37]/30 bg-white rounded-sm overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.05] -mr-10 -mt-10">
                    <Compass className="w-full h-full" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="px-4 py-1.5 bg-[#B22222] text-white text-xs font-bold uppercase tracking-widest rounded-sm">
                        {selectedRoute.difficulty}
                      </span>
                      <span className="text-sm text-[#D4AF37] font-bold">预计耗时 {selectedRoute.estimatedTime}</span>
                    </div>
                    <h3 className="text-4xl font-bold calligraphy text-[#1A1A1A] mb-4">{selectedRoute.title}</h3>
                    <p className="text-lg text-slate-600 leading-relaxed font-medium mb-8">
                      {selectedRoute.description}
                    </p>
                    
                    <button 
                      onClick={() => {
                        onStartRoute(selectedRoute.id);
                        onClose();
                      }}
                      className={`flex-1 py-5 rounded-sm text-base font-black tracking-[0.4em] uppercase transition-all flex items-center justify-center gap-4 ${
                        activeRouteId === selectedRoute.id 
                        ? 'bg-[#00A86B] text-white' 
                        : 'bg-[#1A1A1A] text-white hover:bg-[#B22222] shadow-xl'
                      }`}
                    >
                      {activeRouteId === selectedRoute.id ? (
                        <>
                          <CheckCircle2 className="w-6 h-6" />
                          正在此径修行中
                        </>
                      ) : (
                        <>
                          <Footprints className="w-6 h-6" />
                          接引此径 · 开启问道
                        </>
                      )}
                    </button>

                    {activeRouteId === selectedRoute.id && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelRoute();
                          onClose();
                        }}
                        className="w-full py-4 mt-4 bg-transparent border-2 border-[#B22222]/30 text-[#B22222] text-xs font-black tracking-[0.3em] uppercase hover:bg-[#B22222] hover:text-white transition-all flex items-center justify-center gap-3"
                      >
                        <History className="w-4 h-4" />
                        回归本源 · 止步归心
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-2xl font-bold calligraphy text-[#1A1A1A] border-l-4 border-[#B22222] pl-6">寻迹站点</h4>
                  <div className="relative ml-6 border-l-2 border-dashed border-[#D4AF37]/30 pl-10 space-y-12 py-6">
                    {selectedRoute.steps.map((step, index) => {
                      const site = sites.find(s => s.id === step.siteId);
                      const isCompleted = checkIns.includes(step.siteId);
                      
                      return (
                        <div key={step.siteId} className="relative">
                          <div className={`absolute -left-[53px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 shadow-sm ${
                            isCompleted ? 'bg-[#00A86B] border-[#00A86B] text-white' : 'bg-white border-[#D4AF37] text-[#D4AF37]'
                          }`}>
                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-bold">{index + 1}</span>}
                          </div>
                          
                          <div className="group">
                            <button 
                              onClick={() => site && onSelectSite(site)}
                              className="text-left"
                            >
                              <div className="flex justify-between items-start gap-4">
                                <h5 className={`text-xl font-bold calligraphy mb-2 group-hover:text-[#B22222] transition-colors ${isCompleted ? 'text-slate-400 line-through' : 'text-[#1A1A1A]'}`}>
                                  {site?.name}
                                </h5>
                                {userLocation && site && (
                                  <span className="text-xs font-mono text-[#D4AF37] font-bold bg-[#D4AF37]/10 px-2 py-1 rounded-sm shrink-0">
                                    距您 {getDistance(userLocation[1], userLocation[0], site.coordinates[1], site.coordinates[0]).toFixed(1)}km
                                  </span>
                                )}
                              </div>
                              <p className="text-base text-slate-500 font-medium leading-relaxed">
                                {step.description}
                              </p>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-8 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-sm flex items-center gap-8 shadow-inner">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md shrink-0 border border-[#D4AF37]/10">
                    <Trophy className="w-10 h-10 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h5 className="text-lg font-bold calligraphy text-[#1A1A1A] mb-2">圆满奖励</h5>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                      完成所有站点打卡，即可受持专属 <span className="text-[#B22222] font-bold">《{selectedRoute.rewardName}》</span>，并永久收录于您的云游小册。
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default PilgrimageRoutes;
