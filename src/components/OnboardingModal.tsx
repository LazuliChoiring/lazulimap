import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: (name: string) => void;
  forceShow?: boolean;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, forceShow }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isNameConfirmed, setIsNameConfirmed] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      const savedName = localStorage.getItem('user_name');
      if (savedName) {
        setName(savedName);
        setIsNameConfirmed(true);
      }
    } else {
      const savedName = localStorage.getItem('user_name');
      if (!savedName) {
        setIsVisible(true);
      }
    }
  }, [forceShow]);

  const validateName = (val: string) => {
    if (!val.trim()) return null;
    if (val.length > 4) return '称呼太长，恐难入章（限4字内）';
    if (val.length < 1) return '称呼太短，请重新斟酌';
    
    const chineseRegex = /^[\u4e00-\u9fa5]+$/;
    if (!chineseRegex.test(val)) {
      return '称呼仅限中文，不宜掺杂异国符号或数字';
    }
    
    const sensitiveWords = ['管理员', 'admin', '系统', '官方', '垃圾', '混蛋', '死', '杀', '操', '逼', '贱'];
    if (sensitiveWords.some(word => val.toLowerCase().includes(word))) {
      return '此称呼略显不雅或不合礼数，请重新斟酌';
    }
    
    return null;
  };

  const handleConfirmName = () => {
    if (!name.trim()) {
      setName('無名之輩');
      setIsNameConfirmed(true);
      setError('洗去浮沉，空性妙有。师兄此后便以“無名之輩”入世云游，亦是自在。');
      return;
    }
    const validationError = validateName(name);
    if (validationError) {
      setError(validationError);
      return;
    }
    // Automatically convert to traditional Chinese
    const tradName = s2t(name.trim());
    setName(tradName);
    setIsNameConfirmed(true);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameConfirmed) {
      handleConfirmName();
      return;
    }

    localStorage.setItem('user_name', name.trim());
    setIsVisible(false);
    setTimeout(() => onComplete(name.trim()), 1500);
  };

  // Expanded Simplified to Traditional mapping
  const s2t = (text: string) => {
    const dict: Record<string, string> = {
      '琉': '琉', '璃': '璃', '云': '雲', '游': '遊', '印': '印', '到': '到', '此': '此',
      '一': '一', '二': '二', '三': '三', '四': '四', '五': '五', '六': '六', '七': '七', '八': '八', '九': '九', '十': '十',
      '天': '天', '地': '地', '人': '人', '和': '和', '灵': '靈', '顺': '順', '寺': '寺', '庙': '廟',
      '山': '山', '水': '水', '风': '風', '月': '月', '花': '花', '鸟': '鳥', '鱼': '魚', '虫': '蟲',
      '龙': '龍', '凤': '鳳', '华': '華', '国': '國', '书': '書', '画': '畫', '禅': '禪', '道': '道',
      '真': '真', '君': '君', '下': '下', '第': '第', '财': '財', '神': '神', '无': '無', '名': '名', '之': '之', '辈': '輩',
      '波': '波', '胡': '胡', '海': '海', '空': '空', '妙': '妙', '有': '有', '净': '淨', '尘': '塵',
      '缘': '緣', '合': '合', '迹': '跡', '段': '段', '每': '每', '为': '為', '这': '這', '里': '裡', '后': '後', '于': '於',
      '悠': '悠', '莲': '蓮', '艺': '藝', '术': '術', '大': '大', '成': '成', '乐': '樂', '观': '觀', '见': '見', '觉': '覺',
      '门': '門', '开': '開', '发': '發', '经': '經', '义': '義', '礼': '禮', '圣': '聖', '贤': '賢', '学': '學', '问': '問',
      '万': '萬', '与': '與', '体': '體', '写': '寫', '军': '軍', '农': '農', '冬': '冬', '几': '幾',
      '制': '製', '务': '務', '动': '動', '励': '勵', '劳': '勞', '医': '醫', '双': '雙', '变': '變', '叹': '嘆', '嘱': '囑',
      '园': '園', '围': '圍', '图': '圖', '团': '團', '声': '聲', '处': '處', '备': '備', '梦': '夢', '头': '頭', '夸': '誇',
      '夺': '奪', '奋': '奮', '妇': '婦', '宁': '寧', '宽': '寬', '审': '審', '导': '導', '层': '層', '属': '屬', '屡': '屢',
      '屿': '嶼', '岁': '歲', '广': '廣', '庆': '慶', '庐': '廬', '库': '庫', '应': '應', '庞': '龐', '废': '廢',
      '异': '異', '弃': '棄', '张': '張', '归': '歸', '当': '當', '录': '錄', '彦': '彥', '彻': '徹', '径': '徑',
      '忆': '憶', '忏': '懺', '忧': '憂', '态': '態', '怜': '憐', '怀': '懷', '悬': '懸', '惊': '驚', '惧': '懼', '惨': '慘',
      '惩': '懲', '惫': '憊', '惬': '愜', '惭': '慚', '惮': '憚', '惯': '慣', '愤': '憤', '愿': '願', '懒': '懶', '憾': '憾',
      '懂': '懂', '懈': '懈', '战': '戰', '戏': '戲', '户': '戶', '抛': '拋', '护': '護', '报': '報', '担': '擔', '拟': '擬',
      '拢': '攏', '拣': '揀', '拥': '擁', '拦': '攔', '拧': '擰', '拨': '撥', '择': '擇', '挂': '掛', '挚': '摯', '挛': '攣',
      '挺': '挺', '挽': '挽', '捆': '捆', '捉': '捉', '损': '損', '换': '換', '捣': '搗', '据': '據', '捷': '捷', '授': '授',
      '掉': '掉', '掌': '掌', '掘': '掘', '挣': '掙', '掠': '掠', '採': '採', '探': '探', '掣': '掣', '接': '接',
      '控': '控', '推': '推', '掩': '掩', '措': '措', '掬': '掬', '掼': '摜', '揶': '揶', '掷': '擲', '掸': '撣', '掺': '摻',
      '揉': '揉', '揍': '揍', '描': '描', '提': '提', '插': '插', '揖': '揖', '扬': '揚', '握': '握', '揣': '揣',
      '揩': '揩', '揪': '揪', '揭': '揭', '挥': '揮', '揿': '撳', '援': '援', '搅': '攪', '构': '構', '枢': '樞',
      '标': '標', '栏': '欄', '树': '樹', '栖': '棲', '样': '樣', '档': '檔', '检': '檢', '楼': '樓', '概': '概', '榄': '欖',
      '次': '次', '欢': '歡', '欧': '歐', '欲': '欲', '欺': '欺', '款': '款', '歇': '歇', '歌': '歌', '止': '止', '正': '正',
      '殊': '殊', '残': '殘', '殖': '殖', '殴': '毆', '殷': '殷', '杀': '殺', '壳': '殼', '毁': '毀',
      '毅': '毅', '毋': '毋', '毒': '毒', '比': '比', '毕': '畢', '毗': '毗', '毙': '斃', '毛': '毛', '毡': '氈', '毳': '毳',
      '毯': '毯', '毫': '毫', '氏': '氏', '民': '民', '气': '氣', '氛': '氛', '氟': '氟', '氢': '氫', '氤': '氤',
      '氦': '氦', '氧': '氧', '氨': '氨', '氩': '氬', '氪': '氪', '氙': '氙', '氡': '氡', '氲': '氳', '永': '永',
      '氾': '氾', '汀': '汀', '汁': '汁', '求': '求', '汇': '匯', '汉': '漢', '汗': '汗', '汛': '汛', '汜': '汜',
      '汝': '汝', '汞': '汞', '江': '江', '池': '池', '汤': '湯', '汨': '汨', '汪': '汪', '汰': '汰', '汲': '汲',
      '汴': '汴', '汶': '汶', '汹': '洶', '汽': '汽', '汾': '汾', '沁': '沁', '沂': '沂', '沃': '沃', '沅': '沅', '沆': '沆',
      '沈': '沈', '沉': '沉', '沌': '沌', '沏': '沏', '沐': '沐', '沓': '沓', '沔': '沔', '沙': '沙', '沛': '沛', '沟': '溝',
      '没': '沒', '沣': '灃', '沤': '漚', '沥': '瀝', '沦': '淪', '沧': '滄', '沨': '沨', '沩': '溈', '沪': '滬', '沫': '沫',
      '沭': '沭', '沮': '沮', '沱': '沱', '沲': '沲', '河': '河', '沸': '沸', '油': '油', '治': '治', '沼': '沼', '沽': '沽',
      '沾': '沾', '沿': '沿', '泄': '洩', '泅': '泅', '泉': '泉', '泊': '泊', '泌': '泌', '泖': '泖', '泓': '泓', '泔': '泔',
      '法': '法', '泗': '泗', '泙': '泙', '泛': '泛', '泞': '濘', '泠': '泠', '泡': '泡', '泣': '泣',
      '泥': '泥', '注': '注', '泪': '淚', '泫': '泫', '泮': '泮', '泯': '泯', '泰': '泰', '泱': '泱', '泳': '泳', '洁': '潔',
      '洒': '灑', '洗': '洗', '洙': '洙', '洚': '洚', '洛': '洛', '洞': '洞', '津': '津', '洧': '洧', '洪': '洪', '洫': '洫',
      '洮': '洮', '洱': '洱', '洲': '洲', '洳': '洳', '洵': '洵', '洸': '洸', '洹': '洹', '洺': '洺', '活': '活', '洼': '窪',
      '洽': '洽', '派': '派', '流': '流', '浃': '浹', '浅': '淺', '浆': '漿', '浇': '澆', '浈': '湞', '浉': '溮', '浊': '濁',
      '测': '測', '浍': '澮', '济': '濟', '浏': '瀏', '浐': '滻', '浑': '渾', '浒': '滸', '浓': '濃', '浔': '潯', '浕': '濜',
      '涂': '塗', '涌': '湧', '涛': '濤', '涝': '澇', '涞': '淶', '涟': '漣', '涠': '潿', '涡': '渦', '涣': '渙', '涤': '滌',
      '润': '潤', '涧': '澗', '涨': '漲', '涩': '澀'
    };
    return text.split('').map(c => dict[c] || c).join('');
  };

  const renderSealChars = (text: string) => {
    const tradText = s2t(text);
    const chars = tradText.split('');
    const len = chars.length;

    const charClass = "text-white font-black font-calligraphy leading-none flex items-center justify-center";

    if (len === 1) {
      return (
        <span className={`${charClass} text-6xl`}>
          {chars[0]}
        </span>
      );
    }

    if (len === 2) {
      return (
        <div className="flex flex-row-reverse gap-2 items-center justify-center w-full h-full">
          {chars.map((char, i) => (
            <span key={i} className={`${charClass} text-4xl`}>
              {char}
            </span>
          ))}
        </div>
      );
    }

    if (len === 3) {
      return (
        <div className="flex flex-row-reverse w-full h-full p-1">
          <div className="w-1/2 flex items-center justify-center border-l border-[#D4AF37]/20">
            <span className={`${charClass} text-5xl`}>
              {chars[0]}
            </span>
          </div>
          <div className="w-1/2 flex flex-col">
            <div className="h-1/2 flex items-center justify-center border-b border-[#D4AF37]/20">
              <span className={`${charClass} text-2xl`}>
                {chars[1]}
              </span>
            </div>
            <div className="h-1/2 flex items-center justify-center">
              <span className={`${charClass} text-2xl`}>
                {chars[2]}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-row-reverse w-full h-full p-1">
        <div className="w-1/2 flex flex-col border-l border-[#D4AF37]/20">
          <div className="h-1/2 flex items-center justify-center border-b border-[#D4AF37]/20">
            <span className={`${charClass} text-2xl`}>
              {chars[0]}
            </span>
          </div>
          <div className="h-1/2 flex items-center justify-center">
            <span className={`${charClass} text-2xl`}>
              {chars[1]}
            </span>
          </div>
        </div>
        <div className="w-1/2 flex flex-col">
          <div className="h-1/2 flex items-center justify-center border-b border-[#D4AF37]/20">
            <span className={`${charClass} text-2xl`}>
              {chars[2]}
            </span>
          </div>
          <div className="h-1/2 flex items-center justify-center">
            <span className={`${charClass} text-2xl`}>
              {chars[3]}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            exit={{ 
              opacity: [0, 1, 1, 0],
              transition: { duration: 1.5, times: [0, 0.4, 0.8, 1] }
            }}
            className="fixed inset-0 z-[110] pointer-events-none flex items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              exit={{ 
                scale: [0, 5, 10],
                opacity: [0, 1, 0],
                transition: { duration: 1.5 }
              }}
              className="w-full h-full bg-white/80 backdrop-blur-3xl rounded-full"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.5 } }}
            onClick={() => {
              const currentName = localStorage.getItem('user_name');
              if (!currentName && !name.trim()) {
                // If no name exists and input is empty, default to "無名之輩"
                const defaultName = '無名之輩';
                localStorage.setItem('user_name', defaultName);
                onComplete(defaultName);
              } else if (name.trim() && !isNameConfirmed) {
                // If user typed something but didn't confirm, we can either keep old or use new
                // Let's stick to the principle: if they exit, we use what's there or default
                const finalName = currentName || name.trim() || '無名之輩';
                localStorage.setItem('user_name', finalName);
                onComplete(finalName);
              } else {
                // Already has a name or confirmed
                onComplete(name.trim() || currentName || '無名之輩');
              }
              setIsVisible(false);
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer group"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.p 
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="text-white/40 text-xs calligraphy tracking-[0.2em] mt-[500px]"
              >
                点击空白处，可先入世云游，尊号容后再议
              </motion.p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, transition: { duration: 0.8 } }}
            className="relative w-full max-w-md bg-[#FDFBF7] border-2 border-[#D4AF37]/30 shadow-2xl p-10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#B22222]/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -ml-16 -mb-16 blur-3xl" />
            
            <div className="relative z-10 text-center space-y-8">
              <div className="flex justify-center min-h-[140px] items-center">
                <div className="relative w-32 h-32 bg-[#B22222] border-[3px] border-[#D4AF37] shadow-[0_20px_50px_rgba(178,34,34,0.5)] flex items-center justify-center overflow-hidden">
                  {/* Inner border for physical stamp feel */}
                  <div className="absolute inset-1.5 border border-[#D4AF37]/50" />
                  {/* Subtle stone texture */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-40 mix-blend-overlay" />
                  
                  <div className="relative z-10 w-full h-full">
                    {/* Subtle White Dagoba Background in Seal */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                      <svg viewBox="0 0 100 100" className="w-24 h-24 fill-white">
                        <path d="M25 88 L75 88 L72 80 L28 80 Z" />
                        <path d="M32 80 L68 80 L66 74 L34 74 Z" />
                        <path d="M50 74 C30 74 30 48 50 48 C70 48 70 74 50 74 Z" />
                        <rect x="44" y="44" width="12" height="4" />
                        <path d="M47 44 L53 44 L51 18 L49 18 Z" />
                        <circle cx="50" cy="14" r="3" />
                      </svg>
                    </div>
                    <AnimatePresence mode="wait">
                      {!isNameConfirmed ? (
                        <motion.div
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full h-full"
                        >
                          {renderSealChars('无名之辈')}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="seal-text"
                          initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            filter: 'blur(0px)',
                            transition: { duration: 1.2, ease: "easeOut" }
                          }}
                          className="w-full h-full"
                        >
                          {renderSealChars(name.trim())}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Paper fiber texture overlay */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-20 pointer-events-none" />
                  
                  {/* Emerging light effect */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-[#1A1A1A] calligraphy tracking-widest leading-relaxed">
                  寻筑觅禅
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed max-w-[280px] mx-auto italic">
                  悠然觅真意，禅隐石不言。<br />
                  尘霁灵光现，足下即心莲。
                </p>
                <div className="h-px w-12 bg-[#D4AF37]/20 mx-auto my-4" />
                <p className="text-slate-400 text-xs leading-relaxed max-w-[280px] mx-auto">
                  云游四海，万缘和合。请留下您的名号，我们将以此为您记录每一段文化足迹。
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    disabled={isNameConfirmed}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={(e) => {
                      setIsComposing(false);
                      const val = (e.target as HTMLInputElement).value;
                      const chineseOnly = val.replace(/[^\u4e00-\u9fa5]/g, '');
                      const limited = chineseOnly.slice(0, 4);
                      setName(limited);
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (isComposing) {
                        // During composition, allow all characters to not break IME
                        setName(val);
                      } else {
                        // Only allow Chinese characters and limit to 4
                        const chineseOnly = val.replace(/[^\u4e00-\u9fa5]/g, '');
                        const limited = chineseOnly.slice(0, 4);
                        setName(limited);
                      }
                      setError(null);
                    }}
                    placeholder="若无名号，亦可空性入世"
                    className={`w-full px-6 py-4 bg-white border-b-2 transition-all text-center text-2xl calligraphy outline-none placeholder:text-slate-300 placeholder:font-sans placeholder:text-sm ${
                      isNameConfirmed ? 'border-[#B22222] text-[#B22222]' : 'border-[#D4AF37]/30 focus:border-[#B22222]'
                    }`}
                    autoFocus
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${name === '無名之輩' && isNameConfirmed ? 'text-[#D4AF37]' : 'text-[#B22222]'} text-xs mt-2 font-medium italic`}
                    >
                      {error}
                    </motion.p>
                  )}
                  {isNameConfirmed && (
                    <button 
                      type="button"
                      onClick={() => setIsNameConfirmed(false)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-[#D4AF37] hover:text-[#B22222] font-bold tracking-tighter uppercase"
                    >
                      修改
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3" />
                  <span>称呼将仅用于本地记录与打卡展示</span>
                </div>

                <button
                  type="submit"
                  className={`w-full py-5 text-white font-black text-sm tracking-[0.4em] uppercase shadow-xl transition-all ${
                    isNameConfirmed 
                      ? 'bg-[#B22222] shadow-red-900/20 hover:bg-[#8B0000] hover:scale-[1.02] active:scale-[0.98]' 
                      : 'bg-[#1A1A1A] shadow-slate-900/20 hover:bg-black'
                  }`}
                >
                  {isNameConfirmed ? '开启云游' : '确认称呼'}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
