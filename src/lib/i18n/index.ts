import { en } from './en';
import { fi } from './fi';

export type Key = keyof typeof en;

const dictionaries: Record<string, Record<Key, string>> = { en, fi };

/** Picks the UI language from the browser: Finnish if preferred, English otherwise. */
export function detectLanguage(languages: readonly string[]): 'en' | 'fi' {
  const first = languages.find((l) => /^(fi|en)\b/i.test(l));
  return first?.toLowerCase().startsWith('fi') ? 'fi' : 'en';
}

export const lang = detectLanguage(typeof navigator === 'undefined' ? [] : navigator.languages);

export function t(key: Key): string {
  return dictionaries[lang][key];
}
