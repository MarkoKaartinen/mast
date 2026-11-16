<script lang="ts">
  import { CircleAlert, Plus, Users, X } from '@lucide/svelte';
  import { accountColorClass } from '$lib/accountColor';
  import { accountStore, addAccount, needsRelogin, removeAccount } from '$lib/accounts.svelte';
  import { COLUMN_TITLES, feedStore } from '$lib/feeds.svelte';
  import { t } from '$lib/i18n';
  import { safeHttpUrl } from '$lib/url';

  let open = $state(false);
  let server = $state('');
  let busy = $state(false);
  let adding = $state(false);
  let root: HTMLElement | undefined = $state();

  // 401 means the server no longer accepts the token (revoked or expired)
  const expired = (key: string) => feedStore.failed[key]?.some((f) => f.status === '401') ?? false;
  const problems = $derived(accountStore.list.filter((a) => feedStore.failed[a.key] || needsRelogin(a)).length);
  // With no accounts the form is the only thing to do, so it is always shown
  const showForm = $derived(adding || accountStore.list.length === 0);

  // Open by itself when there is nothing else to do yet
  $effect(() => {
    if (accountStore.ready && accountStore.list.length === 0) open = true;
  });

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    busy = true;
    await addAccount(server);
    busy = false;
  }

  function remove(account: (typeof accountStore.list)[number]) {
    if (confirm(t('confirmRemove'))) void removeAccount(account);
  }

  const errorText = $derived(
    accountStore.error === 'invalidInstance'
      ? t('errorInvalidInstance')
      : accountStore.error === 'loginFailed'
        ? t('errorLoginFailed')
        : '',
  );

  function detail(key: string): string {
    const failures = feedStore.failed[key] ?? [];
    const list = failures.map((f) => `${t(COLUMN_TITLES[f.column])}: ${f.status}`).join(', ');
    return `${t('loadFailed')} (${list})${failures.some((f) => f.status === '429') ? '. ' + t('rateLimitedHint') : ''}`;
  }
</script>

<svelte:window
  onkeydown={(e) => e.key === 'Escape' && (open = false)}
  onpointerdown={(e) => root && !root.contains(e.target as Node) && (open = false)}
/>

<div class="menu" bind:this={root}>
  <button type="button" class="trigger" aria-expanded={open} aria-haspopup="dialog" title={t('accounts')} aria-label={t('accounts')} onclick={() => (open = !open)}>
    <Users size={18} aria-hidden="true" />
    {#if accountStore.list.length}<span class="count">{accountStore.list.length}</span>{/if}
    {#if problems}<span class="problem" aria-hidden="true"></span>{/if}
  </button>

  {#if open}
    <section class="panel" aria-label={t('accounts')}>
      <h2>{t('accounts')}</h2>
      <ul>
        {#each accountStore.list as account (account.key)}
          <li class={accountColorClass(account.key)}>
            {#if safeHttpUrl(account.avatar)}
              <img src={safeHttpUrl(account.avatar)} alt="" width="32" height="32" />
            {/if}
            <span class="name">
              <strong>{account.displayName}</strong>
              <small>{account.acct}</small>
            </span>
            {#if feedStore.failed[account.key]}
              <span class="failed" title={detail(account.key)}><CircleAlert size={16} aria-label={t('loadFailed')} /></span>
            {/if}
            {#if needsRelogin(account) || expired(account.key)}
              <button type="button" class="warn" title={needsRelogin(account) ? t('loginAgainHint') : t('loginExpiredHint')} onclick={() => addAccount(account.instance)}>
                {t('loginAgain')}
              </button>
            {/if}
            <button type="button" class="icon" title={t('remove')} aria-label={t('remove')} onclick={() => remove(account)}>
              <X size={16} aria-hidden="true" />
            </button>
          </li>
        {/each}
      </ul>

      {#if showForm}
        <form onsubmit={submit}>
          <label>
            <span>{t('serverLabel')}</span>
            <input bind:value={server} placeholder={t('serverPlaceholder')} autocapitalize="none" autocomplete="off" spellcheck="false" required />
          </label>
          <button type="submit" class="primary" disabled={busy}>{t('connect')}</button>
        </form>
      {:else}
        <button type="button" class="primary" onclick={() => (adding = true)}><Plus size={16} aria-hidden="true" /> {t('addAccount')}</button>
      {/if}
      {#if errorText}<p class="error" role="alert">{errorText}</p>{/if}
    </section>
  {/if}
</div>

<style>
  .menu {
    position: relative;
  }
  .trigger {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.5rem;
    background: none;
    border: 0;
    border-radius: 0.4rem;
    color: var(--ctp-subtext0);
  }
  .trigger:hover,
  .trigger[aria-expanded='true'] {
    background: var(--ctp-surface0);
    color: var(--ctp-text);
  }
  .count {
    font-size: 0.8rem;
  }
  .problem {
    position: absolute;
    top: 0.2rem;
    right: 0.2rem;
    width: 0.5rem;
    height: 0.5rem;
    background: var(--ctp-red);
    border-radius: 50%;
  }
  .panel {
    position: absolute;
    right: 0;
    top: calc(100% + 0.4rem);
    z-index: 10;
    width: min(24rem, calc(100vw - 2rem));
    padding: 0.75rem;
    background: var(--ctp-mantle);
    border: 1px solid var(--ctp-surface1);
    border-radius: 0.6rem;
    box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 0.5);
  }
  h2 {
    margin: 0 0 0.6rem;
    font-size: 0.9rem;
    color: var(--ctp-subtext0);
    font-weight: 600;
  }
  ul {
    list-style: none;
    margin: 0 0 0.75rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.5rem;
    background: var(--ctp-surface0);
    border-left: 3px solid var(--account);
    border-radius: 0.4rem;
  }
  img {
    border-radius: 50%;
  }
  .name {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }
  .name > * {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  small {
    color: var(--ctp-subtext0);
  }
  form {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: end;
  }
  label {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    font-size: 0.85rem;
    color: var(--ctp-subtext0);
  }
  input {
    padding: 0.4rem 0.6rem;
    background: var(--ctp-base);
    color: var(--ctp-text);
    border: 1px solid var(--ctp-surface1);
    border-radius: 0.4rem;
    font: inherit;
  }
  .primary {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.4rem 0.8rem;
    background: var(--ctp-mauve);
    color: var(--ctp-crust);
    border: 0;
    border-radius: 0.4rem;
  }
  .primary:disabled {
    opacity: 0.6;
  }
  .icon {
    padding: 0.2rem;
    background: none;
    border: 0;
    border-radius: 0.3rem;
    color: var(--ctp-subtext0);
  }
  .icon:hover {
    color: var(--ctp-red);
  }
  .warn {
    padding: 0.2rem 0.5rem;
    background: var(--ctp-peach);
    color: var(--ctp-crust);
    border: 0;
    border-radius: 0.4rem;
    font-size: 0.8rem;
  }
  .failed {
    display: inline-flex;
    color: var(--ctp-red);
  }
  .error {
    margin: 0.5rem 0 0;
    color: var(--ctp-red);
  }
</style>
