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
  const isMobile = useMediaQuery('(max-width: 768px)');
  const mapRef = useRef<HTMLDivElement>(null);
  const amapInstance = useRef<any>(null);
  const scaleControlRef = useRef<any>(null);
  const toolbarControlRef = useRef<any>(null);
  const clusterInstanceRef = useRef<any>(null);
  const lastClusteredRef = useRef<boolean>(initialZoom <= 13);
  const routePolylineRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [currentZoom, setCurrentZoom] = React.useState(initialZoom);
  
  const prevZoomRef = useRef(initialZoom);
  const prevCenterRef = useRef(center);

  // Helper to generate marker content (Updated to handle conditional animation)
  const getMarkerContent = (site: ReligiousSite, isSelected: boolean, isCheckedIn: boolean, isFavorite: boolean, activeRoute: any, shouldAnimate: boolean) => {
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
    const routeStepIndex = activeRoute?.steps.findIndex((step: any) => step.siteId === site.id);
    const isActiveRouteSite = routeStepIndex !== undefined && routeStepIndex !== -1;

    // Direct animation string
    const animationStyle = shouldAnimate ? `animation: marker-appear 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;` : '';

    return `
      <div class="map-marker-container ${isSelected ? 'is-selected' : ''} ${glowClass}" 
           style="display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: ${isSelected ? 1000 : (isCheckedIn ? 500 : (isFavorite ? 300 : 100))}; opacity: ${opacity}; ${animationStyle}">
        ${isActiveRouteSite ? `<div style="position: absolute; bottom: 100%; margin-bottom: 8px; background: white; padding: 4px 10px; border-radius: 4px; border: 1.5px solid ${color}; white-space: nowrap; box-shadow: 0 2px 10px rgba(0,0,0,0.1); pointer-events: none; display: flex; align-items: center; gap: 6px; ${shouldAnimate ? 'animation: marker-appear 0.6s 0.1s both;' : ''}"><span style="background: ${color}; color: white; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 10px; font-weight: bold;">${(routeStepIndex as number) + 1}</span><span style="font-family: 'Ma Shan Zheng', cursive; font-size: 14px; font-weight: bold; color: #1A1A1A;">${site.buildingName}</span></div>` : ''}
        <div class="marker-icon-wrapper" style="width: ${40 * scale}px; height: ${40 * scale}px; background-color: ${isCheckedIn ? '#FFF' : (isFavorite ? '#FDFBF7' : '#F5F2ED')}; border: ${isSelected || isCheckedIn || isActiveRouteSite ? '3px' : '2px'} solid ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; ${isCheckedIn ? 'box-shadow: 0 0 25px rgba(212, 175, 55, 0.8);' : (isFavorite ? 'box-shadow: 0 0 15px rgba(178, 34, 34, 0.4);' : '')}${isActiveRouteSite && !isCheckedIn ? `box-shadow: 0 0 15px ${color}66;` : ''}">
          ${iconContent}
        </div>
        <div style="width: 0; height: 0; border-left: ${6 * scale}px solid transparent; border-right: ${6 * scale}px solid transparent; border-top: ${8 * scale}px solid ${color}; margin-top: -2px;"></div>
        ${pulseClass ? `<div class="${pulseClass}"></div>` : ''}
      </div>`;
  };

  const syncClusterData = () => {
    if (!clusterInstanceRef.current || !window.AMap) return;
    const points = sites.map(site => ({
      lnglat: site.coordinates,
      site: site 
    }));
    clusterInstanceRef.current.setData(points);
  };

  // Manage Map Controls (Scale, ToolBar) reactively
  useEffect(() => {
    if (!amapInstance.current || !window.AMap) return;
    const map = amapInstance.current;

    if (isMobile) {
      if (scaleControlRef.current) {
        map.removeControl(scaleControlRef.current);
        scaleControlRef.current = null;
      }
      if (toolbarControlRef.current) {
        map.removeControl(toolbarControlRef.current);
        toolbarControlRef.current = null;
      }
    } else {
      if (!scaleControlRef.current) {
        scaleControlRef.current = new window.AMap.Scale();
        map.addControl(scaleControlRef.current);
      }
      if (!toolbarControlRef.current) {
        toolbarControlRef.current = new window.AMap.ToolBar({ position: 'RT' });
        map.addControl(toolbarControlRef.current);
      }
    }
  }, [isMobile]);

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
      
      map.on('zoomend', () => {
        const newZoom = map.getZoom();
        setCurrentZoom(newZoom);
        setTimeout(() => {
          lastClusteredRef.current = newZoom <= 13;
        }, 100);
      });

      window.AMap.plugin(['AMap.Scale', 'AMap.ToolBar', 'AMap.MarkerCluster'], () => {
        if (!amapInstance.current) return;
        
        // Initial control setup based on mounting device state
        if (!isMobile) {
          scaleControlRef.current = new window.AMap.Scale();
          toolbarControlRef.current = new window.AMap.ToolBar({ position: 'RT' });
          amapInstance.current.addControl(scaleControlRef.current);
          amapInstance.current.addControl(toolbarControlRef.current);
        }
        
        clusterInstanceRef.current = new window.AMap.MarkerCluster(map, [], {
          gridSize: 70, 
          maxZoom: 13,  
          renderMarker: (context: any) => {
            if (!context.data || !context.data[0] || !context.data[0].site) return;
            const site = context.data[0].site as ReligiousSite;
            const isSelected = site.id === selectedSiteId;
            const isCheckedIn = checkIns.includes(site.id);
            const isFavorite = favorites.includes(site.id);
            
            // Logic: Animate if we just came from a clustered state (zoom <= 13)
            const shouldAnimate = lastClusteredRef.current === true;
            
            context.marker.setContent(getMarkerContent(site, isSelected, isCheckedIn, isFavorite, activeRoute, shouldAnimate));
            const scale = isSelected ? 1.4 : (isCheckedIn ? 1.2 : (isFavorite ? 1.1 : 0.9));
            context.marker.setOffset(new window.AMap.Pixel(-20 * scale, -46 * scale));
            
            context.marker.off('click');
            context.marker.on('click', () => onSiteClick(site));
          },
          renderClusterMarker: (context: any) => {
            const count = context.count;
            const factor = Math.min(1, count / 50);
            const size = 50 + factor * 20;
            
            // Logic: Only animate cluster appearance if we were NOT clustered before 
            const shouldAnimate = lastClusteredRef.current === false;
            
            const content = `
              <div class="zen-cluster-orb" style="
                width: ${size}px; 
                height: ${size}px; 
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                animation: zen-pulse 3s infinite ease-in-out${shouldAnimate ? `, zen-appear 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards` : ''};
              ">
                <!-- Inner Core -->
                <div style="
                  position: absolute;
                  width: 80%;
                  height: 80%;
                  background: radial-gradient(circle, rgba(178, 34, 34, 0.9) 0%, rgba(139, 0, 0, 0.7) 100%);
                  border: 1.5px solid rgba(212, 175, 55, 0.6);
                  border-radius: 50%;
                  box-shadow: 0 0 25px rgba(178, 34, 34, 0.5);
                  backdrop-filter: blur(8px);
                  z-index: 2;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  color: white;
                ">
                  <span style="font-family: 'Ma Shan Zheng', cursive; font-size: ${16 + factor * 6}px; font-weight: bold; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${count}</span>
                  <span style="font-size: 9px; opacity: 0.9; letter-spacing: 1px; transform: scale(0.85); margin-top: 2px; font-weight: 300;">灵韵</span>
                </div>
                <!-- Outer Aura Ring 1 -->
                <div style="
                  position: absolute;
                  width: 100%;
                  height: 100%;
                  border: 1px solid rgba(212, 175, 55, 0.3);
                  border-radius: 50%;
                  animation: zen-rotate 10s infinite linear;
                "></div>
                <!-- Outer Aura Ring 2 (Offset) -->
                <div style="
                  position: absolute;
                  width: 92%;
                  height: 92%;
                  border: 1px dashed rgba(255, 255, 255, 0.2);
                  border-radius: 50%;
                  animation: zen-rotate 15s infinite linear reverse;
                "></div>
              </div>
            `;
            context.marker.setContent(content);
            context.marker.setOffset(new window.AMap.Pixel(-size/2, -size/2));
          }
        });

        if (sites.length > 0) syncClusterData();
      });
    }
  }, []);

  useEffect(() => {
    syncClusterData();
  }, [sites, selectedSiteId, favorites, checkIns, activeRoute]);

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
  const [isOverviewExpanded, setIsOverviewExpanded] = React.useState(false);
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

    // In the new data-driven clustering, we don't need markersRef to filter.
    // Instead, clustering is handled via syncClusterData which uses the 'sites' prop.
    // The handleDistrictClick can still work by finding the markers from the cluster later if needed,
    // but for now, we'll simplify it to use coordinates from the sites.
    const districtSites = sites.filter(s => s.district.includes(district) || district.includes(s.district));

    if (districtSites.length > 0 && window.AMap && amapInstance.current) {
      if (isMobile) {
        const padding: [number, number, number, number] = [60, 10, 150, 10];
        
        let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
        districtSites.forEach(s => {
          const [lng, lat] = s.coordinates;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        });

        const sw = new window.AMap.LngLat(minLng, minLat);
        const ne = new window.AMap.LngLat(maxLng, maxLat);
        const bounds = new window.AMap.Bounds(sw, ne);
        amapInstance.current.setBounds(bounds, false, padding);
        
        setTimeout(() => {
          if (amapInstance.current) {
            const currentZ = amapInstance.current.getZoom();
            if (currentZ < 12.5) {
              amapInstance.current.setZoom(13.5, false, 800);
            }
          }
        }, 500);
      } else {
        const padding: [number, number, number, number] = [100, 100, 100, 100];
        let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
        districtSites.forEach(s => {
          const [lng, lat] = s.coordinates;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        });

        const sw = new window.AMap.LngLat(minLng, minLat);
        const ne = new window.AMap.LngLat(maxLng, maxLat);
        const bounds = new window.AMap.Bounds(sw, ne);
        amapInstance.current.setBounds(bounds, false, padding);
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
        <div className={`absolute z-20 ${isMobile ? 'bottom-20 right-4' : 'bottom-10 right-10'}`}>
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
      <div className={`absolute z-20 flex flex-col gap-3 transition-all duration-500 ${isMobile ? 'bottom-20 left-4 shrink-0' : 'bottom-10 left-10'}`}>
        <motion.div 
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            width: isMobile ? (isOverviewExpanded ? 'calc(100vw - 48px)' : '110px') : '240px',
            height: isMobile ? (isOverviewExpanded ? 'auto' : '40px') : 'auto'
          }}
          className={`${isMobile 
            ? `bg-[#FDFBF7]/95 backdrop-blur-2xl p-3 ${isOverviewExpanded ? 'rounded-2xl' : 'rounded-full px-4'} border border-[#D4AF37]/30 shadow-2xl overflow-hidden` 
            : 'bg-white/95 backdrop-blur-md p-5 border border-[#D4AF37]/30 shadow-2xl rounded-sm w-[240px] max-h-[420px] flex flex-col'}`}
        >
          <div 
            className="flex items-center justify-between pointer-events-auto cursor-pointer select-none"
            onClick={() => isMobile ? setIsOverviewExpanded(!isOverviewExpanded) : handleDistrictClick('杭州市')}
          >
            <motion.div layout className={`flex items-center ${isMobile && !isOverviewExpanded ? 'gap-1.5' : 'gap-3'}`}>
              <div className={`bg-[#B22222] transition-all duration-300 ${isMobile && !isOverviewExpanded ? 'w-1 h-3' : 'w-1.5 h-4'}`} />
              <div className="flex flex-col">
                <span className={`${isMobile && !isOverviewExpanded ? 'text-[10px]' : 'text-xs'} font-black text-[#1A1A1A] tracking-[0.2em] uppercase leading-none mb-0.5 whitespace-nowrap`}>
                  {isCityLevel ? '全市概览' : '区域志'}
                </span>
                {(!isMobile || isOverviewExpanded) && <span className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.3em] leading-none">Districts</span>}
              </div>
            </motion.div>
            
            {isMobile ? (
              <div className="flex items-center gap-2">
                {isOverviewExpanded && (
                  <span className="text-[10px] font-bold text-[#B22222] opacity-60 uppercase tracking-widest">收起</span>
                )}
                <div className={`w-6 h-6 rounded-full bg-[#B22222]/5 flex items-center justify-center transition-all duration-300 ${isOverviewExpanded ? 'rotate-180 bg-[#B22222]/10' : ''}`}>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#B22222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            ) : (
              !isCityLevel && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDistrictClick('杭州市'); }}
                  className="text-[8px] font-bold text-[#B22222] opacity-60 hover:opacity-100 transition-all uppercase tracking-tighter"
                >返回全市</button>
              )
            )}
          </div>
          
          <AnimatePresence>
            {(isOverviewExpanded || !isMobile) && (
              <motion.div 
                layout
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`pointer-events-auto custom-scrollbar mt-4 ${isMobile ? 'flex gap-3 overflow-x-auto pb-2 -mx-1 px-1' : 'flex-1 overflow-y-auto pr-1 space-y-3'}`}
              >
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
              </motion.div>
            )}
          </AnimatePresence>
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
