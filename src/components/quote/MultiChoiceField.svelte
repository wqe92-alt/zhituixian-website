<script lang="ts">
  import Icon from '../Icon.svelte';
  import { CLOTHING_CODES, type ClothingType, type FactorDef } from '../../lib/factors';

  let {
    def,
    value,
    invalid = false,
    onchange,
  }: { def: FactorDef; value: ClothingType[]; invalid?: boolean; onchange: (v: ClothingType[]) => void } = $props();

  function toggle(v: ClothingType, on: boolean) {
    const next = on ? [...value, v] : value.filter((x) => x !== v);
    onchange(CLOTHING_CODES.filter((c) => next.includes(c)));
  }
</script>

<fieldset class="form-field" data-field={def.key} aria-invalid={invalid ? 'true' : undefined}>
  <legend class="w-full">
    <span class="serif text-[1.08rem] font-semibold text-ink">{def.label}</span>
    {#if def.hint}<span class="ml-2 text-[0.8rem] text-ink-2">{def.hint}</span>{/if}
  </legend>
  <div class="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
    {#each def.levels as l (l.v)}
      {@const code = l.v as ClothingType}
      <label class="opt">
        <input
          type="checkbox"
          value={l.v}
          checked={value.includes(code)}
          onchange={(e) => toggle(code, e.currentTarget.checked)}
          class="sr-only"
        />
        <span class="opt-body items-center">
          <span class="opt-mark is-square !mt-0" aria-hidden="true"><Icon name="check" class="size-3" /></span>
          <span class="whitespace-nowrap text-[0.94rem] font-semibold text-ink">{l.label}</span>
        </span>
      </label>
    {/each}
  </div>
  {#if invalid}<p class="field-error">请至少选择一个主营品类</p>{/if}
</fieldset>
