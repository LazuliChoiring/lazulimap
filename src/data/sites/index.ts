import { XIHU_SITES } from './xihu';
import { GONGSHU_SITES } from './gongshu';
import { SHANGCHENG_SITES } from './shangcheng';
import { OTHERS_SITES } from './others';
import { ReligiousSite } from '../types';

export const ALL_SITES: ReligiousSite[] = [
  ...XIHU_SITES,
  ...GONGSHU_SITES,
  ...SHANGCHENG_SITES,
  ...OTHERS_SITES
];
