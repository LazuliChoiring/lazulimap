import React, { useEffect, useRef, useMemo } from 'react';
import { ReligiousSite } from '../data/sites';
import { PilgrimageRoute } from '../data/routes';
import { EnvironmentState } from '../hooks/useEnvironment';
import { motion, AnimatePresence } from 'motion/react';
import { useMediaQuery } from '../hooks/useMediaQuery';

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
  environment
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const amapInstance = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const routePolylineRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [currentZoom, setCurrentZoom] = React.useState(initialZoom);
  
  // Track previous props to detect actual changes from parent
  const prevZoomRef = useRef(initialZoom);
  const prevCenterRef = useRef(center);

  // Handle prop changes for zoom and center
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
        mapStyle: 'amap://styles/grey', // Ink wash feel
      });
      amapInstance.current = map;

      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });

      window.AMap.plugin(['AMap.Scale', 'AMap.ToolBar'], () => {
        map.addControl(new window.AMap.Scale());
        map.addControl(new window.AMap.ToolBar());
      });
    }

    // Update or Add markers
    sites.forEach(site => {
      const isSelected = site.id === selectedSiteId;
      const isFavorite = favorites.includes(site.id);
      const isCheckedIn = checkIns.includes(site.id);
      
      let color = '#B22222'; // Default
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
        iconContent = `
          <svg viewBox="0 0 100 100" width="${32 * scale}" height="${32 * scale}">
            <path d="M50 95C50 95 85 70 85 45C85 25 70 15 50 15C30 15 15 25 15 45C15 70 50 95 50 95Z" fill="${color}" stroke="${isCheckedIn ? '#FFD700' : '#B22222'}" stroke-width="2"/>
            <path d="M50 95C50 95 75 75 75 55C75 40 65 30 50 30C35 30 25 40 25 55C25 75 50 95 50 95Z" fill="#FFD700" opacity="${isCheckedIn ? 1 : 0.6}"/>
            <circle cx="50" cy="50" r="5" fill="${isCheckedIn ? '#FFF' : '#B22222'}"/>
          </svg>
        `;
      } else if (site.religion === '道教') {
        iconContent = `
          <svg viewBox="0 0 100 100" width="${32 * scale}" height="${32 * scale}">
            <circle cx="50" cy="50" r="45" fill="white" stroke="${color}" stroke-width="${isSelected || isCheckedIn ? 4 : 2}"/>
            <path d="M50 5A45 45 0 0 1 50 95A22.5 22.5 0 0 1 50 50A22.5 22.5 0 0 0 50 5" fill="${isCheckedIn ? '#D4AF37' : '#1A1A1A'}"/>
            <circle cx="50" cy="27.5" r="7.5" fill="white"/>
            <circle cx="50" cy="72.5" r="7.5" fill="${isCheckedIn ? '#D4AF37' : '#1A1A1A'}"/>
          </svg>
        `;
      } else {
        iconContent = `
          <svg viewBox="0 0 100 100" width="${32 * scale}" height="${32 * scale}">
            <path d="M50 85L15 40L30 15L50 35L70 15L85 40L50 85Z" fill="${color}" stroke="${isCheckedIn ? '#FFD700' : '#D4AF37'}" stroke-width="2"/>
            <circle cx="35" cy="40" r="4" fill="white"/>
            <circle cx="65" cy="40" r="4" fill="white"/>
            <path d="M45 65L50 70L55 65" stroke="white" fill="none"/>
          </svg>
        `;
      }

      const glowClass = isCheckedIn ? 'marker-star-glow' : (isFavorite ? 'marker-yuan-glow' : '');
      const pulseClass = isSelected ? 'marker-pulse' : (isCheckedIn ? 'marker-star-pulse' : '');

      const routeStepIndex = activeRoute?.steps.findIndex(step => step.siteId === site.id);
      const isActiveRouteSite = routeStepIndex !== undefined && routeStepIndex !== -1;

      const content = `
        <div class="map-marker-container ${isSelected ? 'is-selected' : ''} ${glowClass}" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: ${isSelected ? 1000 : (isCheckedIn ? 500 : (isFavorite ? 300 : 100))};
          opacity: ${opacity};
        ">
          ${isActiveRouteSite ? `
            <div style="
              position: absolute;
              bottom: 100%;
              margin-bottom: 8px;
              background: white;
              padding: 4px 10px;
              border-radius: 4px;
              border: 1.5px solid ${color};
              white-space: nowrap;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              pointer-events: none;
              display: flex;
              align-items: center;
              gap: 6px;
            ">
              <span style="background: ${color}; color: white; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 10px; font-weight: bold;">${(routeStepIndex as number) + 1}</span>
              <span style="font-family: 'Ma Shan Zheng', cursive; font-size: 14px; font-weight: bold; color: #1A1A1A;">${site.buildingName}</span>
            </div>
          ` : ''}
          <div class="marker-icon-wrapper" style="
            width: ${40 * scale}px;
            height: ${40 * scale}px;
            background-color: ${isCheckedIn ? '#FFF' : (isFavorite ? '#FDFBF7' : '#F5F2ED')};
            border: ${isSelected || isCheckedIn || isActiveRouteSite ? '3px' : '2px'} solid ${color};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            ${isCheckedIn ? 'box-shadow: 0 0 25px rgba(212, 175, 55, 0.8);' : (isFavorite ? 'box-shadow: 0 0 15px rgba(178, 34, 34, 0.4);' : '')}
            ${isActiveRouteSite && !isCheckedIn ? `box-shadow: 0 0 15px ${color}66;` : ''}
          ">
            ${iconContent}
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: ${6 * scale}px solid transparent;
            border-right: ${6 * scale}px solid transparent;
            border-top: ${8 * scale}px solid ${color};
            margin-top: -2px;
          "></div>
          ${pulseClass ? `<div class="${pulseClass}"></div>` : ''}
        </div>
      `;

      let marker = markersRef.current.get(site.id);
      
      if (marker) {
        // Update existing marker
        marker.setContent(content);
        marker.setOffset(new window.AMap.Pixel(-20 * scale, -46 * scale));
        marker.setzIndex(isSelected ? 2000 : (isCheckedIn ? 1500 : (isFavorite ? 1200 : 1000)));
      } else {
        // Create new marker
        marker = new window.AMap.Marker({
          position: site.coordinates,
          title: site.name,
          content: content,
          offset: new window.AMap.Pixel(-20 * scale, -46 * scale),
          extData: site,
          zIndex: isSelected ? 2000 : (isCheckedIn ? 1500 : (isFavorite ? 1200 : 1000))
        });

        marker.on('click', () => {
          onSiteClick(site);
        });

        marker.setMap(amapInstance.current);
        markersRef.current.set(site.id, marker);
      }
    });

    // Remove markers for sites no longer in the list
    const currentSiteIds = new Set(sites.map(s => s.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentSiteIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });
  }, [sites, onSiteClick, selectedSiteId, favorites, checkIns]);

  // Handle User Location Marker
  useEffect(() => {
    if (!amapInstance.current || !window.AMap) return;

    if (userLocation) {
      const content = `
        <div class="user-location-marker" style="position: relative; width: 24px; height: 24px;">
          <div style="position: absolute; inset: 0; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>
          <div style="position: absolute; inset: -8px; background: #3b82f6; border-radius: 50%; opacity: 0.3; animation: pulse 2s infinite;"></div>
        </div>
      `;

      if (userMarkerRef.current) {
        userMarkerRef.current.setPosition(userLocation);
      } else {
        userMarkerRef.current = new window.AMap.Marker({
          position: userLocation,
          content: content,
          offset: new window.AMap.Pixel(-12, -12),
          zIndex: 3000,
          title: '我的位置'
        });
        userMarkerRef.current.setMap(amapInstance.current);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  // Handle Route Visualization
  useEffect(() => {
    if (!amapInstance.current || !window.AMap) return;

    if (activeRoute) {
      const routeSites = activeRoute.steps
        .map(step => sites.find(s => s.id === step.siteId))
        .filter((s): s is ReligiousSite => !!s);
      
      const path = routeSites.map(s => s.coordinates);

      if (routePolylineRef.current) {
        routePolylineRef.current.setPath(path);
      } else {
        routePolylineRef.current = new window.AMap.Polyline({
          path: path,
          strokeColor: '#B22222',
          strokeOpacity: 0.8,
          strokeWeight: 6,
          strokeStyle: 'dashed',
          strokeDasharray: [10, 10],
          lineJoin: 'round',
          lineCap: 'round',
          zIndex: 800,
          showDir: true
        });
        routePolylineRef.current.setMap(amapInstance.current);
      }

      // Fit map to route
      if (path.length > 0) {
        amapInstance.current.setFitView([routePolylineRef.current], false, [80, 80, 80, 80]);
      }
    } else if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }
  }, [activeRoute, sites]);

  const getStats = () => {
    const isCityLevel = currentZoom < 13;
    const stats: Record<string, { total: number, checkedIn: number, onlyFavorites: number }> = {};

    sites.forEach(site => {
      const key = isCityLevel ? '杭州市' : site.district;
      if (!stats[key]) {
        stats[key] = { total: 0, checkedIn: 0, onlyFavorites: 0 };
      }
      stats[key].total++;
      
      const isCheckedIn = checkIns.includes(site.id);
      const isFavorite = favorites.includes(site.id);

      if (isCheckedIn) {
        stats[key].checkedIn++;
      } else if (isFavorite) {
        // Only count as "Favorite" if NOT checked in
        stats[key].onlyFavorites++;
      }
    });

    return { isCityLevel, stats };
  };

  const { isCityLevel, stats } = getStats();
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="w-full h-full relative">
      <div 
        ref={mapRef} 
        className="w-full h-full transition-all duration-[2000ms] ease-in-out" 
        id="amap-container" 
        style={{ filter: environment?.filter || 'none' }}
      />
      
      {/* Stats Overlay */}
      <div className={`absolute z-20 flex flex-col gap-3 pointer-events-none transition-all duration-500 ${isMobile ? 'top-20 right-6 items-end' : 'bottom-10 left-10'}`}>
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className={`${isMobile ? 'bg-white/60 backdrop-blur-md p-3 rounded-2xl border border-[#D4AF37]/20 shadow-lg max-w-[140px]' : 'bg-white/90 backdrop-blur-md p-4 border border-[#D4AF37]/30 shadow-2xl rounded-sm'}`}
        >
          <motion.div layout className={`flex items-center gap-2 ${isMobile ? 'mb-2' : 'mb-3'}`}>
            <div className={`w-1 h-3 bg-[#B22222] ${isMobile ? 'rounded-full' : ''}`} />
            <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} font-black text-[#1A1A1A] tracking-[0.2em] uppercase`}>
              {isCityLevel ? '全市' : '区域'}
            </span>
          </motion.div>
          
          <motion.div layout className={`${isMobile ? 'space-y-2' : 'space-y-4'}`}>
            <AnimatePresence mode="popLayout">
              {Object.entries(stats).map(([name, data]) => (
                <motion.div 
                  key={name}
                  layout
                  initial={{ opacity: 0, x: isMobile ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isMobile ? -10 : 10 }}
                  className={`${isMobile ? 'min-w-[100px]' : 'min-w-[160px]'}`}
                >
                  <div className="flex justify-between items-end mb-1">
                    <span className={`${isMobile ? 'text-sm' : 'text-lg'} calligraphy text-[#1A1A1A]`}>{name}</span>
                    <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} font-bold text-slate-400`}>
                      {data.checkedIn}/{data.total}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className={`${isMobile ? 'h-1' : 'h-1.5'} w-full bg-slate-100 rounded-full overflow-hidden flex`}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(data.checkedIn / data.total) * 100}%` }}
                      className="h-full bg-[#D4AF37]" 
                    />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(data.onlyFavorites / data.total) * 100}%` }}
                      className="h-full bg-[#B22222]/40" 
                    />
                  </div>
                  
                  {!isMobile && (
                    <div className="flex gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">云游 {data.checkedIn}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#B22222]/40" />
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">缘起 {data.onlyFavorites}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>
        
        {!isMobile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#1A1A1A]/80 backdrop-blur-sm px-3 py-1.5 rounded-full self-start"
          >
            <p className="text-[8px] text-white/60 font-medium tracking-widest uppercase">
              {isCityLevel ? '放大地图查看各区详情' : '缩小地图查看全市概览'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MapComponent);
