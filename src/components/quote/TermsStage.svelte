<script lang="ts">
  import Icon from '../Icon.svelte';
  import { CONDITIONS_TEXT, EXCLUSIONS, PAYOUT_TEXT, POLICY_DOC_NAME, SCOPE_BY_POLICY } from '../../content/terms';
  import type { Tier3 } from '../../lib/factors';
  import { url } from '../../lib/url';

  let { policy, onback, onnext }: { policy: Tier3; onback: () => void; onnext: () => void } = $props();

  let agreed = $state(false);

  const blocks = $derived([
    { title: '保障范围', body: SCOPE_BY_POLICY[policy] },
    { title: '赔付方式', body: PAYOUT_TEXT },
    { title: '投保与理赔条件', body: CONDITIONS_TEXT },
  ]);
</script>

<div>
  <p class="eyebrow">确认条款</p>
  <h2 tabindex="-1" class="mt-4 text-[clamp(1.6rem,2.8vw,2.1rem)] leading-tight outline-none">保障说明</h2>
  <p class="mt-3 text-[0.94rem] leading-relaxed text-ink-2">投保前，请确认您已了解以下内容。</p>

  <dl class="mt-8 divide-y divide-line border-y hairline">
    {#each blocks as b (b.title)}
      <div class="grid gap-2 py-5 sm:grid-cols-[9rem_1fr] sm:gap-6">
        <dt class="font-semibold text-ink">{b.title}</dt>
        <dd class="text-[0.92rem] leading-[1.85] text-ink-2">{b.body}</dd>
      </div>
    {/each}
  </dl>

  <section class="mt-6 rounded-[20px] border border-brand/30 bg-brand-soft/50 p-6" aria-labelledby="exclusion-title">
    <p id="exclusion-title" class="flex items-center gap-2 font-semibold text-brand-deep">
      <Icon name="alert" class="size-5" /> 免责条款
    </p>
    <p class="mt-3 text-[0.9rem] text-ink">以下情形，保险人不承担赔偿责任：</p>
    <ol class="mt-2 list-decimal space-y-1.5 pl-5 text-[0.9rem] leading-relaxed text-ink marker:text-brand">
      {#each EXCLUSIONS as e (e)}<li>{e}</li>{/each}
    </ol>
    <p class="mt-3 text-[0.84rem] text-ink-2">存在欺诈行为的，保险人有权追回已支付的赔款。</p>
  </section>

  <p class="mt-5 text-[0.88rem]">
    <a class="link" href={url('/coverage#terms')} target="_blank" rel="noopener">查看完整保险条款</a>
  </p>

  <label class="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border hairline bg-white/60 p-4 text-[0.9rem] leading-relaxed text-ink">
    <input type="checkbox" bind:checked={agreed} class="mt-1 size-4 shrink-0 accent-[var(--color-brand)]" />
    <span>我已阅读并理解{POLICY_DOC_NAME}，特别是其中的免责条款。</span>
  </label>

  <div class="mt-8 flex flex-wrap items-center justify-between gap-3 border-t hairline pt-6">
    <button type="button" class="btn btn-ghost" onclick={onback}><Icon name="arrow-left" class="size-4" /> 返回报价</button>
    <button type="button" class="btn btn-primary" disabled={!agreed} onclick={onnext}>
      下一步：填写投保信息 <Icon name="arrow-right" class="arrow size-4" />
    </button>
  </div>
</div>
