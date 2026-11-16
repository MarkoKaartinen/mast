import type { CustomEmoji } from '$lib/api/client';
import { safeHttpUrl } from '$lib/url';

/** Tags kept from server HTML. Everything else is unwrapped (its text stays) or, for script-like tags, dropped. */
const ALLOWED_TAGS = new Set(['p', 'br', 'a', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li']);
const DROPPED_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript']);

/** Classes Mastodon puts in post HTML that the app styles: hidden URL parts, truncation, mentions and hashtags. */
const ALLOWED_CLASSES = new Set(['invisible', 'ellipsis', 'mention', 'hashtag']);

const SHORTCODE = /:([a-zA-Z0-9_]+):/g;

/** Appends text to the target, turning ":shortcode:" of known custom emojis into images. */
function appendText(target: Node, text: string, emojis: Map<string, CustomEmoji>, doc: Document): void {
  let last = 0;
  for (const match of text.matchAll(SHORTCODE)) {
    const emoji = emojis.get(match[1]);
    const src = safeHttpUrl(emoji?.url);
    if (!emoji || !src) continue;
    if (match.index > last) target.appendChild(doc.createTextNode(text.slice(last, match.index)));
    const img = doc.createElement('img');
    img.setAttribute('class', 'emoji');
    img.setAttribute('src', src);
    img.setAttribute('alt', match[0]);
    img.setAttribute('title', match[0]);
    target.appendChild(img);
    last = match.index + match[0].length;
  }
  if (last < text.length) target.appendChild(doc.createTextNode(text.slice(last)));
}

function clean(source: Node, target: Node, doc: Document, emojis: Map<string, CustomEmoji>): void {
  for (const child of Array.from(source.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      appendText(target, child.textContent ?? '', emojis, doc);
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const element = child as Element;
    const tag = element.tagName.toLowerCase();
    if (DROPPED_TAGS.has(tag)) continue;
    if (!ALLOWED_TAGS.has(tag)) {
      clean(element, target, doc, emojis);
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
    clean(element, copy, doc, emojis);
    target.appendChild(copy);
  }
}

const byShortcode = (emojis: CustomEmoji[]) => new Map(emojis.map((e) => [e.shortcode, e]));

/**
 * Rebuilds server-provided HTML from an allowlist of tags, attributes and classes. Safe to use with {@html}.
 * Custom emojis of the post are shown as images.
 */
export function sanitizeHtml(html: string, emojis: CustomEmoji[] = []): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const out = document.implementation.createHTMLDocument('');
  clean(parsed.body, out.body, out, byShortcode(emojis));
  return out.body.innerHTML;
}

/** Plain text (a display name, a content warning) as safe HTML, with custom emojis as images. */
export function emojify(text: string, emojis: CustomEmoji[] = []): string {
  const out = document.implementation.createHTMLDocument('');
  appendText(out.body, text, byShortcode(emojis), out);
  return out.body.innerHTML;
}
