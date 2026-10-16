/** 打开客服窗口时可以带上的上下文（例如报价摘要、投保意向） */
export interface SupportContext {
  kind: 'chat' | 'intent' | 'manual-review';
  /** 摘要标题，例如"投保意向" */
  title?: string;
  /** 摘要正文，每行一条 */
  lines?: string[];
  contact?: {
    name?: string;
    phone?: string;
    store?: string;
    city?: string;
  };
}

/** 客服服务商适配器：换服务商时只需新写一个实现 */
export interface SupportProvider {
  name: string;
  /** 加载第三方脚本；可重复调用 */
  load(): Promise<void>;
  /** 打开对话窗口；返回 false 表示没打开，由外层退回电话弹窗 */
  open(ctx?: SupportContext, summary?: string): Promise<boolean>;
}
