<script lang="ts">
  import { CheckCheck, LoaderCircle } from '@lucide/svelte';
  import { COLUMN_ICONS } from '$lib/columnIcons';
  import { columnItems, feedStore, hasMore, isItemUnread, loadMore, markRead, unreadCount } from '$lib/feeds.svelte';
  import { t, type Key } from '$lib/i18n';
  import type { ColumnId } from '$lib/unread';
  import FeedCard from './FeedCard.svelte';

  let { column, title, active }: { column: ColumnId; title: Key; active: boolean } = $props();

  const unread = $derived(unreadCount(column));
  const items = $derived(columnItems(column));
  const Icon = $derived(COLUMN_ICONS[column]);
</script>

<section class="column" class:active>
  <header class="head">
    <Icon size={18} aria-hidden="true" />
    <h2>{t(title)}</h2>
    {#if unread > 0}<span class="badge" role="status" aria-label={`${unread} ${t('unread')}`}>{unread}</span>{/if}
    <button type="button" class="touch-target" disabled={unread === 0} onclick={() => markRead(column)} title={t('markRead')} aria-label={t('markRead')}>
      <CheckCheck size={18} aria-hidden="true" />
    </button>
  </header>

  <div class="list">
    {#if items.length === 0}
      <div class="empty">
        {#if feedStore.loaded}
          <Icon size={28} aria-hidden="true" />
          <p>{t('empty')}</p>
          <small>{t('emptyHint')}</small>
        {:else}
          <LoaderCircle size={28} class="spin" aria-hidden="true" />
          <p>{t('loading')}</p>
        {/if}
      </div>
    {:else}
      {#each items as item (item.key)}
        <FeedCard {item} column={column} unread={isItemUnread(column, item)} />
      {/each}
      {#if hasMore(column)}
        <button type="button" class="more" disabled={feedStore.loadingMore[column]} onclick={() => loadMore(column)}>
          {feedStore.loadingMore[column] ? t('loading') : t('loadMore')}
        </button>
      {/if}
    {/if}
  </div>
</section>

<style>
  /* Each column scrolls on its own, the header stays in place */
  .column {
    display: none;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
  }
  .column.active {
    display: flex;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    background: var(--ctp-base);
    border-bottom: 1px solid var(--ctp-surface0);
    color: var(--ctp-subtext1);
  }
  h2 {
    flex: 1;
    margin: 0;
    font-size: 0.95rem;
    color: var(--ctp-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .badge {
    padding: 0 0.5rem;
    background: var(--ctp-mauve);
    color: var(--ctp-crust);
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 700;
  }
  .head button {
    display: inline-flex;
    padding: 0.3rem;
    background: none;
    border: 0;
    border-radius: 0.4rem;
    color: var(--ctp-subtext0);
  }
  .head button:hover:not(:disabled) {
    background: var(--ctp-surface0);
    color: var(--ctp-green);
  }
  .head button:disabled {
    opacity: 0.35;
  }
  .list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0.75rem;
    overscroll-behavior: contain;
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    margin-top: 3rem;
    text-align: center;
    color: var(--ctp-overlay1);
  }
  .empty p {
    margin: 0.25rem 0 0;
  }
  .empty small {
    color: var(--ctp-overlay0);
  }
  .empty :global(.spin) {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .more {
    display: block;
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    background: var(--ctp-surface0);
    border: 0;
    border-radius: 0.5rem;
    color: var(--ctp-subtext1);
  }
  .more:hover:not(:disabled) {
    background: var(--ctp-surface1);
  }

  /* Wide screen: all four columns are visible and separated by a line */
  @media (min-width: 64rem) {
    .column,
    .column.active {
      display: flex;
    }
    .column + :global(.column) {
      border-left: 1px solid var(--ctp-surface0);
    }
  }
</style>
