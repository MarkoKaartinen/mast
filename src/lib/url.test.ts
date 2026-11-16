import { describe, expect, it } from 'vitest';
import { normalizeInstance, safeHttpUrl } from './url';

describe('safeHttpUrl', () => {
  it('accepts http and https', () => {
    expect(safeHttpUrl('https://mastodon.example/a')).toBe('https://mastodon.example/a');
    expect(safeHttpUrl('http://mastodon.example')).toBe('http://mastodon.example/');
  });

  it('rejects other schemes and non-strings', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('data:text/html,x')).toBeNull();
    expect(safeHttpUrl('not a url')).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
  });
});

describe('normalizeInstance', () => {
  it('accepts a bare host, a URL and a profile URL', () => {
    expect(normalizeInstance('Mastodon.Example')).toBe('https://mastodon.example');
    expect(normalizeInstance(' https://mastodon.example/@me ')).toBe('https://mastodon.example');
    expect(normalizeInstance('mastodon.example:8443')).toBe('https://mastodon.example:8443');
  });

  it('rejects things that are not host names', () => {
    expect(normalizeInstance('')).toBeNull();
    expect(normalizeInstance('localhost')).toBeNull();
    expect(normalizeInstance('user@mastodon.example')).toBeNull();
    expect(normalizeInstance('mastodon .example')).toBeNull();
  });
});
