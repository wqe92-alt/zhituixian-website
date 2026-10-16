<script lang="ts">
  // Dify AI 客服聊天窗：开场白与推荐问题、流式回答、停止回复、新对话；对话记录保存在本标签页内
  import { tick } from 'svelte';
  import ChatHeader from './ChatHeader.svelte';
  import ChatBubble from './ChatBubble.svelte';
  import ChatComposer from './ChatComposer.svelte';
  import { DifyError, fetchParameters, stopReply, streamReply, type DifyOptions } from '../lib/dify-client';
  import { supportConfig } from '../support.config';

  type Msg = { id: string; role: 'user' | 'assistant'; text: string; status: 'done' | 'streaming' | 'error'; error?: string };

  let { options }: { options: DifyOptions } = $props();

  const cfg = supportConfig.dify;
  const STORE = 'zt.support.chat';
  const saved = restore();

  let open = $state(false);
  let messages = $state<Msg[]>(saved.messages);
  let busy = $state(false);
  let welcome = $state(cfg.welcome);
  let suggestions = $state<string[]>([...cfg.suggestions]);
  let logEl: HTMLDivElement | undefined = $state();
  let composer: ReturnType<typeof ChatComposer> | undefined = $state();
  let conversationId = saved.conversationId;
  let sessionId = saved.sessionId || newSessionId();
  let controller: AbortController | null = null;
  let taskId = '';
  let paramsLoaded = false;

  const asked = $derived(messages.some((m) => m.role === 'user'));
  const uid = () => Math.random().toString(36).slice(2, 10);

  /** 每段对话一个会话编号，作为 Dify 开始节点的 session_id 传入；“新对话”时更换 */
  function newSessionId(): string {
    return `web-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }

  function restore(): { conversationId: string; sessionId: string; messages: Msg[] } {
    try {
      const v = JSON.parse(sessionStorage.getItem(STORE) ?? 'null');
      if (v && Array.isArray(v.messages)) {
        return { conversationId: String(v.conversationId ?? ''), sessionId: String(v.sessionId ?? ''), messages: v.messages };
      }
    } catch {
      /* 忽略 */
    }
    return { conversationId: '', sessionId: '', messages: [] };
  }

  function save() {
    try {
      const done = messages.filter((m) => m.status === 'done').slice(-40);
      sessionStorage.setItem(STORE, JSON.stringify({ conversationId, sessionId, messages: done }));
    } catch {
      /* 隐私模式等：仅不保存 */
    }
  }

  function scrollToEnd(force = false) {
    const el = logEl;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
    if (force || nearBottom) void tick().then(() => (el.scrollTop = el.scrollHeight));
  }

  function describe(e: unknown): string {
    const phone = supportConfig.phone.display;
    if (e instanceof DifyError) {
      if (e.status === 401 || e.status === 403) return `在线顾问暂时无法使用，请致电 ${phone}。`;
      if (e.status === 429) return '当前咨询较多，请稍后再试。';
      if (e.code === 'workflow_failed') return `回复没有成功返回，请稍后再试，或致电 ${phone}。`;
      if (e.status >= 500) return `服务暂时繁忙，请稍后再试，或致电 ${phone}。`;
      return `回复没有成功返回，请稍后再试，或致电 ${phone}。`;
    }
    return `网络连接异常，请检查网络后重试，或致电 ${phone}。`;
  }

  async function reply(q: string, allowRetry = true): Promise<void> {
    messages.push({ id: uid(), role: 'assistant', text: '', status: 'streaming' });
    const msg = messages[messages.length - 1];
    busy = true;
    taskId = '';
    controller = new AbortController();
    const signal = controller.signal;
    scrollToEnd(true);
    try {
      await streamReply(
        options,
        q,
        conversationId,
        cfg.sessionInputKey ? { [cfg.sessionInputKey]: sessionId } : {},
        {
          onDelta: (t) => {
            scrollToEnd();
            msg.text += t;
          },
          onReplace: (t) => (msg.text = t),
          onMeta: (m) => {
            if (m.conversationId) conversationId = m.conversationId;
            if (m.taskId) taskId = m.taskId;
          },
        },
        signal,
      );
      msg.status = msg.text.trim() ? 'done' : 'error';
      if (msg.status === 'error') msg.error = '暂时没有得到回复，请换个说法再试一次。';
    } catch (e) {
      if (signal.aborted) {
        msg.status = 'done';
        if (!msg.text.trim()) msg.text = '（已停止回复）';
      } else if (e instanceof DifyError && e.status === 404 && conversationId && allowRetry) {
        // 会话在 Dify 中已失效：开始新会话后重试一次
        conversationId = '';
        messages.splice(messages.indexOf(msg), 1);
        await reply(q, false);
        return;
      } else {
        // 供运维排查：Dify 返回的具体原因（如开始节点缺少必填变量、密钥无效、应用类型不符）
        console.warn('[support] Dify 请求失败：', e instanceof DifyError ? `${e.status} ${e.code} ${e.message}` : e);
        msg.status = 'error';
        msg.error = describe(e);
      }
    } finally {
      busy = false;
      controller = null;
      save();
      scrollToEnd();
    }
  }

  function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    messages.push({ id: uid(), role: 'user', text: q, status: 'done' });
    void reply(q);
  }

  function retry() {
    const last = messages[messages.length - 1];
    const prev = [...messages].reverse().find((m) => m.role === 'user');
    if (!last || last.status !== 'error' || !prev || busy) return;
    messages.pop();
    void reply(prev.text);
  }

  function stop() {
    controller?.abort();
    if (taskId) void stopReply(options, taskId);
  }

  function reset() {
    if (busy) stop();
    messages = [];
    conversationId = '';
    sessionId = newSessionId();
    save();
    composer?.focus();
  }

  async function loadParams() {
    if (paramsLoaded) return;
    paramsLoaded = true;
    const p = await fetchParameters(options);
    if (p.opening) welcome = p.opening;
    if (p.suggestions.length) suggestions = p.suggestions.slice(0, 4);
  }

  export function show() {
    open = true;
    void loadParams();
    scrollToEnd(true);
    void tick().then(() => composer?.focus());
  }

  export function hide() {
    if (!open) return;
    open = false;
    window.dispatchEvent(new CustomEvent('support:closed'));
    document.querySelector<HTMLElement>('.support-launcher')?.focus();
  }

  export function ask(text: string) {
    show();
    send(text);
  }
</script>

<section
  class={['cp', open && 'is-open']}
  role="dialog"
  aria-label={`${cfg.assistantName} · 在线咨询`}
  inert={!open}
  onkeydown={(e) => e.key === 'Escape' && hide()}
>
  <ChatHeader name={cfg.assistantName} {busy} onreset={reset} onclose={hide} />

  <div class="cp-log" role="log" aria-live="polite" aria-busy={busy} bind:this={logEl}>
    <ChatBubble role="assistant" text={welcome} />
    {#if !asked && suggestions.length}
      <div class="cp-suggest" aria-label="推荐问题">
        {#each suggestions as s (s)}
          <button type="button" class="cp-chip" onclick={() => send(s)}>{s}</button>
        {/each}
      </div>
    {/if}
    {#each messages as m, i (m.id)}
      <ChatBubble
        role={m.role}
        text={m.text}
        streaming={m.status === 'streaming'}
        error={m.status === 'error' ? m.error : undefined}
        onretry={m.status === 'error' && i === messages.length - 1 ? retry : undefined}
      />
    {/each}
  </div>

  <ChatComposer bind:this={composer} {busy} onsend={send} onstop={stop} />
</section>

<style>
  .cp {
    position: fixed;
    right: clamp(1rem, 2.5vw, 1.75rem);
    bottom: clamp(1rem, 2.5vw, 1.75rem);
    z-index: 70;
    display: flex;
    flex-direction: column;
    width: min(calc(100vw - 2rem), 25rem);
    height: min(calc(100vh - 2rem), 40rem);
    height: min(calc(100dvh - 2rem), 40rem);
    overflow: hidden;
    border: 1px solid var(--color-line);
    border-radius: 24px;
    background: var(--color-paper);
    color: var(--color-ink);
    box-shadow:
      0 40px 90px -30px rgb(27 28 32 / 0.55),
      0 2px 8px -2px rgb(27 28 32 / 0.08);
    opacity: 0;
    transform: translateY(16px) scale(0.98);
    transform-origin: bottom right;
    visibility: hidden;
    pointer-events: none;
    transition:
      opacity 0.24s var(--ease-soft),
      transform 0.24s var(--ease-soft),
      visibility 0s linear 0.24s;
  }
  .cp.is-open {
    opacity: 1;
    transform: none;
    visibility: visible;
    pointer-events: auto;
    transition:
      opacity 0.24s var(--ease-soft),
      transform 0.24s var(--ease-soft),
      visibility 0s;
  }
  .cp-log {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--color-line-strong) transparent;
    padding: 1.1rem 1rem 0.4rem;
    background:
      radial-gradient(120% 55% at 100% 0%, rgb(244 217 223 / 0.45), transparent 60%),
      radial-gradient(90% 45% at 0% 100%, rgb(199 178 222 / 0.22), transparent 60%),
      var(--color-paper);
  }
  .cp-suggest {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin: -0.2rem 0 0.95rem 2.4rem;
  }
  .cp-chip {
    padding: 0.38rem 0.8rem;
    border: 1px solid var(--color-line-strong);
    border-radius: 999px;
    background: rgb(255 255 255 / 0.7);
    color: var(--color-ink);
    font-size: 0.8rem;
    line-height: 1.4;
    transition:
      border-color 0.2s var(--ease-soft),
      color 0.2s var(--ease-soft),
      background-color 0.2s var(--ease-soft);
  }
  .cp-chip:hover {
    border-color: var(--color-brand);
    background: #fff;
    color: var(--color-brand);
  }
  @media (max-width: 640px) {
    .cp {
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
      border-radius: 0;
    }
  }
</style>
