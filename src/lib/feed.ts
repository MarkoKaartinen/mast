import type { Conversation, Notification, Status } from '$lib/api/types';
import { isUnread } from '$lib/unread';

/** One row in a column, the same shape for every column. */
export interface FeedItem {
  /** Unique across accounts */
  key: string;
  accountKey: string;
  /** Account-local id used for read state: only comparable with ids of the same account */
  id: string;
  createdAt: string;
  kind: 'favourite' | 'reblog' | 'mention' | 'message' | 'post';
  /** Who did it: the other person for notifications and messages, the account itself for posts */
  from: { acct: string; displayName: string; avatar: string };
  status: Status | null;
  unread: boolean;
}

type Seen = (accountKey: string) => string | undefined;

function from(account: { acct: string; display_name: string; avatar: string }) {
  return { acct: account.acct, displayName: account.display_name || account.acct, avatar: account.avatar };
}

export function fromNotifications(accountKey: string, list: Notification[], seen: Seen): FeedItem[] {
  return list
    .filter((n) => n.type === 'favourite' || n.type === 'reblog' || n.type === 'mention')
    .map((n) => ({
      key: `${accountKey}/n/${n.id}`,
      accountKey,
      id: n.id,
      createdAt: n.created_at,
      kind: n.type as FeedItem['kind'],
      from: from(n.account),
      status: n.status ?? null,
      unread: isUnread(n.id, seen(accountKey)),
    }));
}

/** Conversations are identified by their last status, because conversation ids are not reliably exposed. */
export function fromConversations(accountKey: string, list: Conversation[], seen: Seen): FeedItem[] {
  return list.flatMap((c) => {
    const status = c.last_status;
    if (!status) return [];
    return [
      {
        key: `${accountKey}/c/${c.id}`,
        accountKey,
        id: status.id,
        createdAt: status.created_at,
        kind: 'message' as const,
        from: from(status.account),
        status,
        unread: isUnread(status.id, seen(accountKey)),
      },
    ];
  });
}

export function fromPosts(accountKey: string, list: Status[], seen: Seen): FeedItem[] {
  return list.map((s) => ({
    key: `${accountKey}/s/${s.id}`,
    accountKey,
    id: s.id,
    createdAt: s.created_at,
    kind: 'post' as const,
    from: from(s.account),
    status: s,
    unread: isUnread(s.id, seen(accountKey)),
  }));
}

/** Merges the items of all accounts, newest first. Dates are used because ids differ between servers. */
export function mergeFeeds(feeds: FeedItem[][]): FeedItem[] {
  return feeds.flat().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
