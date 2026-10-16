<script lang="ts">
  // 一个月的赔付示例：勾选或取消几笔退货，查看当月赔付的变化
  import model from '../../data/model.json';
  import { num, yuan } from '../../lib/format';

  const D = model.pricing.deductible;
  const RATE = 5.8;

  const items = [
    { name: '羊绒大衣', price: 3980, n: 1 },
    { name: '连衣裙', price: 1280, n: 2 },
    { name: '西装套装', price: 4600, n: 1 },
    { name: '针织开衫', price: 680, n: 3 },
    { name: '羽绒服', price: 2580, n: 2 },
    { name: '风衣', price: 1980, n: 4 },
    { name: '真丝衬衫', price: 3280, n: 2 },
    { name: '休闲西裤', price: 1580, n: 3 },
  ];

  let on = $state(items.map(() => true));
  const loss = (i: number) => (items[i].price * RATE * items[i].n) / 100;
  const total = $derived(items.reduce((s, _, i) => s + (on[i] ? loss(i) : 0), 0));
  const payout = $derived(Math.max(0, total - D));
  const scaleMax = 2600;
</script>

<div class="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
  <div class="overflow-x-auto rounded-[20px] border hairline bg-white/60">
    <table class="data-table min-w-[30rem]">
      <thead>
        <tr>
          <th class="w-10"><span class="sr-only">计入本月</span></th>
          <th>退货商品</th>
          <th class="n">售价 × 赔付比例 × 件数</th>
          <th class="n">核定损失</th>
        </tr>
      </thead>
      <tbody>
        {#each items as it, i (it.name)}
          <tr class={on[i] ? '' : 'opacity-40'}>
            <td><input type="checkbox" bind:checked={on[i]} aria-label={`计入${it.name}`} class="size-4 accent-[var(--color-brand)]" /></td>
            <td class="text-ink">{it.name}</td>
            <td class="n text-ink-2">¥{yuan(it.price)} × {RATE}% × {it.n}</td>
            <td class="n font-semibold text-ink">¥{num(loss(i))}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="flex flex-col gap-4">
    <div class="rounded-[20px] bg-ink p-6 text-paper" aria-live="polite">
      <p class="text-[0.8rem] text-paper/60">本月核定损失合计</p>
      <p class="num mt-1 text-[2.4rem] leading-none">¥{num(total)}</p>
      <div class="relative mt-5 h-3 rounded-full bg-paper/15" aria-hidden="true">
        <div class="absolute inset-y-0 left-0 rounded-full bg-lilac" style={`width:${(Math.min(total, D) / scaleMax) * 100}%`}></div>
        {#if total > D}
          <div
            class="absolute inset-y-0 rounded-r-full bg-brand"
            style={`left:${(D / scaleMax) * 100}%;width:${(Math.min(total - D, scaleMax - D) / scaleMax) * 100}%`}
          ></div>
        {/if}
        <div class="absolute -top-1.5 h-6 w-0.5 bg-paper" style={`left:${(D / scaleMax) * 100}%`}></div>
      </div>
      <p class="mt-2 text-[0.72rem] text-paper/60">白线为每月免赔额 ¥{yuan(D)}</p>
      <div class="mt-5 flex items-baseline justify-between border-t border-paper/15 pt-4">
        <span class="text-[0.9rem] font-semibold">本月赔付</span>
        <span class="num text-[2rem] text-blush">¥{num(payout)}</span>
      </div>
      <p class="mt-2 text-[0.78rem] text-paper/60">= 核定损失合计 − 每月免赔额 ¥{yuan(D)}</p>
    </div>
    <p class="text-[0.78rem] leading-relaxed text-ink-2">
      示例按赔付比例 {RATE}% 计算。实际赔付比例按您门店的商品类别和价格确定，一般为 3%–8%。
    </p>
  </div>
</div>
