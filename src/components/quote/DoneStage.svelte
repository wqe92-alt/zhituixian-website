<script lang="ts">
  import Icon from '../Icon.svelte';
  import { url } from '../../lib/url';
  import { supportConfig } from '../../support/support.config';

  let { manual, onrestart }: { manual: boolean; onrestart: () => void } = $props();
</script>

<div class="rounded-[28px] bg-ink p-8 text-paper sm:p-12">
  <span class="grid size-14 place-items-center rounded-full bg-brand text-white"><Icon name="check" class="size-7" /></span>
  <h2 tabindex="-1" class="mt-8 text-[clamp(1.8rem,3.4vw,2.6rem)] text-paper outline-none">
    {manual ? '评估申请已提交' : '投保申请已提交'}
  </h2>
  <p class="mt-4 max-w-xl text-[1rem] leading-[1.9] text-paper/75">
    顾问会尽快与您联系{manual ? '，评估门店情况并给出报价' : '，确认门店信息并办理投保'}。如在线对话没有打开，您也可以直接致电
    <a class="font-semibold text-blush underline underline-offset-4" href={`tel:${supportConfig.phone.tel}`}>{supportConfig.phone.display}</a>。
  </p>
  <div class="mt-9 flex flex-wrap gap-3">
    <a href={url('/coverage')} class="btn btn-light">了解保障范围</a>
    <button type="button" class="btn border border-paper/25 text-paper hover:border-paper" onclick={onrestart}>为另一家门店测算</button>
  </div>
</div>
