<script lang="ts">
  import AnimatedNumber from '../AnimatedNumber.svelte';
  import Icon from '../Icon.svelte';
  import type { Quote } from '../../lib/engine';
  import { levelLabel, typesLabel, type SingleKey } from '../../lib/factors';
  import { pct, yuan } from '../../lib/format';
  import { ALL_FIELDS, FIELD_LABEL, filledCount, isFilled, type Form } from './form';

  let { q, form }: { q: Quote; form: Form } = $props();

  const total = ALL_FIELDS.length;
  const count = $derived(filledCount(form));
  const rows = $derived(
    ALL_FIELDS.filter((f) => isFilled(form, f)).map((f) => {
      const v =
        f === 'clothing_type'
          ? typesLabel(form.clothing_type)
          : f === 'monthlySalesYuan'
            ? `${yuan(Number(form.monthlySalesYuan))} 元`
            : f === 'monthlyUnits'
              ? `${yuan(Number(form.monthlyUnits))} 件`
              : levelLabel(f as SingleKey, form[f as SingleKey] as string);
      return { k: FIELD_LABEL[f], v };
    }),
  );
</script>

<aside class="hidden self-start lg:sticky lg:top-28 lg:block" aria-label="预估保费">
  <div class="relative overflow-hidden rounded-[24px] bg-ink p-7 text-paper">
    <p class="eyebrow !text-blush">预估月保费 · 常规月</p>
    <p class="num mt-4 text-[3.2rem] leading-none" aria-live="polite">
      <span class="mr-1 text-[0.45em] text-paper/60">¥</span><AnimatedNumber value={q.premium.regular} format={yuan} />
      <span class="ml-1 text-[0.32em] text-paper/60">/ 月</span>
    </p>
    <p class="mt-3 text-[0.86rem] text-paper/70">
      约为月销售额的 {pct(q.ratePct.regular)} · 换季月约 ¥<AnimatedNumber value={q.premium.season} format={yuan} />
    </p>

    <div class="mt-6 h-1.5 overflow-hidden rounded-full bg-paper/15" aria-hidden="true">
      <div class="h-full rounded-full bg-blush transition-[width] duration-500" style={`width:${(count / total) * 100}%`}></div>
    </div>
    <p class="mt-2 text-[0.76rem] text-paper/60">
      已填写 {count} / {total} 项{count < total ? '，未填写的项目暂按常见门店估算' : ''}
    </p>

    {#if q.manualReview}
      <p class="mt-5 flex items-start gap-2 rounded-xl bg-paper/10 p-3 text-[0.8rem] leading-relaxed text-paper/85">
        <Icon name="info" class="mt-0.5 size-4 shrink-0 text-amber" />根据已填写的信息，可能需要顾问评估后报价。
      </p>
    {/if}
  </div>

  {#if rows.length}
    <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-[20px] border hairline bg-white/50 p-5 text-[0.8rem]">
      {#each rows as r (r.k)}
        <div class="min-w-0">
          <dt class="text-ink-2">{r.k}</dt>
          <dd class="truncate font-semibold text-ink" title={r.v}>{r.v}</dd>
        </div>
      {/each}
    </dl>
  {/if}
</aside>

<div class="estimate-bar no-print lg:hidden" aria-label="预估保费">
  <div>
    <p class="text-[0.7rem] text-paper/60">预估月保费 · 已填写 {count}/{total}</p>
    <p class="num text-xl leading-tight">¥<AnimatedNumber value={q.premium.regular} format={yuan} /><span class="text-xs text-paper/60"> / 月</span></p>
  </div>
  <p class="num text-sm text-paper/80">{pct(q.ratePct.regular)}</p>
</div>

<style>
  .estimate-bar {
    position: fixed;
    left: 0.75rem;
    right: 5.25rem;
    bottom: 0.9rem;
    z-index: 55;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-radius: 18px;
    background: var(--color-ink);
    color: var(--color-paper);
    padding: 0.65rem 1rem;
    box-shadow: 0 18px 40px -18px rgb(27 28 32 / 0.6);
  }
  @media (min-width: 1024px) {
    .estimate-bar {
      display: none;
    }
  }
</style>
