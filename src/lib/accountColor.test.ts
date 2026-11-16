import { describe, expect, it } from 'vitest';
import { accountColorClass, accountLabel } from './accountColor';

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

describe('accountLabel', () => {
  it('drops the server when the name is unique among the accounts', () => {
    expect(accountLabel('spottihinta@mastodon.example', ['spottihinta@mastodon.example', 'tapaaminen@mastodon.example'])).toBe('spottihinta');
  });

  it('keeps the server when two accounts have the same name', () => {
    const accts = ['sanna@one.example', 'sanna@two.example'];
    expect(accountLabel(accts[0], accts)).toBe('sanna@one.example');
  });
});
