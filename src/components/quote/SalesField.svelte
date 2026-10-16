<script lang="ts">
  import Icon from '../Icon.svelte';
  import { levelLabel } from '../../lib/factors';
  import type { Quote } from '../../lib/engine';
  import { yuan } from '../../lib/format';

  let {
    sales = $bindable(),
    units = $bindable(),
    q,
    bandChosen,
    invalidSales = false,
    invalidUnits = false,
  }: {
    sales: number | null;
    units: number | null;
    q: Quote;
    bandChosen: boolean;
    invalidSales?: boolean;
    invalidUnits?: boolean;
  } = $props();

  const hasBoth = $derived(Number(sales) > 0 && Number(units) > 0);
  const bandLabel = $derived(levelLabel('price_band', q.input.price_band));
</script>

<div class="form-field">
  <p class="serif text-[1.08rem] font-semibold text-ink">经营规模</p>
  <p class="mt-1 text-[0.8rem] text-ink-2">按近三个月的平均值填写。保费按当月销售额计算。</p>
  <div class="mt-4 grid gap-4 sm:grid-cols-2">
    <div>
      <label class="field-label" for="f-sales">月销售额</label>
      <div class="relative">
        <input
          id="f-sales"
          type="number"
          inputmode="numeric"
          min="1"
          step="1000"
          placeholder="例如 190000"
          bind:value={sales}
          aria-invalid={invalidSales ? 'true' : undefined}
          class="field-input num pr-10 text-lg"
        />
        <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[0.9rem] text-ink-2">元</span>
      </div>
      {#if invalidSales}<p class="field-error">请填写月销售额</p>{/if}
    </div>
    <div>
      <label class="field-label" for="f-units">月销量</label>
      <div class="relative">
        <input
          id="f-units"
          type="number"
          inputmode="numeric"
          min="1"
          step="1"
          placeholder="例如 140"
          bind:value={units}
          aria-invalid={invalidUnits ? 'true' : undefined}
          class="field-input num pr-10 text-lg"
        />
        <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[0.9rem] text-ink-2">件</span>
      </div>
      {#if invalidUnits}<p class="field-error">请填写月销量</p>{/if}
    </div>
  </div>

  {#if hasBoth && bandChosen}
    <p
      class={[
        'mt-4 flex items-start gap-2 rounded-2xl px-4 py-3 text-[0.86rem] leading-relaxed',
        q.bandFit === 'ok' ? 'bg-paper-2 text-ink-2' : 'bg-amber/15 text-[#6b4510]',
      ]}
      aria-live="polite"
    >
      <Icon name={q.bandFit === 'ok' ? 'check' : 'info'} class="mt-0.5 size-4 shrink-0" />
      <span>
        件均价约 {yuan(q.avgPrice)} 元。
        {#if q.bandFit === 'ok'}
          与您选择的主力商品单价一致。
        {:else}
          与您选择的主力商品单价（{bandLabel}）差别较大，请核对销售额和销量。
        {/if}
      </span>
    </p>
  {/if}
</div>
