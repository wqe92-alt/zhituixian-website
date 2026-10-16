// 报价链接：把表单答案编码进 URL（?q=...），方便复制给顾问或保存
import { CLOTHING_CODES, FACTOR_DEFS, type ClothingType, type Profile } from './factors';
import type { StoreInput } from './engine';

const SINGLE_DEFS = FACTOR_DEFS.filter((f) => f.key !== 'clothing_type');

/** "MW" → ['M','W']；含非法字符或为空时返回 null，结果按选项顺序排列并去重 */
export function parseTypes(s: string | null | undefined): ClothingType[] | null {
  if (!s) return null;
  const chars = [...s];
  if (!chars.every((c) => (CLOTHING_CODES as string[]).includes(c))) return null;
  return CLOTHING_CODES.filter((c) => chars.includes(c));
}

export function encodeInput(i: StoreInput): string {
  const singles = SINGLE_DEFS.map((f) => i[f.key as Exclude<keyof Profile, 'clothing_type'>]);
  return [i.clothing_type.join(''), ...singles, Math.round(i.monthlySalesYuan), Math.round(i.monthlyUnits)].join('.');
}

export function decodeInput(s: string | null | undefined): StoreInput | null {
  if (!s) return null;
  const parts = s.split('.');
  if (parts.length !== SINGLE_DEFS.length + 3) return null;
  const types = parseTypes(parts[0]);
  if (!types?.length) return null;
  const profile: Record<string, unknown> = { clothing_type: types };
  for (const [idx, def] of SINGLE_DEFS.entries()) {
    const v = parts[idx + 1];
    if (!def.levels.some((l) => l.v === v)) return null;
    profile[def.key] = v;
  }
  const sales = Number(parts[SINGLE_DEFS.length + 1]);
  const units = Number(parts[SINGLE_DEFS.length + 2]);
  if (!(sales > 0 && units > 0)) return null;
  return { ...(profile as unknown as Profile), monthlySalesYuan: sales, monthlyUnits: units };
}
