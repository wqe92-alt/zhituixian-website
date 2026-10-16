<script lang="ts">
  import Icon from '../Icon.svelte';

  let { current }: { current: number } = $props();

  const STEPS = ['门店信息', '查看报价', '确认条款', '提交申请'];
</script>

<ol class="no-print mb-10 flex flex-wrap items-center gap-x-2 gap-y-3 text-[0.82rem]" aria-label="投保步骤">
  {#each STEPS as s, i (s)}
    <li class="flex items-center gap-2" aria-current={i === current ? 'step' : undefined}>
      <span
        class={[
          'grid size-7 place-items-center rounded-full border text-[0.78rem] font-semibold transition',
          i < current && 'border-brand bg-brand text-white',
          i === current && 'border-ink bg-ink text-paper',
          i > current && 'border-line-strong text-ink-2',
        ]}
      >
        {#if i < current}<Icon name="check" class="size-3.5" />{:else}{i + 1}{/if}
      </span>
      <span class={i === current ? 'font-semibold text-ink' : 'text-ink-2'}>{s}</span>
      {#if i < STEPS.length - 1}<span class="mx-1 h-px w-6 bg-line-strong sm:w-10"></span>{/if}
    </li>
  {/each}
</ol>
