import { describe, expect, it } from 'vitest';
import { nextPagePath, RATE_LIMIT_WINDOW_MS, rateLimitPauseMs } from './client';

describe('rateLimitPauseMs', () => {
  const now = Date.parse('2026-01-01T12:00:00Z');

  it('waits until the reset time the server gave', () => {
    expect(rateLimitPauseMs('2026-01-01T12:02:00Z', now)).toBe(120_000);
  });

  it('waits one full window when the header is missing, broken, in the past or too far away', () => {
    expect(rateLimitPauseMs(null, now)).toBe(RATE_LIMIT_WINDOW_MS);
    expect(rateLimitPauseMs('soon', now)).toBe(RATE_LIMIT_WINDOW_MS);
    expect(rateLimitPauseMs('2026-01-01T11:00:00Z', now)).toBe(RATE_LIMIT_WINDOW_MS);
    expect(rateLimitPauseMs('2026-01-02T12:00:00Z', now)).toBe(RATE_LIMIT_WINDOW_MS);
  });
});

describe('nextPagePath', () => {
  const instance = 'https://mastodon.example';

  it('reads the next link from a Link header', () => {
    const header = '<https://mastodon.example/api/v1/notifications?max_id=5>; rel="next", <https://mastodon.example/api/v1/notifications?min_id=9>; rel="prev"';
    expect(nextPagePath(header, instance)).toBe('/api/v1/notifications?max_id=5');
  });

  it('ignores a missing header and links to other servers', () => {
    expect(nextPagePath(null, instance)).toBeNull();
    expect(nextPagePath('<https://mastodon.example/a>; rel="prev"', instance)).toBeNull();
    expect(nextPagePath('<https://evil.example/a?max_id=1>; rel="next"', instance)).toBeNull();
  });
});
