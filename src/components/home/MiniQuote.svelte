<script lang="ts">
  import AnimatedNumber from '../AnimatedNumber.svelte';
  import Icon from '../Icon.svelte';
  import { quote, TYPICAL_INPUT } from '../../lib/engine';
  import { CLOTHING_CODES, FACTOR_BY_KEY, type ClothingType } from '../../lib/factors';
  import { yuan } from '../../lib/format';
  import { url } from '../../lib/url';

  const levels = FACTOR_BY_KEY.clothing_type.levels;
  const avgPrice = TYPICAL_INPUT.monthlySalesYuan / TYPICAL_INPUT.monthlyUnits;

  let picked = $state<ClothingType[]>([...TYPICAL_INPUT.clothing_type]);
  let sales = $state(TYPICAL_INPUT.monthlySalesYuan);

  const safeSales = $derived(Math.min(5_000_000, Math.max(1_000, Number(sales) || 0)));
  const q = $derived(
    picked.length
      ? quote({
          ...TYPICAL_INPUT,
          clothing_type: picked,
          monthlySalesYuan: safeSales,
          monthlyUnits: Math.max(1, Math.round(safeSales / avgPrice)),
        })
      : null,
  );
  const href = $derived(`${url('/quote')}?ct=${picked.join('')}&s=${Math.round(safeSales)}`);

  function toggle(v: ClothingType, on: boolean) {
    const next = on ? [...picked, v] : picked.filter((x) => x !== v);
    picked = CLOTHING_CODES.filter((c) => next.includes(c));
  }
</script>

<div class="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
  <div class="space-y-8">
    <fieldset>
      <legend class="mb-3 text-[0.88rem] font-semibold text-ink">主营品类 <span class="ml-1 font-normal text-ink-2">可多选</span></legend>
      <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2">
        {#each levels as l (l.v)}
          {@const code = l.v as ClothingType}
          <label class="opt">
            <input type="checkbox" checked={picked.includes(code)} onchange={(e) => toggle(code, e.currentTarget.checked)} class="sr-only" />
            <span class="opt-body items-center">
              <span class="opt-mark is-square !mt-0" aria-hidden="true"><Icon name="check" class="size-3" /></span>
              <span class="whitespace-nowrap text-[0.92rem] font-semibold text-ink">{l.label}</span>
            </span>
          </label>
        {/each}
      </div>
    </fieldset>

    <div>
      <label for="mq-sales" class="mb-3 flex items-baseline justify-between text-[0.88rem] font-semibold text-ink">
        <span>月销售额</span>
        <span class="flex items-baseline gap-1">
          <input
            id="mq-sales"
            type="number"
            inputmode="numeric"
            min="1000"
            step="1000"
            bind:value={sales}
            class="num w-32 rounded-lg border hairline bg-white/70 px-2 py-1 text-right text-lg text-ink"
          />
          <span class="font-normal text-ink-2">元</span>
        </span>
      </label>
      <input type="range" min="10000" max="600000" step="10" bind:value={sales} aria-label="月销售额" class="range w-full" />
      <div class="mt-1 flex justify-between text-[0.72rem] text-ink-2"><span>1 万元</span><span>60 万元</span></div>
    </div>

    <p class="text-[0.8rem] leading-relaxed text-ink-2">其余信息先按常见门店估算。完整测算会根据您门店的位置、销售方式、退货政策等给出准确报价。</p>
  </div>

  <div class="relative overflow-hidden rounded-[22px] bg-ink p-7 text-paper sm:p-8" aria-live="polite">
    <p class="eyebrow !text-blush">预估月保费 · 常规月</p>
    {#if q}
      <p class="num mt-4 text-[clamp(2.8rem,6vw,4.2rem)] leading-none">
        <span class="mr-1 text-[0.45em] text-paper/60">¥</span><AnimatedNumber value={q.premium.regular} format={yuan} />
        <span class="ml-1 text-[0.32em] text-paper/60">/ 月</span>
      </p>
      <dl class="mt-7 grid grid-cols-2 gap-4 border-t border-paper/15 pt-6 text-[0.85rem]">
        <div>
          <dt class="text-paper/60">换季月（3、4、9、10 月）</dt>
          <dd class="num mt-1 text-xl">¥<AnimatedNumber value={q.premium.season} format={yuan} /></dd>
        </div>
        <div>
          <dt class="text-paper/60">开通数据换利后</dt>
          <dd class="num mt-1 text-xl text-blush">¥<AnimatedNumber value={q.discounted.regular} format={yuan} /></dd>
        </div>
      </dl>
    {:else}
      <p class="mt-6 text-[0.95rem] text-paper/75">请选择至少一个主营品类。</p>
    {/if}
    <a href={href} class={['btn btn-primary mt-8 w-full', !q && 'pointer-events-none opacity-50']} aria-disabled={!q}>
      完整测算 <Icon name="arrow-right" class="arrow size-4" />
    </a>
    <p class="mt-3 text-center text-[0.74rem] text-paper/55">报价包含每月免赔额 1,100 元和单月赔付不封顶的保障</p>
  </div>
</div>
