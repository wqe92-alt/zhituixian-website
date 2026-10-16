<script lang="ts">
  import Icon from '../Icon.svelte';
  import type { Quote } from '../../lib/engine';
  import { pct, yuan } from '../../lib/format';
  import { quoteSummaryLines } from '../../lib/summary';
  import { openSupport } from '../../support';

  let { q, discount, onback, ondone }: { q: Quote; discount: boolean; onback: () => void; ondone: () => void } = $props();

  let store = $state('');
  let name = $state('');
  let phone = $state('');
  let city = $state('');
  let note = $state('');
  let consent = $state(false);
  let tried = $state(false);
  let sending = $state(false);

  const manual = $derived(q.manualReview);
  const phoneOk = $derived(/^1\d{10}$/.test(phone.replace(/[\s-]/g, '')));
  const valid = $derived(store.trim() !== '' && name.trim() !== '' && phoneOk && consent);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    tried = true;
    if (!valid) return;
    sending = true;
    const lines = quoteSummaryLines(q, discount, location.href);
    if (note.trim()) lines.push(`补充说明：${note.trim()}`);
    await openSupport({
      kind: 'intent',
      title: manual ? '报价评估申请' : '投保申请',
      contact: { store: store.trim(), name: name.trim(), phone: phone.replace(/[\s-]/g, ''), city: city.trim() || undefined },
      lines,
    });
    sending = false;
    ondone();
  }
</script>

<div>
  <p class="eyebrow">提交申请</p>
  <h2 tabindex="-1" class="mt-4 text-[clamp(1.6rem,2.8vw,2.1rem)] leading-tight outline-none">
    {manual ? '填写联系信息' : '填写投保信息'}
  </h2>
  <p class="mt-3 max-w-2xl text-[0.94rem] leading-relaxed text-ink-2">
    {manual ? '提交后，顾问会尽快与您联系，评估门店情况并给出报价。' : '提交后，顾问会尽快与您联系，确认门店信息并办理投保。'}
  </p>

  {#if !manual}
    <div class="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-paper-2 px-5 py-4 text-[0.88rem]">
      <span class="text-ink-2">您的报价</span>
      <span class="num text-lg text-ink">¥{yuan(discount ? q.discounted.regular : q.premium.regular)} / 月</span>
      <span class="text-ink-2">约为月销售额的 {pct(q.ratePct.regular)}{discount ? ' · 已选择数据换利' : ''}</span>
    </div>
  {/if}

  <form class="mt-8 grid gap-5 sm:grid-cols-2" novalidate onsubmit={submit}>
    <div>
      <label class="field-label" for="f-store">门店名称 <span class="text-brand">*</span></label>
      <input id="f-store" class="field-input" bind:value={store} autocomplete="organization" aria-invalid={tried && !store.trim() ? 'true' : undefined} />
      {#if tried && !store.trim()}<p class="field-error">请填写门店名称</p>{/if}
    </div>
    <div>
      <label class="field-label" for="f-name">联系人 <span class="text-brand">*</span></label>
      <input id="f-name" class="field-input" bind:value={name} autocomplete="name" aria-invalid={tried && !name.trim() ? 'true' : undefined} />
      {#if tried && !name.trim()}<p class="field-error">请填写联系人</p>{/if}
    </div>
    <div>
      <label class="field-label" for="f-phone">手机号 <span class="text-brand">*</span></label>
      <input id="f-phone" class="field-input" type="tel" inputmode="tel" bind:value={phone} autocomplete="tel" aria-invalid={tried && !phoneOk ? 'true' : undefined} />
      {#if tried && !phoneOk}<p class="field-error">请填写 11 位手机号</p>{/if}
    </div>
    <div>
      <label class="field-label" for="f-city">所在城市</label>
      <input id="f-city" class="field-input" bind:value={city} autocomplete="address-level2" />
    </div>
    <div class="sm:col-span-2">
      <label class="field-label" for="f-note">补充说明</label>
      <textarea id="f-note" class="field-input min-h-28" bind:value={note} placeholder="例如：门店数量、方便联系的时间"></textarea>
    </div>
    <label class="flex items-start gap-3 text-[0.86rem] leading-relaxed text-ink-2 sm:col-span-2">
      <input type="checkbox" bind:checked={consent} class="mt-1 size-4 shrink-0 accent-[var(--color-brand)]" aria-invalid={tried && !consent ? 'true' : undefined} />
      <span>
        我同意将以上信息和报价发送给智退险顾问，用于联系我办理投保。
        {#if tried && !consent}<span class="field-error block">请勾选同意后提交</span>{/if}
      </span>
    </label>

    <div class="flex flex-wrap items-center justify-between gap-3 border-t hairline pt-6 sm:col-span-2">
      <button type="button" class="btn btn-ghost" onclick={onback}><Icon name="arrow-left" class="size-4" /> 上一步</button>
      <button type="submit" class="btn btn-primary" disabled={sending}>
        {sending ? '正在提交…' : manual ? '提交评估申请' : '提交投保申请'}
        <Icon name="arrow-right" class="arrow size-4" />
      </button>
    </div>
  </form>
</div>
