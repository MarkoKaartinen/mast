<script lang="ts">
  import { CircleAlert, Plus, Users, X } from '@lucide/svelte';
  import { accountColorClass } from '$lib/accountColor';
  import { accountStore, addAccount, needsRelogin, removeAccount } from '$lib/accounts.svelte';
  import { COLUMN_TITLES, feedStore, forgetAccount } from '$lib/feeds.svelte';
  import { t } from '$lib/i18n';
  import { safeHttpUrl } from '$lib/url';
  import ConnectForm from './ConnectForm.svelte';

  let open = $state(false);
  const accountKeys = $derived(accountStore.list.map((a) => a.key));
  let adding = $state(false);
  let root: HTMLElement | undefined = $state();

  // 401 means the server no longer accepts the token (revoked or expired)
  const expired = (key: string) => feedStore.failed[key]?.some((f) => f.status === '401') ?? false;
  const problems = $derived(accountStore.list.filter((a) => feedStore.failed[a.key] || needsRelogin(a)).length);
  function remove(account: (typeof accountStore.list)[number]) {
    if (confirm(t('confirmRemove'))) void removeAccount(account).then(() => forgetAccount(account.key));
  }

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
  <button type="button" class="trigger touch-target" aria-expanded={open} aria-haspopup="dialog" title={t('accounts')} aria-label={t('accounts')} onclick={() => (open = !open)}>
    <Users size={18} aria-hidden="true" />
    {#if accountStore.list.length}<span class="count">{accountStore.list.length}</span>{/if}
    {#if problems}<span class="problem" aria-hidden="true"></span>{/if}
  </button>

  {#if open}
    <section class="panel" aria-label={t('accounts')}>
      <h2>{t('accounts')}</h2>
      <ul>
        {#each accountStore.list as account (account.key)}
          <li class={accountColorClass(account.key, accountKeys)}>
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
            <button type="button" class="icon touch-target" title={t('remove')} aria-label={t('remove')} onclick={() => remove(account)}>
              <X size={16} aria-hidden="true" />
            </button>
          </li>
        {/each}
      </ul>

      {#if adding}
        <ConnectForm />
      {:else}
        <button type="button" class="primary" onclick={() => (adding = true)}><Plus size={16} aria-hidden="true" /> {t('addAccount')}</button>
      {/if}
      <p class="version">{t('appName')} · {t('version')} {__APP_VERSION__}</p>
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
  .version {
    margin: 0.75rem 0 0;
    padding-top: 0.5rem;
    border-top: 1px solid var(--ctp-surface0);
    font-size: 0.75rem;
    color: var(--ctp-overlay1);
  }
</style>
