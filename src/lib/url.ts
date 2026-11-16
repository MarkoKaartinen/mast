/** Returns the URL string if it is a plain http(s) URL, otherwise null. Use for every server-provided address. */
export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

const HOST = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(:\d{1,5})?$/i;

/**
 * Turns what a user typed ("mastodon.example", "https://mastodon.example/@me")
 * into a server origin ("https://mastodon.example"), or null if it is not a host name.
 */
export function normalizeInstance(input: string): string | null {
  const host = input
    .trim()
    .replace(/^https?:\/\//i, '')
    .split(/[/?#]/)[0];
  if (!HOST.test(host)) return null;
  return `https://${host.toLowerCase()}`;
}
