<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { accountStore, initAccounts } from '$lib/accounts.svelte';
  import Accounts from '$lib/components/Accounts.svelte';
  import Column from '$lib/components/Column.svelte';
  import { COLUMNS, COLUMN_TITLES, refreshAll, startPolling, unreadCount } from '$lib/feeds.svelte';
  import { t } from '$lib/i18n';
  import { connectStream } from '$lib/streaming';
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

  // One live stream per account: it only tells when to refresh, the columns are always loaded from the REST API
  $effect(() => {
    const accounts = accountStore.list;
    const stops = untrack(() => accounts.map((account) => connectStream(account, () => void refreshAll())));
    return () => stops.forEach((stop) => stop());
  });
</script>

<header class="bar">
  <h1>{t('appName')}</h1>
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
    padding: 0.5rem 1rem;
    background: var(--ctp-mantle);
    border-bottom: 1px solid var(--ctp-surface0);
  }
  h1 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--ctp-mauve);
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
