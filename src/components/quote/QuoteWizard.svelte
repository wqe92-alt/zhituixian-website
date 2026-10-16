<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Stepper from './Stepper.svelte';
  import ProfileStage from './ProfileStage.svelte';
  import LiveEstimate from './LiveEstimate.svelte';
  import ResultStage from './ResultStage.svelte';
  import TermsStage from './TermsStage.svelte';
  import IntentStage from './IntentStage.svelte';
  import DoneStage from './DoneStage.svelte';
  import HelpAside from './HelpAside.svelte';
  import { quote } from '../../lib/engine';
  import { decodeInput, encodeInput, parseTypes } from '../../lib/share';
  import { emptyForm, formFromInput, toInput, type Form } from './form';

  type Stage = 'profile' | 'result' | 'terms' | 'intent' | 'done';
  const STEP_OF: Record<Stage, number> = { profile: 0, result: 1, terms: 2, intent: 3, done: 4 };

  let stage = $state<Stage>('profile');
  let section = $state(0);
  let form = $state<Form>(emptyForm());
  let discount = $state(false);
  let shared = $state(false);
  let root: HTMLElement | undefined = $state();

  const input = $derived(toInput(form));
  const q = $derived(quote(input));

  onMount(() => {
    const params = new URLSearchParams(location.search);
    const full = decodeInput(params.get('q'));
    if (full) {
      form = formFromInput(full);
      discount = params.get('d') === '1';
      shared = true;
      stage = 'result';
      return;
    }
    const types = parseTypes(params.get('ct'));
    if (types?.length) form.clothing_type = types;
    const s = Number(params.get('s'));
    if (s > 0) form.monthlySalesYuan = s;
  });

  async function setStage(s: Stage) {
    stage = s;
    if (s === 'result') syncUrl();
    await tick();
    const top = (root?.getBoundingClientRect().top ?? 0) + window.scrollY - 120;
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
    root?.querySelector<HTMLElement>('h2[tabindex="-1"]')?.focus({ preventScroll: true });
  }

  function syncUrl() {
    const u = new URL(location.href);
    u.search = '';
    u.searchParams.set('q', encodeInput(input));
    if (discount) u.searchParams.set('d', '1');
    history.replaceState(null, '', u);
  }

  function edit() {
    shared = false;
    section = 0;
    void setStage('profile');
  }

  function restart() {
    form = emptyForm();
    discount = false;
    shared = false;
    section = 0;
    history.replaceState(null, '', location.pathname);
    void setStage('profile');
  }

  $effect(() => {
    // 结果页切换数据换利时同步到报价链接
    const d = discount;
    if (stage !== 'result') return;
    const u = new URL(location.href);
    if (d) u.searchParams.set('d', '1');
    else u.searchParams.delete('d');
    history.replaceState(null, '', u);
  });
</script>

<div bind:this={root} class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-14">
  <div class="min-w-0">
    <Stepper current={STEP_OF[stage]} />

    {#if stage === 'profile'}
      <ProfileStage bind:form bind:section {q} ondone={() => setStage('result')} />
    {:else if stage === 'result'}
      <ResultStage
        {q}
        bind:discount
        {shared}
        oncontinue={() => setStage('terms')}
        onapply={() => setStage('intent')}
        onedit={edit}
        onrestart={restart}
      />
    {:else if stage === 'terms'}
      <TermsStage policy={input.policy} onback={() => setStage('result')} onnext={() => setStage('intent')} />
    {:else if stage === 'intent'}
      <IntentStage {q} {discount} onback={() => setStage(q.manualReview ? 'result' : 'terms')} ondone={() => setStage('done')} />
    {:else}
      <DoneStage manual={q.manualReview} onrestart={restart} />
    {/if}
  </div>

  {#if stage === 'profile'}
    <LiveEstimate {q} {form} />
  {:else}
    <HelpAside />
  {/if}
</div>
