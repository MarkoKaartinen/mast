import { describe, expect, it } from 'vitest';
import type { Notification, Status } from '$lib/api/types';
import { fromNotifications, fromPosts, mergeFeeds } from './feed';

const person = { id: '1', acct: 'ronsu@mastodon.example', display_name: '', avatar: 'https://mastodon.example/a.png' };
const status = (id: string, created_at: string): Status => ({
  id,
  created_at,
  url: null,
  content: '<p>Hi</p>',
  spoiler_text: '',
  visibility: 'public',
  account: person,
  reblog: null,
});
const note = (id: string, type: string, created_at: string): Notification => ({
  id,
  type,
  created_at,
  account: person,
  status: status('s' + id, created_at),
});

describe('feed', () => {
  it('keeps only the notification types of the columns and marks unread ones', () => {
    const items = fromNotifications('acc', [note('12', 'favourite', 'a'), note('11', 'follow', 'a'), note('9', 'reblog', 'a')], () => '10');
    expect(items.map((i) => [i.id, i.kind, i.unread])).toEqual([
      ['12', 'favourite', true],
      ['9', 'reblog', false],
    ]);
    expect(items[0].from.displayName).toBe('ronsu@mastodon.example');
  });

  it('merges accounts by date, newest first', () => {
    const a = fromPosts('a', [status('5', '2026-01-02T00:00:00Z')], () => undefined);
    const b = fromPosts('b', [status('900', '2026-01-03T00:00:00Z'), status('800', '2026-01-01T00:00:00Z')], () => undefined);
    expect(mergeFeeds([a, b]).map((i) => i.key)).toEqual(['b/s/900', 'a/s/5', 'b/s/800']);
  });
});
