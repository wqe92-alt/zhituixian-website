// Dify AI 客服：挂载自建聊天窗（components/ChatPanel.svelte），经 lib/dify-client.ts 调用 Dify 对话接口。
// 聊天窗按需加载：页面空闲时预加载，不在首屏请求 Dify。
import { supportConfig } from '../support.config';
import type { DifyOptions } from '../lib/dify-client';
import type { SupportProvider } from '../types';

type PanelApi = { show: () => void; hide: () => void; ask: (text: string) => void };

const cfg = supportConfig.dify;
let panel: PanelApi | null = null;
let loading: Promise<void> | null = null;

/** 已填写密钥，或 API 地址是同源代理路径（以 / 开头，由代理注入密钥） */
export const difyConfigured = () => !!cfg.apiKey || cfg.apiBase.startsWith('/');

/** 匿名访客标识：Dify 用它区分会话归属，保存在本机浏览器 */
function visitorId(): string {
  const KEY = 'zt.support.visitor';
  const make = () => `web-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`}`;
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = make();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return make();
  }
}

export const dify: SupportProvider = {
  name: 'dify',

  load() {
    if (!difyConfigured()) return Promise.reject(new Error('Dify 未配置：请在 website/.env 填写 PUBLIC_DIFY_API_KEY'));
    if (loading) return loading;
    loading = (async () => {
      const [{ mount }, { default: ChatPanel }] = await Promise.all([import('svelte'), import('../components/ChatPanel.svelte')]);
      const options: DifyOptions = {
        apiBase: cfg.apiBase,
        apiKey: cfg.apiKey,
        appMode: cfg.appMode,
        workflowInputKey: cfg.workflowInputKey,
        workflowOutputKey: cfg.workflowOutputKey,
        user: visitorId(),
      };
      const host = document.createElement('div');
      host.className = 'support-chat no-print';
      document.body.appendChild(host);
      panel = mount(ChatPanel, { target: host, props: { options } }) as unknown as PanelApi;
    })();
    loading.catch(() => (loading = null));
    return loading;
  },

  async open(ctx, summary) {
    if (!panel) return false;
    // 投保申请、报价评估等带上下文的入口：把摘要作为第一条消息发给 AI 客服
    if (summary && ctx?.kind !== 'chat') panel.ask(summary);
    else panel.show();
    return true;
  },
};
