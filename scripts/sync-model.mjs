// 构建前把冻结模型中报价需要的字段，按白名单同步到 src/data/model.json。
// 只读素材库（../model），不改动任何源文件；白名单以外的字段不会进入网站。
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(here, '..');
const root = resolve(site, '..');
const outDir = resolve(site, 'src/data');
const outFile = resolve(outDir, 'model.json');

const src = {
  registry: resolve(root, 'model/registry.json'),
  rateManual: resolve(root, 'model/rate_manual.csv'),
  zCurve: resolve(root, 'model/z_curve.csv'),
  pricing: resolve(root, 'model/summaries/pricing_summary.json'),
  frequency: resolve(root, 'model/summaries/frequency_fit_summary.json'),
};

const missing = Object.values(src).filter((p) => !existsSync(p));
if (missing.length) {
  const list = missing.map((p) => '  ' + p).join('\n');
  if (existsSync(outFile)) {
    console.warn(`[sync] 素材库文件缺失，沿用已有的 src/data/model.json：\n${list}`);
    process.exit(0);
  }
  console.error(`[sync] 找不到素材库文件：\n${list}`);
  process.exit(1);
}

const text = (p) => readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
const json = (p) => JSON.parse(text(p));
const csv = (p) => {
  const [head, ...rows] = text(p).trim().split(/\r?\n/);
  const keys = head.split(',');
  return rows.map((r) => Object.fromEntries(r.split(',').map((v, i) => [keys[i], v])));
};

const registry = json(src.registry);
const pricing = json(src.pricing);
const freqFit = json(src.frequency);

// 费率手册：side → factor → level → multiplier
const rateManual = { frequency: {}, severity: {} };
for (const { side, factor, level, multiplier } of csv(src.rateManual)) {
  (rateManual[side][factor] ??= {})[level] = Number(multiplier);
}

// 示例门店画像（键名换成报价引擎的因子名；主营品类为数组）
const tp = pricing.typical_store.profile;
const typicalProfile = {
  clothing_type: [tp.type],
  category: tp.cat,
  price_band: String(tp.band),
  refresh_freq: tp.refresh,
  location: tp.loc,
  city_tier: tp.city,
  store_age: tp.age,
  channel: tp.mode,
  policy: tp.policy,
};

// 核保检查的保守口径：公司基线取 34 家公司退货频率区间上沿 4%。
// 以 e^const × 4% 作为频率基准，可复现冻结模型"约 3.9% 组合触发 / 最高 72.27%"。
const COMPANY_BASELINE_UPPER_PCT = 4.0;

const model = {
  rateManual: {
    base: {
      freqPct: registry.pricing.base_rate.base_freq_rate_pct,
      lossPct: registry.pricing.base_rate.base_loss_rate_pct,
      grossPct: registry.pricing.base_rate.base_gross_rate_pct,
    },
    frequency: rateManual.frequency,
    severity: rateManual.severity,
  },
  underwriting: {
    capRatePct: registry.frequency.underwriting_cap.rate * 100,
    rejectedCombosPct: registry.frequency.underwriting_cap.rejected_combos_pct,
    maxRateBeforeCapPct: registry.frequency.underwriting_cap.max_rate_before_cap_pct,
    nCombos: freqFit.underwriting_boundary.n_combos,
    capBaseFreqPct: Math.exp(registry.frequency.coefficients.const) * COMPANY_BASELINE_UPPER_PCT,
  },
  typical: {
    profile: typicalProfile,
    monthlySalesYuan: pricing.typical_store.monthly_sales_yuan,
    monthlyUnits: pricing.typical_store.monthly_units,
    expectedReturns: pricing.typical_store.E_N,
  },
  pricing: {
    deductible: registry.pricing.deductible,
    // 折扣比例写在 registry 字段名里（discount_30pct_funding），这里显式落成数值
    discountRate: 0.3,
    typicalGrossRatePct: registry.pricing.typical_gross_rate_pct,
    typicalPremiumYuan: pricing.premium.typical_premium_yuan,
  },
  credibility: {
    K: registry.credibility.K_frequency,
    zCurve: csv(src.zCurve).map((r) => ({ month: Number(r.month), units: Number(r.m_cum_units), z: Number(r.Z) })),
  },
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(model, null, 2) + '\n');
console.log(`[sync] model v${registry.model_version} → src/data/model.json`);
