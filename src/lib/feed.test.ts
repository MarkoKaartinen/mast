import { describe, expect, it } from 'vitest';
import type { Notification, Status } from '$lib/api/types';
import { fromNotifications, fromPosts, mergeFeeds, mergeRefresh, type FeedItem } from './feed';

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
  it('keeps only the notification types of the columns', () => {
    const items = fromNotifications('acc', [note('12', 'favourite', 'a'), note('11', 'follow', 'a'), note('9', 'reblog', 'a')]);
    expect(items.map((i) => [i.id, i.kind])).toEqual([
      ['12', 'favourite'],
      ['9', 'reblog'],
    ]);
    expect(items[0].from.displayName).toBe('ronsu@mastodon.example');
  });

  it('merges accounts by date, newest first', () => {
    const a = fromPosts('a', [status('5', '2026-01-02T00:00:00Z')]);
    const b = fromPosts('b', [status('900', '2026-01-03T00:00:00Z'), status('800', '2026-01-01T00:00:00Z')]);
    expect(mergeFeeds([a, b]).map((i) => i.key)).toEqual(['b/s/900', 'a/s/5', 'b/s/800']);
  });

  describe('mergeRefresh', () => {
    const item = (id: string): FeedItem => ({ key: 'k' + id, accountKey: 'a', id, createdAt: '', kind: 'post', from: { acct: '', displayName: '', avatar: '' }, status: null });

    it('keeps older loaded items and their link after a refresh', () => {
      const existing = { items: [item('50'), item('40'), item('30'), item('20')], next: 'older-link' };
      const merged = mergeRefresh(existing, { items: [item('60'), item('50'), item('40')], next: 'fresh-link' });
      expect(merged.items.map((i) => i.id)).toEqual(['60', '50', '40', '30', '20']);
      expect(merged.next).toBe('older-link');
    });

    it('uses the fresh link when nothing older is kept', () => {
      const merged = mergeRefresh({ items: [item('50')], next: 'old' }, { items: [item('60'), item('50')], next: 'fresh-link' });
      expect(merged.next).toBe('fresh-link');
    });

    it('takes the fresh page as is without existing items', () => {
      const fresh = { items: [item('1')], next: null };
      expect(mergeRefresh(undefined, fresh)).toBe(fresh);
    });
  });
});
