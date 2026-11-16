<script lang="ts">
  import { RefreshCw } from '@lucide/svelte';
  import { onMount, untrack } from 'svelte';
  import { accountStore, initAccounts } from '$lib/accounts.svelte';
  import Accounts from '$lib/components/Accounts.svelte';
  import Column from '$lib/components/Column.svelte';
  import { COLUMNS, COLUMN_TITLES, feedStore, refreshAll, startPolling, unreadCount } from '$lib/feeds.svelte';
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
  <h1>{t('appName')}</h1>
  <button type="button" class="refresh" class:spinning={feedStore.loading} disabled={feedStore.loading} title={t('refresh')} aria-label={t('refresh')} onclick={() => void refreshAll()}>
    <RefreshCw size={18} />
  </button>
</header>

{#if accountStore.ready}
  <Accounts />
{/if}

<nav class="tabs" aria-label={t('appName')}>
  {#each COLUMNS as id (id)}
    <button class:active={id === active} onclick={() => (active = id)}>
      {t(COLUMN_TITLES[id])}
      {#if unreadCount(id) > 0}<span class="dot" aria-hidden="true"></span>{/if}
    </button>
  {/each}
</nav>

<main class="columns">
  {#each COLUMNS as id (id)}
    <section class="column" class:active={id === active}>
      <Column column={id} title={COLUMN_TITLES[id]} hasAccounts={accountStore.list.length > 0} />
    </section>
  {/each}
</main>

<style>
  :global(#app) {
    display: flex;
    flex-direction: column;
  }
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    background: var(--ctp-mantle);
    border-bottom: 1px solid var(--ctp-surface0);
  }
  h1 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--ctp-mauve);
  }
  .refresh {
    display: inline-flex;
    padding: 0.35rem;
    background: none;
    border: 0;
    border-radius: 0.4rem;
    color: var(--ctp-subtext0);
    cursor: pointer;
  }
  .refresh:disabled {
    cursor: default;
  }
  .spinning :global(svg) {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .tabs {
    display: flex;
    background: var(--ctp-mantle);
    border-bottom: 1px solid var(--ctp-surface0);
  }
  .tabs button {
    flex: 1;
    padding: 0.6rem 0.25rem;
    background: none;
    border: 0;
    border-bottom: 2px solid transparent;
    color: var(--ctp-subtext0);
    cursor: pointer;
  }
  .tabs button.active {
    color: var(--ctp-text);
    border-bottom-color: var(--ctp-mauve);
  }
  .dot {
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    margin-left: 0.25rem;
    background: var(--ctp-mauve);
    border-radius: 50%;
  }
  .columns {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr;
  }
  .column {
    display: none;
    padding: 1rem;
    overflow-y: auto;
  }
  .column.active {
    display: block;
  }

  /* Wide screen: four columns side by side, tabs hidden */
  @media (min-width: 64rem) {
    .tabs {
      display: none;
    }
    .columns {
      grid-template-columns: repeat(4, 1fr);
    }
    .column,
    .column.active {
      display: block;
      border-right: 1px solid var(--ctp-surface0);
    }
  }
</style>
