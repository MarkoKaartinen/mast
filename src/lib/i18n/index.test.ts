import { describe, expect, it } from 'vitest';
import { en } from './en';
import { fi } from './fi';
import { detectLanguage } from './index';

describe('i18n', () => {
  it('has the same keys in every language', () => {
    expect(Object.keys(fi).sort()).toEqual(Object.keys(en).sort());
  });

  it('prefers Finnish only when it comes first among supported languages', () => {
    expect(detectLanguage(['fi-FI', 'en'])).toBe('fi');
    expect(detectLanguage(['de', 'en-US', 'fi'])).toBe('en');
    expect(detectLanguage([])).toBe('en');
  });
});
