/**
 * Mastodon IDs are numeric strings that grow with time within one server.
 * They are compared by length first, then as text, so no number conversion is needed.
 */
export function compareIds(a: string, b: string): number {
  if (a.length !== b.length) return a.length - b.length;
  return a < b ? -1 : a > b ? 1 : 0;
}

export function newestId(ids: string[]): string | undefined {
  return ids.reduce<string | undefined>((max, id) => (max === undefined || compareIds(id, max) > 0 ? id : max), undefined);
}

export type ColumnId = 'interactions' | 'mentions' | 'messages' | 'posts';

const PREFIX = 'mast.seen.';

/** The newest ID the user has marked as read, per account and column. Kept in the browser only. */
export function loadSeen(accountKey: string, column: ColumnId): string | undefined {
  try {
    return localStorage.getItem(`${PREFIX}${column}.${accountKey}`) ?? undefined;
  } catch {
    return undefined;
  }
}

export function saveSeen(accountKey: string, column: ColumnId, id: string): void {
  try {
    localStorage.setItem(`${PREFIX}${column}.${accountKey}`, id);
  } catch {
    // Storage can be blocked: the column then shows everything as unread, which is harmless
  }
}

export function clearSeen(accountKey: string, column: ColumnId): void {
  try {
    localStorage.removeItem(`${PREFIX}${column}.${accountKey}`);
  } catch {
    // Nothing to clean up if storage is blocked
  }
}

/** An item is unread when it is newer than the last ID marked as read. Without a mark everything is unread. */
export function isUnread(id: string, seen: string | undefined): boolean {
  return seen === undefined || compareIds(id, seen) > 0;
}
