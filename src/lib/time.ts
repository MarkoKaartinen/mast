const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** After a week an exact date is more useful than "9 days ago" */
const RELATIVE_LIMIT = 7 * DAY;

/** "5 minutes ago" for recent times and a short date for older ones, in the given language. */
export function formatTime(iso: string, now: number, locale: string): string {
  const then = Date.parse(iso);
  const age = now - then;
  if (Number.isNaN(then)) return '';
  if (age >= RELATIVE_LIMIT || age < -MINUTE) {
    return new Date(then).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: age >= 365 * DAY ? 'numeric' : undefined });
  }
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  if (age < MINUTE) return rtf.format(0, 'second');
  if (age < HOUR) return rtf.format(-Math.floor(age / MINUTE), 'minute');
  if (age < DAY) return rtf.format(-Math.floor(age / HOUR), 'hour');
  return rtf.format(-Math.floor(age / DAY), 'day');
}
