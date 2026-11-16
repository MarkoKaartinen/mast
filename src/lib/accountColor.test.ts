import { describe, expect, it } from 'vitest';
import { accountColorClass } from './accountColor';

describe('accountColorClass', () => {
  it('is stable and stays within the defined colors', () => {
    expect(accountColorClass('https://mastodon.example/1')).toBe(accountColorClass('https://mastodon.example/1'));
    for (const key of ['a', 'b', 'https://mastodon.example/123', '']) expect(accountColorClass(key)).toMatch(/^acc-[0-7]$/);
  });
});
