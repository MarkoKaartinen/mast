import { accountStore } from '$lib/accounts.svelte';
import { ApiError } from '$lib/api/client';
import { fetchConversations, fetchInteractions, fetchMentions, fetchPosts } from '$lib/api/feeds';
import type { Key } from '$lib/i18n';
import { fromConversations, fromNotifications, fromPosts, mergeFeeds, type FeedItem } from '$lib/feed';
import type { StoredAccount } from '$lib/storage';
import { isUnread, loadSeen, newestId, saveSeen, type ColumnId } from '$lib/unread';

export const COLUMNS: ColumnId[] = ['interactions', 'mentions', 'messages', 'posts'];

export const COLUMN_TITLES: Record<ColumnId, Key> = {
  interactions: 'columnInteractions',
  mentions: 'columnMentions',
  messages: 'columnMessages',
  posts: 'columnPosts',
};

/** How often to poll while the page is visible. The streaming API replaces this later. */
export const POLL_INTERVAL_MS = 60_000;

const loaders: Record<ColumnId, (account: StoredAccount) => Promise<FeedItem[]>> = {
  interactions: async (a) => fromNotifications(a.key, await fetchInteractions(a)),
  mentions: async (a) => fromNotifications(a.key, await fetchMentions(a)),
  messages: async (a) => fromConversations(a.key, await fetchConversations(a)),
  posts: async (a) => fromPosts(a.key, await fetchPosts(a)),
};

export const feedStore = $state({
  items: { interactions: [], mentions: [], messages: [], posts: [] } as Record<ColumnId, FeedItem[]>,
  /** Last item marked as read, keyed "<column>/<account key>" */
  seen: {} as Record<string, string | undefined>,
  /** What failed in the last refresh, keyed by account: the column and the HTTP status ("network" if none) */
  failed: {} as Record<string, { column: ColumnId; status: string }[]>,
  /** False until the first refresh has finished, so "loading" is only shown once */
  loaded: false,
  loading: false,
});

const seenKey = (column: ColumnId, accountKey: string) => `${column}/${accountKey}`;

/** Reads the saved read marks into the store. Done before items are set so that rendering never writes state. */
function loadSeenMarks(accounts: StoredAccount[]): void {
  for (const account of accounts) {
    for (const column of COLUMNS) {
      const key = seenKey(column, account.key);
      if (!(key in feedStore.seen)) feedStore.seen[key] = loadSeen(account.key, column);
    }
  }
}

export const isItemUnread = (column: ColumnId, item: FeedItem) =>
  isUnread(item.id, feedStore.seen[seenKey(column, item.accountKey)]);

export const unreadCount = (column: ColumnId) => feedStore.items[column].filter((i) => isItemUnread(column, i)).length;

/** Marks everything currently in the column as read, per account. */
export function markRead(column: ColumnId): void {
  for (const account of accountStore.list) {
    const newest = newestId(feedStore.items[column].filter((i) => i.accountKey === account.key).map((i) => i.id));
    if (!newest) continue;
    feedStore.seen[seenKey(column, account.key)] = newest;
    saveSeen(account.key, column, newest);
  }
}

/** Set when a refresh was requested while one was running, so that the change is not missed. */
let refreshAgain = false;

export async function refreshAll(): Promise<void> {
  const accounts = accountStore.list;
  if (accounts.length === 0) {
    for (const c of COLUMNS) feedStore.items[c] = [];
    return;
  }
  if (feedStore.loading) {
    refreshAgain = true;
    return;
  }
  feedStore.loading = true;
  loadSeenMarks(accounts);
  const failed: typeof feedStore.failed = {};
  const next = {} as Record<ColumnId, FeedItem[]>;
  await Promise.all(
    COLUMNS.map(async (column) => {
      const results = await Promise.allSettled(accounts.map((a) => loaders[column](a)));
      next[column] = mergeFeeds(
        results.flatMap((r, i) => {
          if (r.status === 'fulfilled') return [r.value];
          const status = r.reason instanceof ApiError ? String(r.reason.status) : 'network';
          (failed[accounts[i].key] ??= []).push({ column, status });
          return [];
        }),
      );
    }),
  );
  for (const column of COLUMNS) feedStore.items[column] = next[column];
  feedStore.failed = failed;
  feedStore.loading = false;
  feedStore.loaded = true;
  if (refreshAgain) {
    refreshAgain = false;
    await refreshAll();
  }
}

/** Starts polling and refreshes when the tab becomes visible again. Returns a function that stops it. */
export function startPolling(): () => void {
  const tick = () => {
    if (document.visibilityState === 'visible') void refreshAll();
  };
  const timer = setInterval(tick, POLL_INTERVAL_MS);
  document.addEventListener('visibilitychange', tick);
  return () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', tick);
  };
}
