import { accountStore } from '$lib/accounts.svelte';
import { ApiError } from '$lib/api/client';
import { fetchConversations, fetchInteractions, fetchMentions, fetchPosts } from '$lib/api/feeds';
import type { Key } from '$lib/i18n';
import { fromConversations, fromNotifications, fromPosts, mergeFeeds, mergeRefresh, type FeedItem, type Slot } from '$lib/feed';
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

/** Loads the first page, or the page at `path`, of one column for one account. */
type Loader = (account: StoredAccount, path?: string) => Promise<Slot>;

const loaders: Record<ColumnId, Loader> = {
  interactions: async (a, path) => {
    const page = await fetchInteractions(a, path);
    return { items: fromNotifications(a.key, page.data), next: page.next };
  },
  mentions: async (a, path) => {
    const page = await fetchMentions(a, path);
    return { items: fromNotifications(a.key, page.data), next: page.next };
  },
  messages: async (a, path) => {
    const page = await fetchConversations(a, path);
    return { items: fromConversations(a.key, page.data), next: page.next };
  },
  posts: async (a, path) => {
    const page = await fetchPosts(a, path);
    return { items: fromPosts(a.key, page.data), next: page.next };
  },
};

export const feedStore = $state({
  /** Items per column and account, keyed "<column>/<account key>". Kept when a refresh fails. */
  slots: {} as Record<string, Slot>,
  /** Accounts that hit the rate limit: no requests until this time (ms since epoch) */
  pausedUntil: {} as Record<string, number>,
  /** Last item marked as read, keyed "<column>/<account key>" */
  seen: {} as Record<string, string | undefined>,
  /** What failed in the last refresh, keyed by account: the column and the HTTP status ("network" if none) */
  failed: {} as Record<string, { column: ColumnId; status: string }[]>,
  /** False until the first refresh has finished, so "loading" is only shown once */
  loaded: false,
  loading: false,
  /** Columns where "load more" is running */
  loadingMore: { interactions: false, mentions: false, messages: false, posts: false } as Record<ColumnId, boolean>,
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
  mergeFeeds(accountStore.list.map((a) => feedStore.slots[seenKey(column, a.key)]?.items ?? []));

export const unreadCount = (column: ColumnId) => columnItems(column).filter((i) => isItemUnread(column, i)).length;

/** Marks everything currently in the column as read, per account. */
export function markRead(column: ColumnId): void {
  for (const account of accountStore.list) {
    const newest = newestId((feedStore.slots[seenKey(column, account.key)]?.items ?? []).map((i) => i.id));
    if (!newest) continue;
    feedStore.seen[seenKey(column, account.key)] = newest;
    saveSeen(account.key, column, newest);
  }
}

/** The HTTP status of a failed request ("network" if there was none). A rate limit also pauses the account. */
function failureStatus(accountKey: string, error: unknown): string {
  if (!(error instanceof ApiError)) return 'network';
  if (error.pauseMs) feedStore.pausedUntil[accountKey] = Date.now() + error.pauseMs;
  return String(error.status);
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
          const key = seenKey(column, account.key);
          feedStore.slots[key] = mergeRefresh(feedStore.slots[key], await loaders[column](account));
        } catch (error) {
          // The old items stay, so a failing request never empties a column
          (failed[account.key] ??= []).push({ column, status: failureStatus(account.key, error) });
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

export const hasMore = (column: ColumnId): boolean =>
  accountStore.list.some((a) => feedStore.slots[seenKey(column, a.key)]?.next);

/** Loads the next older page of a column for every account that has one. */
export async function loadMore(column: ColumnId): Promise<void> {
  if (feedStore.loadingMore[column]) return;
  feedStore.loadingMore[column] = true;
  const now = Date.now();
  await Promise.all(
    accountStore.list.map(async (account) => {
      const key = seenKey(column, account.key);
      const slot = feedStore.slots[key];
      if (!slot?.next || (feedStore.pausedUntil[account.key] ?? 0) > now) return;
      try {
        const page = await loaders[column](account, slot.next);
        const known = new Set(slot.items.map((i) => i.key));
        feedStore.slots[key] = { items: [...slot.items, ...page.items.filter((i) => !known.has(i.key))], next: page.next };
      } catch (error) {
        (feedStore.failed[account.key] ??= []).push({ column, status: failureStatus(account.key, error) });
      }
    }),
  );
  feedStore.loadingMore[column] = false;
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
