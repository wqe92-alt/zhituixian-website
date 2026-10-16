import { describe, expect, it } from 'vitest';
import model from '../data/model.json';
import { credibilityZ, enumerateCapCombos, quote, TYPICAL_INPUT } from './engine';
import { decodeInput, encodeInput, parseTypes } from './share';

describe('示例门店复现冻结模型', () => {
  const q = quote(TYPICAL_INPUT);

  it('常规月费率 ≈ 0.9809%', () => {
    expect(q.ratePct.regular).toBeCloseTo(model.pricing.typicalGrossRatePct, 3);
  });

  it('常规月保费 ≈ 1,863 元', () => {
    expect(Math.abs(q.premium.regular - model.pricing.typicalPremiumYuan)).toBeLessThan(1);
  });

  it('月退货笔数 ≈ 3.287', () => {
    expect(Math.abs(q.expectedReturns.regular - model.typical.expectedReturns)).toBeLessThan(0.002);
  });

  it('换季月 = 常规月 × 1.358 × 1.083', () => {
    expect(q.premium.season / q.premium.regular).toBeCloseTo(1.358 * 1.083, 6);
    expect(q.months.filter((m) => m.seasonChange).map((m) => m.month)).toEqual([3, 4, 9, 10]);
  });

  it('数据换利 7 折后约 1,304 元', () => {
    expect(Math.round(q.discounted.regular)).toBe(1304);
  });

  it('示例门店可直接报价', () => {
    expect(q.manualReview).toBe(false);
  });
});

describe('主营品类多选', () => {
  const single = (t: 'M' | 'W') => quote({ ...TYPICAL_INPUT, clothing_type: [t] });

  it('两类品类的保费 = 各自保费的平均', () => {
    const both = quote({ ...TYPICAL_INPUT, clothing_type: ['M', 'W'] });
    expect(both.premium.regular).toBeCloseTo((single('M').premium.regular + single('W').premium.regular) / 2, 6);
    expect(both.premium.season).toBeCloseTo((single('M').premium.season + single('W').premium.season) / 2, 6);
  });

  it('退货笔数按各品类频率平均', () => {
    const both = quote({ ...TYPICAL_INPUT, clothing_type: ['M', 'W'] });
    expect(both.expectedReturns.regular).toBeCloseTo(
      (single('M').expectedReturns.regular + single('W').expectedReturns.regular) / 2,
      6,
    );
  });
});

describe('核保检查（预测退货频率 ≥ 25% 需顾问评估）', () => {
  const { total, rejected, maxPct } = enumerateCapCombos();

  it('组合总数 15,552', () => {
    expect(total).toBe(model.underwriting.nCombos);
  });

  it('约 3.9% 组合触发', () => {
    expect(Math.abs((rejected / total) * 100 - model.underwriting.rejectedCombosPct)).toBeLessThan(0.05);
  });

  it('最高约 72.27%', () => {
    expect(Math.abs(maxPct - model.underwriting.maxRateBeforeCapPct)).toBeLessThan(0.05);
  });

  it('高风险组合转顾问评估', () => {
    const q = quote({
      ...TYPICAL_INPUT,
      clothing_type: ['K'],
      category: 'C',
      location: 'B',
      channel: 'C',
      policy: 'C',
      city_tier: 'T1',
      store_age: '<1',
    });
    expect(q.manualReview).toBe(true);
  });
});

describe('数据换利的经验权重', () => {
  it('Z(24) = 0.8467（月销 143 件）', () => {
    expect(credibilityZ(24 * 143)).toBeCloseTo(0.8467, 4);
  });

  it('与 z_curve.csv 全部格点一致', () => {
    for (const p of model.credibility.zCurve) {
      expect(credibilityZ(p.units)).toBeCloseTo(p.z, 3);
    }
  });
});

describe('报价链接', () => {
  it('单选往返一致', () => {
    expect(decodeInput(encodeInput(TYPICAL_INPUT))).toEqual(TYPICAL_INPUT);
  });

  it('多选往返一致', () => {
    const input = { ...TYPICAL_INPUT, clothing_type: ['M', 'W', 'B'] as ('M' | 'W' | 'B')[] };
    expect(decodeInput(encodeInput(input))).toEqual(input);
  });

  it('品类按选项顺序去重', () => {
    expect(parseTypes('WMW')).toEqual(['M', 'W']);
    expect(parseTypes('X')).toBeNull();
  });

  it('非法输入返回 null', () => {
    expect(decodeInput('x.y')).toBeNull();
  });
});
