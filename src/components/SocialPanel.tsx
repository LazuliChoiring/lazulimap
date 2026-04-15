import React, { useState, useEffect, useMemo } from 'react';
import { Users, UserPlus, Copy, Check, MessageSquare, Compass, X, MapPin, Navigation2, History, ChevronLeft, Quote, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, collection, query, where, addDoc, getDoc, getDocs, serverTimestamp, orderBy, setDoc } from 'firebase/firestore';
import { ReligiousSite } from '../data/sites';

interface SocialPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sites: ReligiousSite[];
  onSelectSite: (site: ReligiousSite) => void;
  userLocation: [number, number] | null;
}

interface FriendProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  favorites: number[];
  checkIns: number[];
}

interface Moment {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  siteId: number;
  siteName: string;
  timestamp: any;
}

interface ChatMessage {
  id: string;
  senderUid: string;
  text: string;
  timestamp: any;
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

const SocialPanel: React.FC<SocialPanelProps> = ({ isOpen, onClose, sites, onSelectSite, userLocation }) => {
  const [activeView, setActiveView] = useState<'list' | 'chat' | 'journey' | 'moments'>('list');
  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [newFriendUid, setNewFriendUid] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [moments, setMoments] = useState<Moment[]>([]);

  const currentUser = auth.currentUser;

  // 1. Fetch current user profile and friends
  useEffect(() => {
    if (!currentUser) return;

    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        
        // Fetch friend details in parallel
        if (data.friends && data.friends.length > 0) {
          const fetchFriends = async () => {
            try {
              const friendPromises = data.friends.map((fUid: string) => getDoc(doc(db, 'users', fUid)));
              const friendSnaps = await Promise.all(friendPromises);
              const friendData = friendSnaps
                .filter(snap => snap.exists())
                .map(snap => snap.data() as FriendProfile);
              setFriends(friendData);
            } catch (err) {
              console.error("Error fetching friends:", err);
            }
          };
          fetchFriends();
        } else {
          setFriends([]);
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`));

    return () => unsub();
  }, [currentUser]);

  // 2. Fetch friend requests
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'friend_requests'), where('toUid', '==', currentUser.uid), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, (snap) => {
      setFriendRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [currentUser]);

  // 3. Fetch messages when in chat
  useEffect(() => {
    if (!currentUser || !selectedFriend || activeView !== 'chat') return;

    const chatId = [currentUser.uid, selectedFriend.uid].sort().join('_');
    const q = query(collection(db, 'messages'), where('chatId', '==', chatId), orderBy('timestamp', 'asc'));
    
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'messages'));

    return () => unsub();
  }, [currentUser, selectedFriend, activeView]);

  // 4. Fetch moments from friends
  useEffect(() => {
    if (!currentUser || activeView !== 'moments') return;

    const friendUids = friends.map(f => f.uid);
    if (friendUids.length === 0) {
      setMoments([]);
      return;
    }

    // Firestore 'in' query limit is 10, but for simplicity we'll assume friends < 10 for now
    // or just fetch all and filter client side if needed. 
    // Let's fetch the most recent moments from everyone and filter.
    const q = query(
      collection(db, 'moments'), 
      where('authorUid', 'in', [...friendUids, currentUser.uid]),
      orderBy('timestamp', 'desc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setMoments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Moment)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'moments'));

    return () => unsub();
  }, [currentUser, friends, activeView]);

  const copyUid = () => {
    if (currentUser) {
      navigator.clipboard.writeText(currentUser.uid);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const sendFriendRequest = async () => {
    if (!currentUser || !newFriendUid.trim() || newFriendUid === currentUser.uid) return;

    try {
      // Check if user exists
      const userSnap = await getDoc(doc(db, 'users', newFriendUid));
      if (!userSnap.exists()) {
        alert('未找到该同修，请检查UID是否正确');
        return;
      }

      await addDoc(collection(db, 'friend_requests'), {
        fromUid: currentUser.uid,
        fromName: userProfile?.displayName || '匿名同修',
        toUid: newFriendUid,
        status: 'pending',
        timestamp: Date.now()
      });
      setNewFriendUid('');
      alert('请求已发送，静候回音');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'friend_requests');
    }
  };

  const acceptRequest = async (req: any) => {
    if (!currentUser) return;

    try {
      // Add to each other's friends list
      await updateDoc(doc(db, 'users', currentUser.uid), {
        friends: arrayUnion(req.fromUid)
      });
      await updateDoc(doc(db, 'users', req.fromUid), {
        friends: arrayUnion(currentUser.uid)
      });
      // Delete request
      await updateDoc(doc(db, 'friend_requests', req.id), {
        status: 'accepted'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'users');
    }
  };

  const sendMessage = async () => {
    if (!currentUser || !selectedFriend || !newMessage.trim()) return;

    const chatId = [currentUser.uid, selectedFriend.uid].sort().join('_');
    try {
      await addDoc(collection(db, 'messages'), {
        chatId,
        senderUid: currentUser.uid,
        text: newMessage,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'messages');
    }
  };

  // Shared Journey Logic
  const sharedJourney = useMemo(() => {
    if (!selectedFriend || !userProfile) return { waiting: [], shared: [] };

    const waiting = sites.filter(s => 
      userProfile.favorites?.includes(s.id) && 
      selectedFriend.favorites?.includes(s.id) &&
      !userProfile.checkIns?.includes(s.id) &&
      !selectedFriend.checkIns?.includes(s.id)
    );

    const shared = sites.filter(s => 
      userProfile.checkIns?.includes(s.id) && 
      selectedFriend.checkIns?.includes(s.id)
    );

    if (userLocation) {
      const sortByDist = (a: ReligiousSite, b: ReligiousSite) => {
        const distA = getDistance(userLocation[1], userLocation[0], a.coordinates[1], a.coordinates[0]);
        const distB = getDistance(userLocation[1], userLocation[0], b.coordinates[1], b.coordinates[0]);
        return distA - distB;
      };
      return {
        waiting: [...waiting].sort(sortByDist),
        shared: [...shared].sort(sortByDist)
      };
    }

    return { waiting, shared };
  }, [selectedFriend, userProfile, sites, userLocation]);

  if (!isOpen) return null;

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
        <div className="p-8 border-b border-[#D4AF37]/20 bg-[#F5F2ED] flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-[#B22222] rounded-full flex items-center justify-center text-white shadow-lg">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold calligraphy tracking-widest text-[#1A1A1A]">同修录</h2>
                <p className="text-xs text-[#B22222] font-black tracking-[0.3em] uppercase opacity-70">Fellow Practitioners</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-[#B22222]/10 rounded-full transition-colors">
              <X className="w-7 h-7 text-[#1A1A1A]" />
            </button>
          </div>

          <div className="flex bg-white/50 p-1 rounded-sm border border-[#D4AF37]/10">
            <button 
              onClick={() => setActiveView('list')}
              className={`flex-1 py-2 text-xs font-bold tracking-widest calligraphy transition-all ${activeView === 'list' ? 'bg-[#B22222] text-white shadow-sm' : 'text-slate-500 hover:text-[#B22222]'}`}
            >
              同修列表
            </button>
            <button 
              onClick={() => setActiveView('moments')}
              className={`flex-1 py-2 text-xs font-bold tracking-widest calligraphy transition-all ${activeView === 'moments' ? 'bg-[#B22222] text-white shadow-sm' : 'text-slate-500 hover:text-[#B22222]'}`}
            >
              同修动态
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {activeView === 'moments' && (
              <motion.div
                key="moments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col p-8 space-y-8 overflow-y-auto custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"
              >
                <div className="space-y-10">
                  {moments.map(moment => (
                    <div key={moment.id} className="relative pl-12 border-l border-[#D4AF37]/30 py-2 group">
                      <div className="absolute -left-[6px] top-4 w-3 h-3 rounded-full bg-[#FDFBF7] border-2 border-[#D4AF37] group-hover:bg-[#B22222] group-hover:border-[#B22222] transition-colors" />
                      
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#D4AF37]/20 shrink-0">
                          <img src={moment.authorPhoto} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-bold calligraphy text-[#B22222]">{moment.authorName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {moment.timestamp?.seconds ? new Date(moment.timestamp.seconds * 1000).toLocaleString() : '刚刚'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                            <MapPin className="w-3 h-3" />
                            云游至 · {moment.siteName}
                          </div>
                        </div>
                      </div>

                      <div className="relative p-6 bg-white border border-[#D4AF37]/10 rounded-sm shadow-sm hover:shadow-md transition-shadow">
                        <Quote className="absolute -top-3 -left-3 w-6 h-6 text-[#D4AF37]/20" />
                        <p className="text-lg text-[#1A1A1A] calligraphy leading-relaxed italic">
                          {moment.content}
                        </p>
                      </div>
                    </div>
                  ))}

                  {moments.length === 0 && (
                    <div className="py-20 text-center space-y-4 opacity-40">
                      <Wind className="w-12 h-12 mx-auto text-slate-300" />
                      <p className="text-sm font-bold tracking-widest text-slate-400 calligraphy">清风拂过，暂无同修留下墨宝</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeView === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col p-6 space-y-8 overflow-y-auto custom-scrollbar"
              >
                {/* My UID */}
                <div className="p-6 bg-white border border-[#D4AF37]/20 rounded-sm space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold calligraphy text-slate-500">我的同修编号 (UID)</span>
                    <button 
                      onClick={copyUid}
                      className="flex items-center gap-2 text-sm text-[#B22222] hover:underline font-medium"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {isCopied ? '已复制' : '复制编号'}
                    </button>
                  </div>
                  <div className="bg-[#F5F2ED] p-4 rounded-sm font-mono text-base break-all text-slate-600 border border-[#D4AF37]/10">
                    {currentUser?.uid}
                  </div>
                </div>

                {/* Add Friend */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold calligraphy text-[#1A1A1A] flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#B22222]" />
                    寻访新同修
                  </h3>
                  <div className="flex gap-3">
                    <input 
                      type="text"
                      value={newFriendUid}
                      onChange={(e) => setNewFriendUid(e.target.value)}
                      placeholder="输入同修UID..."
                      className="flex-1 px-5 py-3 bg-white border border-[#D4AF37]/30 rounded-sm text-base focus:ring-2 focus:ring-[#B22222]/20 outline-none transition-all"
                    />
                    <button 
                      onClick={sendFriendRequest}
                      className="px-6 py-3 bg-[#1A1A1A] text-white rounded-sm text-base font-bold hover:bg-[#B22222] transition-colors flex items-center gap-2 shadow-md"
                    >
                      添加
                    </button>
                  </div>
                  
                  {/* Test Button */}
                  <button 
                    onClick={async () => {
                      if (!currentUser) return;
                      const mockUid = 'MOCK_MASTER_001';
                      try {
                        // 1. Create mock user if not exists
                        await setDoc(doc(db, 'users', mockUid), {
                          uid: mockUid,
                          displayName: '云游僧·虚云',
                          photoURL: 'https://picsum.photos/seed/monk/200/200',
                          favorites: [1, 2, 3, 5, 8, 12, 15, 20],
                          checkIns: [1, 4, 7],
                          friends: [currentUser.uid] // Make them friends immediately for testing
                        }, { merge: true });

                        // 2. Add current user to mock user's friends if not already
                        await updateDoc(doc(db, 'users', currentUser.uid), {
                          friends: arrayUnion(mockUid)
                        });

                        // 3. Create a mock moment
                        await addDoc(collection(db, 'moments'), {
                          authorUid: mockUid,
                          authorName: '云游僧·虚云',
                          authorPhoto: 'https://picsum.photos/seed/monk/200/200',
                          content: '灵山不远，就在脚下。今日于灵隐寺听经，忽觉万法唯心，所见皆是虚妄，亦是真如。',
                          siteId: 1,
                          siteName: '灵隐寺',
                          timestamp: serverTimestamp()
                        });

                        alert('测试同修“虚云”已与您结缘，并留下了一则心得。请切换到“同修动态”查看。');
                      } catch (err) {
                        console.error(err);
                        alert('召唤失败，请检查网络连接');
                      }
                    }}
                    className="w-full py-2 border border-dashed border-[#B22222]/30 text-[#B22222]/60 text-[10px] calligraphy hover:bg-[#B22222]/5 transition-all"
                  >
                    ✨ 召唤虚拟同修 (测试心得与动态)
                  </button>
                </div>

                {/* Friend Requests */}
                {friendRequests.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold calligraphy text-[#B22222]">待结缘请求</h3>
                    <div className="space-y-3">
                      {friendRequests.map(req => (
                        <div key={req.id} className="flex items-center justify-between p-4 bg-[#B22222]/5 border border-[#B22222]/10 rounded-sm shadow-sm">
                          <span className="text-base font-bold calligraphy">{req.fromName}</span>
                          <button 
                            onClick={() => acceptRequest(req)}
                            className="px-5 py-2 bg-[#B22222] text-white text-sm font-bold rounded-full hover:bg-[#8B0000] transition-colors shadow-sm"
                          >
                            结缘
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Friends List */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold calligraphy text-[#1A1A1A]">我的同修 ({friends.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {friends.map(friend => (
                      <button
                        key={friend.uid}
                        onClick={() => {
                          setSelectedFriend(friend);
                          setActiveView('chat');
                        }}
                        className="flex items-center gap-4 p-5 bg-white border border-[#D4AF37]/10 hover:border-[#B22222]/30 transition-all rounded-sm group shadow-sm hover:shadow-md"
                      >
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                          {friend.photoURL ? (
                            <img src={friend.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Users className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="text-base font-bold calligraphy group-hover:text-[#B22222] truncate">{friend.displayName || '无名同修'}</div>
                          <div className="text-xs text-slate-400 font-mono truncate">UID: {friend.uid.slice(0, 12)}...</div>
                        </div>
                        <MessageSquare className="w-5 h-5 text-slate-300 ml-auto group-hover:text-[#B22222] shrink-0" />
                      </button>
                    ))}
                    {friends.length === 0 && (
                      <div className="col-span-full py-16 text-center px-6">
                        <div className="w-12 h-12 bg-[#D4AF37]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-6 h-6 text-[#D4AF37]/20" />
                        </div>
                        <p className="text-sm text-slate-400 italic calligraphy mb-1">独行亦是修行，结缘自在人心</p>
                        <p className="text-[9px] text-slate-300 tracking-[0.2em] uppercase">Your journey is currently a solitary one</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'chat' && selectedFriend && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                {/* Chat Header */}
                <div className="px-8 py-4 bg-white border-b border-[#D4AF37]/10 flex items-center justify-between shadow-sm">
                  <button 
                    onClick={() => setActiveView('list')}
                    className="text-base text-slate-500 hover:text-[#B22222] calligraphy flex items-center gap-2 group font-medium"
                  >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 返回
                  </button>
                  <div className="text-center">
                    <div className="text-lg font-bold calligraphy text-[#1A1A1A]">{selectedFriend.displayName}</div>
                    <div className="text-xs text-[#00A86B] font-bold tracking-widest uppercase">在线交流</div>
                  </div>
                  <button 
                    onClick={() => setActiveView('journey')}
                    className="px-4 py-2 bg-[#B22222]/10 text-[#B22222] text-sm font-bold rounded-full hover:bg-[#B22222] hover:text-white transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Compass className="w-4 h-4" />
                    同愿同行
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderUid === currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-sm text-base shadow-sm leading-relaxed ${msg.senderUid === currentUser?.uid ? 'bg-[#1A1A1A] text-white' : 'bg-white border border-[#D4AF37]/20 text-[#2C3E50]'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="p-6 bg-[#F5F2ED] border-t border-[#D4AF37]/20 flex gap-3">
                  <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="说点什么..."
                    className="flex-1 px-6 py-3 bg-white border border-[#D4AF37]/30 rounded-full text-base outline-none focus:ring-2 focus:ring-[#B22222]/20 shadow-inner"
                  />
                  <button 
                    onClick={sendMessage}
                    className="w-12 h-12 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center hover:bg-[#B22222] transition-colors shadow-md"
                  >
                    <MessageSquare className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            )}

            {activeView === 'journey' && selectedFriend && (
              <motion.div
                key="journey"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col p-8 space-y-10 overflow-y-auto custom-scrollbar"
              >
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => setActiveView('chat')}
                    className="text-base text-slate-500 hover:text-[#B22222] calligraphy flex items-center gap-2 group font-medium"
                  >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 返回对话
                  </button>
                  <h3 className="text-xl font-bold calligraphy text-[#B22222] tracking-wide">同愿同行 · 缘分契合</h3>
                </div>

                {/* Waiting for Connection */}
                <div className="space-y-5">
                  <h4 className="text-base font-bold calligraphy flex items-center gap-3 text-[#D4AF37]">
                    <Navigation2 className="w-5 h-5" />
                    静候结缘 (共同想去)
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {sharedJourney.waiting.map(site => (
                      <button
                        key={site.id}
                        onClick={() => {
                          onSelectSite(site);
                          onClose();
                        }}
                        className="flex items-center justify-between p-5 bg-white border border-[#D4AF37]/20 rounded-sm hover:border-[#B22222] transition-all group shadow-sm hover:shadow-md"
                      >
                        <div className="text-left">
                          <div className="text-base font-bold calligraphy group-hover:text-[#B22222]">{site.name}</div>
                          <div className="text-sm text-slate-400 mt-1">{site.district} · {site.religion}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <MapPin className="w-5 h-5 text-[#D4AF37]/30 group-hover:text-[#B22222]" />
                          {userLocation && (
                            <span className="text-xs font-mono text-slate-400 font-medium">
                              {getDistance(userLocation[1], userLocation[0], site.coordinates[1], site.coordinates[0]).toFixed(1)}km
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                    {sharedJourney.waiting.length === 0 && (
                      <p className="text-sm text-slate-400 italic text-center py-6 bg-white/50 rounded-sm border border-dashed border-slate-200">暂无共同向往之地</p>
                    )}
                  </div>
                </div>

                {/* Shared Footprints */}
                <div className="space-y-5">
                  <h4 className="text-base font-bold calligraphy flex items-center gap-3 text-[#00A86B]">
                    <History className="w-5 h-5" />
                    同愿同行 (共同去过)
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {sharedJourney.shared.map(site => (
                      <button
                        key={site.id}
                        onClick={() => {
                          onSelectSite(site);
                          onClose();
                        }}
                        className="flex items-center justify-between p-5 bg-[#00A86B]/5 border border-[#00A86B]/20 rounded-sm hover:border-[#00A86B] transition-all group shadow-sm hover:shadow-md"
                      >
                        <div className="text-left">
                          <div className="text-base font-bold calligraphy text-[#00A86B]">{site.name}</div>
                          <div className="text-sm text-slate-400 mt-1">{site.district} · {site.religion}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Check className="w-5 h-5 text-[#00A86B]" />
                          {userLocation && (
                            <span className="text-xs font-mono text-slate-400 font-medium">
                              {getDistance(userLocation[1], userLocation[0], site.coordinates[1], site.coordinates[0]).toFixed(1)}km
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                    {sharedJourney.shared.length === 0 && (
                      <p className="text-sm text-slate-400 italic text-center py-6 bg-white/50 rounded-sm border border-dashed border-slate-200">尚未有共同足迹</p>
                    )}
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

export default SocialPanel;
