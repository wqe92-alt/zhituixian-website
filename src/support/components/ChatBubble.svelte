<script lang="ts">
  import paths from '../../assets/logo-paths.json';
  import { cleanAnswer, renderMarkdown } from '../lib/chat-markdown';

  let {
    role,
    text,
    streaming = false,
    error,
    onretry,
  }: {
    role: 'user' | 'assistant';
    text: string;
    streaming?: boolean;
    error?: string;
    onretry?: () => void;
  } = $props();

  const { mark } = paths;
  const html = $derived(role === 'assistant' ? renderMarkdown(cleanAnswer(text)) : '');
</script>

{#if role === 'user'}
  <div class="row me">
    <div class="bub me">{text}</div>
  </div>
{:else}
  <div class="row them">
    <span class="av" aria-hidden="true">
      <svg viewBox={`0 0 ${mark.w} ${mark.h}`} fill="currentColor" fill-rule="evenodd"><path d={mark.d} /></svg>
    </span>
    <div class="bub them">
      {#if html}
        <!-- renderMarkdown 先整体转义，再只生成段落、列表、加粗、链接等有限标签 -->
        {@html html}
      {:else if streaming}
        <span class="typing" role="status" aria-label="正在回复"><i></i><i></i><i></i></span>
      {/if}
      {#if error}
        <p class="err">
          {error}
          {#if onretry}<button type="button" class="retry" onclick={onretry}>重试</button>{/if}
        </p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .row {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    margin: 0 0 0.85rem;
  }
  .row.me {
    justify-content: flex-end;
  }
  .av {
    flex: none;
    display: grid;
    place-items: center;
    width: 1.85rem;
    height: 1.85rem;
    margin-top: 0.1rem;
    border-radius: 999px;
    background: var(--color-brand-soft);
    color: var(--color-brand);
  }
  .av svg {
    width: 1.1rem;
    height: auto;
  }
  .bub {
    max-width: 82%;
    padding: 0.62rem 0.9rem;
    border-radius: 18px;
    font-size: 0.9rem;
    line-height: 1.75;
    overflow-wrap: anywhere;
  }
  .bub.them {
    border: 1px solid var(--color-line);
    border-top-left-radius: 6px;
    background: #fff;
    color: var(--color-ink);
  }
  .bub.me {
    border-top-right-radius: 6px;
    background: var(--color-brand);
    color: #fff;
    white-space: pre-wrap;
  }
  .bub :global(p) {
    margin: 0;
  }
  .bub :global(* + p),
  .bub :global(* + ul),
  .bub :global(* + ol) {
    margin-top: 0.5em;
  }
  .bub :global(ul),
  .bub :global(ol) {
    padding-left: 1.25em;
  }
  .bub :global(ul) {
    list-style: disc;
  }
  .bub :global(ol) {
    list-style: decimal;
  }
  .bub :global(li + li) {
    margin-top: 0.2em;
  }
  .bub :global(strong) {
    font-weight: 600;
  }
  .bub :global(a) {
    color: var(--color-brand);
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
  .bub :global(a[href^='tel:']) {
    white-space: nowrap;
  }
  .bub :global(code) {
    padding: 0.05em 0.35em;
    border-radius: 6px;
    background: var(--color-paper-2);
    font-size: 0.86em;
  }
  .typing {
    display: inline-flex;
    gap: 0.3rem;
    padding: 0.45rem 0;
  }
  .typing i {
    width: 0.42rem;
    height: 0.42rem;
    border-radius: 999px;
    background: var(--color-ink-3);
    animation: blink 1.2s infinite ease-in-out;
  }
  .typing i:nth-child(2) {
    animation-delay: 0.15s;
  }
  .typing i:nth-child(3) {
    animation-delay: 0.3s;
  }
  @keyframes blink {
    0%,
    80%,
    100% {
      opacity: 0.25;
      transform: translateY(0);
    }
    40% {
      opacity: 1;
      transform: translateY(-3px);
    }
  }
  .err {
    margin: 0.35rem 0 0;
    font-size: 0.8rem;
    line-height: 1.6;
    color: var(--color-brand-deep);
  }
  .retry {
    margin-left: 0.35rem;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
</style>
