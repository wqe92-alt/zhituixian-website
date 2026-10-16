// 测算表单的状态与校验：未填写的项目为 null（主营品类为空数组）
import { FACTOR_BY_KEY, profileText, type Profile, type SingleKey } from '../../lib/factors';
import { TYPICAL_INPUT, type StoreInput } from '../../lib/engine';

export type Form = { [K in SingleKey]: Profile[K] | null } & {
  clothing_type: Profile['clothing_type'];
  monthlySalesYuan: number | null;
  monthlyUnits: number | null;
};

export type FieldKey = keyof Form;

export const SECTIONS: { title: string; fields: FieldKey[] }[] = [
  { title: '商品情况', fields: ['clothing_type', 'category', 'price_band', 'refresh_freq'] },
  { title: '门店情况', fields: ['location', 'city_tier', 'store_age'] },
  { title: '经营情况', fields: ['channel', 'policy', 'monthlySalesYuan', 'monthlyUnits'] },
];

export const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);

export const FIELD_LABEL: Record<FieldKey, string> = {
  ...(Object.fromEntries(Object.values(FACTOR_BY_KEY).map((d) => [d.key, d.label])) as Record<keyof Profile, string>),
  monthlySalesYuan: '月销售额',
  monthlyUnits: '月销量',
};

export function emptyForm(): Form {
  return {
    clothing_type: [],
    category: null,
    price_band: null,
    refresh_freq: null,
    location: null,
    city_tier: null,
    store_age: null,
    channel: null,
    policy: null,
    monthlySalesYuan: null,
    monthlyUnits: null,
  };
}

export function formFromInput(i: StoreInput): Form {
  return { ...i, clothing_type: [...i.clothing_type] };
}

export function isFilled(form: Form, f: FieldKey): boolean {
  if (f === 'clothing_type') return form.clothing_type.length > 0;
  if (f === 'monthlySalesYuan' || f === 'monthlyUnits') return Number(form[f]) > 0;
  return form[f] != null;
}

export const filledCount = (form: Form) => ALL_FIELDS.filter((f) => isFilled(form, f)).length;

export const missingIn = (form: Form, section: number) => SECTIONS[section].fields.filter((f) => !isFilled(form, f));

const TYPICAL_PRICE = TYPICAL_INPUT.monthlySalesYuan / TYPICAL_INPUT.monthlyUnits;

/** 未填写的项目暂按示例门店估算，用于实时预估 */
export function toInput(form: Form): StoreInput {
  const t = TYPICAL_INPUT;
  const sales = Number(form.monthlySalesYuan) > 0 ? Number(form.monthlySalesYuan) : t.monthlySalesYuan;
  const units =
    Number(form.monthlyUnits) > 0
      ? Math.round(Number(form.monthlyUnits))
      : Math.max(1, Math.round(sales / TYPICAL_PRICE));
  return {
    clothing_type: form.clothing_type.length ? form.clothing_type : t.clothing_type,
    category: form.category ?? t.category,
    price_band: form.price_band ?? t.price_band,
    refresh_freq: form.refresh_freq ?? t.refresh_freq,
    location: form.location ?? t.location,
    city_tier: form.city_tier ?? t.city_tier,
    store_age: form.store_age ?? t.store_age,
    channel: form.channel ?? t.channel,
    policy: form.policy ?? t.policy,
    monthlySalesYuan: sales,
    monthlyUnits: units,
  };
}

export { profileText };
