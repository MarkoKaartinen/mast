<script lang="ts">
  import { accountStore, addAccount } from '$lib/accounts.svelte';
  import { t } from '$lib/i18n';

  let server = $state('');
  let busy = $state(false);

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

<form onsubmit={submit}>
  <label>
    <span>{t('serverLabel')}</span>
    <input bind:value={server} placeholder={t('serverPlaceholder')} autocapitalize="none" autocomplete="off" spellcheck="false" required />
  </label>
  <button type="submit" class="primary" disabled={busy}>{t('connect')}</button>
</form>
{#if errorText}<p class="error" role="alert">{errorText}</p>{/if}

<style>
  form {
    text-align: left;
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
    padding: 0.4rem 0.8rem;
    background: var(--ctp-mauve);
    color: var(--ctp-crust);
    border: 0;
    border-radius: 0.4rem;
  }
  .primary:disabled {
    opacity: 0.6;
  }
  .error {
    margin: 0.5rem 0 0;
    color: var(--ctp-red);
  }
</style>
