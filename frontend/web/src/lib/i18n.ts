import type { LocalizedText } from './api/types';

export const LOCALES = ['tr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'tr';

export function isLocale(value: string | undefined): value is Locale {
  return value === 'tr' || value === 'en';
}

export function pick(text: LocalizedText | undefined | null, locale: Locale): string {
  if (!text) return '';
  const primary = text[locale]?.trim();
  if (primary) return text[locale];
  return text[locale === 'tr' ? 'en' : 'tr'] ?? '';
}

export const emptyText = (): LocalizedText => ({ tr: '', en: '' });
