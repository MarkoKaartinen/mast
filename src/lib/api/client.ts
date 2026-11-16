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

/** Mastodon's CustomEmoji entity: ":shortcode:" in a name or post is shown as the image at url. */
export interface CustomEmoji {
  shortcode: string;
  url: string;
  static_url: string;
}

/** The fields of Mastodon's Account entity this app uses. */
export interface Account {
  id: string;
  acct: string;
  display_name: string;
  avatar: string;
  emojis: CustomEmoji[];
}

export interface Page<T> {
  data: T[];
  /** Path and query of the next (older) page, or null when there is none */
  next: string | null;
}

/**
 * Reads rel="next" from a Link header. Only addresses on the same server are accepted,
 * and only their path and query are returned, so a header can never send the token elsewhere.
 */
export function nextPagePath(linkHeader: string | null, instance: string): string | null {
  const match = linkHeader?.match(/<([^>]+)>\s*;\s*rel="next"/);
  if (!match) return null;
  try {
    const url = new URL(match[1]);
    return url.origin === instance ? `${url.pathname}${url.search}` : null;
  } catch {
    return null;
  }
}

async function request(instance: string, token: string, path: string): Promise<Response> {
  const response = await fetch(`${instance}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    const pause = response.status === 429 ? rateLimitPauseMs(response.headers.get('X-RateLimit-Reset'), Date.now()) : undefined;
    throw new ApiError(`Request failed (${response.status})`, response.status, pause);
  }
  return response;
}

/** GET a Mastodon API path with a user token. */
export async function apiGet<T>(instance: string, token: string, path: string): Promise<T> {
  return (await request(instance, token, path)).json();
}

/** GET a list endpoint together with the link to its next page (the Link header, as the docs describe). */
export async function apiGetPage<T>(instance: string, token: string, path: string): Promise<Page<T>> {
  const response = await request(instance, token, path);
  return { data: await response.json(), next: nextPagePath(response.headers.get('Link'), instance) };
}

export const verifyCredentials = (instance: string, token: string) =>
  apiGet<Account>(instance, token, '/api/v1/accounts/verify_credentials');
