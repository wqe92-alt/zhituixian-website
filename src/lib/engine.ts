// 报价引擎：月保费 = 当月销售额 × 费率；费率 = 基准费率 × 频率乘数 × 强度乘数。
// 系数全部来自 src/data/model.json（构建前由 scripts/sync-model.mjs 从冻结模型同步）。
import model from '../data/model.json';
import { FACTOR_DEFS, PRICE_BAND_RANGE, SEASON_MONTHS, type ClothingType, type Profile } from './factors';

export interface StoreInput extends Profile {
  monthlySalesYuan: number;
  monthlyUnits: number;
}

type Table = Record<string, Record<string, number>>;
const FREQ = model.rateManual.frequency as Table;
const SEV = model.rateManual.severity as Table;
const BASE = model.rateManual.base;

const FREQ_OTHER = ['category', 'location', 'channel', 'policy', 'city_tier', 'store_age'] as const;
const SEV_OTHER = ['category', 'price_band', 'city_tier', 'refresh_freq'] as const;

export const TYPICAL_INPUT: StoreInput = {
  ...(model.typical.profile as Profile),
  monthlySalesYuan: model.typical.monthlySalesYuan,
  monthlyUnits: model.typical.monthlyUnits,
};

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const typesOf = (p: Profile): ClothingType[] => (p.clothing_type.length ? p.clothing_type : TYPICAL_INPUT.clothing_type);

function interactionMultiplier(p: Profile): number {
  let m = 1;
  if (p.category === 'C' && p.location === 'B') m *= FREQ.interactions.catC_locB;
  if (p.city_tier === 'T1' && p.location === 'B') m *= FREQ.interactions.cityT1_locB;
  return m;
}

const freqOther = (p: Profile) => FREQ_OTHER.reduce((acc, f) => acc * FREQ[f][p[f]], 1) * interactionMultiplier(p);
const sevOther = (p: Profile) => SEV_OTHER.reduce((acc, f) => acc * SEV[f][p[f]], 1);

/** 频率乘数：多选品类时取各品类频率乘数的平均 */
export function frequencyMultiplier(p: Profile, seasonChange = false): number {
  const type = mean(typesOf(p).map((t) => FREQ.clothing_type[t]));
  return freqOther(p) * type * (seasonChange ? FREQ.season.season_change : 1);
}

/** 费率（%）：多选品类时取各品类"频率 × 强度"乘数的平均，相当于销售额在所选品类间均分 */
export function grossRatePct(p: Profile, seasonChange = false): number {
  const type = mean(typesOf(p).map((t) => FREQ.clothing_type[t] * SEV.clothing_type[t]));
  const season = seasonChange ? FREQ.season.season_change * SEV.season.season_change : 1;
  return BASE.grossPct * freqOther(p) * sevOther(p) * type * season;
}

/** 核保检查用的预测退货频率（%），公司基线取上沿的保守口径 */
export function capCheckRatePct(p: Profile, seasonChange: boolean): number {
  return model.underwriting.capBaseFreqPct * frequencyMultiplier(p, seasonChange);
}

/** 本店经验在定价中的权重：Z = m / (m + K)，m 为累计回传销量 */
export function credibilityZ(cumulativeUnits: number): number {
  return cumulativeUnits / (cumulativeUnits + model.credibility.K);
}

export type BandFit = 'ok' | 'low' | 'high';

export interface MonthQuote {
  month: number;
  seasonChange: boolean;
  premium: number;
  discounted: number;
}

export interface Quote {
  input: StoreInput;
  /** 需顾问评估后报价 */
  manualReview: boolean;
  ratePct: { regular: number; season: number };
  premium: { regular: number; season: number };
  discounted: { regular: number; season: number };
  months: MonthQuote[];
  annual: number;
  annualDiscounted: number;
  expectedReturns: { regular: number; season: number };
  /** 保费约占月毛利的区间（%），按服装零售毛利率 40%–60% 估算 */
  marginShare: { low: number; high: number };
  avgPrice: number;
  bandFit: BandFit;
}

export function quote(input: StoreInput): Quote {
  const sales = Math.max(0, input.monthlySalesYuan);
  const units = Math.max(1, input.monthlyUnits);
  const rateRegular = grossRatePct(input, false);
  const rateSeason = grossRatePct(input, true);
  const premiumRegular = (rateRegular / 100) * sales;
  const premiumSeason = (rateSeason / 100) * sales;
  const keep = 1 - model.pricing.discountRate;

  const months: MonthQuote[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const seasonChange = SEASON_MONTHS.includes(month);
    const premium = seasonChange ? premiumSeason : premiumRegular;
    return { month, seasonChange, premium, discounted: premium * keep };
  });
  const annual = months.reduce((s, m) => s + m.premium, 0);

  const cap = model.underwriting.capRatePct;
  const manualReview = Math.max(capCheckRatePct(input, false), capCheckRatePct(input, true)) >= cap;

  const avgPrice = sales / units;
  const [lo, hi] = PRICE_BAND_RANGE[input.price_band];
  const bandFit: BandFit = avgPrice < lo * 0.85 ? 'low' : avgPrice > hi * 1.15 ? 'high' : 'ok';

  return {
    input,
    manualReview,
    ratePct: { regular: rateRegular, season: rateSeason },
    premium: { regular: premiumRegular, season: premiumSeason },
    discounted: { regular: premiumRegular * keep, season: premiumSeason * keep },
    months,
    annual,
    annualDiscounted: annual * keep,
    expectedReturns: {
      regular: (BASE.freqPct / 100) * frequencyMultiplier(input, false) * units,
      season: (BASE.freqPct / 100) * frequencyMultiplier(input, true) * units,
    },
    marginShare: { low: rateRegular / 0.6, high: rateRegular / 0.4 },
    avgPrice,
    bandFit,
  };
}

/** 枚举全部频率侧因子组合（单一品类）× 季节，共 15,552 种，用于核对核保检查的口径 */
export function enumerateCapCombos(): { total: number; rejected: number; maxPct: number } {
  const keys = ['clothing_type', ...FREQ_OTHER] as string[];
  const defs = FACTOR_DEFS.filter((f) => keys.includes(f.key));
  let total = 0;
  let rejected = 0;
  let maxPct = 0;
  const walk = (i: number, p: Record<string, unknown>) => {
    if (i === defs.length) {
      for (const season of [false, true]) {
        const r = capCheckRatePct(p as unknown as Profile, season);
        total++;
        if (r >= model.underwriting.capRatePct) rejected++;
        if (r > maxPct) maxPct = r;
      }
      return;
    }
    const d = defs[i];
    for (const l of d.levels) walk(i + 1, { ...p, [d.key]: d.key === 'clothing_type' ? [l.v] : l.v });
  };
  walk(0, {});
  return { total, rejected, maxPct };
}
