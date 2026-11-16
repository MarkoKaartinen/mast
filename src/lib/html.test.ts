// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from './html';

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
});
