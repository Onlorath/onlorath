'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALES, type Locale } from '@/lib/i18n';
import styles from './LanguageSwitch.module.css';

export function LanguageSwitch({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() ?? `/${locale}`;
  const rest = pathname.replace(/^\/(tr|en)(?=\/|$)/, '');

  return (
    <span role="group" aria-label={label} className={styles.switch}>
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest}`}
          hrefLang={l}
          aria-current={l === locale ? 'true' : undefined}
          className={l === locale ? styles.active : styles.option}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </span>
  );
}
