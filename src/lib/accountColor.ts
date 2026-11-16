/** Number of account colors defined as .acc-0 ... .acc-7 in app.css */
export const ACCOUNT_COLORS = 8;

/** A stable color class for an account, so the same account always has the same color on every screen. */
export function accountColorClass(accountKey: string): string {
  let hash = 0;
  for (const char of accountKey) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `acc-${hash % ACCOUNT_COLORS}`;
}
