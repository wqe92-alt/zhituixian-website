<script lang="ts">
  import { tick } from 'svelte';
  import { fly } from 'svelte/transition';
  import Icon from '../Icon.svelte';
  import ChoiceField from './ChoiceField.svelte';
  import MultiChoiceField from './MultiChoiceField.svelte';
  import SalesField from './SalesField.svelte';
  import { FACTOR_BY_KEY, type SingleKey } from '../../lib/factors';
  import type { Quote } from '../../lib/engine';
  import { FIELD_LABEL, SECTIONS, missingIn, type FieldKey, type Form } from './form';

  let {
    form = $bindable(),
    section = $bindable(0),
    q,
    ondone,
  }: { form: Form; section: number; q: Quote; ondone: () => void } = $props();

  let tried = $state(SECTIONS.map(() => false));
  let root: HTMLElement | undefined = $state();
  const missing = $derived(missingIn(form, section));
  const invalid = (f: FieldKey) => tried[section] && missing.includes(f);
  const last = SECTIONS.length - 1;

  const getSingle = (f: FieldKey) => form[f as SingleKey] as string | null;
  function setSingle(f: FieldKey, v: string) {
    (form as unknown as Record<string, unknown>)[f] = v;
  }

  async function show(i: number) {
    section = i;
    await tick();
    const top = (root?.getBoundingClientRect().top ?? 0) + window.scrollY - 120;
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
    root?.querySelector<HTMLElement>('h2[tabindex="-1"]')?.focus({ preventScroll: true });
  }

  async function next() {
    if (missing.length) {
      tried[section] = true;
      await tick();
      root?.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (section < last) void show(section + 1);
    else ondone();
  }

  const reachable = (i: number) => i <= section || SECTIONS.slice(0, i).every((_, k) => missingIn(form, k).length === 0);
</script>

<div bind:this={root}>
  <ol class="no-print grid grid-cols-3 gap-3" aria-label="门店信息">
    {#each SECTIONS as s, i (s.title)}
      {@const done = i < section || (i !== section && missingIn(form, i).length === 0)}
      <li>
        <button
          type="button"
          class="group w-full text-left disabled:cursor-default"
          disabled={!reachable(i)}
          aria-current={i === section ? 'step' : undefined}
          onclick={() => show(i)}
        >
          <span class={['block h-1 rounded-full transition', i === section ? 'bg-brand' : done ? 'bg-brand/40' : 'bg-paper-3']}></span>
          <span class={['mt-2.5 flex items-center gap-1.5 text-[0.84rem]', i === section ? 'font-semibold text-ink' : 'text-ink-2']}>
            {#if done && i !== section}<Icon name="check" class="size-3.5 text-brand" />{/if}{s.title}
          </span>
        </button>
      </li>
    {/each}
  </ol>

  <h2 tabindex="-1" class="mt-10 text-[clamp(1.6rem,2.8vw,2.1rem)] leading-tight outline-none">{SECTIONS[section].title}</h2>

  {#key section}
    <div class="mt-7" in:fly={{ y: 14, duration: 320 }}>
      {#each SECTIONS[section].fields as f (f)}
        {#if f === 'clothing_type'}
          <MultiChoiceField def={FACTOR_BY_KEY.clothing_type} value={form.clothing_type} invalid={invalid(f)} onchange={(v) => (form.clothing_type = v)} />
        {:else if f === 'monthlySalesYuan'}
          <SalesField
            bind:sales={form.monthlySalesYuan}
            bind:units={form.monthlyUnits}
            {q}
            bandChosen={form.price_band != null}
            invalidSales={invalid('monthlySalesYuan')}
            invalidUnits={invalid('monthlyUnits')}
          />
        {:else if f !== 'monthlyUnits'}
          <ChoiceField def={FACTOR_BY_KEY[f as SingleKey]} value={getSingle(f)} invalid={invalid(f)} onchange={(v) => setSingle(f, v)} />
        {/if}
      {/each}
    </div>
  {/key}

  {#if tried[section] && missing.length}
    <p class="mt-6 rounded-2xl bg-brand-soft/70 px-4 py-3 text-[0.86rem] text-brand-deep" role="alert">
      请完成：{missing.map((f) => FIELD_LABEL[f]).join('、')}
    </p>
  {/if}

  <div class="mt-8 flex items-center justify-between gap-3 border-t hairline pt-6">
    <button type="button" class="btn btn-ghost" onclick={() => show(section - 1)} disabled={section === 0}>
      <Icon name="arrow-left" class="size-4" /> 上一步
    </button>
    <button type="button" class={['btn', section === last ? 'btn-primary' : 'btn-ink']} onclick={next}>
      {section === last ? '查看报价' : '下一步'} <Icon name="arrow-right" class="arrow size-4" />
    </button>
  </div>
</div>
