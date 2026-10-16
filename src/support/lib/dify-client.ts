// Dify 对话接口客户端：只负责请求与解析流式事件，不涉及界面。
// 对话类应用（聊天助手 / Agent / Chatflow）走 POST /chat-messages；工作流应用走 POST /workflows/run。

export type DifyMode = 'chat' | 'workflow';

export interface DifyOptions {
  apiBase: string;
  /** 为空时不带 Authorization 头（适用于由同源代理注入密钥的部署） */
  apiKey: string;
  appMode: DifyMode;
  workflowInputKey: string;
  workflowOutputKey: string;
  /** 访客标识，Dify 用于区分会话归属 */
  user: string;
}

export class DifyError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DifyError';
  }
}

export interface ReplyHandlers {
  onDelta: (text: string) => void;
  onReplace: (text: string) => void;
  onMeta: (meta: { conversationId?: string; taskId?: string }) => void;
}

type Json = Record<string, unknown>;

const base = (o: DifyOptions) => o.apiBase.trim().replace(/\/+$/, '');
const str = (v: unknown) => (typeof v === 'string' ? v : '');

function headers(o: DifyOptions): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (o.apiKey.trim()) h.Authorization = `Bearer ${o.apiKey.trim()}`;
  return h;
}

async function toError(res: Response): Promise<DifyError> {
  try {
    const j = (await res.json()) as Json;
    return new DifyError(res.status, str(j.code), str(j.message) || res.statusText);
  } catch {
    return new DifyError(res.status, '', res.statusText || 'request failed');
  }
}

/** 把 SSE 文本流切成事件对象；返回的函数可以多次喂入分片，最后一次传 flush=true */
export function createSseParser(onEvent: (data: Json) => void) {
  let buf = '';
  const emit = (block: string) => {
    const data = block
      .split('\n')
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trimStart())
      .join('\n');
    if (!data) return;
    try {
      const obj: unknown = JSON.parse(data);
      if (obj && typeof obj === 'object') onEvent(obj as Json);
    } catch {
      /* 心跳等非 JSON 内容忽略 */
    }
  };
  return (chunk: string, flush = false) => {
    buf = (buf + chunk).replace(/\r\n?/g, '\n');
    let i: number;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      emit(buf.slice(0, i));
      buf = buf.slice(i + 2);
    }
    if (flush && buf.trim()) {
      emit(buf);
      buf = '';
    }
  };
}

function pickOutput(outputs: unknown, key: string): string {
  if (!outputs || typeof outputs !== 'object') return '';
  const o = outputs as Json;
  if (typeof o[key] === 'string') return o[key] as string;
  const first = Object.values(o).find((v) => typeof v === 'string');
  return typeof first === 'string' ? first : '';
}

/** 发送一条问题并以流式方式接收回答；inputs 为传给 Dify「开始」节点的变量 */
export async function streamReply(
  o: DifyOptions,
  query: string,
  conversationId: string,
  inputs: Record<string, string>,
  h: ReplyHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const workflow = o.appMode === 'workflow';
  const url = `${base(o)}/${workflow ? 'workflows/run' : 'chat-messages'}`;
  const body = workflow
    ? { inputs: { ...inputs, [o.workflowInputKey]: query }, response_mode: 'streaming', user: o.user }
    : { inputs, query, response_mode: 'streaming', conversation_id: conversationId, user: o.user };

  const res = await fetch(url, { method: 'POST', headers: headers(o), body: JSON.stringify(body), signal });
  if (!res.ok || !res.body) throw await toError(res);

  let received = false;
  let failure: DifyError | null = null;
  const feed = createSseParser((ev) => {
    const event = str(ev.event);
    const conversation = str(ev.conversation_id);
    const task = str(ev.task_id);
    if (conversation || task) h.onMeta({ conversationId: conversation || undefined, taskId: task || undefined });
    const data = (ev.data && typeof ev.data === 'object' ? ev.data : {}) as Json;
    if (event === 'message' || event === 'agent_message') {
      const t = str(ev.answer);
      if (t) {
        received = true;
        h.onDelta(t);
      }
    } else if (event === 'message_replace') {
      received = true;
      h.onReplace(str(ev.answer));
    } else if (event === 'text_chunk') {
      const t = str(data.text);
      if (t) {
        received = true;
        h.onDelta(t);
      }
    } else if (event === 'workflow_finished') {
      // 流程失败时 Dify 只在这里给出原因（例如开始节点缺少必填变量），不会再发 error 事件
      if (str(data.status) === 'failed') {
        failure = new DifyError(500, 'workflow_failed', str(data.error) || 'workflow failed');
      } else if (workflow && !received) {
        const out = pickOutput(data.outputs, o.workflowOutputKey);
        if (out) {
          received = true;
          h.onReplace(out);
        }
      }
    } else if (event === 'error') {
      failure = new DifyError(Number(ev.status) || 500, str(ev.code) || 'stream_error', str(ev.message) || 'stream error');
    }
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    feed(decoder.decode(value, { stream: true }));
  }
  feed(decoder.decode(), true);
  if (failure) throw failure;
}

/** 停止正在生成的回答（尽力而为，失败忽略） */
export async function stopReply(o: DifyOptions, taskId: string): Promise<void> {
  const path = o.appMode === 'workflow' ? `workflows/tasks/${taskId}/stop` : `chat-messages/${taskId}/stop`;
  try {
    await fetch(`${base(o)}/${path}`, { method: 'POST', headers: headers(o), body: JSON.stringify({ user: o.user }) });
  } catch {
    /* 忽略 */
  }
}

/** 读取应用在 Dify 中配置的开场白与推荐问题；读取失败时返回空 */
export async function fetchParameters(o: DifyOptions): Promise<{ opening: string; suggestions: string[] }> {
  try {
    const res = await fetch(`${base(o)}/parameters?user=${encodeURIComponent(o.user)}`, { headers: headers(o) });
    if (!res.ok) return { opening: '', suggestions: [] };
    const j = (await res.json()) as Json;
    const list = Array.isArray(j.suggested_questions) ? j.suggested_questions.filter((s): s is string => typeof s === 'string' && !!s.trim()) : [];
    return { opening: str(j.opening_statement).trim(), suggestions: list };
  } catch {
    return { opening: '', suggestions: [] };
  }
}
