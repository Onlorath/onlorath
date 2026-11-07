import Link from 'next/link';
import { Logo } from '@/components/Logo';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Locale } from '@/lib/i18n';
import { LanguageSwitch } from './LanguageSwitch';
import { NavMenu } from './NavMenu';
import styles from './SiteHeader.module.css';

interface Props {
  locale: Locale;
  logoText: string;
  dict: Dictionary;
  active?: 'blog';
}

export function SiteHeader({ locale, logoText, dict, active }: Props) {
  const home = `/${locale}`;
  return (
    <header className={styles.header}>
      <Link href={home} aria-label={logoText || dict.meta.title} className={styles.home}>
        <Logo text={logoText} />
      </Link>

      <NavMenu label={dict.nav.label} openLabel={dict.nav.menu} closeLabel={dict.nav.closeMenu}>
        <a href={`${home}#projects`} className={`nav-link ${styles.link}`}>
          {dict.nav.projects}
        </a>
        <a href={`${home}#about`} className={`nav-link ${styles.link}`}>
          {dict.nav.about}
        </a>
        <Link
          href={`${home}/blog`}
          className={`nav-link ${styles.link}`}
          aria-current={active === 'blog' ? 'page' : undefined}
        >
          {dict.nav.blog}
        </Link>
        <a href={`${home}#contact`} className={`nav-link ${styles.link}`}>
          {dict.nav.contact}
        </a>
        <div className={styles.navEnd}>
          <LanguageSwitch locale={locale} label={dict.nav.language} />
          <a href={`${home}#contact`} className={`btn-pill btn-primary btn-sm ${styles.cta}`}>
            {dict.nav.message}
          </a>
        </div>
      </NavMenu>
    </header>
  );
}
