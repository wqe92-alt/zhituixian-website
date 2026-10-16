const intFmt = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 });

/** 千分位整数，如 1,863 */
export function yuan(n: number): string {
  return intFmt.format(Math.round(n));
}

/** 固定小数位的千分位数字，如 1,074.8 */
export function num(n: number, digits = 1): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

/** 百分数（输入已经是百分比数值），如 pct(0.98113) → "0.98%" */
export function pct(n: number, digits = 2): string {
  return `${n.toFixed(digits)}%`;
}

/** 按 0 位或 1 位小数显示的倍数，如 ×1.36 */
export function times(n: number, digits = 2): string {
  return `×${n.toFixed(digits)}`;
}
