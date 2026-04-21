import React, { useEffect, useRef, useMemo } from 'react';
import { ReligiousSite } from '../data/sites';
import { PilgrimageRoute } from '../data/routes';
import { EnvironmentState } from '../hooks/useEnvironment';
import { motion, AnimatePresence } from 'motion/react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Navigation2 } from 'lucide-react';

interface MapComponentProps {
  sites: ReligiousSite[];
  onSiteClick: (site: ReligiousSite) => void;
  selectedSiteId?: number;
  center?: [number, number];
  zoom?: number;
  favorites: number[];
  checkIns: number[];
  activeRoute?: PilgrimageRoute | null;
  userLocation?: [number, number] | null;
  environment?: EnvironmentState;
  onRelocate?: () => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  sites, 
  onSiteClick, 
  selectedSiteId, 
  center = [120.153576, 30.287459], 
  zoom: initialZoom = 11,
  favorites = [],
  checkIns = [],
  activeRoute = null,
  userLocation = null,
  environment,
  onRelocate
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const amapInstance = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const routePolylineRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [currentZoom, setCurrentZoom] = React.useState(initialZoom);
  
  const prevZoomRef = useRef(initialZoom);
  const prevCenterRef = useRef(center);

  useEffect(() => {
    if (!amapInstance.current) return;
    const zoomChanged = initialZoom !== prevZoomRef.current;
    const centerChanged = JSON.stringify(center) !== JSON.stringify(prevCenterRef.current);
    if (zoomChanged) {
      amapInstance.current.setZoom(initialZoom, false, 800);
      prevZoomRef.current = initialZoom;
    }
    if (centerChanged) {
      amapInstance.current.setCenter(center, false, 800);
      prevCenterRef.current = center;
    }
  }, [initialZoom, center]);

  useEffect(() => {
    if (!window.AMap || !mapRef.current) return;
    if (!amapInstance.current) {
      const map = new window.AMap.Map(mapRef.current, {
        zoom: initialZoom,
        center,
        viewMode: '3D',
        pitch: 45,
        mapStyle: 'amap://styles/grey',
      });
      amapInstance.current = map;
      map.on('zoomend', () => setCurrentZoom(map.getZoom()));
      window.AMap.plugin(['AMap.Scale', 'AMap.ToolBar'], () => {
        map.addControl(new window.AMap.Scale());
        map.addControl(new window.AMap.ToolBar());
      });
    }

    sites.forEach(site => {
      const isSelected = site.id === selectedSiteId;
      const isCheckedIn = checkIns.includes(site.id);
      const isFavorite = favorites.includes(site.id);
      
      let color = '#B22222';
      if (isSelected) color = '#FFD700';
      else if (isCheckedIn) color = '#D4AF37';
      else if (isFavorite) color = '#B22222';
      else {
        color = site.religion === '佛教' ? '#D4AF37' : site.religion === '道教' ? '#1A1A1A' : '#B22222';
      }

      const scale = isSelected ? 1.4 : (isCheckedIn ? 1.2 : (isFavorite ? 1.1 : 0.9));
      const opacity = isCheckedIn ? 1 : (isFavorite ? 0.8 : 0.6);
      
      let iconContent = '';
      if (site.religion === '佛教') {
        iconContent = `<svg viewBox="0 0 100 100" width="${32 * scale}" height="${32 * scale}"><path d="M50 95C50 95 85 70 85 45C85 25 70 15 50 15C30 15 15 25 15 45C15 70 50 95 50 95Z" fill="${color}" stroke="${isCheckedIn ? '#FFD700' : '#B22222'}" stroke-width="2"/><path d="M50 95C50 95 75 75 75 55C75 40 65 30 50 30C35 30 25 40 25 55C25 75 50 95 50 95Z" fill="#FFD700" opacity="${isCheckedIn ? 1 : 0.6}"/><circle cx="50" cy="50" r="5" fill="${isCheckedIn ? '#FFF' : '#B22222'}"/></svg>`;
      } else if (site.religion === '道教') {
        iconContent = `<svg viewBox="0 0 100 100" width="${32 * scale}" height="${32 * scale}"><circle cx="50" cy="50" r="45" fill="white" stroke="${color}" stroke-width="${isSelected || isCheckedIn ? 4 : 2}"/><path d="M50 5A45 45 0 0 1 50 95A22.5 22.5 0 0 1 50 50A22.5 22.5 0 0 0 50 5" fill="${isCheckedIn ? '#D4AF37' : '#1A1A1A'}"/><circle cx="50" cy="27.5" r="7.5" fill="white"/><circle cx="50" cy="72.5" r="7.5" fill="${isCheckedIn ? '#D4AF37' : '#1A1A1A'}"/></svg>`;
      } else {
        iconContent = `<svg viewBox="0 0 100 100" width="${32 * scale}" height="${32 * scale}"><path d="M50 85L15 40L30 15L50 35L70 15L85 40L50 85Z" fill="${color}" stroke="${isCheckedIn ? '#FFD700' : '#D4AF37'}" stroke-width="2"/><circle cx="35" cy="40" r="4" fill="white"/><circle cx="65" cy="40" r="4" fill="white"/><path d="M45 65L50 70L55 65" stroke="white" fill="none"/></svg>`;
      }

      const glowClass = isCheckedIn ? 'marker-star-glow' : (isFavorite ? 'marker-yuan-glow' : '');
      const pulseClass = isSelected ? 'marker-pulse' : (isCheckedIn ? 'marker-star-pulse' : '');
      const routeStepIndex = activeRoute?.steps.findIndex(step => step.siteId === site.id);
      const isActiveRouteSite = routeStepIndex !== undefined && routeStepIndex !== -1;

      const content = `<div class="map-marker-container ${isSelected ? 'is-selected' : ''} ${glowClass}" style="display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: ${isSelected ? 1000 : (isCheckedIn ? 500 : (isFavorite ? 300 : 100))}; opacity: ${opacity};">${isActiveRouteSite ? `<div style="position: absolute; bottom: 100%; margin-bottom: 8px; background: white; padding: 4px 10px; border-radius: 4px; border: 1.5px solid ${color}; white-space: nowrap; box-shadow: 0 2px 10px rgba(0,0,0,0.1); pointer-events: none; display: flex; align-items: center; gap: 6px;"><span style="background: ${color}; color: white; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 10px; font-weight: bold;">${(routeStepIndex as number) + 1}</span><span style="font-family: 'Ma Shan Zheng', cursive; font-size: 14px; font-weight: bold; color: #1A1A1A;">${site.buildingName}</span></div>` : ''}<div class="marker-icon-wrapper" style="width: ${40 * scale}px; height: ${40 * scale}px; background-color: ${isCheckedIn ? '#FFF' : (isFavorite ? '#FDFBF7' : '#F5F2ED')}; border: ${isSelected || isCheckedIn || isActiveRouteSite ? '3px' : '2px'} solid ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; ${isCheckedIn ? 'box-shadow: 0 0 25px rgba(212, 175, 55, 0.8);' : (isFavorite ? 'box-shadow: 0 0 15px rgba(178, 34, 34, 0.4);' : '')}${isActiveRouteSite && !isCheckedIn ? `box-shadow: 0 0 15px ${color}66;` : ''}">${iconContent}</div><div style="width: 0; height: 0; border-left: ${6 * scale}px solid transparent; border-right: ${6 * scale}px solid transparent; border-top: ${8 * scale}px solid ${color}; margin-top: -2px;"></div>${pulseClass ? `<div class="${pulseClass}"></div>` : ''}</div>`;

      let marker = markersRef.current.get(site.id);
      if (marker) {
        marker.setContent(content);
        marker.setOffset(new window.AMap.Pixel(-20 * scale, -46 * scale));
        marker.setzIndex(isSelected ? 2000 : (isCheckedIn ? 1500 : (isFavorite ? 1200 : 1000)));
      } else {
        marker = new window.AMap.Marker({ position: site.coordinates, title: site.name, content, offset: new window.AMap.Pixel(-20 * scale, -46 * scale), extData: site, zIndex: isSelected ? 2000 : (isCheckedIn ? 1500 : (isFavorite ? 1200 : 1000)) });
        marker.on('click', () => onSiteClick(site));
        marker.setMap(amapInstance.current);
        markersRef.current.set(site.id, marker);
      }
    });

    const currentSiteIds = new Set(sites.map(s => s.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentSiteIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });
  }, [sites, onSiteClick, selectedSiteId, favorites, checkIns]);

  useEffect(() => {
    if (!amapInstance.current || !window.AMap) return;
    if (userLocation) {
      const content = `<div class="user-location-marker" style="position: relative; width: 24px; height: 24px;"><div style="position: absolute; inset: 0; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div><div style="position: absolute; inset: -8px; background: #3b82f6; border-radius: 50%; opacity: 0.3; animation: pulse 2s infinite;"></div></div>`;
      if (userMarkerRef.current) userMarkerRef.current.setPosition(userLocation);
      else {
        userMarkerRef.current = new window.AMap.Marker({ position: userLocation, content, offset: new window.AMap.Pixel(-12, -12), zIndex: 3000, title: '我的位置' });
        userMarkerRef.current.setMap(amapInstance.current);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  useEffect(() => {
    if (!amapInstance.current || !window.AMap) return;
    if (activeRoute) {
      const routeSites = activeRoute.steps.map(step => sites.find(s => s.id === step.siteId)).filter((s): s is ReligiousSite => !!s);
      const path = routeSites.map(s => s.coordinates);
      if (routePolylineRef.current) routePolylineRef.current.setPath(path);
      else {
        routePolylineRef.current = new window.AMap.Polyline({ path, strokeColor: '#B22222', strokeOpacity: 0.8, strokeWeight: 6, strokeStyle: 'dashed', strokeDasharray: [10, 10], lineJoin: 'round', lineCap: 'round', zIndex: 800, showDir: true });
        routePolylineRef.current.setMap(amapInstance.current);
      }
      if (path.length > 0) amapInstance.current.setFitView([routePolylineRef.current], false, [80, 80, 80, 80]);
    } else if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }
  }, [activeRoute, sites]);

  const getStats = () => {
    const stats: Record<string, { total: number, checkedIn: number, onlyFavorites: number }> = {};
    
    // Always calculate district-level stats to allow navigation at any zoom
    sites.forEach(site => {
      const key = site.district;
      if (!stats[key]) stats[key] = { total: 0, checkedIn: 0, onlyFavorites: 0 };
      stats[key].total++;
      if (checkIns.includes(site.id)) stats[key].checkedIn++;
      else if (favorites.includes(site.id)) stats[key].onlyFavorites++;
    });

    // Add city-wide summary
    const cityTotal = sites.length;
    const cityCheckedIn = checkIns.length;
    const cityOnlyFavorites = favorites.filter(id => !checkIns.includes(id)).length;
    
    const statsWithCity = {
      '杭州市': { total: cityTotal, checkedIn: cityCheckedIn, onlyFavorites: cityOnlyFavorites },
      ...stats
    };

    return { isCityLevel: currentZoom < 12.0, stats: statsWithCity };
  };

  const { isCityLevel, stats } = getStats();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const districtCenters = useMemo(() => {
    const centers: Record<string, [number, number]> = {};
    const districtCoords: Record<string, [number, number][]> = {};
    sites.forEach(site => {
      if (!districtCoords[site.district]) districtCoords[site.district] = [];
      districtCoords[site.district].push(site.coordinates);
    });
    Object.entries(districtCoords).forEach(([district, coords]) => {
      const avgLng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
      const avgLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
      centers[district] = [avgLng, avgLat];
    });
    centers['杭州市'] = [120.153576, 30.287459];
    return centers;
  }, [sites]);

  const handleDistrictClick = (district: string) => {
    if (!amapInstance.current) return;
    
    if (district === '杭州市') {
      amapInstance.current.setZoomAndCenter(11, [120.153576, 30.287459], false, 1200);
      return;
    }

    // Explicitly filter markers based on district property from metadata
    const districtMarkers: any[] = [];
    markersRef.current.forEach((marker) => {
      const site = marker.getExtData() as ReligiousSite;
      // More flexible matching for district names
      if (site && (site.district.includes(district) || district.includes(site.district))) {
        districtMarkers.push(marker);
      }
    });

    if (districtMarkers.length > 0) {
      if (isMobile) {
        // Significantly reduced padding to allow for maximum map visibility on small screens
        // [Top, Right, Bottom, Left]
        const padding: [number, number, number, number] = [60, 10, 150, 10];
        
        // Use fitView with a slightly longer animation or immediate jump to ensure accuracy
        amapInstance.current.setFitView(districtMarkers, false, padding, 16);
        
        // Periodic check to ensure we break the "City Overview" threshold (now 12.0)
        // If fitView result is too zoomed out, force a zoom to 13-14
        setTimeout(() => {
          if (amapInstance.current) {
            const currentZ = amapInstance.current.getZoom();
            // If still too zoomed out to trigger district view, force it
            if (currentZ < 12.5) {
              amapInstance.current.setZoom(13.5, false, 800);
            }
          }
        }, 500);
      } else {
        const padding: [number, number, number, number] = [100, 100, 100, 100];
        amapInstance.current.setFitView(districtMarkers, false, padding, 14);
      }
    } else {
      // Fallback to calculated centers
      const center = districtCenters[district];
      if (center) {
        amapInstance.current.setZoomAndCenter(14, center, false, 1200);
      }
    }
  };

  return (
    <div className="w-full h-full relative">
      <div 
        ref={mapRef} 
        className="w-full h-full transition-all duration-[2000ms] ease-in-out" 
        id="amap-container" 
        style={{ filter: environment?.filter || 'none' }}
      />
      {onRelocate && (
        <div className={`absolute z-20 ${isMobile ? 'bottom-20 right-6' : 'bottom-10 right-10'}`}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onRelocate}
            className="w-12 h-12 md:w-14 md:h-14 bg-white/90 backdrop-blur-md rounded-full border border-[#D4AF37]/30 shadow-2xl flex items-center justify-center text-[#B22222] hover:text-[#D4AF37] transition-colors"
            title="感应我的地理位置"
          >
            <Navigation2 className="w-6 h-6" />
          </motion.button>
        </div>
      )}
      
      {/* Stats Overlay - Optimized District Ledger */}
      <div className={`absolute z-20 flex flex-col gap-3 transition-all duration-500 ${isMobile ? 'bottom-24 left-0 right-0 px-6 shrink-0' : 'bottom-10 left-10'}`}>
        <motion.div 
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isMobile 
            ? 'bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-white/40 shadow-2xl overflow-hidden' 
            : 'bg-white/95 backdrop-blur-md p-5 border border-[#D4AF37]/30 shadow-2xl rounded-sm w-[240px] max-h-[420px] flex flex-col'}`}
        >
          <div className="flex items-center justify-between mb-4 shrink-0 pointer-events-auto">
            <motion.div layout className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => handleDistrictClick('杭州市')}>
              <div className="w-1 h-3.5 bg-[#B22222]" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#1A1A1A] tracking-[0.2em] uppercase leading-none mb-0.5">{isCityLevel ? '全市概览' : '区域志'}</span>
                <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest leading-none">Ledger</span>
              </div>
            </motion.div>
            {!isCityLevel && !isMobile && (
              <button 
                onClick={() => handleDistrictClick('杭州市')}
                className="text-[8px] font-bold text-[#B22222] opacity-60 hover:opacity-100 transition-all uppercase tracking-tighter"
              >返回全市</button>
            )}
          </div>
          
          <motion.div layout className={`pointer-events-auto custom-scrollbar ${isMobile ? 'flex gap-3 overflow-x-auto pb-2 -mx-1 px-1' : 'flex-1 overflow-y-auto pr-1 space-y-3'}`}>
            <AnimatePresence mode="popLayout">
              {Object.entries(stats)
                .sort((a, b) => (a[0] === '杭州市' ? -1 : b[0] === '杭州市' ? 1 : (b[1].checkedIn - a[1].checkedIn) || (b[1].total - a[1].total)))
                .map(([name, data], idx) => (
                <motion.div 
                  key={name} 
                  layout 
                  initial={{ opacity: 0, scale: 0.98 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.95 }} 
                  transition={{ delay: idx * 0.03 }} 
                  whileTap={{ scale: 0.95 }}
                  className={`${isMobile ? 'min-w-[140px] bg-white p-4 rounded-[1.5rem] border border-[#D4AF37]/20 shadow-xl flex flex-col justify-between' : 'w-full group/stat'} cursor-pointer`} 
                  onClick={() => handleDistrictClick(name)}
                >
                  <div className="w-full">
                    <div className="flex justify-between items-end mb-1">
                      <span className={`${isMobile ? 'text-sm' : 'text-sm'} calligraphy font-bold text-[#1A1A1A] group-hover/stat:text-[#B22222] transition-colors truncate`}>{name}</span>
                      <span className="text-[8px] font-bold text-slate-400 group-hover/stat:text-[#B22222]/60 bg-slate-50 px-1 py-0.5 rounded-sm shrink-0">{data.checkedIn}<span className="mx-0.5 opacity-20">/</span>{data.total}</span>
                    </div>
                    <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <motion.div layoutId={`progress-${name}`} initial={{ width: 0 }} animate={{ width: `${(data.checkedIn / data.total) * 100}%` }} className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B22222] z-10" />
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(data.onlyFavorites / data.total) * 100}%` }} className="h-full bg-[#B22222]/10" />
                    </div>
                  </div>
                  {isMobile && (
                    <div className="mt-3 flex items-center justify-between pointer-events-none">
                      <span className="text-[9px] text-[#D4AF37] font-bold">前往探寻</span>
                      <div className="w-8 h-8 bg-[#B22222] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#B22222]/20">
                        <Navigation2 className="w-4 h-4 rotate-45" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          {!isMobile && <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/90 to-transparent pointer-events-none rounded-b-sm" />}
        </motion.div>
        {!isMobile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#1A1A1A]/95 backdrop-blur-sm px-3 py-1.5 rounded-sm border-l border-[#B22222] self-start shadow-xl">
            <p className="text-[8px] text-white/70 font-bold tracking-[0.2em] uppercase calligraphy">{isCityLevel ? '放大地图 寻访各区灵韵' : '禅隐石不言 万法随心生'}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MapComponent);
