<script lang="ts">
  import { Repeat2 } from '@lucide/svelte';
  import { accountColorClass } from '$lib/accountColor';
  import { accountStore } from '$lib/accounts.svelte';
  import { COLUMN_ICONS } from '$lib/columnIcons';
  import type { FeedItem } from '$lib/feed';
  import { sanitizeHtml } from '$lib/html';
  import { lang, t, type Key } from '$lib/i18n';
  import { formatTime } from '$lib/time';
  import type { ColumnId } from '$lib/unread';
  import { safeHttpUrl } from '$lib/url';

  let { item, column, unread }: { item: FeedItem; column: ColumnId; unread: boolean } = $props();

  const labels: Record<FeedItem['kind'], Key> = {
    favourite: 'kindFavourite',
    reblog: 'kindReblog',
    mention: 'kindMention',
    message: 'kindMessage',
    post: 'kindPost',
  };
  // Boosts show a repeat icon, everything else the icon of its column
  const Icon = $derived(item.kind === 'reblog' ? Repeat2 : COLUMN_ICONS[column]);
  const avatar = $derived(safeHttpUrl(item.from.avatar));
  // Boosts of other people's posts show the boosted post
  const shown = $derived(item.status?.reblog ?? item.status);
  const link = $derived(safeHttpUrl(shown?.url));
  const owner = $derived(accountStore.list.find((a) => a.key === item.accountKey));
  const ownerAvatar = $derived(safeHttpUrl(owner?.avatar));
  const media = $derived(
    (shown?.media_attachments ?? []).flatMap((m) => {
      const src = safeHttpUrl(m.preview_url);
      return src ? [{ id: m.id, src, alt: m.description ?? '', video: m.type === 'video' || m.type === 'gifv' }] : [];
    }),
  );
  const time = $derived(formatTime(item.createdAt, Date.now(), lang));
  const fullTime = $derived(new Date(item.createdAt).toLocaleString());
</script>

{#snippet attachments()}
  {#if media.length}
    <ul class="media" aria-label={t('media')}>
      {#each media as m (m.id)}
        <li><img src={m.src} alt={m.alt} loading="lazy" />{#if m.video}<span class="play" aria-hidden="true"></span>{/if}</li>
      {/each}
    </ul>
  {/if}
{/snippet}

<article class="card {accountColorClass(item.accountKey)}" class:unread>
  <header>
    {#if avatar}<img class="avatar" src={avatar} alt="" width="36" height="36" loading="lazy" />{/if}
    <div class="who">
      <strong>{item.from.displayName}</strong>
      <small>{item.from.acct}</small>
    </div>
    {#if unread}<span class="unread-dot" title={t('unread')}></span>{/if}
  </header>

  <p class="action {item.kind}"><Icon size={14} aria-hidden="true" /> {t(labels[item.kind])}</p>

  {#if shown}
    {#if shown.spoiler_text || (shown.sensitive && media.length)}
      <details>
        <summary>{shown.spoiler_text || t('sensitiveMedia')}</summary>
        {#if shown.content}<div class="content">{@html sanitizeHtml(shown.content)}</div>{/if}
        {@render attachments()}
      </details>
    {:else}
      {#if shown.content}<div class="content">{@html sanitizeHtml(shown.content)}</div>{/if}
      {@render attachments()}
    {/if}
  {/if}

  <footer>
    {#if owner}
      <span class="account" title={owner.acct}>
        {#if ownerAvatar}<img src={ownerAvatar} alt="" width="14" height="14" />{/if}
        <span>{owner.acct}</span>
      </span>
    {/if}
    {#if link}
      <a href={link} target="_blank" rel="noopener noreferrer" title={fullTime}><time datetime={item.createdAt}>{time}</time></a>
    {:else}
      <time datetime={item.createdAt} title={fullTime}>{time}</time>
    {/if}
  </footer>
</article>

<style>
  .card {
    padding: 0.6rem 0.75rem;
    margin-bottom: 0.6rem;
    background: var(--ctp-mantle);
    border: 1px solid var(--ctp-surface0);
    /* The account's color on the left edge shows which account the item belongs to */
    border-left: 3px solid var(--account);
    border-radius: 0.5rem;
    overflow-wrap: anywhere;
    color: var(--ctp-subtext1);
  }
  .card.unread {
    background: var(--ctp-surface0);
    border-color: var(--ctp-surface1);
    border-left-color: var(--account);
    color: var(--ctp-text);
  }
  header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .avatar {
    border-radius: 50%;
    background: var(--ctp-surface1);
  }
  .who {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }
  small {
    color: var(--ctp-subtext0);
    font-size: 0.8rem;
  }
  .unread-dot {
    width: 0.55rem;
    height: 0.55rem;
    background: var(--ctp-mauve);
    border-radius: 50%;
  }
  .action {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin: 0.35rem 0 0;
    font-size: 0.8rem;
    color: var(--ctp-subtext0);
  }
  .action.favourite {
    color: var(--ctp-yellow);
  }
  .action.reblog {
    color: var(--ctp-green);
  }
  .action.mention {
    color: var(--ctp-blue);
  }
  .action.message {
    color: var(--ctp-peach);
  }
  .action.post {
    color: var(--ctp-mauve);
  }
  .content {
    margin-top: 0.35rem;
  }
  .content :global(p) {
    margin: 0 0 0.5rem;
  }
  .content :global(p:last-child) {
    margin-bottom: 0;
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
    margin-top: 0.35rem;
    color: var(--ctp-peach);
  }
  .media {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
    gap: 0.3rem;
    margin: 0.5rem 0 0;
    padding: 0;
  }
  .media li {
    position: relative;
    overflow: hidden;
    border-radius: 0.4rem;
    background: var(--ctp-crust);
  }
  .media img {
    display: block;
    width: 100%;
    max-height: 14rem;
    object-fit: cover;
  }
  .play {
    position: absolute;
    inset: 50% auto auto 50%;
    width: 0;
    height: 0;
    transform: translate(-30%, -50%);
    border-style: solid;
    border-width: 0.7rem 0 0.7rem 1.1rem;
    border-color: transparent transparent transparent var(--ctp-text);
    filter: drop-shadow(0 0 4px rgb(0 0 0 / 0.7));
  }
  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--ctp-subtext0);
  }
  /* A chip in the account's color: which of your accounts this concerns */
  .account {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    min-width: 0;
    padding: 0.05rem 0.5rem 0.05rem 0.25rem;
    color: var(--account);
    background: color-mix(in srgb, var(--account) 14%, transparent);
    border-radius: 1rem;
  }
  .account span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .account img {
    border-radius: 50%;
  }
  footer a {
    color: inherit;
  }
</style>
