import type { Locale } from './i18n';

export function formatDate(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}
