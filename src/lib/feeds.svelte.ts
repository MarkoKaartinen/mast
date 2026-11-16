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

/**
 * How often to refresh while the page is visible. A refresh costs four requests per account and Mastodon
 * allows 300 per 5 minutes per account and per IP, so 5 minutes leaves plenty of room.
 */
export const POLL_INTERVAL_MS = 5 * 60_000;

/** How often to check whether a refresh is due. */
const POLL_CHECK_MS = 30_000;

const loaders: Record<ColumnId, (account: StoredAccount) => Promise<FeedItem[]>> = {
  interactions: async (a) => fromNotifications(a.key, await fetchInteractions(a)),
  mentions: async (a) => fromNotifications(a.key, await fetchMentions(a)),
  messages: async (a) => fromConversations(a.key, await fetchConversations(a)),
  posts: async (a) => fromPosts(a.key, await fetchPosts(a)),
};

export const feedStore = $state({
  /** Items per column and account, keyed "<column>/<account key>". Kept when a refresh fails. */
  slots: {} as Record<string, FeedItem[]>,
  /** Accounts that hit the rate limit: no requests until this time (ms since epoch) */
  pausedUntil: {} as Record<string, number>,
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

/** All accounts' items of a column, newest first. */
export const columnItems = (column: ColumnId): FeedItem[] =>
  mergeFeeds(accountStore.list.map((a) => feedStore.slots[seenKey(column, a.key)] ?? []));

export const unreadCount = (column: ColumnId) => columnItems(column).filter((i) => isItemUnread(column, i)).length;

/** Marks everything currently in the column as read, per account. */
export function markRead(column: ColumnId): void {
  for (const account of accountStore.list) {
    const newest = newestId((feedStore.slots[seenKey(column, account.key)] ?? []).map((i) => i.id));
    if (!newest) continue;
    feedStore.seen[seenKey(column, account.key)] = newest;
    saveSeen(account.key, column, newest);
  }
}

/** Set when a refresh was requested while one was running, so that the change is not missed. */
let refreshAgain = false;
let lastRefresh = 0;

export async function refreshAll(): Promise<void> {
  const accounts = accountStore.list;
  if (accounts.length === 0) {
    feedStore.slots = {};
    return;
  }
  if (feedStore.loading) {
    refreshAgain = true;
    return;
  }
  feedStore.loading = true;
  loadSeenMarks(accounts);
  const failed: typeof feedStore.failed = {};
  const now = Date.now();

  await Promise.all(
    accounts.flatMap((account) =>
      COLUMNS.map(async (column) => {
        if ((feedStore.pausedUntil[account.key] ?? 0) > now) {
          (failed[account.key] ??= []).push({ column, status: '429' });
          return;
        }
        try {
          feedStore.slots[seenKey(column, account.key)] = await loaders[column](account);
        } catch (error) {
          // The old items stay, so a failing request never empties a column
          const status = error instanceof ApiError ? String(error.status) : 'network';
          (failed[account.key] ??= []).push({ column, status });
          if (error instanceof ApiError && error.pauseMs) feedStore.pausedUntil[account.key] = Date.now() + error.pauseMs;
        }
      }),
    ),
  );

  // Forget the items of accounts that were removed
  const keys = new Set(accounts.flatMap((a) => COLUMNS.map((c) => seenKey(c, a.key))));
  for (const key of Object.keys(feedStore.slots)) if (!keys.has(key)) delete feedStore.slots[key];

  feedStore.failed = failed;
  feedStore.loading = false;
  feedStore.loaded = true;
  lastRefresh = Date.now();
  if (refreshAgain) {
    refreshAgain = false;
    await refreshAll();
  }
}

/**
 * Refreshes when the page is visible and the data is older than the poll interval.
 * Checking on tab switches too keeps a returning user's view fresh without refreshing on every switch.
 */
export function startPolling(): () => void {
  const tick = () => {
    if (document.visibilityState === 'visible' && Date.now() - lastRefresh >= POLL_INTERVAL_MS) void refreshAll();
  };
  const timer = setInterval(tick, POLL_CHECK_MS);
  document.addEventListener('visibilitychange', tick);
  return () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', tick);
  };
}
