<script lang="ts">
  import AnimatedNumber from '../AnimatedNumber.svelte';
  import model from '../../data/model.json';
  import type { Quote } from '../../lib/engine';
  import { num, pct, yuan } from '../../lib/format';
  import { DIVIDEND_RULE } from '../../content/terms';

  let { q, discount = $bindable(false) }: { q: Quote; discount: boolean } = $props();

  const regular = $derived(discount ? q.discounted.regular : q.premium.regular);
  const season = $derived(discount ? q.discounted.season : q.premium.season);
  const annual = $derived(discount ? q.annualDiscounted : q.annual);
  const ded = model.pricing.deductible;
</script>

<div class="mt-8 grid gap-5 md:grid-cols-[1.25fr_1fr]">
  <div class="rounded-[24px] bg-ink p-7 text-paper sm:p-8 print:border print:border-ink print:bg-white print:text-ink">
    <p class="eyebrow !text-blush">常规月保费</p>
    <p class="num mt-5 text-[clamp(3rem,6vw,4.4rem)] leading-none" aria-live="polite">
      <span class="mr-1 text-[0.45em] text-paper/60 print:text-ink">¥</span><AnimatedNumber value={regular} format={yuan} />
      <span class="ml-1 text-[0.3em] text-paper/60 print:text-ink">/ 月</span>
    </p>
    {#if discount}
      <p class="mt-2 text-[0.85rem] text-paper/50 line-through">原价 ¥{yuan(q.premium.regular)} / 月</p>
    {/if}
    <p class="mt-3 text-[0.9rem] text-paper/70 print:text-ink">约为月销售额的 {pct(q.ratePct.regular)}</p>

    <label class="no-print mt-7 flex cursor-pointer items-start gap-3 rounded-2xl bg-paper/[0.07] p-4">
      <input type="checkbox" bind:checked={discount} class="switch" />
      <span>
        <span class="block text-[0.95rem] font-semibold">开通数据换利，保费 7 折</span>
        <span class="mt-1 block text-[0.8rem] leading-relaxed text-paper/65">{DIVIDEND_RULE}</span>
      </span>
    </label>
    {#if discount}<p class="mt-3 hidden text-sm print:block">已选择数据换利：每月回传经营数据，保费 7 折。</p>{/if}
  </div>

  <dl class="grid grid-cols-2 gap-3">
    <div class="stat">
      <dt>换季月保费</dt>
      <dd class="num">¥<AnimatedNumber value={season} format={yuan} /></dd>
      <p>3、4、9、10 月</p>
    </div>
    <div class="stat">
      <dt>全年合计约</dt>
      <dd class="num">¥<AnimatedNumber value={annual} format={yuan} /></dd>
      <p>8 个常规月 + 4 个换季月</p>
    </div>
    <div class="stat">
      <dt>每月免赔额</dt>
      <dd class="num">¥{yuan(ded)}</dd>
      <p>超出部分按笔赔付</p>
    </div>
    <div class="stat">
      <dt>保费约占月毛利</dt>
      <dd class="num">{num(q.marginShare.low)}–{num(q.marginShare.high)}<small>%</small></dd>
      <p>按服装零售毛利率 40%–60% 估算</p>
    </div>
  </dl>
</div>

<style>
  .stat {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--color-line);
    border-radius: 20px;
    background: rgb(255 255 255 / 0.55);
    padding: 1.1rem 1.15rem;
  }
  .stat dt {
    font-size: 0.8rem;
    color: var(--color-ink-2);
  }
  .stat dd {
    margin-top: auto;
    padding-top: 0.9rem;
    font-size: 1.65rem;
    line-height: 1.1;
    color: var(--color-ink);
  }
  .stat dd small {
    font-size: 0.55em;
    color: var(--color-ink-2);
  }
  .stat p {
    margin-top: 0.3rem;
    font-size: 0.74rem;
    color: var(--color-ink-2);
  }
  .switch {
    appearance: none;
    position: relative;
    flex-shrink: 0;
    width: 2.6rem;
    height: 1.5rem;
    margin-top: 0.1rem;
    border-radius: 999px;
    background: rgb(250 246 240 / 0.25);
    cursor: pointer;
    transition: background-color 0.25s;
  }
  .switch::after {
    content: '';
    position: absolute;
    top: 0.18rem;
    left: 0.18rem;
    width: 1.14rem;
    height: 1.14rem;
    border-radius: 999px;
    background: var(--color-paper);
    transition: transform 0.25s var(--ease-soft);
  }
  .switch:checked {
    background: var(--color-brand);
  }
  .switch:checked::after {
    transform: translateX(1.1rem);
  }
  .switch:focus-visible {
    outline: 2px solid var(--color-blush);
    outline-offset: 2px;
  }
</style>
