import { Solar, Lunar, HolidayUtil } from 'lunar-javascript';

export interface CalendarInfo {
  gregorian: string; // YYYY年MM月DD日 HH:mm
  lunar: string;     // 农历XXXX年XX月XX
  shichen: string;   // XX时
  solarTerm: string | null;
  festivals: string[];
}

export const RELIGIOUS_FESTIVALS: Record<string, string[]> = {
  // Format: 'LunarMonth-LunarDay'
  '1-1': ['弥勒菩萨圣诞', '天官大帝圣诞'],
  '1-15': ['上元节'],
  '2-2': ['土地公圣诞'],
  '2-8': ['释迦牟尼佛出家日'],
  '2-15': ['太上老君圣诞', '释迦牟尼佛涅槃日'],
  '2-19': ['观世音菩萨圣诞'],
  '2-21': ['普贤菩萨圣诞'],
  '3-3': ['王母娘娘圣诞', '真武大帝圣诞'],
  '3-16': ['准提菩萨圣诞'],
  '4-4': ['文殊菩萨圣诞'],
  '4-8': ['释迦牟尼佛圣诞 (浴佛节)'],
  '4-14': ['吕洞宾仙师圣诞'],
  '4-28': ['药王菩萨圣诞'],
  '5-13': ['关圣帝君圣诞'],
  '6-3': ['韦驮菩萨圣诞'],
  '6-19': ['观世音菩萨成道日'],
  '7-13': ['大势至菩萨圣诞'],
  '7-15': ['中元节', '地官大帝圣诞', '盂兰盆节'],
  '7-30': ['地藏菩萨圣诞'],
  '8-15': ['月下老人圣诞'],
  '9-9': ['重阳节', '斗姥元君圣诞', '妈祖成道日'],
  '9-19': ['观世音菩萨出家日'],
  '9-30': ['药师佛圣诞'],
  '10-15': ['下元节', '水官大帝圣诞'],
  '11-17': ['阿弥陀佛圣诞'],
  '12-8': ['腊八节', '释迦牟尼佛成道日'],
  '12-23': ['灶君圣诞'],
  '12-29': ['华严菩萨圣诞'],
};

export const SOLAR_TERMS_CULTURE: Record<string, { customs: string, recommendation: string, sites: string[] }> = {
  '立春': { 
    customs: '打春牛、咬春（吃春饼、萝卜）。象征万物起始。', 
    recommendation: '春回大地，适合前往山林环抱的古刹感受生机。',
    sites: ['灵隐寺', '永福寺']
  },
  '雨水': { 
    customs: '回娘家、拉保保。春雨润物细无声。', 
    recommendation: '细雨蒙蒙，最宜在西湖边的寺院听雨品茗。',
    sites: ['净慈寺', '法喜寺']
  },
  '惊蛰': { 
    customs: '祭白虎、吃梨。春雷始鸣，惊醒蛰伏。', 
    recommendation: '雷声隐隐，适合去高处观云听雷，感悟自然伟力。',
    sites: ['抱朴道院', '韬光寺']
  },
  '春分': { 
    customs: '竖蛋、吃春菜。昼夜平分，阴阳平衡。', 
    recommendation: '春色中分，适合在园林式寺庙中寻觅平衡之道。',
    sites: ['灵顺寺', '香积寺']
  },
  '清明': { 
    customs: '踏青、祭祖、插柳。慎终追远，亲近自然。', 
    recommendation: '万物清明，适合登山远眺，缅怀先贤。',
    sites: ['天竺三寺', '显宁寺']
  },
  '谷雨': { 
    customs: '采茶、祭海。雨生百谷，春季最后一个节气。', 
    recommendation: '茶香四溢，龙井村附近的寺庙是此时的最佳去处。',
    sites: ['法净寺', '法镜寺']
  },
  '立夏': { 
    customs: '秤人、吃立夏饭。夏季开始，万物繁茂。', 
    recommendation: '绿荫初浓，适合在深山古刹中避暑消夏。',
    sites: ['径山寺', '理安寺']
  },
  '小满': { 
    customs: '祭车神、吃苦菜。麦类饱满，尚未成熟。', 
    recommendation: '小满即安，适合在宁静的院落中感悟知足常乐。',
    sites: ['慧因高丽寺', '灵隐寺']
  },
  '芒种': { 
    customs: '送花神、青梅煮酒。忙于播种，忙于收获。', 
    recommendation: '仲夏时节，适合在古树参天的寺庙中寻觅清凉。',
    sites: ['净慈寺', '法喜寺']
  },
  '夏至': { 
    customs: '吃夏至面、祭地。日影最短，阳气最盛。', 
    recommendation: '至阳之时，适合在道观中感悟阴阳消长。',
    sites: ['抱朴道院', '玉皇山']
  },
  '小暑': { 
    customs: '食新、吃藕。暑气渐浓，万物繁盛。', 
    recommendation: '蝉鸣阵阵，适合在依山傍水的寺庙中静心。',
    sites: ['韬光寺', '灵隐寺']
  },
  '大暑': { 
    customs: '晒伏姜、喝伏茶。一年中最热的时节。', 
    recommendation: '酷暑难耐，深山幽谷中的古寺是避暑圣地。',
    sites: ['径山寺', '永福寺']
  },
  '立秋': { 
    customs: '贴秋膘、咬秋（吃西瓜）。秋季开始，凉风至。', 
    recommendation: '秋意初现，适合在视野开阔的寺庙观赏初秋云影。',
    sites: ['灵顺寺', '北高峰']
  },
  '处暑': { 
    customs: '放河灯、吃鸭肉。暑气至此而止。', 
    recommendation: '秋水长天，适合在水边的寺院感悟宁静。',
    sites: ['净慈寺', '香积寺']
  },
  '白露': { 
    customs: '收清露、喝白露茶。露凝而白，秋意渐浓。', 
    recommendation: '晨露晶莹，适合在竹林环绕的寺庙中漫步。',
    sites: ['法喜寺', '云栖坞']
  },
  '秋分': { 
    customs: '祭月、吃秋菜。昼夜平分，秋色正浓。', 
    recommendation: '金风送爽，适合在桂花盛开的寺院中品香。',
    sites: ['法净寺', '灵隐寺']
  },
  '寒露': { 
    customs: '登高、吃芝麻。露气寒冷，将凝结也。', 
    recommendation: '寒露凝霜，适合登高望远，感悟季节更迭。',
    sites: ['玉皇山', '韬光寺']
  },
  '霜降': { 
    customs: '吃柿子、赏菊。气温骤降，露凝为霜。', 
    recommendation: '枫叶渐红，适合在色彩斑斓的深山古寺中寻秋。',
    sites: ['灵隐寺', '永福寺']
  },
  '立冬': { 
    customs: '补冬、吃饺子。冬季开始，万物收藏。', 
    recommendation: '冬日初至，适合在暖阳照耀的院落中晒太阳。',
    sites: ['香积寺', '净慈寺']
  },
  '小雪': { 
    customs: '腌腊肉、吃糍粑。气温下降，开始降雪。', 
    recommendation: '初雪消融，适合在静谧的寺庙中感悟禅意。',
    sites: ['法喜寺', '天竺三寺']
  },
  '大雪': { 
    customs: '进补、赏雪。降雪渐大，积雪不化。', 
    recommendation: '银装素裹，雪后的古刹有着超尘脱俗的美。',
    sites: ['灵隐寺', '径山寺']
  },
  '冬至': { 
    customs: '吃饺子、祭祖。阴极之至，阳气始生。', 
    recommendation: '冬至大如年，适合在古老的寺庙中祈福。',
    sites: ['净慈寺', '灵顺寺']
  },
  '小寒': { 
    customs: '吃腊八粥、赏梅。进入最寒冷的时节。', 
    recommendation: '寒梅傲雪，适合在梅花盛开的寺院中寻香。',
    sites: ['灵峰探梅', '永福寺']
  },
  '大寒': { 
    customs: '除旧布新、吃糯米饭。一年中最后的节气。', 
    recommendation: '岁末将至，适合在寺庙中参加祈福法会。',
    sites: ['灵隐寺', '香积寺']
  }
};

export function getUpcomingFestivals(count: number = 5): { name: string, lunar: string, date: Date, type: 'festival' | 'solarTerm' }[] {
  const festivals: { name: string, lunar: string, date: Date, type: 'festival' | 'solarTerm' }[] = [];
  const solarTerms: { name: string, lunar: string, date: Date, type: 'festival' | 'solarTerm' }[] = [];
  const now = new Date();
  
  // Check next 60 days
  for (let i = 0; i < 60; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + i);
    const solar = Solar.fromDate(checkDate);
    const lunar = solar.getLunar();
    
    // 1. Check Religious Festivals
    const key = `${lunar.getMonth()}-${lunar.getDay()}`;
    if (RELIGIOUS_FESTIVALS[key]) {
      RELIGIOUS_FESTIVALS[key].forEach(name => {
        festivals.push({
          name,
          lunar: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
          date: checkDate,
          type: 'festival'
        });
      });
    }

    // 2. Check Solar Terms - Only keep the first one found
    const solarTerm = solar.getLunar().getJieQi();
    if (solarTerm && solarTerms.length === 0) {
      solarTerms.push({
        name: solarTerm,
        lunar: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
        date: checkDate,
        type: 'solarTerm'
      });
    }
    
    // Stop if we have enough festivals and at least one solar term
    if (festivals.length >= count - 1 && solarTerms.length > 0) break;
  }
  
  // Combine: 1 nearest solar term + (count - 1) nearest festivals
  const result = [...solarTerms, ...festivals.slice(0, count - 1)];
  return result.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function getCalendarInfo(date: Date = new Date()): CalendarInfo {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  
  const gregorian = `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  
  const lunarStr = `农历${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
  
  const shichen = lunar.getTimeZhi() + '时';
  
  const solarTerm = lunar.getJieQi() || null;
  
  const festivals: string[] = [];
  
  // Traditional festivals from lunar-javascript (filtering out modern ones)
  // Note: lunar-javascript's getFestivals() might include some we don't want, 
  // so we'll be selective or use our own map.
  
  const lunarKey = `${lunar.getMonth()}-${lunar.getDay()}`;
  if (RELIGIOUS_FESTIVALS[lunarKey]) {
    festivals.push(...RELIGIOUS_FESTIVALS[lunarKey]);
  }
  
  // Add some common traditional ones if not already there
  const otherFestivals = lunar.getFestivals();
  const traditionalKeywords = ['春节', '端午', '中秋', '七夕', '冬至', '清明'];
  otherFestivals.forEach(f => {
    if (traditionalKeywords.some(k => f.includes(k)) && !festivals.includes(f)) {
      festivals.push(f);
    }
  });

  return {
    gregorian,
    lunar: lunarStr,
    shichen,
    solarTerm,
    festivals
  };
}
