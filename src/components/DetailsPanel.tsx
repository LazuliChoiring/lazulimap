import React, { useState, useEffect, useMemo } from 'react';
import { X, History, BookOpen, MapPin, Calendar, Sparkles, Footprints, Wind, PenTool, MessageSquare, Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { ReligiousSite, Couplet } from '../data/sites';
import { motion, AnimatePresence, useMotionValue } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface DetailsPanelProps {
  site: ReligiousSite | null;
  onClose: () => void;
  isFavorite: boolean;
  isCheckedIn: boolean;
  onToggleFavorite: () => void;
  onToggleCheckIn: (siteId: number, targetState?: boolean) => Promise<string | null>;
  onShowSuccess?: (siteName: string) => void;
  onShowSeal?: (hookCharacters?: string) => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ 
  site, 
  onClose, 
  isFavorite, 
  isCheckedIn, 
  onToggleFavorite, 
  onToggleCheckIn,
  onShowSuccess,
  onShowSeal
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'story' | 'travelogue'>('info');
  const [aiStory, setAiStory] = useState<string | null>(null);

  // Extract hook early to avoid Temporal Dead Zone (TDZ) issues in event handlers
  const hook = useMemo(() => {
    if (!site) return '古迹寻踪';
    const hookMatch = site.background.match(/【(.*?)】/);
    return hookMatch ? hookMatch[1] : '古迹寻踪';
  }, [site]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [userName, setUserName] = useState('');
  const [userNotes, setUserNotes] = useState<{id: string, content: string, timestamp: number, author: string}[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newMoment, setNewMoment] = useState('');
  const [showMomentInput, setShowMomentInput] = useState(false);
  const [favRipples, setFavRipples] = useState<{ id: number, x: number, y: number }[]>([]);
  const [checkRipples, setCheckRipples] = useState<{ id: number, x: number, y: number }[]>([]);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const addFavRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setFavRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setFavRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  };

  const addCheckRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setCheckRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setCheckRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  };

  useEffect(() => {
    const name = localStorage.getItem('user_name') || '游侠';
    setUserName(name);
  }, []);

  useEffect(() => {
    if (site) {
      setAiStory(site.folklore);
      setActiveTab('info');
      
      // Real-time notes from Firebase
      const notesRef = collection(db, 'notes');
      const q = query(
        notesRef, 
        where('siteId', '==', site.id),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];
        setUserNotes(notes);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'notes'));

      return () => unsubscribe();
    }
  }, [site]);

  // Remove fetchNotes as it's replaced by onSnapshot

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo(0, 0);
    }
  }, [activeTab]);

  const generateNewStory = async () => {
    if (!site) return;
    setIsGenerating(true);
    const story = await geminiService.generateFolklore(site.name, site.background);
    setAiStory(story);
    setIsGenerating(false);
    setActiveTab('story');
  };

  const currentYear = new Date().getFullYear();
  const age = site ? currentYear - site.yearBuilt : 0;

  const handleCheckIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!site) return;
    addCheckRipple(e);
    
    const target = !isCheckedIn;
    // Immediate feedback through optimistic update
    onToggleCheckIn(site.id, target);
    
    // If checking in (target == true)
    if (target) {
      setShowMomentInput(true);
    } else {
      setShowMomentInput(false);
    }
  };

  const submitCheckInWithMoment = async () => {
    if (!site) return;

    try {
      // 1. Save the moment if provided and logged in
      if (newMoment.trim() && auth.currentUser) {
        await addDoc(collection(db, 'moments'), {
          authorUid: auth.currentUser.uid,
          authorName: localStorage.getItem('user_name') || auth.currentUser.displayName || '匿名同修',
          authorPhoto: auth.currentUser.photoURL || 'https://picsum.photos/seed/user/200/200',
          content: newMoment.trim(),
          siteId: site.id,
          siteName: site.buildingName,
          timestamp: serverTimestamp(),
          location: site.district
        });
      }

      setNewMoment('');
      setShowMomentInput(false);
      
      // Trigger sequential popups defined in App.tsx
      onShowSuccess?.(site.buildingName);
      onShowSeal?.(hook);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'moments');
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    addFavRipple(e);
    onToggleFavorite();
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !site) return;
    
    // Check if user is logged in
    if (!auth.currentUser) {
      alert("请先登录以分享您的云游感悟");
      return;
    }

    const noteData = {
      siteId: site.id,
      content: newNote.trim(),
      timestamp: Date.now(), // Using number for consistency with existing UI
      author: localStorage.getItem('user_name') || auth.currentUser.displayName || '匿名同修',
      authorUid: auth.currentUser.uid
    };
    
    try {
      await addDoc(collection(db, 'notes'), noteData);
      setNewNote('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'notes');
    }
  };

  const isMobile = useMediaQuery('(max-width: 768px)');
  const [sheetState, setSheetState] = useState<'half' | 'full'>('half');
  
  // Snap points for mobile
  const snapPoints = {
    half: 0.4,      // 40% down
    full: 0.05      // 5% down
  };

  const currentSnapY = useMemo(() => {
    if (!isMobile) return 0;
    const height = window.innerHeight;
    return height * snapPoints[sheetState];
  }, [sheetState, isMobile]);

  const handleDragEnd = (event: any, info: any) => {
    if (!isMobile) return;
    
    const velocity = info.velocity.y;
    const offset = info.offset.y;
    
    if (velocity > 500) {
      if (sheetState === 'half') {
        onClose();
      } else {
        setSheetState('half');
      }
    } else if (offset > 300) {
      onClose();
    } else if (offset > 100 && sheetState === 'full') {
      setSheetState('half');
    } else if (velocity < -500 || (offset < -100 && sheetState === 'half')) {
      setSheetState('full');
    }
  };

  if (!site) return null;

  const cleanBackground = site.background.replace(/【.*?】/, '').trim();

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        {/* Backdrop for mobile modal */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-h-[90vh] bg-[#FDFBF7] border-2 border-[#D4AF37] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden rounded-sm"
        >
          {/* Header Image for Mobile Modal */}
          <div className="relative h-[180px] shrink-0">
            <img src={site.images[0]} alt={site.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] via-transparent to-transparent" />
            
            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white z-20 hover:bg-[#B22222] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title Overlay */}
            <div className="absolute bottom-4 left-6 right-6">
              <h2 className="text-2xl font-bold text-[#1A1A1A] calligraphy leading-tight drop-shadow-sm">{site.buildingName}</h2>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col px-6">
            <div className="py-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-[#B22222] text-white text-[10px] font-black uppercase tracking-widest">{site.religion}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate">{site.address}</span>
              </div>
              
              {/* Tabs for Mobile Modal */}
              <div className="flex border-b border-[#D4AF37]/10 mb-6 sticky top-0 bg-[#FDFBF7] z-10">
                {['info', 'story', 'travelogue'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 py-4 text-[9px] font-black tracking-widest transition-all relative uppercase ${activeTab === tab ? 'text-[#B22222]' : 'text-slate-400'}`}
                  >
                    {tab === 'info' ? '档案 · HISTORY' : tab === 'story' ? '传说 · FOLKLORE' : '游记 · TRAVELOGUE'}
                    {activeTab === tab && (
                      <motion.div layoutId="activeTabMobileDetails" className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#B22222]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="pb-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'info' && (
                    <motion.div key="info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white border border-[#D4AF37]/10 rounded-sm">
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-1">时代</p>
                          <p className="text-base font-bold text-[#1A1A1A]">{site.era}</p>
                        </div>
                        <div className="p-3 bg-[#B22222] text-white rounded-sm">
                          <p className="text-[8px] text-white/60 font-bold uppercase tracking-widest mb-1">岁月</p>
                          <p className="text-base font-bold">约 {age} 载</p>
                        </div>
                      </div>
                      <div className="p-4 bg-white/50 border-l-2 border-[#D4AF37]/40">
                        <p className="text-sm text-[#2C3E50] leading-relaxed italic font-medium">
                          “{site.recommendation}”
                        </p>
                      </div>
                      <div className="text-[#34495E] text-sm leading-relaxed font-serif text-justify">
                        {cleanBackground}
                      </div>
                    </motion.div>
                  )}
                  {activeTab === 'story' && (
                    <motion.div key="story" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className="text-[#2C3E50] leading-relaxed text-base font-serif italic border-l-2 border-[#D4AF37]/30 pl-4 py-1">
                        {aiStory}
                      </div>
                      <button
                        onClick={generateNewStory}
                        disabled={isGenerating}
                        className="w-full py-3 border-2 border-[#B22222] text-[#B22222] font-black text-[10px] tracking-widest flex items-center justify-center gap-3 uppercase active:scale-95 transition-transform"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? '正在挖掘...' : 'AI 深度挖掘传说'}
                      </button>
                    </motion.div>
                  )}
                  {activeTab === 'travelogue' && (
                    <motion.div key="travelogue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      {/* Couplets */}
                      {site.couplets && site.couplets.length > 0 && (
                        <div className="space-y-3">
                          {site.couplets.map((c, i) => (
                            <div key={i} className="p-3 bg-white border border-[#D4AF37]/10 rounded-sm">
                              <p className="text-[8px] text-[#B22222] font-bold tracking-widest mb-1 uppercase text-center">{c.location}</p>
                              {c.content.map((line, li) => (
                                <p key={li} className="text-base font-serif text-[#1A1A1A] calligraphy text-center tracking-widest">{line}</p>
                              ))}
                              {c.note && (
                                <p className="mt-2 text-[9px] text-slate-400 italic text-center border-t border-[#D4AF37]/5 pt-2 flex items-center justify-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  {c.note}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Notes Section for Mobile */}
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="记录感悟..."
                            className="w-full p-4 bg-white border border-[#D4AF37]/20 rounded-sm text-sm font-serif min-h-[100px] outline-none"
                          />
                          <button
                            onClick={handleAddNote}
                            disabled={!newNote.trim()}
                            className="w-full py-4 bg-[#1A1A1A] text-white font-black text-[10px] tracking-widest uppercase active:scale-95 transition-transform"
                          >
                            记下一笔
                          </button>
                        </div>
                        
                        <div className="pt-4 border-t border-[#D4AF37]/10 space-y-4">
                          {userNotes.map((note) => (
                            <div key={note.id} className="text-sm">
                              <div className="flex justify-between mb-1">
                                <span className="font-bold text-[#B22222] text-[10px] tracking-widest uppercase">{note.author}</span>
                                <span className="text-[8px] text-slate-400">{new Date(note.timestamp).toLocaleDateString()}</span>
                              </div>
                              <p className="font-serif italic text-slate-600 line-clamp-3">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Achievement Sequence & Action Buttons Logic */}
          <AnimatePresence>
            {showMomentInput && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowMomentInput(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-sm bg-[#FDFBF7] border-2 border-[#D4AF37] p-6 shadow-2xl rounded-sm"
                >
                  <div className="flex items-center gap-3 text-[#B22222] mb-4">
                    <PenTool className="w-5 h-5" />
                    <h3 className="text-sm font-black tracking-[0.2em] uppercase calligraphy">留下此时此刻的心得</h3>
                  </div>
                  <textarea
                    value={newMoment}
                    onChange={(e) => setNewMoment(e.target.value)}
                    placeholder="于这古迹禅意间，心有所感..."
                    className="w-full p-4 bg-white border border-[#D4AF37]/20 rounded-sm text-base font-serif italic focus:ring-1 focus:ring-[#B22222] outline-none min-h-[120px]"
                    autoFocus
                  />
                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={() => {
                        setShowMomentInput(false);
                        onShowSuccess?.(site.buildingName);
                        onShowSeal?.(hook);
                        onClose();
                      }}
                      className="flex-1 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase calligraphy"
                    >
                      暂不留言
                    </button>
                    <button 
                      onClick={async () => {
                        await submitCheckInWithMoment();
                        onClose();
                      }}
                      className="flex-[2] py-3 bg-[#B22222] text-white text-[10px] font-black tracking-widest uppercase calligraphy rounded-sm shadow-md active:scale-95 transition-transform"
                    >
                      确认签到
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Action Buttons at Bottom */}
          <div className="p-4 bg-white border-t border-[#D4AF37]/10 flex gap-3 shrink-0">
            <button
              onClick={handleFavoriteClick}
              className={`flex-1 py-3 font-black text-[10px] tracking-widest flex items-center justify-center gap-2 border-2 transition-all uppercase ${isFavorite ? 'bg-[#B22222] border-[#B22222] text-white' : 'border-slate-200 text-slate-500'}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="calligraphy">
                {isFavorite ? '静候缘起' : '一时缘起'}
              </span>
            </button>
            <button
              onClick={handleCheckIn}
              className={`flex-1 py-3 font-black text-[10px] tracking-widest flex items-center justify-center gap-2 border-2 transition-all uppercase ${isCheckedIn ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'border-slate-200 text-slate-500'}`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span className="calligraphy">
                {isCheckedIn ? '云游到此' : '一次接引'}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 200 }}
      className="fixed md:absolute right-0 top-0 w-full md:w-[480px] h-full bg-[#FDFBF7] shadow-[-20px_0_50px_rgba(0,0,0,0.15)] z-[100] flex flex-col border-l border-[#D4AF37]/20"
    >
      {/* Header Section */}
      <div className="relative h-[240px] md:h-[320px] shrink-0 overflow-hidden">
        <img
          src={site.images[0]}
          alt={site.name}
          className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1] brightness-[0.95] sepia-[0.1]"
          referrerPolicy="no-referrer"
          onLoad={(e) => {
            const img = e.currentTarget;
            img.classList.add('animate-fade-in');
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/40 to-transparent" />
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-[#B22222] hover:rotate-90 transition-all border border-white/20 z-30"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-10 pb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="px-4 py-1.5 bg-[#B22222] text-white text-[11px] font-black uppercase tracking-[0.25em] shadow-lg shadow-red-900/20">
                {site.religion}
              </div>
              <div className="h-[1px] flex-1 bg-white/30" />
            </div>

            <div className="relative flex items-center justify-between gap-6 min-h-[100px]">
              <div className="flex-1 min-w-0">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="calligraphy tracking-widest"
                >
                  {site.locationPrefix && (
                    <span className="block text-lg md:text-xl text-white/70 font-medium mb-1 opacity-90 italic">
                      {site.locationPrefix}
                    </span>
                  )}
                  <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight break-words drop-shadow-lg">
                    {site.buildingName}
                  </h2>
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: 'spring', damping: 12, stiffness: 100 }}
                className="relative w-28 h-28 flex items-center justify-center shrink-0"
              >
                {/* Decorative rotating ring */}
                <div className="absolute inset-0 border border-[#D4AF37]/30 rounded-full animate-spin-slow" />
                <div className="absolute inset-2 border border-[#D4AF37]/20 rounded-full animate-spin-slow [animation-direction:reverse]" />
                
                {/* The Seal - 2x2 Grid Layout */}
                <div className="relative w-20 h-20 bg-[#B22222] shadow-[0_15px_35px_rgba(178,34,34,0.5)] flex items-center justify-center border-2 border-[#D4AF37] transform hover:scale-110 transition-transform cursor-default overflow-hidden group/seal">
                  <div className="absolute inset-0.5 border border-[#D4AF37]/40" />
                  <div className="grid grid-cols-2 grid-rows-2 w-full h-full p-2 gap-1 z-10">
                    {hook.split('').map((char, idx) => (
                      <div key={idx} className="flex items-center justify-center text-white text-xl font-black calligraphy leading-none transform group-hover/seal:scale-110 transition-transform duration-300">
                        {char}
                      </div>
                    ))}
                  </div>
                  {/* Subtle texture overlay */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-20 pointer-events-none" />
                </div>
              </motion.div>
            </div>

            <p className="text-white/70 text-sm font-medium tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              {site.address}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white border-b border-[#D4AF37]/10 px-6">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-6 text-xs font-black tracking-[0.4em] transition-all relative uppercase ${activeTab === 'info' ? 'text-[#B22222]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          档案 · HISTORY
          {activeTab === 'info' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-8 right-8 h-1 bg-[#B22222]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('story')}
          className={`flex-1 py-6 text-xs font-black tracking-[0.4em] transition-all relative uppercase ${activeTab === 'story' ? 'text-[#B22222]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          传说 · FOLKLORE
          {activeTab === 'story' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-8 right-8 h-1 bg-[#B22222]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('travelogue')}
          className={`flex-1 py-6 text-xs font-black tracking-[0.4em] transition-all relative uppercase ${activeTab === 'travelogue' ? 'text-[#B22222]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          游记 · TRAVELOGUE
          {activeTab === 'travelogue' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-8 right-8 h-1 bg-[#B22222]" />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto custom-scrollbar bg-[#FDFBF7] touch-pan-y"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'info' ? (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-10 space-y-12"
            >
              {/* Stats Grid - Moved to Top */}
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-white border border-[#D4AF37]/10 rounded-sm shadow-sm">
                  <Calendar className="w-5 h-5 text-[#B22222] mb-3" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">始建年代</p>
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-[#1A1A1A] leading-none">{site.era}</p>
                    <p className="text-sm text-slate-500 font-medium">公元 {site.yearBuilt} 年</p>
                  </div>
                </div>
                <div className="p-6 bg-[#B22222] text-white rounded-sm shadow-xl shadow-red-900/10">
                  <History className="w-5 h-5 text-white/60 mb-3" />
                  <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-1">岁月沉淀</p>
                  <p className="text-xl font-bold">约 {age} 载</p>
                </div>
              </div>

              {/* Recommendation Card */}
              <div className="relative group">
                <div className="absolute -inset-2 bg-[#B22222]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-8 bg-white border border-[#D4AF37]/20 shadow-sm">
                  <Sparkles className="absolute -top-4 -left-4 w-8 h-8 text-[#D4AF37] bg-[#FDFBF7] p-1.5 rounded-full border border-[#D4AF37]/20" />
                  <h4 className="text-sm font-black text-[#B22222] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <span className="w-10 h-[1px] bg-[#B22222]/30" />
                    文化荐语
                  </h4>
                  <p className="text-lg text-[#2C3E50] leading-relaxed italic font-medium">
                    “{site.recommendation}”
                  </p>
                </div>
              </div>

              {/* Practical Info Section */}
              <div className="space-y-6">
                <div className="flex gap-4 group/item">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0 group-hover/item:bg-[#D4AF37]/20 transition-colors">
                    <MapPin className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-[#B22222] uppercase tracking-[0.2em] mb-1">详细地址</h4>
                    <p className="text-base text-[#1A1A1A] leading-relaxed font-medium">{site.address}</p>
                  </div>
                </div>

                <div className="flex gap-4 group/item">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0 group-hover/item:bg-[#D4AF37]/20 transition-colors">
                    <Calendar className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-[#B22222] uppercase tracking-[0.2em] mb-1">营业时间</h4>
                    <p className="text-base text-[#1A1A1A] leading-relaxed font-medium">{site.openingHours}</p>
                  </div>
                </div>
              </div>

              {/* Main Text Content */}
              <div className="space-y-8">
                <section>
                  <h4 className="text-xs font-black text-[#B22222] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                    <History className="w-4 h-4" />
                    历史沿革
                    <div className="h-[1px] flex-1 bg-[#B22222]/10" />
                  </h4>
                  <div className="text-[#34495E] text-lg leading-[2.2] text-justify font-serif">
                    {cleanBackground}
                  </div>
                </section>
              </div>
            </motion.div>
          ) : activeTab === 'travelogue' ? (
            <motion.div
              key="travelogue"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-10 space-y-12"
            >
              {/* Couplets Section */}
              {site.couplets && site.couplets.length > 0 && (
                <section className="space-y-8">
                  <h4 className="text-xs font-black text-[#B22222] uppercase tracking-[0.3em] flex items-center gap-3">
                    <Quote className="w-4 h-4" />
                    古建楹联
                    <div className="h-[1px] flex-1 bg-[#B22222]/10" />
                  </h4>
                  <div className="space-y-6">
                    {site.couplets.map((couplet, idx) => (
                      <div key={idx} className="p-6 bg-white border border-[#D4AF37]/10 rounded-sm shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-5 text-[#D4AF37] group-hover:opacity-20 transition-opacity">
                          <BookOpen className="w-12 h-12" />
                        </div>
                        <p className="text-[10px] text-[#B22222] font-bold tracking-widest mb-3 uppercase">{couplet.location}</p>
                        <div className="flex flex-col items-center gap-2 mb-4">
                          {couplet.content.map((line, lIdx) => (
                            <p key={lIdx} className="text-xl font-serif text-[#1A1A1A] calligraphy tracking-widest text-center">
                              {line}
                            </p>
                          ))}
                        </div>
                        {couplet.meaning && (
                          <div className="mt-4 pt-4 border-t border-[#D4AF37]/10">
                            <p className="text-xs text-slate-500 leading-relaxed">
                              <span className="font-bold text-[#D4AF37] mr-2">释意:</span>
                              {couplet.meaning}
                            </p>
                          </div>
                        )}
                        {couplet.note && (
                          <p className="mt-2 text-[10px] text-slate-400 italic flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#D4AF37]/60" />
                            注：{couplet.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* User Notes Section */}
              <section className="space-y-8">
                <h4 className="text-xs font-black text-[#B22222] uppercase tracking-[0.3em] flex items-center gap-3">
                  <PenTool className="w-4 h-4" />
                  云游笔记
                  <div className="h-[1px] flex-1 bg-[#B22222]/10" />
                </h4>
                
                {/* Add Note Form */}
                <div className="space-y-4">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="记录下你在此处的所见所想，或是发现的楹联细节..."
                    className="w-full p-6 bg-white border border-[#D4AF37]/20 rounded-sm text-base focus:ring-1 focus:ring-[#B22222] focus:border-[#B22222] transition-all placeholder:text-slate-300 min-h-[120px] font-serif"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="w-full py-4 bg-[#1A1A1A] text-white font-black text-[10px] tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-[#B22222] transition-all disabled:opacity-30 uppercase"
                  >
                    <PenTool className="w-4 h-4" />
                    记下一笔
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-6 pt-4">
                  {userNotes.length > 0 ? (
                    userNotes.map((note) => (
                      <div key={note.id} className="relative pl-8 border-l-2 border-[#D4AF37]/20 py-2 group">
                        <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-[#FDFBF7] border-2 border-[#D4AF37] group-hover:bg-[#B22222] group-hover:border-[#B22222] transition-colors" />
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-[#B22222] tracking-widest uppercase">{note.author}</span>
                          <span className="text-[10px] text-slate-400">{new Date(note.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[#2C3E50] leading-relaxed font-serif italic">
                          {note.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center space-y-4 opacity-30">
                      <MessageSquare className="w-12 h-12 mx-auto text-slate-300" />
                      <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">尚无云游记录，期待你的分享</p>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="story"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-10 space-y-10"
            >
              <div className="relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]/30" />
                <div className="pl-8 text-[#2C3E50] leading-[2.4] text-justify indent-10 text-xl font-serif italic">
                  {aiStory}
                </div>
              </div>
              
              <button
                onClick={generateNewStory}
                disabled={isGenerating}
                className="w-full py-6 bg-white border-2 border-[#B22222] text-[#B22222] font-black text-xs tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-[#B22222] hover:text-white transition-all disabled:opacity-50 uppercase group"
              >
                <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
                {isGenerating ? '正在穿越时空...' : 'AI 深度挖掘更多传说'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="p-10 border-t border-[#D4AF37]/10 bg-white flex flex-col gap-6 shrink-0">
        <AnimatePresence>
          {showMomentInput && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowMomentInput(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-[#FDFBF7] border-2 border-[#D4AF37] p-10 shadow-2xl rounded-sm"
              >
                <div className="flex items-center gap-4 text-[#B22222] mb-6">
                  <PenTool className="w-6 h-6" />
                  <h3 className="text-xl font-bold tracking-[0.3em] uppercase calligraphy">留下此时此刻的心得</h3>
                </div>
                <p className="text-sm text-slate-500 mb-6 font-serif italic">
                  “一念起处，众缘相会。于此地留下足迹，亦是心中一抹清凉。”
                </p>
                <textarea
                  value={newMoment}
                  onChange={(e) => setNewMoment(e.target.value)}
                  placeholder="于这古迹禅意间，心有所感..."
                  className="w-full p-6 bg-white border border-[#D4AF37]/20 rounded-sm text-lg font-serif italic focus:ring-1 focus:ring-[#B22222] outline-none min-h-[160px]"
                  autoFocus
                />
                <div className="flex gap-4 mt-8">
                  <button 
                    onClick={() => {
                      setShowMomentInput(false);
                      onShowSuccess?.(site.buildingName);
                      onShowSeal?.(hook);
                      onClose();
                    }}
                    className="flex-1 py-4 text-xs font-black tracking-[0.3em] text-slate-400 hover:text-slate-600 uppercase calligraphy"
                  >
                    暂不留言
                  </button>
                  <button 
                    onClick={async () => {
                      await submitCheckInWithMoment();
                      onClose();
                    }}
                    className="flex-[2] py-4 bg-[#1A1A1A] text-white text-xs font-black tracking-[0.3em] uppercase calligraphy rounded-sm shadow-xl hover:bg-[#B22222] transition-colors active:scale-95"
                  >
                    确认签到 · 円满
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex gap-6">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFavoriteClick}
            className={`flex-1 py-5 font-black text-xs tracking-[0.3em] flex items-center justify-center gap-3 transition-all border-2 uppercase relative overflow-hidden group/btn ${isFavorite ? 'bg-[#B22222] border-[#B22222] text-white shadow-[0_10px_20px_rgba(178,34,34,0.2)]' : 'bg-transparent border-slate-200 text-slate-500 hover:border-[#B22222] hover:text-[#B22222] hover:bg-[#B22222]/5'}`}
          >
            <motion.div
              animate={isFavorite ? { scale: [1, 1.3, 1], rotate: [0, 20, -20, 0] } : {}}
              transition={{ duration: 0.6, ease: "backOut" }}
            >
              <Sparkles className={`w-5 h-5 ${isFavorite ? 'text-white' : 'group-hover:text-[#B22222] transition-colors'}`} />
            </motion.div>
            <span className="calligraphy text-sm tracking-widest relative z-10">
              {isFavorite ? '静候缘起' : '一时缘起'}
            </span>
            
            {/* Ripple Effect */}
            <AnimatePresence>
              {favRipples.map(ripple => (
                <motion.span
                  key={ripple.id}
                  initial={{ scale: 0, opacity: 0.5 }}
                  animate={{ scale: 4, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  style={{
                    position: 'absolute',
                    left: ripple.x,
                    top: ripple.y,
                    width: '20px',
                    height: '20px',
                    backgroundColor: isFavorite ? 'rgba(255,255,255,0.4)' : 'rgba(178,34,34,0.2)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              ))}
            </AnimatePresence>

            {/* Background Glow on Favorite */}
            {isFavorite && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-white/20 pointer-events-none"
              />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCheckIn}
            className={`flex-1 py-5 font-black text-xs tracking-[0.3em] flex items-center justify-center gap-3 transition-all border-2 uppercase relative overflow-hidden group/btn ${isCheckedIn ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-[0_10px_20px_rgba(0,0,0,0.15)]' : 'bg-transparent border-slate-200 text-slate-500 hover:border-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5'}`}
          >
            <motion.div
              animate={isCheckedIn ? { y: [0, -8, 0], scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <Footprints className={`w-5 h-5 ${isCheckedIn ? 'text-white' : 'group-hover:text-[#1A1A1A] transition-colors'}`} />
            </motion.div>
            <span className="calligraphy text-sm tracking-widest relative z-10">
              {isCheckedIn ? '云游到此' : '一次接引'}
            </span>

            {/* Ripple Effect */}
            <AnimatePresence>
              {checkRipples.map(ripple => (
                <motion.span
                  key={ripple.id}
                  initial={{ scale: 0, opacity: 0.5 }}
                  animate={{ scale: 4, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  style={{
                    position: 'absolute',
                    left: ripple.x,
                    top: ripple.y,
                    width: '20px',
                    height: '20px',
                    backgroundColor: isCheckedIn ? 'rgba(255,255,255,0.3)' : 'rgba(26,26,26,0.15)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              ))}
            </AnimatePresence>

            {/* Shimmer Effect for Checked In */}
            {isCheckedIn && (
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
              />
            )}
          </motion.button>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-40">
          <p className="text-[10px] text-slate-500 calligraphy tracking-[0.2em]">
            {isFavorite ? "心向往之，待云游时再续前缘" : "见证古迹，不为占有，只为一瞬之缘"}
          </p>
          {isCheckedIn && (
            <p className="text-[10px] text-slate-500 calligraphy tracking-[0.2em]">
              到访此地，接引古今，云游四海
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DetailsPanel;
