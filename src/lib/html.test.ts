// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { emojify, sanitizeHtml } from './html';

describe('sanitizeHtml', () => {
  it('keeps basic formatting', () => {
    expect(sanitizeHtml('<p>Hello <strong>world</strong><br>again</p>')).toBe('<p>Hello <strong>world</strong><br>again</p>');
  });

  it('drops scripts and unwraps unknown tags', () => {
    expect(sanitizeHtml('<p>a<script>alert(1)</script><img src=x onerror=alert(1)><span>b</span></p>')).toBe('<p>a<span>b</span></p>');
    expect(sanitizeHtml('<div>x<em>y</em></div>')).toBe('x<em>y</em>');
  });

  it('removes event handlers, styles and unknown attributes', () => {
    expect(sanitizeHtml('<p onclick="x()" style="color:red" data-a="1">t</p>')).toBe('<p>t</p>');
  });

  it('keeps only safe links and opens them safely', () => {
    expect(sanitizeHtml('<a href="https://mastodon.example/@a">a</a>')).toBe(
      '<a href="https://mastodon.example/@a" target="_blank" rel="noopener noreferrer nofollow">a</a>',
    );
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
  });

  it('keeps only the classes the app styles', () => {
    expect(sanitizeHtml('<span class="invisible evil">h</span>')).toBe('<span class="invisible">h</span>');
  });

  describe('custom emojis', () => {
    const emojis = [
      { shortcode: 'blobaww', url: 'https://mastodon.example/blobaww.png', static_url: 'https://mastodon.example/blobaww_static.png' },
      { shortcode: 'evil', url: 'javascript:alert(1)', static_url: '' },
    ];

    it('turns known shortcodes in a post into images', () => {
      expect(sanitizeHtml('<p>Hi :blobaww: there</p>', emojis)).toBe(
        '<p>Hi <img class="emoji" src="https://mastodon.example/blobaww.png" alt=":blobaww:" title=":blobaww:"> there</p>',
      );
    });

    it('leaves unknown shortcodes and unsafe emoji addresses as text', () => {
      expect(sanitizeHtml('<p>:unknown: :evil:</p>', emojis)).toBe('<p>:unknown: :evil:</p>');
    });

    it('does not touch shortcodes in attributes', () => {
      expect(sanitizeHtml('<a href="https://mastodon.example/:blobaww:">x</a>', emojis)).toContain('href="https://mastodon.example/:blobaww:"');
    });

    it('escapes plain text and shows emojis in names', () => {
      expect(emojify('<b>Ann</b> :blobaww:', emojis)).toBe(
        '&lt;b&gt;Ann&lt;/b&gt; <img class="emoji" src="https://mastodon.example/blobaww.png" alt=":blobaww:" title=":blobaww:">',
      );
    });
  });
});
