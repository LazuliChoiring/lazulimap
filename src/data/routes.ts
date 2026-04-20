import { ReligiousSite } from './sites';

export interface RouteStep {
  siteId: number;
  description: string;
}

export interface PilgrimageRoute {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  difficulty: '初级' | '中级' | '高级';
  estimatedTime: string;
  steps: RouteStep[];
  rewardName: string;
  figure?: string;
  themeColor: string;
  tags: string[];
}

export const ROUTES_DATA: PilgrimageRoute[] = [
  {
    id: 'west-lake-zen',
    title: '西湖禅修一日径',
    subtitle: '寻访灵隐西麓的静谧禅心',
    description: '此路线遵循“由俗入圣，步步登高”的逻辑。清晨在运河边品味烟火素斋，午后深入法云弄园林避暑修心，傍晚登顶北高峰俯瞰西湖落日。',
    category: '西湖经典',
    difficulty: '中级',
    estimatedTime: '6-8 小时',
    themeColor: '#B22222',
    rewardName: '西湖禅修·结缘证',
    tags: ['禅修', '园林', '登高'],
    steps: [
      { siteId: 1, description: '【辰时·启程】在香积寺品一碗素面。清晨的运河烟火气最能唤醒身心，以此开启一日修行。' },
      { siteId: 5, description: '【午时·入禅】入灵隐禅踪。正午时分，古刹的参天古木可遮蔽烈日，最宜在石刻间寻凉。' },
      { siteId: 2, description: '【未时·品茗】永福寺园林漫步。午后阳光透过竹林，在福泉边品一杯禅茶，体会静谧。' },
      { siteId: 3, description: '【申时·圆满】登北高峰灵顺寺。傍晚时分登高，可俯瞰西湖全景与夕阳，圆满此行。' }
    ]
  },
  {
    id: 'su-shi-footsteps',
    title: '东坡寻迹·西湖南北',
    subtitle: '随苏东坡的笔触，走过西湖千年',
    description: '此路线遵循“晨茶暮钟”的人文逻辑。上午寻访灵隐西麓的清泉，傍晚在南屏山下聆听回荡千年的晚钟。',
    category: '人文寻踪',
    difficulty: '初级',
    estimatedTime: '3-4 小时',
    themeColor: '#2C3E50',
    rewardName: '东坡寻迹·结缘证',
    figure: '苏东坡',
    tags: ['人文', '诗词', '古迹'],
    steps: [
      { siteId: 2, description: '【巳时·寻泉】寻访永福寺福泉。上午泉水清冽，最宜品味东坡笔下的“禅茶一味”。' },
      { siteId: 4, description: '【酉时·听钟】净慈寺听南屏晚钟。黄昏时分，钟声与岩石共鸣，方能领略西湖十景之神韵。' }
    ]
  },
  {
    id: 'yuhuang-daoist',
    title: '玉皇问道之路',
    subtitle: '登万山之祖，感紫气东来',
    description: '此路线遵循“紫气东来，顺时而动”的道家逻辑。清晨在栖霞岭感悟晨光，午后登顶玉皇山，在天地气场交汇处感悟自然。',
    category: '山川问道',
    difficulty: '高级',
    estimatedTime: '4-5 小时',
    themeColor: '#D4AF37',
    rewardName: '玉皇问道·结缘证',
    figure: '葛洪',
    tags: ['问道', '养生', '寻仙'],
    steps: [
      { siteId: 269, description: '【卯时·晨修】从老主宣宫出发。清晨栖霞岭紫气最盛，最宜感悟全真派的清修传统。' },
      { siteId: 270, description: '【辰时·寻仙】登上葛岭抱朴道院。上午阳光明媚，寻访葛洪炼丹遗迹，感悟抱朴守真。' },
      { siteId: 273, description: '【未时·登顶】登顶玉皇山福星观。午后气场沉稳，在万山之巅俯瞰钱江，感悟道法自然。' }
    ]
  },
  {
    id: 'chunan-seclusion',
    title: '千岛探幽·里商遗韵',
    subtitle: '在万顷碧波间，寻访深山隐遁的先贤足迹',
    description: '此路线深入千岛湖里商乡，探寻古老的宗教遗迹与自然山水的和谐共生。从湖边的龙华寺出发，登高至云雷寺感受自然威严，最后在仙出寺感悟云雾中的仙气。',
    category: '千岛湖畔',
    difficulty: '高级',
    estimatedTime: '10-12 小时',
    themeColor: '#008B8B',
    rewardName: '千岛探幽·结缘证',
    tags: ['湖光', '隐遁', '山秀'],
    steps: [
      { siteId: 67, description: '【辰时·启程】龙华寺。在进贤半岛看第一缕阳光映照湖面，开启千岛寻幽之旅。' },
      { siteId: 70, description: '【午时·雷音】云雷寺。正午时分登顶，感悟风雷汇聚的自然力量。' },
      { siteId: 61, description: '【未时·归隐】仙出寺。午后在云雾缭绕中寻找仙趣，俯瞰千岛。' }
    ]
  },
  {
    id: 'xiaoshan-heritage',
    title: '萧山访古·越地梵音',
    subtitle: '跨越萧然大地的历史长廊',
    description: '此路线贯穿萧山区，从繁华北干到宁静进化，在古建筑中触摸萧山千年的文化脉搏。寻访大岩山的巍峨，感悟复兴寺的清幽。',
    category: '萧然古地',
    difficulty: '中级',
    estimatedTime: '8-10 小时',
    themeColor: '#4682B4',
    rewardName: '萧山访古·结缘证',
    tags: ['访古', '宗风', '村落'],
    steps: [
      { siteId: 77, description: '【巳时·闹中取静】复兴寺。在大道繁华间寻得一处静心之所。' },
      { siteId: 87, description: '【未时·绝岭攀登】大岩寺。午后攀登进化之巅，感悟北宋古刹的威严。' },
      { siteId: 100, description: '【申时·古道回望】山西寺。在临浦的古道夕阳中，为一日访古画上句号。' }
    ]
  },
  {
    id: 'xiaoshan-kanshan-zen',
    title: '坎山叠翠·古刹行禅',
    category: '萧然古地',
    difficulty: '中级',
    estimatedTime: '6-8 小时',
    themeColor: '#CD853F',
    rewardName: '坎山结缘证书',
    description: '深入萧山坎山腹地，在密集的古刹群中体验地道的乡村禅意。从气势不凡的广福寺开始，一路寻访极乐、龙隐等名寺。',
    subtitle: '在坎山的钟声里，寻回如宝如盖的初心',
    tags: ['禅修', '乡村', '古塔'],
    steps: [
      { siteId: 95, description: '【晨时·朝礼】广福寺。在凤凰山脚下开启一日的朝圣节奏。' },
      { siteId: 97, description: '【午时·净土】极乐寺。于正午暖阳中，感悟弥陀净土的欢喜。' },
      { siteId: 98, description: '【未时·隐修】龙隐寺。在山林深处，寻找潜伏在岁月里的智慧之龙。' }
    ]
  },
  {
    id: 'fuyang-longmen',
    title: '富春山居·龙门寻古',
    subtitle: '在富春江畔，探寻千年古镇的王者禅影',
    description: '此路线深入富阳龙门古镇，结合了孙吴文化与山水禅意。从古镇入口出发，登高至龙门寺，最后在富春江畔的鹳山感悟先贤骨气。',
    category: '富春山水',
    difficulty: '高级',
    estimatedTime: '8-10 小时',
    themeColor: '#556B2F',
    rewardName: '富春山居·结缘证',
    tags: ['古镇', '江景', '孙吴'],
    steps: [
      { siteId: 101, description: '【辰时·古镇漫步】龙门寺。在古镇的晨曦中开启一天，感受龙门山的巍峨。' },
      { siteId: 112, description: '【午时·凌空】永安山玉皇宫。在落地点之上，俯瞰富春江的蜿蜒。' },
      { siteId: 102, description: '【申时·江畔怀古】严子陵祠。在鹳山的夕阳里，领略不事王侯的高洁。' }
    ]
  },
  {
    id: 'linan-tianmu',
    title: '天目印心·昭明分经',
    subtitle: '入深山大川，在古木间聆听梁代梵音',
    description: '天目山不仅是自然宝库，更是韦驮菩萨的道场。此路线涵盖了昭明分经的历史遗迹与西天目禅源寺的深厚底蕴。',
    category: '天目秘境',
    difficulty: '高级',
    estimatedTime: '12-14 小时',
    themeColor: '#228B22',
    rewardName: '天目印心·结缘证',
    tags: ['大川', '古木', '理学'],
    steps: [
      { siteId: 103, description: '【巳时·分经往事】昭明禅寺。在太子分经台前，感悟跨越千年的文化执着。' },
      { siteId: 104, description: '【未时·祖庭朝圣】禅源寺。在西天目的层林叠翠中，礼拜这方浙西净土。' },
      { siteId: 114, description: '【酉时·王室遗风】钱镠陵。回到临安城关，拜谒为江南开启千年繁荣的吴越之主。' }
    ]
  },
  {
    id: 'hangzhou-old-street',
    title: '杭城老街·里弄梵音',
    subtitle: '穿梭于古城墙基与老街巷间的心灵之旅',
    description: '此路线深入杭州老城的核心，从南宋皇城基址的馒头山出发，路过南星桥的市井烟火，最后在祥符古镇感悟水乡观音的慈悲。',
    category: '市井寻踪',
    difficulty: '初级',
    estimatedTime: '4-5 小时',
    themeColor: '#8B4513',
    rewardName: '杭城老街·结缘证',
    tags: ['市井', '民俗', '老街'],
    steps: [
      { siteId: 155, description: '【晨时·皇城远眺】馒头山慧慈林。在南宋皇城的余晖中开启清晨，感受那份藏在居民区里的肃静。' },
      { siteId: 142, description: '【巳时·市井祈福】南星桥圣福庵。在复兴街的叫卖声中，寻访这处跨越百年的平凡守护。' },
      { siteId: 143, description: '【午时·水乡观音】祥符古镇观音阁。在重生的古镇廊桥间，看一看临水而立的慈悲意象。' }
    ]
  },
  {
    id: 'qiantang-estuary',
    title: '江海交汇·围垦壮歌',
    subtitle: '在钱塘新城与大江东之间，感受拓荒者的信仰',
    description: '此路线沿着钱塘江向东延伸，从繁华的航运遗迹杨公堂出发，见证前进街道的慈航心火，最后在大江东潮圣庙感悟人类与潮汐的千年博弈。',
    category: '潮涌钱塘',
    difficulty: '中级',
    estimatedTime: '6-7 小时',
    themeColor: '#1E90FF',
    rewardName: '围垦壮歌·结缘证',
    tags: ['潮汐', '拓荒', '江景'],
    steps: [
      { siteId: 148, description: '【辰时·启程】杨公堂。在大学城的现代气息旁，致敬那份厚重的下沙围垦精神。' },
      { siteId: 170, description: '【午时·江海定力】普济庵。在现代工业港口的东缘，寻找这份微小而坚韧的慈悲心火。' },
      { siteId: 128, description: '【申时·怒潮守护】潮圣庙。站在钱塘边缘，感受古代围垦区劳动人民对自然力量的至高敬畏。' }
    ]
  },
  {
    id: 'zhexi-ancient-town',
    title: '浙西古镇·徽韵印记',
    subtitle: '循着徽商的足迹，深入河桥与分水古镇',
    description: '此路线深入临安与桐庐交界处，寻找那段尘封在青石板路上的贸易与信仰史。从唐代龙兴院开始，穿越至明代的分水广宁寺。',
    category: '古镇遗风',
    difficulty: '高级',
    estimatedTime: '8-10 小时',
    themeColor: '#2F4F4F',
    rewardName: '浙西古镇·结缘证',
    tags: ['古镇', '徽商', '石径'],
    steps: [
      { siteId: 150, description: '【巳时·唐韵河桥】龙兴院。在河桥古镇的石板路上，追寻沉实近千载的晚唐遗风。' },
      { siteId: 151, description: '【未时·分水安澜】广宁寺。在桐庐的丘陵起伏间，邂逅这座曾护佑古镇洪峰不侵的明代丰碑。' }
    ]
  },
  {
    id: 'west-lake-hidden',
    title: '西湖秘境·茶山寻幽',
    subtitle: '避开人群，在茶文化与禅宗的交汇点隐入尘烟',
    description: '这条路线专门为追求深度静谧的修行者设计。从飞来峰下的冷泉庵出发，深入茶村巅峰的真际庵，最后在美院旁的定慧院感悟艺术与禅的定力。',
    category: '西湖秘境',
    difficulty: '高级',
    estimatedTime: '7-9 小时',
    themeColor: '#6B8E23',
    rewardName: '西湖秘境·结缘证',
    tags: ['秘境', '茶文化', '艺术'],
    steps: [
      { siteId: 141, description: '【晨时·冷泉听经】冷泉庵。在灵隐的热闹之外，品味这份属于宋代文人的“冷”之真意。' },
      { siteId: 154, description: '【午时·禅茶巅峰】真际庵。在龙坞万顷茶园之上，寻找那份“禅茶一味”的最高表达。' },
      { siteId: 194, description: '【申时·定慧象山】定慧院。在中国美院的建筑森林旁，感知艺术灵魂背后的坚实基石。' }
    ]
  }
];
