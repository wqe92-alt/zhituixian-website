<script lang="ts">
  import { supportConfig } from '../support.config';

  let { busy, onsend, onstop }: { busy: boolean; onsend: (text: string) => void; onstop: () => void } = $props();

  let value = $state('');
  let ta: HTMLTextAreaElement | undefined = $state();

  export function focus() {
    ta?.focus();
  }

  function grow() {
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }

  function submit(e?: Event) {
    e?.preventDefault();
    const t = value.trim();
    if (!t || busy) return;
    value = '';
    onsend(t);
    requestAnimationFrame(grow);
  }

  // 中文输入法选词时的回车不发送；Shift+回车换行
  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
      e.preventDefault();
      submit();
    }
  }
</script>

<form class="cc" onsubmit={submit}>
  <div class="cc-box">
    <textarea
      bind:this={ta}
      bind:value
      rows="1"
      maxlength="2000"
      placeholder="请输入您的问题"
      aria-label="输入问题"
      oninput={grow}
      {onkeydown}
    ></textarea>
    {#if busy}
      <button type="button" class="cc-btn stop" onclick={onstop} aria-label="停止回复" title="停止回复">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" /></svg>
      </button>
    {:else}
      <button type="submit" class="cc-btn" disabled={!value.trim()} aria-label="发送" title="发送">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 19V5M6 11l6-6 6 6" />
        </svg>
      </button>
    {/if}
  </div>
  <p class="cc-note">
    AI 回答仅供参考，具体以保险合同为准 · 人工顾问
    <a href={`tel:${supportConfig.phone.tel}`}>{supportConfig.phone.display}</a>
  </p>
</form>

<style>
  .cc {
    flex: none;
    padding: 0.7rem 0.8rem 0.6rem;
    border-top: 1px solid var(--color-line);
    background: var(--color-paper);
  }
  .cc-box {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    padding: 0.35rem 0.35rem 0.35rem 0.95rem;
    border: 1px solid var(--color-line-strong);
    border-radius: 18px;
    background: #fff;
    transition:
      border-color 0.2s var(--ease-soft),
      box-shadow 0.2s var(--ease-soft);
  }
  .cc-box:focus-within {
    border-color: rgb(160 0 48 / 0.55);
    box-shadow: 0 0 0 3px rgb(160 0 48 / 0.07);
  }
  textarea {
    flex: 1;
    min-width: 0;
    max-height: 7.5rem;
    padding: 0.5rem 0;
    border: 0;
    background: transparent;
    color: var(--color-ink);
    font-size: 0.92rem;
    line-height: 1.5;
    resize: none;
  }
  textarea:focus,
  textarea:focus-visible {
    outline: none;
  }
  textarea::placeholder {
    color: var(--color-ink-3);
  }
  .cc-btn {
    flex: none;
    display: grid;
    place-items: center;
    width: 2.3rem;
    height: 2.3rem;
    border-radius: 999px;
    background: var(--color-brand);
    color: #fff;
    transition:
      background-color 0.2s var(--ease-soft),
      opacity 0.2s var(--ease-soft);
  }
  .cc-btn svg {
    width: 1.1rem;
    height: 1.1rem;
  }
  .cc-btn:hover:not(:disabled) {
    background: var(--color-brand-deep);
  }
  .cc-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .cc-btn.stop {
    background: var(--color-ink);
  }
  .cc-note {
    margin: 0.5rem 0.2rem 0;
    font-size: 0.7rem;
    line-height: 1.5;
    text-align: center;
    color: var(--color-ink-2);
  }
  .cc-note a {
    color: var(--color-ink);
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
  @media (max-width: 640px) {
    textarea {
      font-size: 16px;
    }
    .cc {
      padding-bottom: calc(0.6rem + env(safe-area-inset-bottom));
    }
  }
</style>
