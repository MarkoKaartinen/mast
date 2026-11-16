import { describe, expect, it } from 'vitest';
import { compareIds, isUnread, newestId } from './unread';

describe('unread', () => {
  it('compares ids of different lengths numerically', () => {
    expect(compareIds('99', '100')).toBeLessThan(0);
    expect(compareIds('110000000000000001', '109999999999999999')).toBeGreaterThan(0);
    expect(compareIds('5', '5')).toBe(0);
  });

  it('finds the newest id', () => {
    expect(newestId(['9', '120', '30'])).toBe('120');
    expect(newestId([])).toBeUndefined();
  });

  it('treats everything as unread until something is marked as read', () => {
    expect(isUnread('10', undefined)).toBe(true);
    expect(isUnread('10', '10')).toBe(false);
    expect(isUnread('11', '10')).toBe(true);
    expect(isUnread('9', '10')).toBe(false);
  });
});
