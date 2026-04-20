/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useAmap } from './hooks/useAmap';
import { useEnvironment } from './hooks/useEnvironment';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import DetailsPanel from './components/DetailsPanel';
import OnboardingModal from './components/OnboardingModal';
import MasterSearchModal from './components/MasterSearchModal';
import EnvironmentIndicator from './components/EnvironmentIndicator';
import CalendarModal from './components/CalendarModal';
import DailyZenFloating from './components/DailyZenFloating';
import SocialPanel from './components/SocialPanel';
import CheckInSeal from './components/CheckInSeal';
import PilgrimageRoutes from './components/PilgrimageRoutes';
import RouteAchievementModal from './components/RouteAchievementModal';
import { SITES_DATA, ReligiousSite } from './data/sites';
import { ROUTES_DATA, PilgrimageRoute } from './data/routes';
import { geminiService } from './services/geminiService';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, AlertCircle, LogIn, User as UserIcon, X, Trophy, Share2 } from 'lucide-react';
import { auth, db, signInWithGoogle, logout, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';

const AMAP_KEY = 'e452c9863df6137890fd51a3ed9106fd';
const AMAP_SECRET = '33117018363198c7dcc04633fd200c45';

// Golden Lotus Icon Component with Cohesive Blooming Animation
const GoldenLotus = ({ className }: { className?: string }) => {
  const petalVariants = {
    closed: { scale: 0, rotate: 0, opacity: 0 },
    open: (i: number) => ({
      scale: 1,
      rotate: i * 45,
      opacity: 1,
      transition: {
        delay: 0.8 + (i % 4) * 0.15,
        duration: 2,
        ease: [0.34, 1.56, 0.64, 1] as any
      }
    })
  };

  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="lotus-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF7E6" />
          <stop offset="70%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#B22222" stopOpacity="0.2" />
        </radialGradient>
        <filter id="lotus-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ethereal Aura */}
      <motion.circle
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.4, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        cx="50" cy="65" r="35"
        fill="url(#lotus-grad)"
        style={{ filter: 'blur(20px)' }}
      />

      {/* Outer Petals - Anchored at the center bud (50, 65) */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <motion.path
          key={`outer-${i}`}
          variants={petalVariants}
          custom={i}
          initial="closed"
          animate="open"
          d="M50 65 C65 55 75 45 50 15 C25 45 35 55 50 65Z"
          fill="url(#lotus-grad)"
          stroke="#D4AF37"
          strokeWidth="0.3"
          style={{ originX: "50px", originY: "65px" }}
        />
      ))}

      {/* Inner Petals - Anchored at the same point */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.path
          key={`inner-${i}`}
          initial={{ scale: 0, rotate: i * 72, opacity: 0 }}
          animate={{ scale: 0.7, rotate: i * 72 + 36, opacity: 1 }}
          transition={{ delay: 1.8 + i * 0.1, duration: 1.5, ease: "backOut" }}
          d="M50 65 C58 60 65 55 50 40 C35 55 42 60 50 65Z"
          fill="#D4AF37"
          stroke="#FFF7E6"
          strokeWidth="0.2"
          style={{ originX: "50px", originY: "65px" }}
        />
      ))}

      {/* The Golden Seed / Heart - The Anchor Point */}
      <motion.circle
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2.8, duration: 1.5, type: "spring", bounce: 0.5 }}
        cx="50" cy="65" r="4"
        fill="#D4AF37"
        style={{ filter: 'url(#lotus-glow)' }}
      />
    </svg>
  );
};

// Achievement Modal Component
const AchievementModal = ({ 
  isOpen, 
  onClose, 
  userName, 
  name,
  type = 'region'
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  userName: string; 
  name: string;
  type?: 'site' | 'region';
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8, rotateX: 30 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1, 
              rotateX: 0,
              transition: { 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1] 
              } 
            }}
            exit={{ 
              opacity: 0, 
              scale: 1.1, 
              y: -50,
              filter: 'blur(20px)',
              transition: { duration: 1 } 
            }}
            className="relative max-w-md w-full bg-[#FDFBF7] border-4 border-[#D4AF37] p-10 shadow-[0_0_100px_rgba(212,175,55,0.3)] overflow-hidden"
          >
            {/* Scroll Reveal Overlay */}
            <motion.div
              initial={{ height: "100%" }}
              animate={{ height: "0%" }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 bg-[#FDFBF7] z-20 origin-top"
            />

            {/* Ink Wash Background */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.08, scale: 1.5 }}
              transition={{ duration: 3 }}
              className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none"
            />
            
            {/* Corner Borders */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-[#D4AF37]" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-[#D4AF37]" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-[#D4AF37]" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-[#D4AF37]" />

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-300 hover:text-[#B22222] transition-colors z-[30]"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center space-y-8 relative z-10">
              <div className="flex justify-center">
                <GoldenLotus className="w-32 h-32 md:w-36 md:h-36 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <h3 className="text-[12px] font-black tracking-[0.4em] text-[#D4AF37] uppercase">
                    {type === 'site' ? '造访胜迹 · 云游到此' : '云游成就 · 功德圆满'}
                  </h3>
                  <div className="h-px w-16 bg-[#D4AF37] mx-auto opacity-50" />
                </div>

                <div className="py-2 space-y-4">
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1, duration: 0.8 }}
                    className="calligraphy text-4xl text-[#1A1A1A] leading-tight block"
                  >
                    {userName}
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4, duration: 0.8 }}
                    className="calligraphy text-3xl text-[#1A1A1A] leading-tight opacity-80 block"
                  >
                    {type === 'site' ? <>云游至 <span className="text-[#B22222] font-bold">{name}</span></> : `遍历 ${name}`}
                  </motion.p>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.15, scale: 1 }}
                    transition={{ delay: 1.8, duration: 1 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[20%] pointer-events-none"
                  >
                    <div className="w-64 h-64 border-[12px] border-[#B22222] rounded-full flex items-center justify-center rotate-[-15deg]">
                      <span className="calligraphy text-5xl font-black text-[#B22222]">云游到此</span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    transition={{ delay: 2.2, duration: 1.2 }}
                  >
                    <div className="calligraphy text-2xl text-[#B22222] mt-8 leading-relaxed">
                      {type === 'site' 
                        ? (
                          <p>
                            一念起处，众缘相会。<br />于此地留下足迹，亦是心中一抹清凉。
                          </p>
                        )
                        : (
                          <p>
                            上下四方，古往今来<br />自性光明，普照世间
                          </p>
                        )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 5 }}
                className="pt-6"
              >
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-[#1A1A1A] text-white text-[11px] font-bold tracking-[0.3em] uppercase flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-black/10"
                >
                  <Share2 className="w-4 h-4" />
                  分享这份喜悦
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Grand Achievement Modal for City-wide Completion
const GrandAchievementModal = ({ 
  isOpen, 
  onClose, 
  userName 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  userName: string 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              rotateX: 0,
              transition: { 
                duration: 1.8, 
                ease: [0.22, 1, 0.36, 1] 
              } 
            }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            className="relative w-full max-w-2xl bg-[#1A1A1A] border-[8px] md:border-[12px] border-[#D4AF37] p-6 md:p-10 shadow-[0_0_150px_rgba(212,175,55,0.4)] flex flex-col items-center justify-center text-center overflow-hidden"
          >
            {/* Traditional Totem Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Central Mandala Totem */}
              <motion.div 
                animate={{ 
                  rotate: 360,
                  transition: { duration: 100, repeat: Infinity, ease: "linear" }
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-[0.05]"
              >
                <svg viewBox="0 0 200 200" className="w-full h-full fill-[#D4AF37]">
                  <path d="M100 0 L110 90 L200 100 L110 110 L100 200 L90 110 L0 100 L90 90 Z" />
                  <circle cx="100" cy="100" r="80" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="4 4" />
                  <circle cx="100" cy="100" r="60" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
                </svg>
              </motion.div>
              
              {/* Corner Cloud Totems */}
              <div className="absolute top-0 left-0 w-32 h-32 opacity-10 mix-blend-screen">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-[#D4AF37]">
                  <path d="M20 20 C30 10 50 10 60 20 C70 30 70 50 60 60 C50 70 30 70 20 60 C10 50 10 30 20 20 Z" />
                </svg>
              </div>
              <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10 mix-blend-screen rotate-180">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-[#D4AF37]">
                  <path d="M20 20 C30 10 50 10 60 20 C70 30 70 50 60 60 C50 70 30 70 20 60 C10 50 10 30 20 20 Z" />
                </svg>
              </div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full flex flex-col items-center space-y-4 md:space-y-6">
              {/* Lotus Section */}
              <div className="relative flex justify-center">
                <motion.div
                  initial={{ filter: 'brightness(0) blur(20px)' }}
                  animate={{ filter: 'brightness(1) blur(0px)' }}
                  transition={{ delay: 0.8, duration: 2 }}
                >
                  <GoldenLotus className="w-28 h-28 md:w-40 md:h-40 drop-shadow-[0_0_30px_rgba(212,175,55,0.6)]" />
                </motion.div>
              </div>

              {/* Text Section */}
              <div className="space-y-3 md:space-y-5 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="space-y-1"
                >
                  <h2 className="text-[10px] md:text-[12px] font-black tracking-[0.6em] text-[#D4AF37] uppercase">
                    全境点亮 · 功德无量
                  </h2>
                  <div className="h-px w-20 bg-[#D4AF37]/50 mx-auto" />
                </motion.div>

                <div className="space-y-1 md:space-y-2">
                  <motion.p 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2.2, duration: 1.2 }}
                    className="calligraphy text-3xl md:text-5xl text-white leading-tight"
                  >
                    {userName}
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3, duration: 1 }}
                    className="calligraphy text-xl md:text-3xl text-[#D4AF37] leading-tight"
                  >
                    遍历 杭州全境
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 4, duration: 2 }}
                  className="space-y-2 pt-2 md:pt-4"
                >
                  <p className="calligraphy text-lg md:text-2xl text-white/80 leading-relaxed">
                    三百余处灵光，皆因君而起
                  </p>
                  <p className="calligraphy text-base md:text-xl text-[#D4AF37] leading-relaxed">
                    上下四方，古往今来<br />
                    万缘和合，自性大成
                  </p>
                </motion.div>
              </div>

              {/* Footer Section */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 5.5 }}
                className="pt-4 md:pt-6 w-full max-w-xs"
              >
                <p className="text-[9px] md:text-[10px] text-white/40 mb-4 italic calligraphy tracking-widest">
                  此份殊胜，愿随行护佑，独朗心珠
                </p>
                <button 
                  onClick={onClose}
                  className="w-full py-3 md:py-4 bg-[#D4AF37] text-[#1A1A1A] text-[10px] md:text-xs font-black tracking-[0.4em] uppercase hover:bg-white transition-all shadow-[0_10px_30px_rgba(212,175,55,0.3)] active:scale-95"
                >
                  受持这份荣耀
                </button>
              </motion.div>
            </div>

            {/* Corner Embellishments */}
            <div className="absolute top-4 left-4 w-12 h-12 md:w-16 md:h-16 border-t-2 border-l-2 border-[#D4AF37]/60" />
            <div className="absolute top-4 right-4 w-12 h-12 md:w-16 md:h-16 border-t-2 border-r-2 border-[#D4AF37]/60" />
            <div className="absolute bottom-4 left-4 w-12 h-12 md:w-16 md:h-16 border-b-2 border-l-2 border-[#D4AF37]/60" />
            <div className="absolute bottom-4 right-4 w-12 h-12 md:w-16 md:h-16 border-b-2 border-r-2 border-[#D4AF37]/60" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const { loaded, error } = useAmap(AMAP_KEY, AMAP_SECRET);
  const environment = useEnvironment(AMAP_KEY);
  const [selectedSite, setSelectedSite] = useState<ReligiousSite | null>(null);
  const [filters, setFilters] = useState<{ religion: string[], status: string[] }>({ religion: [], status: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMasterSearch, setShowMasterSearch] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [masterSearchInitialQuery, setMasterSearchInitialQuery] = useState('');
  const [masterSearchInitialSuggestions, setMasterSearchInitialSuggestions] = useState<string[]>([]);
  const [showSocialPanel, setShowSocialPanel] = useState(false);
  const [showRoutesPanel, setShowRoutesPanel] = useState(false);
  const [showCheckInSeal, setShowCheckInSeal] = useState(false);
  const [sealHook, setSealHook] = useState('云游');
  const [activeRouteId, setActiveRouteId] = useState<string | null>(localStorage.getItem('active_route_id'));
  const [routeAchievement, setRouteAchievement] = useState<{ isOpen: boolean, route: PilgrimageRoute | null }>({ isOpen: false, route: null });
  const [favorites, setFavorites] = useState<number[]>([]);
  const [checkIns, setCheckIns] = useState<{ siteId: number, date: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [achievement, setAchievement] = useState<{ 
    isOpen: boolean, 
    name: string, 
    type: 'site' | 'region' 
  }>({ 
    isOpen: false, 
    name: '', 
    type: 'region' 
  });
  const [pendingAchievement, setPendingAchievement] = useState<{ name: string, type: 'site' | 'region' } | null>(null);
  const [grandAchievement, setGrandAchievement] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [isGrandAchiever, setIsGrandAchiever] = useState(localStorage.getItem('is_grand_achiever') === 'true');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const lastPopupTime = useRef<Record<string, number>>({});

  const completedRegions = useMemo(() => {
    const siteIds = checkIns.map(c => c.siteId);
    const completed: string[] = [];
    
    if (siteIds.length === 0) return completed;

    // Check city
    if (SITES_DATA.every(s => siteIds.includes(s.id))) {
      completed.push('杭州市');
    }
    
    // Check districts
    const districts = Array.from(new Set(SITES_DATA.map(s => s.district)));
    for (const district of districts) {
      const districtSites = SITES_DATA.filter(s => s.district === district);
      if (districtSites.length > 0 && districtSites.every(s => siteIds.includes(s.id))) {
        completed.push(district);
      }
    }
    return completed;
  }, [checkIns]);

  // Persist grand achiever status
  useEffect(() => {
    if (completedRegions.includes('杭州市')) {
      setIsGrandAchiever(true);
      localStorage.setItem('is_grand_achiever', 'true');
    }
  }, [completedRegions]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      
      if (user) {
        // Ensure user document exists
        const userRef = doc(db, 'users', user.uid);
        getDoc(userRef).then((docSnap) => {
          const savedName = localStorage.getItem('user_name');
          if (!docSnap.exists()) {
            setDoc(userRef, {
              uid: user.uid,
              displayName: user.displayName,
              dignitaryTitle: savedName || '无名之辈',
              photoURL: user.photoURL,
              favorites: [],
              checkIns: [],
              friends: []
            });
          } else {
            // Sync savedName to Firestore if it exists locally and is different from what's stored
            const data = docSnap.data();
            if (savedName && savedName !== data.dignitaryTitle) {
              updateDoc(userRef, { dignitaryTitle: savedName });
            } else if (!savedName && data.dignitaryTitle) {
              // Sync Firestore name back to local if local is empty
              localStorage.setItem('user_name', data.dignitaryTitle);
            }
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Get User Location
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
        },
        (err) => console.error("Geolocation failed:", err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const handleLogin = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        console.error("Login failed:", error);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Real-time User Data Sync
  useEffect(() => {
    if (!currentUser) {
      // Fallback to local storage if not logged in
      const savedFavorites = JSON.parse(localStorage.getItem('user_favorites') || '[]');
      const savedCheckIns = JSON.parse(localStorage.getItem('user_checkins') || '[]');
      
      const formattedCheckIns = savedCheckIns.map((c: any) => {
        if (typeof c === 'number') {
          return { siteId: c, date: new Date().toISOString() };
        }
        return c;
      });
      
      setFavorites(savedFavorites);
      setCheckIns(formattedCheckIns);
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFavorites(data.favorites || []);
        
        // Migration: Handle old number[] format and new {siteId, date}[] format
        const rawCheckIns = data.checkIns || [];
        const formattedCheckIns = rawCheckIns.map((c: any) => {
          if (typeof c === 'number') {
            return { siteId: c, date: new Date().toISOString() };
          }
          return c;
        });
        setCheckIns(formattedCheckIns);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`));

    return () => unsubscribe();
  }, [currentUser]);

  const toggleFavorite = async (siteId: number) => {
    if (!currentUser) {
      const newFavorites = favorites.includes(siteId)
        ? favorites.filter(id => id !== siteId)
        : [...favorites, siteId];
      setFavorites(newFavorites);
      localStorage.setItem('user_favorites', JSON.stringify(newFavorites));
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    const isAdding = !favorites.includes(siteId);
    
    try {
      await updateDoc(userRef, {
        favorites: isAdding ? arrayUnion(siteId) : arrayRemove(siteId)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const toggleCheckIn = async (siteId: number, targetState?: boolean) => {
    const now = new Date().toISOString();
    
    // Determine the intended action based on provided targetState or current state
    const isRemove = targetState !== undefined ? !targetState : checkIns.some(c => c.siteId === siteId);
    
    // Optimistic UI Update - immediately update state to provide "fake" (instant) response
    setCheckIns(prev => {
      const exists = prev.some(c => c.siteId === siteId);
      if (isRemove) {
        return prev.filter(c => c.siteId !== siteId);
      } else {
        // Only add if it doesn't already exist in the previous state (to avoid duplicates)
        if (!exists) {
          return [...prev, { siteId, date: now }];
        }
        return prev;
      }
    });

    // Route completion check
    if (!isRemove && activeRouteId) {
      const activeRoute = ROUTES_DATA.find(r => r.id === activeRouteId);
      if (activeRoute) {
        // Need to check with the LATEST state
        setCheckIns(current => {
          const siteIds = current.map(c => c.siteId);
          const isRouteCompleted = activeRoute.steps.every(step => siteIds.includes(step.siteId));
          if (isRouteCompleted) {
            setTimeout(() => {
              setRouteAchievement({ isOpen: true, route: activeRoute });
              setActiveRouteId(null);
              localStorage.removeItem('active_route_id');
            }, 1000);
          }
          return current;
        });
      }
    }

    if (!currentUser) {
      // Local storage persistence
      const currentLocal = JSON.parse(localStorage.getItem('user_checkins') || '[]');
      let updatedLocal;
      if (isRemove) {
        updatedLocal = currentLocal.filter((c: any) => 
          (typeof c === 'number' && c !== siteId) || 
          (typeof c === 'object' && c.siteId !== siteId)
        );
      } else {
        const exists = currentLocal.some((c: any) => 
          (typeof c === 'number' && c === siteId) || 
          (typeof c === 'object' && c.siteId === siteId)
        );
        updatedLocal = exists ? currentLocal : [...currentLocal, { siteId, date: now }];
      }
      localStorage.setItem('user_checkins', JSON.stringify(updatedLocal));
      
      if (!isRemove) {
        return checkAchievements(updatedLocal.map((c: any) => typeof c === 'number' ? c : c.siteId), siteId);
      }
      return null;
    }

    const userRef = doc(db, 'users', currentUser.uid);

    try {
      // For Firestore, we fetch the latest state to be safe
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const dbCheckIns = docSnap.data().checkIns || [];
        
        if (isRemove) {
          const updatedCheckIns = dbCheckIns.filter((c: any) => 
            !((typeof c === 'number' && c === siteId) || 
              (typeof c === 'object' && c.siteId === siteId))
          );
          
          await updateDoc(userRef, {
            checkIns: updatedCheckIns
          });
        } else {
          const alreadyInDb = dbCheckIns.some((c: any) => 
            (typeof c === 'number' && c === siteId) || 
            (typeof c === 'object' && c.siteId === siteId)
          );
          
          if (!alreadyInDb) {
            await updateDoc(userRef, {
              checkIns: arrayUnion({ siteId, date: now })
            });
          }
          
          const finalSiteIds = [...dbCheckIns.map((c: any) => typeof c === 'number' ? c : c.siteId), siteId];
          return checkAchievements(finalSiteIds, siteId);
        }
      }
    } catch (err) {
      // In case of real network error, we might want to sync back, but usually optimistic is fine
      // unless we want to "rollback"
      console.error("Firestore sync failed:", err);
      // Optional: sync back logic if critical
    }
    return null;
  };

  const checkAchievements = (currentCheckIns: number[], justCheckedInId?: number) => {
    let triggeredRegion = '';
    const now = Date.now();
    const COOLDOWN = 60000; // 1 minute cooldown for the same achievement popup

    // 1. Check whole city (Hangzhou) - HIGHEST PRIORITY
    const isAllCompleted = SITES_DATA.every(s => currentCheckIns.includes(s.id));
    if (isAllCompleted) {
      const lastTime = lastPopupTime.current['杭州市'] || 0;
      if (now - lastTime > COOLDOWN) {
        triggeredRegion = '杭州市';
        // Small delay for better pacing
        setTimeout(() => {
          setGrandAchievement({ isOpen: true });
        }, 1500);
        lastPopupTime.current['杭州市'] = now;
      }
      return triggeredRegion;
    }

    // 2. Check districts - LOWER PRIORITY
    // Only check the district of the site just checked in to avoid incorrect/repeat triggers
    const districts = Array.from(new Set(SITES_DATA.map(s => s.district)));
    const targetDistricts = justCheckedInId 
      ? [SITES_DATA.find(s => s.id === justCheckedInId)?.district].filter(Boolean) as string[]
      : districts;

    for (const district of targetDistricts) {
      const districtSites = SITES_DATA.filter(s => s.district === district);
      const isCompleted = districtSites.every(s => currentCheckIns.includes(s.id));
      
      if (isCompleted) {
        const lastTime = lastPopupTime.current[district] || 0;
        if (now - lastTime > COOLDOWN) {
          triggeredRegion = district;
          setPendingAchievement({ name: district, type: 'region' });
          lastPopupTime.current[district] = now;
          break; // Show one district achievement at a time
        }
      }
    }

    return triggeredRegion;
  };

  const filteredSites = useMemo(() => {
    return SITES_DATA.filter(site => {
      // Religion filter
      if (filters.religion.length > 0 && !filters.religion.includes(site.religion)) return false;

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(site.status)) return false;

      // Search filter
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const matchesText = site.name.toLowerCase().includes(query) || 
                           site.address.toLowerCase().includes(query) ||
                           site.background.toLowerCase().includes(query);
        
        const matchesAi = aiSearchResults.includes(site.name);
        
        if (!matchesText && !matchesAi) return false;
      }

      return true;
    });
  }, [filters, debouncedSearchQuery, aiSearchResults]);

  const handleSiteSelect = (site: ReligiousSite) => {
    setSelectedSite(site);
  };

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F5F2ED] p-8 text-center">
        <div className="w-20 h-20 bg-[#B22222]/10 rounded-full flex items-center justify-center text-[#B22222] mb-8">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-[#1A1A1A] calligraphy mb-6">地图加载失败</h2>
        <p className="text-lg text-slate-500 max-w-md leading-relaxed mb-10">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-10 py-4 bg-[#B22222] text-white font-black text-sm tracking-[0.2em] uppercase shadow-xl shadow-red-100 hover:bg-[#8B0000] transition-all"
        >
          重新加载
        </button>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F5F2ED] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
        <div className="relative">
          <div className="w-32 h-32 border-4 border-[#D4AF37]/20 border-t-[#B22222] rounded-full animate-spin mb-10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="calligraphy text-4xl text-[#B22222]">杭</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-[#1A1A1A] calligraphy tracking-widest">正在开启文化地图...</h2>
        <p className="text-base text-[#B22222]/60 mt-6 font-medium italic tracking-widest">— 寻觅千年古都之灵韵 —</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col md:flex-row overflow-hidden bg-[#F5F2ED]">
      <AnimatePresence>
        {showSocialPanel && (
          <SocialPanel 
            isOpen={showSocialPanel}
            onClose={() => setShowSocialPanel(false)}
            sites={SITES_DATA}
            onSelectSite={setSelectedSite}
            userLocation={userLocation}
          />
        )}
      </AnimatePresence>

      <CheckInSeal 
        isVisible={showCheckInSeal} 
        hook={sealHook}
        onComplete={() => {
          setShowCheckInSeal(false);
          if (pendingAchievement) {
            setAchievement({ isOpen: true, name: pendingAchievement.name, type: pendingAchievement.type });
            setPendingAchievement(null);
          }
        }} 
      />

      <OnboardingModal 
        forceShow={showOnboarding} 
        onComplete={async (name) => {
          setShowOnboarding(false);
          localStorage.setItem('user_name', name);
          
          if (currentUser) {
            try {
              await updateDoc(doc(db, 'users', currentUser.uid), {
                dignitaryTitle: name
              });
            } catch (err) {
              console.error("Failed to update dignitary title in Firestore:", err);
            }
          }
        }} 
      />
      <Sidebar 
        sites={filteredSites} 
        onSelectSite={handleSiteSelect}
        onSearch={(query, suggestions) => {
          setMasterSearchInitialQuery(query || '');
          setMasterSearchInitialSuggestions(suggestions || []);
          setShowMasterSearch(true);
        }}
        onFilterChange={setFilters}
        isAiSearching={isAiSearching}
        onChangeName={() => setShowOnboarding(true)}
        onOpenSocial={() => {
          if (!currentUser) {
            handleLogin();
          } else {
            setShowSocialPanel(true);
          }
        }}
        onOpenRoutes={() => setShowRoutesPanel(true)}
        userLocation={userLocation}
        checkIns={checkIns}
        isGrandAchiever={isGrandAchiever}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        environment={environment}
      />
      
      <main className="flex-1 relative">
        {/* Auth Button */}
        <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md p-1.5 pr-4 rounded-full border border-[#D4AF37]/20 shadow-lg">
              <img src={currentUser.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-[#D4AF37]/30" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#B22222] tracking-widest uppercase truncate max-w-[80px]">
                  {currentUser.displayName}
                </span>
                <button onClick={logout} className="text-[8px] text-slate-400 hover:text-[#B22222] text-left uppercase tracking-tighter">
                  退出登录
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              disabled={isSigningIn}
              className="px-6 py-2.5 bg-[#B22222] text-white text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-2 shadow-xl shadow-red-900/20 hover:bg-[#8B0000] transition-all rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigningIn ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
              {isSigningIn ? '正在登录...' : '同修登录'}
            </button>
          )}
        </div>

        <MapComponent 
          sites={filteredSites} 
          onSiteClick={handleSiteSelect}
          selectedSiteId={selectedSite?.id}
          center={selectedSite ? selectedSite.coordinates : undefined}
          zoom={selectedSite ? 16 : 11}
          favorites={favorites}
          checkIns={checkIns.map(c => c.siteId)}
          activeRoute={ROUTES_DATA.find(r => r.id === activeRouteId)}
          userLocation={userLocation}
          environment={environment}
        />

        {/* Environment Indicator - Floating on Map */}
        <EnvironmentIndicator 
          environment={environment} 
          onClick={() => setShowCalendarModal(true)} 
        />

        {/* Floating DailyZen (Jing Niao Ling) */}
        <DailyZenFloating />

        {/* Calendar Modal */}
        <CalendarModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          environment={environment}
          onSearch={(query, suggestions) => {
            setMasterSearchInitialQuery(query);
            setMasterSearchInitialSuggestions(suggestions || []);
            setShowMasterSearch(true);
          }}
        />
        
        <AnimatePresence>
          {selectedSite && (
            <DetailsPanel 
              site={selectedSite} 
              onClose={() => setSelectedSite(null)} 
              isFavorite={favorites.includes(selectedSite.id)}
              isCheckedIn={checkIns.some(c => c.siteId === selectedSite.id)}
              onToggleFavorite={() => toggleFavorite(selectedSite.id)}
              onToggleCheckIn={(siteId: number, targetState?: boolean) => toggleCheckIn(siteId, targetState)}
              onShowSuccess={(siteName) => setPendingAchievement({ name: siteName, type: 'site' })}
              onShowSeal={() => {
                setSealHook(localStorage.getItem('user_name') || '云游');
                setShowCheckInSeal(true);
              }}
            />
          )}
        </AnimatePresence>
      </main>

      <AchievementModal 
        isOpen={achievement.isOpen}
        onClose={() => setAchievement(prev => ({ ...prev, isOpen: false }))}
        userName={localStorage.getItem('user_name') || currentUser?.displayName || '同修'}
        name={achievement.name}
        type={achievement.type}
      />

      <PilgrimageRoutes 
        isOpen={showRoutesPanel}
        onClose={() => setShowRoutesPanel(false)}
        sites={SITES_DATA}
        checkIns={checkIns.map(c => c.siteId)}
        onSelectSite={handleSiteSelect}
        activeRouteId={activeRouteId}
        onStartRoute={(id) => {
          setActiveRouteId(id);
          localStorage.setItem('active_route_id', id);
        }}
        onCancelRoute={() => {
          setActiveRouteId(null);
          localStorage.removeItem('active_route_id');
        }}
        userLocation={userLocation}
      />

      <RouteAchievementModal 
        isOpen={routeAchievement.isOpen}
        onClose={() => {
          setRouteAchievement(prev => ({ ...prev, isOpen: false }));
          setShowCheckInSeal(true);
        }}
        userName={localStorage.getItem('user_name') || currentUser?.displayName || '同修'}
        route={routeAchievement.route}
      />

      <GrandAchievementModal 
        isOpen={grandAchievement.isOpen}
        onClose={() => {
          setGrandAchievement({ isOpen: false });
          setShowCheckInSeal(true);
        }}
        userName={localStorage.getItem('user_name') || currentUser?.displayName || '同修'}
      />

      <AnimatePresence>
        {showMasterSearch && (
          <MasterSearchModal 
            isOpen={showMasterSearch}
            onClose={() => {
              setShowMasterSearch(false);
              setMasterSearchInitialQuery('');
              setMasterSearchInitialSuggestions([]);
            }}
            sites={SITES_DATA}
            onSelectSite={handleSiteSelect}
            initialQuery={masterSearchInitialQuery}
            initialSuggestions={masterSearchInitialSuggestions}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
