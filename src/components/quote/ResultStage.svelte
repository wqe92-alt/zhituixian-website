<script lang="ts">
  import Icon from '../Icon.svelte';
  import PriceSummary from './PriceSummary.svelte';
  import MonthCalendar from './MonthCalendar.svelte';
  import QuoteIncludes from './QuoteIncludes.svelte';
  import ManualReview from './ManualReview.svelte';
  import type { Quote } from '../../lib/engine';
  import { profileText } from '../../lib/factors';
  import { yuan } from '../../lib/format';

  let {
    q,
    discount = $bindable(false),
    shared,
    oncontinue,
    onapply,
    onedit,
    onrestart,
  }: {
    q: Quote;
    discount: boolean;
    shared: boolean;
    oncontinue: () => void;
    onapply: () => void;
    onedit: () => void;
    onrestart: () => void;
  } = $props();

  const today = new Date().toISOString().slice(0, 10);
  let copied = $state(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(location.href);
      copied = true;
      setTimeout(() => (copied = false), 2200);
    } catch {
      prompt('复制以下链接：', location.href);
    }
  }
</script>

<div>
  <div class="mb-8 hidden border-b border-ink/20 pb-4 print:block">
    <p class="serif text-2xl font-bold">智退险 · 保费报价单</p>
    <p class="mt-1 text-sm">报价日期 {today}。报价根据门店填写的信息估算，最终以核保结果为准。</p>
  </div>

  {#if shared}
    <p class="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-lilac-soft px-5 py-3 text-[0.88rem] text-plum">
      <span>这是一份已保存的报价。如需为您的门店测算，请重新填写。</span>
      <button type="button" class="font-semibold underline underline-offset-4" onclick={onrestart}>重新测算</button>
    </p>
  {/if}

  <p class="eyebrow">您的报价</p>
  <h2 tabindex="-1" class="mt-4 text-[clamp(1.6rem,2.8vw,2.1rem)] leading-tight outline-none">
    {q.manualReview ? '您的门店需要顾问评估后报价' : '您门店的保费报价'}
  </h2>
  <p class="mt-3 text-[0.86rem] leading-relaxed text-ink-2">
    {profileText(q.input)} · 月销售额 {yuan(q.input.monthlySalesYuan)} 元 · 月销量 {yuan(q.input.monthlyUnits)} 件
  </p>

  {#if q.manualReview}
    <ManualReview {q} {onapply} />
  {:else}
    <PriceSummary {q} bind:discount />
    <MonthCalendar {q} {discount} />
    <QuoteIncludes {q} />
  {/if}

  <div class="no-print mt-8 flex flex-wrap items-center justify-between gap-4 border-t hairline pt-6">
    <div class="flex flex-wrap gap-2">
      <button type="button" class="btn btn-ghost !px-4 !py-2.5 text-[0.85rem]" onclick={onedit}>
        <Icon name="arrow-left" class="size-4" /> 修改信息
      </button>
      {#if !q.manualReview}
        <button type="button" class="btn btn-ghost !px-4 !py-2.5 text-[0.85rem]" onclick={() => window.print()}>
          <Icon name="printer" class="size-4" /> 打印报价单
        </button>
        <button type="button" class="btn btn-ghost !px-4 !py-2.5 text-[0.85rem]" onclick={copyLink}>
          <Icon name={copied ? 'check' : 'link'} class="size-4" />
          {copied ? '链接已复制' : '复制报价链接'}
        </button>
      {/if}
    </div>
    {#if !q.manualReview}
      <button type="button" class="btn btn-primary" onclick={oncontinue}>继续投保 <Icon name="arrow-right" class="arrow size-4" /></button>
    {/if}
  </div>
  <p class="mt-5 text-[0.78rem] leading-relaxed text-ink-2">报价根据您填写的信息估算，最终以核保结果为准。</p>
</div>
