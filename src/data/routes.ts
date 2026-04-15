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
  }
];
