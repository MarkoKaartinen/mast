<script lang="ts">
  import { CircleAlert, Plus, X } from '@lucide/svelte';
  import { accountStore, addAccount, needsRelogin, removeAccount } from '$lib/accounts.svelte';
  import { COLUMN_TITLES, feedStore } from '$lib/feeds.svelte';
  import { t } from '$lib/i18n';
  import { safeHttpUrl } from '$lib/url';

  let server = $state('');
  let busy = $state(false);
  let adding = $state(false);
  // With no accounts the form is the only thing to do, so it is always shown
  const showForm = $derived(adding || accountStore.list.length === 0);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    busy = true;
    await addAccount(server);
    busy = false;
  }

  const errorText = $derived(
    accountStore.error === 'invalidInstance'
      ? t('errorInvalidInstance')
      : accountStore.error === 'loginFailed'
        ? t('errorLoginFailed')
        : '',
  );
</script>

<section class="accounts" aria-label={t('accounts')}>
  <ul>
    {#each accountStore.list as account (account.key)}
      <li>
        {#if safeHttpUrl(account.avatar)}
          <img src={safeHttpUrl(account.avatar)} alt="" width="28" height="28" />
        {/if}
        <span class="name">
          <strong>{account.displayName}</strong>
          <small>{account.acct}</small>
        </span>
        {#if feedStore.failed[account.key]}
          {@const detail = feedStore.failed[account.key].map((f) => `${t(COLUMN_TITLES[f.column])}: ${f.status}`).join(', ')}
          <span class="failed" title={`${t('loadFailed')} (${detail})`}><CircleAlert size={16} aria-label={t('loadFailed')} /></span>
        {/if}
        {#if needsRelogin(account)}
          <button type="button" class="warn" title={t('loginAgainHint')} onclick={() => addAccount(account.instance)}>
            {t('loginAgain')}
          </button>
        {/if}
        <button type="button" class="icon" title={t('remove')} aria-label={t('remove')} onclick={() => removeAccount(account)}>
          <X size={16} />
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
      <button type="submit" disabled={busy}>{t('connect')}</button>
    </form>
  {:else}
    <button type="button" onclick={() => (adding = true)}><Plus size={16} /> {t('addAccount')}</button>
  {/if}
  {#if errorText}<p class="error" role="alert">{errorText}</p>{/if}
</section>

<style>
  .accounts {
    padding: 0.75rem 1rem;
    background: var(--ctp-mantle);
    border-bottom: 1px solid var(--ctp-surface0);
  }
  ul {
    list-style: none;
    margin: 0 0 0.5rem;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: var(--ctp-surface0);
    border-radius: 0.5rem;
  }
  img {
    border-radius: 50%;
  }
  .name {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
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
  input:focus-visible {
    outline: 2px solid var(--ctp-mauve);
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.4rem 0.8rem;
    background: var(--ctp-mauve);
    color: var(--ctp-crust);
    border: 0;
    border-radius: 0.4rem;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.6;
    cursor: default;
  }
  button.icon {
    padding: 0.2rem;
    background: none;
    color: var(--ctp-subtext0);
  }
  button.warn {
    background: var(--ctp-peach);
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
