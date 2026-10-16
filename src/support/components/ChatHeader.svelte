<script lang="ts">
  import Icon from '../../components/Icon.svelte';
  import paths from '../../assets/logo-paths.json';

  let {
    name,
    busy,
    onreset,
    onclose,
  }: { name: string; busy: boolean; onreset: () => void; onclose: () => void } = $props();

  const { mark } = paths;
</script>

<header class="ch">
  <span class="ch-avatar" aria-hidden="true">
    <svg viewBox={`0 0 ${mark.w} ${mark.h}`} fill="currentColor" fill-rule="evenodd"><path d={mark.d} /></svg>
  </span>
  <div class="ch-text">
    <p class="ch-name">{name}</p>
    <p class="ch-status"><span class="ch-dot"></span>{busy ? '正在回复…' : 'AI 助手 · 在线'}</p>
  </div>
  <button type="button" class="ch-btn" onclick={onreset} aria-label="开始新对话" title="新对话">
    <Icon name="refresh" class="size-[1.05rem]" />
  </button>
  <button type="button" class="ch-btn" onclick={onclose} aria-label="关闭对话窗口" title="关闭">
    <Icon name="x" class="size-[1.15rem]" />
  </button>
</header>

<style>
  .ch {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.85rem 0.75rem 0.85rem 1rem;
    background: var(--color-ink);
    color: var(--color-paper);
  }
  .ch-avatar {
    flex: none;
    display: grid;
    place-items: center;
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 999px;
    background: var(--color-brand);
    color: var(--color-paper);
  }
  .ch-avatar svg {
    width: 1.4rem;
    height: auto;
  }
  .ch-text {
    flex: 1;
    min-width: 0;
  }
  .ch-name {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 1.04rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1.2;
  }
  .ch-status {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0.25rem 0 0;
    font-size: 0.72rem;
    line-height: 1.2;
    color: rgb(250 246 240 / 0.7);
  }
  .ch-dot {
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 999px;
    background: #6fcf97;
    box-shadow: 0 0 0 3px rgb(111 207 151 / 0.22);
  }
  .ch-btn {
    flex: none;
    display: grid;
    place-items: center;
    width: 2.15rem;
    height: 2.15rem;
    border-radius: 999px;
    color: rgb(250 246 240 / 0.78);
    transition:
      background-color 0.2s var(--ease-soft),
      color 0.2s var(--ease-soft);
  }
  .ch-btn:hover {
    background: rgb(250 246 240 / 0.12);
    color: var(--color-paper);
  }
</style>
