<script lang="ts">
  import { CheckCheck } from '@lucide/svelte';
  import { feedStore, isItemUnread, markRead, unreadCount } from '$lib/feeds.svelte';
  import { t, type Key } from '$lib/i18n';
  import type { ColumnId } from '$lib/unread';
  import FeedCard from './FeedCard.svelte';

  let { column, title, hasAccounts }: { column: ColumnId; title: Key; hasAccounts: boolean } = $props();

  const unread = $derived(unreadCount(column));
  const items = $derived(feedStore.items[column]);
</script>

<div class="head">
  <h2>{t(title)}</h2>
  {#if unread > 0}<span class="badge" aria-label={`${unread} ${t('unread')}`}>{unread}</span>{/if}
  <button type="button" disabled={unread === 0} onclick={() => markRead(column)} title={t('markRead')}>
    <CheckCheck size={16} aria-hidden="true" /> {t('markRead')}
  </button>
</div>

{#if !hasAccounts}
  <p class="empty">{t('noAccounts')}</p>
{:else if items.length === 0}
  <p class="empty">{feedStore.loaded ? t('empty') : t('loading')}</p>
{:else}
  {#each items as item (item.key)}
    <FeedCard {item} unread={isItemUnread(column, item)} />
  {/each}
{/if}

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  h2 {
    flex: 1;
    margin: 0;
    font-size: 1rem;
  }
  .badge {
    padding: 0 0.5rem;
    background: var(--ctp-mauve);
    color: var(--ctp-crust);
    border-radius: 1rem;
    font-size: 0.8rem;
    font-weight: 600;
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.6rem;
    background: var(--ctp-surface0);
    border: 0;
    border-radius: 0.4rem;
    font-size: 0.85rem;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .empty {
    color: var(--ctp-overlay1);
  }
</style>
