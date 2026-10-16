<script lang="ts">
  import Icon from '../Icon.svelte';
  import type { Quote } from '../../lib/engine';
  import { quoteSummaryLines } from '../../lib/summary';
  import { openSupport } from '../../support';

  let { q, onapply }: { q: Quote; onapply: () => void } = $props();

  function ask() {
    void openSupport({ kind: 'manual-review', title: '报价评估咨询', lines: quoteSummaryLines(q, false, location.href) });
  }
</script>

<div class="mt-8 rounded-[24px] border border-amber/60 bg-amber/10 p-7 sm:p-9">
  <Icon name="users" class="size-8 text-[#9a6418]" />
  <p class="serif mt-5 text-[1.45rem] font-semibold text-ink">顾问评估后为您报价</p>
  <p class="mt-4 max-w-2xl text-[0.95rem] leading-[1.9] text-ink-2">
    根据您填写的信息，门店的退货风险因素较多，系统暂时无法直接给出报价。顾问会结合门店的实际经营和退货记录进行评估，并为您提供正式报价。
  </p>
  <div class="no-print mt-7 flex flex-wrap gap-3">
    <button type="button" class="btn btn-primary" onclick={ask}><Icon name="chat" class="size-4" /> 联系顾问</button>
    <button type="button" class="btn btn-ghost" onclick={onapply}>提交评估申请</button>
  </div>
</div>
