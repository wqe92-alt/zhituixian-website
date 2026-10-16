<script lang="ts">
  import Icon from '../Icon.svelte';
  import type { FactorDef } from '../../lib/factors';

  let {
    def,
    value,
    invalid = false,
    onchange,
  }: { def: FactorDef; value: string | null; invalid?: boolean; onchange: (v: string) => void } = $props();

  const cols = $derived(
    def.levels.length >= 5 ? 'grid-cols-2 sm:grid-cols-3' : def.levels.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3',
  );
</script>

<fieldset class="form-field" data-field={def.key} aria-invalid={invalid ? 'true' : undefined}>
  <legend class="w-full">
    <span class="serif text-[1.08rem] font-semibold text-ink">{def.label}</span>
    {#if def.hint}<span class="ml-2 text-[0.8rem] text-ink-2">{def.hint}</span>{/if}
  </legend>
  <div class={`mt-3 grid gap-2.5 ${cols}`}>
    {#each def.levels as l (l.v)}
      <label class="opt">
        <input
          type="radio"
          name={`f-${def.key}`}
          value={l.v}
          checked={value === l.v}
          onchange={() => onchange(l.v)}
          class="sr-only"
        />
        <span class="opt-body">
          <span class="opt-mark" aria-hidden="true"><Icon name="check" class="size-3" /></span>
          <span class="min-w-0">
            <span class="block text-[0.94rem] font-semibold leading-snug text-ink">{l.label}</span>
            {#if l.hint}<span class="mt-0.5 block text-[0.78rem] leading-snug text-ink-2">{l.hint}</span>{/if}
          </span>
        </span>
      </label>
    {/each}
  </div>
  {#if invalid}<p class="field-error">请选择{def.label}</p>{/if}
</fieldset>
