<script lang="ts">
  import type { Quote } from '../../lib/engine';
  import { yuan } from '../../lib/format';

  let { q, discount }: { q: Quote; discount: boolean } = $props();

  const maxMonth = $derived(Math.max(...q.months.map((m) => m.premium)));
  const regular = $derived(discount ? q.discounted.regular : q.premium.regular);
  const season = $derived(discount ? q.discounted.season : q.premium.season);
</script>

<section class="card mt-5 p-6 sm:p-7" aria-labelledby="cal-title">
  <div class="flex flex-wrap items-baseline justify-between gap-3">
    <h3 id="cal-title" class="text-[1.15rem]">12 个月保费</h3>
    <p class="flex items-center gap-4 text-[0.78rem] text-ink-2">
      <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm bg-lilac"></span>常规月 ¥{yuan(regular)}</span>
      <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm bg-brand"></span>换季月 ¥{yuan(season)}</span>
    </p>
  </div>
  <ol class="mt-6 grid h-44 grid-cols-12 items-end gap-1.5 sm:gap-2.5">
    {#each q.months as m (m.month)}
      {@const v = discount ? m.discounted : m.premium}
      <li class="flex h-full flex-col items-center justify-end gap-1.5">
        <span class="hidden text-[0.66rem] text-ink-2 md:block">{yuan(v)}</span>
        <span
          class={['w-full rounded-t-md transition-[height] duration-500', m.seasonChange ? 'bg-brand' : 'bg-lilac']}
          style={`height:${(m.premium / maxMonth) * 78}%`}
          title={`${m.month} 月 ¥${yuan(v)}`}
        ></span>
        <span class={['text-[0.72rem]', m.seasonChange ? 'font-semibold text-brand' : 'text-ink-2']}>{m.month}月</span>
      </li>
    {/each}
  </ol>
  <p class="mt-4 text-[0.8rem] leading-relaxed text-ink-2">
    按您填写的月销售额估算，实际按当月销售额计算。3、4、9、10 月是换季月，退货更集中，按换季月费率计费。
  </p>
</section>
