import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContactFooter } from '@/components/site/ContactFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { getDictionary } from '@/i18n/dictionaries';
import { getBlogs, getSite } from '@/lib/api/server';
import { formatDate } from '@/lib/format';
import { isLocale, pick } from '@/lib/i18n';
import { PASTELS } from '@/lib/api/types';
import styles from './blog.module.css';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? getDictionary(locale).blog.title : 'Blog' };
}

export default async function BlogIndex({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const [site, blogs] = await Promise.all([getSite(), getBlogs()]);

  return (
    <div className="container">
      <SiteHeader locale={locale} logoText={site.profile.logo_text || site.profile.name} dict={dict} active="blog" />
      <main className={styles.main}>
        <header className={styles.intro}>
          <h1 className={`font-display ${styles.title}`}>{dict.blog.title}</h1>
        </header>

        {blogs.length === 0 ? (
          <p className={styles.empty}>{dict.blog.empty}</p>
        ) : (
          <ul className={styles.grid}>
            {blogs.map((b, i) => (
              <li key={b.id} className={`pastel-${PASTELS[i % PASTELS.length]} ${styles.card} ${i === 0 ? styles.featured : ''}`}>
                <Link href={`/${locale}/blog/${b.slug}`} className={styles.cardLink}>
                  {b.cover_image && (
                    <img src={b.cover_image} alt="" className={styles.cover} loading="lazy" />
                  )}
                  <span className={`font-mono ${styles.date}`}>{formatDate(b.published_at, locale)}</span>
                  <h2 className={`font-display ${styles.cardTitle}`}>{pick(b.title, locale)}</h2>
                  {pick(b.excerpt, locale) && <p className={styles.excerpt}>{pick(b.excerpt, locale)}</p>}
                  <span className={styles.read}>{dict.blog.read} →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <ContactFooter profile={site.profile} socials={site.socials} locale={locale} dict={dict} />
    </div>
  );
}
