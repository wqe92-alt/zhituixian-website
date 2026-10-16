<script lang="ts">
  import Icon from '../Icon.svelte';
  import { url } from '../../lib/url';
  import { supportConfig } from '../../support/support.config';
</script>

<aside class="no-print hidden self-start lg:sticky lg:top-28 lg:block">
  <div class="rounded-[24px] border hairline bg-white/50 p-6">
    <p class="eyebrow">顾问服务</p>
    <p class="serif mt-3 text-[1.2rem] font-semibold leading-snug">顾问可以协助您完成投保</p>
    <p class="mt-2 text-[0.85rem] leading-relaxed text-ink-2">条款理解、保费计算、数据回传等问题，都可以咨询。</p>
    <button type="button" class="btn btn-ink mt-5 w-full" data-open-support="报价咨询"><Icon name="chat" class="size-4" /> 联系顾问</button>
    <a class="mt-3 flex items-center justify-center gap-2 text-[0.85rem] text-ink-2 hover:text-ink" href={`tel:${supportConfig.phone.tel}`}>
      <Icon name="phone" class="size-4" />{supportConfig.phone.display}
    </a>
  </div>
  <a href={url('/pricing')} class="mt-4 flex items-center justify-between rounded-[20px] bg-paper-2 px-5 py-4 text-[0.86rem] text-ink hover:bg-paper-3/70">
    了解价格与优惠 <Icon name="arrow-right" class="size-4" />
  </a>
</aside>
