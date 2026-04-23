export interface Couplet {
  location: string;
  content: string[]; // [upper, lower]
  meaning?: string;
  note?: string;
}

export interface ReligiousSite {
  id: number;
  name: string;
  locationPrefix: string;
  buildingName: string;
  religion: '佛教' | '道教' | '民间信仰';
  sect: string;
  address: string;
  coordinates: [number, number]; // [lng, lat]
  status: '现存' | '遗址' | '原迹' | '修缮';
  district: string; // 区/县
  yearBuilt: number; // 公元纪年
  era: string; // 朝代
  openingHours: string;
  background: string;
  folklore: string;
  recommendation: string;
  images: string[];
  couplets?: Couplet[];
}
