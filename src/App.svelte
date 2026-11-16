<script lang="ts">
  import { RefreshCw } from '@lucide/svelte';
  import { onMount, untrack } from 'svelte';
  import { accountStore, initAccounts } from '$lib/accounts.svelte';
  import Accounts from '$lib/components/Accounts.svelte';
  import Column from '$lib/components/Column.svelte';
  import Logo from '$lib/components/Logo.svelte';
  import { COLUMN_ICONS } from '$lib/columnIcons';
  import { COLUMN_TITLES, COLUMNS, feedStore, refreshAll, startPolling, unreadCount } from '$lib/feeds.svelte';
  import { t } from '$lib/i18n';
  import type { ColumnId } from '$lib/unread';

  let active = $state<ColumnId>('interactions');

  onMount(() => {
    void initAccounts();
    return startPolling();
  });

  // Fetch whenever the set of accounts changes, including after the first load.
  // untrack: the refresh reads and writes its own loading state, which must not re-run this effect.
  $effect(() => {
    void accountStore.list.length;
    if (accountStore.ready) untrack(() => void refreshAll());
  });
</script>

<header class="bar">
  <h1><Logo size={32} /> {t('appName')}</h1>
  <div class="actions">
    <button type="button" class="refresh" class:spinning={feedStore.loading} disabled={feedStore.loading} title={t('refresh')} aria-label={t('refresh')} onclick={() => void refreshAll()}>
      <RefreshCw size={18} aria-hidden="true" />
    </button>
    <Accounts />
  </div>
</header>

<main class="columns">
  {#each COLUMNS as id (id)}
    <Column column={id} title={COLUMN_TITLES[id]} hasAccounts={accountStore.list.length > 0} active={id === active} />
  {/each}
</main>

<nav class="tabs" aria-label={t('appName')}>
  {#each COLUMNS as id (id)}
    {@const Icon = COLUMN_ICONS[id]}
    {@const unread = unreadCount(id)}
    <button type="button" class:active={id === active} aria-current={id === active} onclick={() => (active = id)}>
      <span class="icon">
        <Icon size={20} aria-hidden="true" />
        {#if unread > 0}<span class="dot" aria-label={`${unread} ${t('unread')}`}></span>{/if}
      </span>
      <span class="label">{t(COLUMN_TITLES[id])}</span>
    </button>
  {/each}
</nav>

<style>
  :global(#app) {
    display: flex;
    flex-direction: column;
  }
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(0.4rem + env(safe-area-inset-top)) 0.75rem 0.4rem;
    background: var(--ctp-mantle);
    border-bottom: 1px solid var(--ctp-surface0);
  }
  h1 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 1.05rem;
    color: var(--ctp-mauve);
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .refresh {
    display: inline-flex;
    padding: 0.35rem 0.5rem;
    background: none;
    border: 0;
    border-radius: 0.4rem;
    color: var(--ctp-subtext0);
  }
  .refresh:hover:not(:disabled) {
    background: var(--ctp-surface0);
    color: var(--ctp-text);
  }
  .spinning :global(svg) {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .columns {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }

  /* Narrow screen: tabs at the bottom, like an app */
  .tabs {
    display: flex;
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--ctp-mantle);
    border-top: 1px solid var(--ctp-surface0);
  }
  .tabs button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: 0.5rem 0.25rem;
    background: none;
    border: 0;
    color: var(--ctp-subtext0);
    font-size: 0.7rem;
    line-height: 1.1;
    text-align: center;
  }
  .tabs button.active {
    color: var(--ctp-mauve);
  }
  .icon {
    position: relative;
    display: inline-flex;
  }
  .dot {
    position: absolute;
    top: -0.1rem;
    right: -0.35rem;
    width: 0.55rem;
    height: 0.55rem;
    background: var(--ctp-mauve);
    border: 2px solid var(--ctp-mantle);
    border-radius: 50%;
  }

  /* Wide screen: four columns side by side, no tabs */
  @media (min-width: 64rem) {
    .tabs {
      display: none;
    }
    .columns {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
</style>
