<script lang="ts">
  import { AtSign, Mail, Pencil, Repeat2, Star } from '@lucide/svelte';
  import { accountStore } from '$lib/accounts.svelte';
  import type { FeedItem } from '$lib/feed';
  import { sanitizeHtml } from '$lib/html';
  import { t, type Key } from '$lib/i18n';
  import { safeHttpUrl } from '$lib/url';

  let { item, unread }: { item: FeedItem; unread: boolean } = $props();

  const icons = { favourite: Star, reblog: Repeat2, mention: AtSign, message: Mail, post: Pencil };
  const labels: Record<FeedItem['kind'], Key> = {
    favourite: 'kindFavourite',
    reblog: 'kindReblog',
    mention: 'kindMention',
    message: 'kindMessage',
    post: 'kindPost',
  };
  const Icon = $derived(icons[item.kind]);
  const avatar = $derived(safeHttpUrl(item.from.avatar));
  // Boosts of other people's posts show the boosted post
  const shown = $derived(item.status?.reblog ?? item.status);
  const link = $derived(safeHttpUrl(shown?.url));
  const owner = $derived(accountStore.list.find((a) => a.key === item.accountKey));
  const time = $derived(new Date(item.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }));
</script>

<article class="card" class:unread>
  <header>
    {#if avatar}<img src={avatar} alt="" width="32" height="32" loading="lazy" />{/if}
    <div class="who">
      <strong>{item.from.displayName}</strong>
      <small>{item.from.acct}</small>
    </div>
    <span class="kind {item.kind}" title={t(labels[item.kind])}><Icon size={16} aria-hidden="true" /></span>
  </header>

  {#if shown}
    {#if shown.spoiler_text}
      <details>
        <summary>{shown.spoiler_text}</summary>
        <div class="content">{@html sanitizeHtml(shown.content)}</div>
      </details>
    {:else}
      <div class="content">{@html sanitizeHtml(shown.content)}</div>
    {/if}
  {/if}

  <footer>
    {#if owner}<span class="owner">{t(labels[item.kind])} · {owner.acct}</span>{/if}
    {#if link}
      <a href={link} target="_blank" rel="noopener noreferrer"><time datetime={item.createdAt}>{time}</time></a>
    {:else}
      <time datetime={item.createdAt}>{time}</time>
    {/if}
  </footer>
</article>

<style>
  .card {
    padding: 0.6rem 0.75rem;
    margin-bottom: 0.6rem;
    background: var(--ctp-mantle);
    border: 1px solid var(--ctp-surface0);
    border-left: 3px solid transparent;
    border-radius: 0.5rem;
    overflow-wrap: anywhere;
  }
  .card.unread {
    border-left-color: var(--ctp-mauve);
    background: var(--ctp-surface0);
  }
  header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  img {
    border-radius: 50%;
  }
  .who {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }
  small,
  footer {
    color: var(--ctp-subtext0);
    font-size: 0.8rem;
  }
  .kind.favourite {
    color: var(--ctp-yellow);
  }
  .kind.reblog {
    color: var(--ctp-green);
  }
  .kind.mention {
    color: var(--ctp-blue);
  }
  .kind.message {
    color: var(--ctp-peach);
  }
  .kind.post {
    color: var(--ctp-mauve);
  }
  .content {
    margin-top: 0.4rem;
  }
  .content :global(p) {
    margin: 0 0 0.5rem;
  }
  .content :global(a) {
    color: var(--ctp-blue);
  }
  .content :global(.invisible) {
    display: none;
  }
  .content :global(.ellipsis)::after {
    content: '\2026';
  }
  summary {
    cursor: pointer;
    margin-top: 0.4rem;
    color: var(--ctp-peach);
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.1rem 0.75rem;
    margin-top: 0.4rem;
  }
  footer a {
    color: inherit;
  }
</style>
