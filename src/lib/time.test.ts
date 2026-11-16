import { describe, expect, it } from 'vitest';
import { formatTime } from './time';

const now = Date.parse('2026-03-10T12:00:00Z');

describe('formatTime', () => {
  it('uses relative times for the last week', () => {
    expect(formatTime('2026-03-10T11:55:00Z', now, 'en')).toBe('5 min. ago');
    expect(formatTime('2026-03-10T09:00:00Z', now, 'en')).toBe('3 hr. ago');
    expect(formatTime('2026-03-08T12:00:00Z', now, 'en')).toBe('2 days ago');
    expect(formatTime('2026-03-10T11:59:50Z', now, 'en')).toBe('now');
  });

  it('uses a date for older times and adds the year after a year', () => {
    expect(formatTime('2026-01-02T12:00:00Z', now, 'en')).toBe('Jan 2');
    expect(formatTime('2024-01-02T12:00:00Z', now, 'en')).toBe('Jan 2, 2024');
  });

  it('returns nothing for an invalid date', () => {
    expect(formatTime('x', now, 'en')).toBe('');
  });
});
