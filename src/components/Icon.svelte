<script lang="ts">
  import { ICONS, type IconName } from '../lib/icons';

  let { name, class: cls = 'size-5' }: { name: IconName; class?: string } = $props();
</script>

<svg
  class={cls}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d={ICONS[name]} />
</svg>
