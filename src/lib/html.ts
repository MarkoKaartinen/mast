import { safeHttpUrl } from '$lib/url';

/** Tags kept from server HTML. Everything else is unwrapped (its text stays) or, for script-like tags, dropped. */
const ALLOWED_TAGS = new Set(['p', 'br', 'a', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li']);
const DROPPED_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript']);

/** Classes Mastodon puts in post HTML that the app styles: hidden URL parts, truncation, mentions and hashtags. */
const ALLOWED_CLASSES = new Set(['invisible', 'ellipsis', 'mention', 'hashtag']);

function clean(source: Node, target: Node, doc: Document): void {
  for (const child of Array.from(source.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      target.appendChild(doc.createTextNode(child.textContent ?? ''));
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const element = child as Element;
    const tag = element.tagName.toLowerCase();
    if (DROPPED_TAGS.has(tag)) continue;
    if (!ALLOWED_TAGS.has(tag)) {
      clean(element, target, doc);
      continue;
    }
    const copy = doc.createElement(tag);
    const classes = (element.getAttribute('class') ?? '').split(/\s+/).filter((c) => ALLOWED_CLASSES.has(c));
    if (classes.length) copy.setAttribute('class', classes.join(' '));
    if (tag === 'a') {
      const href = safeHttpUrl(element.getAttribute('href'));
      if (href) {
        copy.setAttribute('href', href);
        copy.setAttribute('target', '_blank');
        copy.setAttribute('rel', 'noopener noreferrer nofollow');
      }
    }
    clean(element, copy, doc);
    target.appendChild(copy);
  }
}

/** Rebuilds server-provided HTML from an allowlist of tags, attributes and classes. Safe to use with {@html}. */
export function sanitizeHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const out = document.implementation.createHTMLDocument('');
  clean(parsed.body, out.body, out);
  return out.body.innerHTML;
}
