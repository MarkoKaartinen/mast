<script lang="ts">
  import { onMount } from 'svelte';
  import { accountStore, initAccounts } from '$lib/accounts.svelte';
  import Accounts from '$lib/components/Accounts.svelte';
  import { t, type Key } from '$lib/i18n';

  const columns: Key[] = ['columnInteractions', 'columnMentions', 'columnMessages', 'columnPosts'];
  let active = $state(0);

  onMount(initAccounts);
</script>

<header class="bar">
  <h1>{t('appName')}</h1>
</header>

{#if accountStore.ready}
  <Accounts />
{/if}

<nav class="tabs" aria-label={t('appName')}>
  {#each columns as key, i (key)}
    <button class:active={i === active} onclick={() => (active = i)}>{t(key)}</button>
  {/each}
</nav>

<main class="columns">
  {#each columns as key, i (key)}
    <section class="column" class:active={i === active}>
      <h2>{t(key)}</h2>
      {#if accountStore.ready && accountStore.list.length === 0}
        <p class="empty">{t('noAccounts')}</p>
      {:else}
        <p class="empty">{t('empty')}</p>
      {/if}
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
  .column h2 {
    display: none;
    margin: 0 0 0.75rem;
    font-size: 1rem;
  }
  .empty {
    color: var(--ctp-overlay1);
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
    .column h2 {
      display: block;
    }
  }
</style>
