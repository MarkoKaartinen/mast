import { describe, expect, it } from 'vitest';
import { accountColorClass } from './accountColor';

describe('accountColorClass', () => {
  it('gives every account of the list its own color', () => {
    const keys = Array.from({ length: 8 }, (_, i) => `https://mastodon.example/${i}`);
    expect(new Set(keys.map((key) => accountColorClass(key, keys))).size).toBe(8);
  });

  it('is stable and stays within the defined colors, also for unknown keys', () => {
    expect(accountColorClass('x', [])).toBe(accountColorClass('x', []));
    for (const key of ['a', 'b', '']) expect(accountColorClass(key, [])).toMatch(/^acc-[0-7]$/);
  });
});
