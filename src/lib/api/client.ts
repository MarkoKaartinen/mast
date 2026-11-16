/** Mastodon's default limit is 300 requests per 5 minutes, so waiting one window is always enough. */
export const RATE_LIMIT_WINDOW_MS = 5 * 60_000;

/**
 * How long to wait after a 429. Uses the X-RateLimit-Reset timestamp when it is readable and sensible,
 * otherwise one full window.
 */
export function rateLimitPauseMs(resetHeader: string | null, now: number): number {
  const reset = resetHeader ? Date.parse(resetHeader) : NaN;
  const wait = reset - now;
  return wait > 0 && wait <= RATE_LIMIT_WINDOW_MS ? wait : RATE_LIMIT_WINDOW_MS;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Set on 429: how long to leave this account alone, in milliseconds */
    readonly pauseMs?: number,
  ) {
    super(message);
  }
}

/** The fields of Mastodon's Account entity this app uses. */
export interface Account {
  id: string;
  acct: string;
  display_name: string;
  avatar: string;
}

/** GET a Mastodon API path with a user token. */
export async function apiGet<T>(instance: string, token: string, path: string): Promise<T> {
  const response = await fetch(`${instance}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    const pause = response.status === 429 ? rateLimitPauseMs(response.headers.get('X-RateLimit-Reset'), Date.now()) : undefined;
    throw new ApiError(`Request failed (${response.status})`, response.status, pause);
  }
  return response.json();
}

export const verifyCredentials = (instance: string, token: string) =>
  apiGet<Account>(instance, token, '/api/v1/accounts/verify_credentials');
