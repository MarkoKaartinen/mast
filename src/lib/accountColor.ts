/** Number of account colors defined as .acc-0 ... .acc-7 in app.css */
export const ACCOUNT_COLORS = 8;

/**
 * A color class for an account: its place in the list of accounts, so that up to ACCOUNT_COLORS accounts
 * never share a color (a hash would often give two accounts the same one). Unknown keys fall back to a hash.
 */
export function accountColorClass(accountKey: string, accountKeys: string[]): string {
  const index = accountKeys.indexOf(accountKey);
  if (index >= 0) return `acc-${index % ACCOUNT_COLORS}`;
  let hash = 0;
  for (const char of accountKey) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `acc-${hash % ACCOUNT_COLORS}`;
}
