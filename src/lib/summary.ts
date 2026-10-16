// 报价摘要：随投保申请或咨询一起交给顾问
import type { Quote } from './engine';
import { profileText } from './factors';
import { pct, yuan } from './format';

export function quoteSummaryLines(q: Quote, discount: boolean, link?: string): string[] {
  const p = q.input;
  const lines = [`门店情况：${profileText(p)}`, `月销售额 ¥${yuan(p.monthlySalesYuan)} · 月销量 ${yuan(p.monthlyUnits)} 件`];
  if (q.manualReview) {
    lines.push('报价结果：需顾问评估后报价');
  } else {
    lines.push(
      `报价：常规月 ¥${yuan(q.premium.regular)}（约为销售额的 ${pct(q.ratePct.regular)}）· 换季月 ¥${yuan(q.premium.season)} · 全年约 ¥${yuan(q.annual)}`,
    );
    lines.push(`数据换利：${discount ? `已选择，常规月约 ¥${yuan(q.discounted.regular)}` : '未选择'}`);
  }
  if (link) lines.push(`报价链接：${link}`);
  return lines;
}
