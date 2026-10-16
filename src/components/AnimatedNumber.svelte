<script lang="ts">
  import { untrack } from 'svelte';
  import { Tween, prefersReducedMotion } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  let {
    value,
    format = (n: number) => String(Math.round(n)),
    duration = 550,
  }: { value: number; format?: (n: number) => string; duration?: number } = $props();

  const shown = new Tween(
    untrack(() => value),
    { easing: cubicOut },
  );

  $effect(() => {
    const target = value;
    shown.set(target, { duration: prefersReducedMotion.current ? 0 : duration });
  });
</script>

<span class="tabular-nums">{format(shown.current)}</span>
