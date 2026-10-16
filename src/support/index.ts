// 客服模块对外入口：页面只调用 openSupport()，或在按钮上加 data-open-support
import { providers } from './providers';
import { supportConfig } from './support.config';
import type { SupportContext } from './types';

export type { SupportContext } from './types';

const provider = supportConfig.provider === 'none' ? null : (providers[supportConfig.provider] ?? null);
let initialized = false;

export function formatSummary(ctx?: SupportContext): string {
  if (!ctx || (!ctx.lines?.length && !ctx.contact)) return '';
  const out: string[] = [`【${ctx.title ?? '智退险咨询'}】`];
  const c = ctx.contact;
  if (c) {
    for (const [k, v] of [
      ['门店', c.store],
      ['联系人', c.name],
      ['手机', c.phone],
      ['城市', c.city],
    ] as const) {
      if (v) out.push(`${k}：${v}`);
    }
  }
  if (ctx.lines?.length) out.push(...ctx.lines);
  return out.join('\n');
}

function showFallback(summary: string) {
  const dialog = document.getElementById('support-fallback') as HTMLDialogElement | null;
  if (!dialog) {
    window.location.href = `tel:${supportConfig.phone.tel}`;
    return;
  }
  const box = dialog.querySelector<HTMLElement>('[data-support-summary]');
  if (box) {
    box.textContent = summary;
    box.closest<HTMLElement>('[data-support-summary-wrap]')?.toggleAttribute('hidden', !summary);
  }
  dialog.showModal();
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}

/** 打开客服对话；服务商不可用时退回电话联系弹窗 */
export async function openSupport(ctx?: SupportContext): Promise<void> {
  const summary = formatSummary(ctx);
  if (!provider) return showFallback(summary);
  try {
    await withTimeout(provider.load(), supportConfig.openTimeoutMs);
    const ok = await provider.open(ctx, summary);
    if (!ok) return showFallback(summary);
    window.dispatchEvent(new CustomEvent('support:opened'));
  } catch {
    showFallback(summary);
  }
}

/** 由 SupportLauncher 在每个页面调用一次：延迟预加载 + 绑定 data-open-support 按钮 */
export function initSupport(): void {
  if (initialized) return;
  initialized = true;

  document.addEventListener('click', (e) => {
    const el = (e.target as Element | null)?.closest<HTMLElement>('[data-open-support]');
    if (!el) return;
    e.preventDefault();
    const topic = el.dataset.openSupport;
    void openSupport(topic ? { kind: 'chat', title: topic, lines: [`咨询主题：${topic}`] } : { kind: 'chat' });
  });

  if (!provider) return;
  const preload = () => provider.load().catch(() => {});
  const idle = (cb: () => void) =>
    'requestIdleCallback' in window ? window.requestIdleCallback(cb, { timeout: 4000 }) : setTimeout(cb, 1);
  const schedule = () => setTimeout(() => idle(preload), supportConfig.loadDelayMs);
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
}
