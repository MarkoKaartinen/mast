import { describe, expect, it } from 'vitest';
import { RATE_LIMIT_WINDOW_MS, rateLimitPauseMs } from './client';

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
