import type { StoredAccount } from '$lib/storage';
import { apiGetPage, type Page } from './client';
import type { Conversation, Notification, Status } from './types';

/** How many items to fetch per account and column. 40 is the maximum Mastodon allows for statuses and notifications. */
export const PAGE_SIZE = 40;

function notificationsPath(types: string[]): string {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  for (const type of types) params.append('types[]', type);
  return `/api/v1/notifications?${params}`;
}

/** Each fetcher loads the first page, or the page at `path` (the "next" link of an earlier page). */
export const fetchInteractions = (account: StoredAccount, path?: string): Promise<Page<Notification>> =>
  apiGetPage(account.instance, account.accessToken, path ?? notificationsPath(['favourite', 'reblog']));

export const fetchMentions = (account: StoredAccount, path?: string): Promise<Page<Notification>> =>
  apiGetPage(account.instance, account.accessToken, path ?? notificationsPath(['mention']));

export const fetchConversations = (account: StoredAccount, path?: string): Promise<Page<Conversation>> =>
  apiGetPage(account.instance, account.accessToken, path ?? `/api/v1/conversations?limit=${PAGE_SIZE}`);

export const fetchPosts = (account: StoredAccount, path?: string): Promise<Page<Status>> =>
  apiGetPage(account.instance, account.accessToken, path ?? `/api/v1/accounts/${account.id}/statuses?limit=${PAGE_SIZE}`);
