<script lang="ts">
  import Icon from '../Icon.svelte';
  import type { Quote } from '../../lib/engine';
  import { levelLabel } from '../../lib/factors';
  import { SCOPE_SHORT } from '../../content/terms';

  let { q }: { q: Quote } = $props();

  const items = $derived([
    ['每月免赔额 1,100 元', '每月核定损失扣除 1,100 元后，余额按笔赔付。'],
    ['单月赔付不封顶', '退货集中的月份按实际损失赔付，这部分保障已包含在保费中。'],
    [levelLabel('policy', q.input.policy), `保障${SCOPE_SHORT[q.input.policy]}。`],
    ['两个销售季', '春夏季 2 月 1 日至 8 月 31 日，秋冬季 9 月 1 日至次年 1 月 31 日，季末仍有退货宽限期。'],
    ['理赔材料', 'POS 收银记录、物流凭证（如有寄送）和门店验收记录。'],
  ]);
</script>

<section class="card mt-5 p-6 sm:p-7">
  <h3 class="text-[1.15rem]">报价包含的保障</h3>
  <ul class="mt-5 grid gap-x-8 gap-y-4 md:grid-cols-2">
    {#each items as [t, b] (t)}
      <li class="flex gap-3 text-[0.9rem] leading-relaxed">
        <Icon name="check" class="mt-1 size-4 shrink-0 text-brand" />
        <span><span class="font-semibold text-ink">{t}</span><span class="text-ink-2">：{b}</span></span>
      </li>
    {/each}
  </ul>
</section>
