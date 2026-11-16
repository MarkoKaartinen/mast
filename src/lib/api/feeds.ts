import type { StoredAccount } from '$lib/storage';
import { apiGet } from './client';
import type { Conversation, Notification, Status } from './types';

/** How many items to fetch per account and column. 40 is the maximum Mastodon allows for statuses and notifications. */
export const PAGE_SIZE = 40;

function notifications(account: StoredAccount, types: string[]): Promise<Notification[]> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  for (const type of types) params.append('types[]', type);
  return apiGet(account.instance, account.accessToken, `/api/v1/notifications?${params}`);
}

export const fetchInteractions = (account: StoredAccount) => notifications(account, ['favourite', 'reblog']);

export const fetchMentions = (account: StoredAccount) => notifications(account, ['mention']);

export const fetchConversations = (account: StoredAccount): Promise<Conversation[]> =>
  apiGet(account.instance, account.accessToken, `/api/v1/conversations?limit=${PAGE_SIZE}`);

export const fetchPosts = (account: StoredAccount): Promise<Status[]> =>
  apiGet(account.instance, account.accessToken, `/api/v1/accounts/${account.id}/statuses?limit=${PAGE_SIZE}`);
