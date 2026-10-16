// 报价因子 = 测算表单字段。这里只放字段名、选项与说明；乘数一律从 model.json 读取。

export type ClothingType = 'M' | 'W' | 'K' | 'S' | 'U' | 'B';
export type Tier3 = 'A' | 'B' | 'C';
export type PriceBand = '1' | '2' | '3' | '4' | '5';
export type CityTier = 'T1' | 'T2' | 'T3' | 'T4';
export type StoreAge = '<1' | '1-3' | '3-10' | '>10';
export type Refresh = 'seasonal' | 'monthly' | 'biweekly' | 'weekly';

export interface Profile {
  /** 主营品类，可多选；多选时按各品类等权平均 */
  clothing_type: ClothingType[];
  category: Tier3;
  price_band: PriceBand;
  refresh_freq: Refresh;
  location: Tier3;
  city_tier: CityTier;
  store_age: StoreAge;
  channel: Tier3;
  policy: Tier3;
}

export type FactorKey = keyof Profile;
export type SingleKey = Exclude<FactorKey, 'clothing_type'>;

export interface Level {
  v: string;
  label: string;
  hint?: string;
}

export interface FactorDef {
  key: FactorKey;
  label: string;
  hint?: string;
  levels: Level[];
}

export const FACTOR_DEFS: FactorDef[] = [
  {
    key: 'clothing_type',
    label: '主营品类',
    hint: '可多选，多选时按各品类平均计算',
    levels: [
      { v: 'M', label: '男装' },
      { v: 'W', label: '女装' },
      { v: 'K', label: '童装' },
      { v: 'S', label: '运动户外' },
      { v: 'U', label: '内衣袜配' },
      { v: 'B', label: '鞋履箱包' },
    ],
  },
  {
    key: 'category',
    label: '商品定位',
    levels: [
      { v: 'A', label: '基础款', hint: 'T 恤、打底、家居服等' },
      { v: 'B', label: '时装', hint: '流行款式，换季上新快' },
      { v: 'C', label: '正装礼服与定制', hint: '西装、礼服、定制款' },
    ],
  },
  {
    key: 'price_band',
    label: '主力商品单价',
    levels: [
      { v: '1', label: '800 元以下' },
      { v: '2', label: '800–1,500 元' },
      { v: '3', label: '1,500–2,500 元' },
      { v: '4', label: '2,500–4,000 元' },
      { v: '5', label: '4,000 元以上' },
    ],
  },
  {
    key: 'refresh_freq',
    label: '上新频率',
    levels: [
      { v: 'weekly', label: '每周' },
      { v: 'biweekly', label: '每半月' },
      { v: 'monthly', label: '每月' },
      { v: 'seasonal', label: '每季' },
    ],
  },
  {
    key: 'location',
    label: '门店位置',
    levels: [
      { v: 'A', label: '社区街边店', hint: '社区、学校、街道周边' },
      { v: 'B', label: '商场或步行街', hint: '购物中心、核心商圈' },
      { v: 'C', label: '批发市场或折扣店', hint: '批发市场、特卖场' },
    ],
  },
  {
    key: 'city_tier',
    label: '所在城市',
    levels: [
      { v: 'T1', label: '一线城市' },
      { v: 'T2', label: '新一线城市' },
      { v: 'T3', label: '二线城市' },
      { v: 'T4', label: '三线及以下城市' },
    ],
  },
  {
    key: 'store_age',
    label: '开业时间',
    levels: [
      { v: '<1', label: '不满 1 年' },
      { v: '1-3', label: '1–3 年' },
      { v: '3-10', label: '3–10 年' },
      { v: '>10', label: '10 年以上' },
    ],
  },
  {
    key: 'channel',
    label: '主要销售方式',
    levels: [
      { v: 'A', label: '到店试穿购买' },
      { v: 'B', label: '社群接单发货', hint: '微信群、朋友圈等' },
      { v: 'C', label: '直播下单发货' },
    ],
  },
  {
    key: 'policy',
    label: '退货政策',
    hint: '保障范围与您选择的退货政策一致，并写入保单',
    levels: [
      { v: 'A', label: '不退不换', hint: '质量问题、协商一致的除外' },
      { v: 'B', label: '限期换货', hint: '承诺期限内可以换货' },
      { v: 'C', label: '15 天无理由退货', hint: '收货 15 天内可无理由退货' },
    ],
  },
];

export const FACTOR_BY_KEY = Object.fromEntries(FACTOR_DEFS.map((f) => [f.key, f])) as Record<FactorKey, FactorDef>;

export const CLOTHING_CODES = FACTOR_BY_KEY.clothing_type.levels.map((l) => l.v as ClothingType);

export function levelLabel(key: SingleKey, v: string): string {
  return FACTOR_BY_KEY[key].levels.find((l) => l.v === v)?.label ?? v;
}

export function typesLabel(types: ClothingType[]): string {
  return types.map((t) => FACTOR_BY_KEY.clothing_type.levels.find((l) => l.v === t)?.label ?? t).join('、');
}

export function profileText(p: Profile): string {
  const singles = FACTOR_DEFS.filter((f) => f.key !== 'clothing_type').map((f) => levelLabel(f.key as SingleKey, p[f.key as SingleKey]));
  return [typesLabel(p.clothing_type), ...singles].join(' · ');
}

// 主力商品单价对应的元区间，用于核对"月销售额 ÷ 月销量"得到的件均价
export const PRICE_BAND_RANGE: Record<PriceBand, [number, number]> = {
  '1': [0, 800],
  '2': [800, 1500],
  '3': [1500, 2500],
  '4': [2500, 4000],
  '5': [4000, Infinity],
};

// 换季月：3、4、9、10 月
export const SEASON_MONTHS = [3, 4, 9, 10];
