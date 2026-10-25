import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ContactFooter } from '@/components/site/ContactFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { getDictionary } from '@/i18n/dictionaries';
import { getBlog, getSite, NotFoundError } from '@/lib/api/server';
import { formatDate } from '@/lib/format';
import { isLocale, pick } from '@/lib/i18n';
import styles from '../blog.module.css';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; slug: string }> };

async function loadBlog(slug: string) {
  try {
    return await getBlog(slug);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  try {
    const blog = await getBlog(slug);
    return { title: pick(blog.title, locale), description: pick(blog.excerpt, locale) || undefined };
  } catch {
    return {};
  }
}

export default async function BlogPost({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const [site, blog] = await Promise.all([getSite(), loadBlog(slug)]);

  return (
    <div className="container">
      <SiteHeader locale={locale} logoText={site.profile.logo_text || site.profile.name} dict={dict} active="blog" />
      <main className={styles.main}>
        <article className={styles.article}>
          <Link href={`/${locale}/blog`} className={styles.back}>
            ← {dict.blog.back}
          </Link>
          <span className={`font-mono ${styles.date}`}>{formatDate(blog.published_at, locale)}</span>
          <h1 className={`font-display ${styles.postTitle}`}>{pick(blog.title, locale)}</h1>
          {pick(blog.excerpt, locale) && <p className={styles.postLead}>{pick(blog.excerpt, locale)}</p>}
          {blog.cover_image && (
            <img src={blog.cover_image} alt="" className={styles.postCover} />
          )}
          <div className="prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{pick(blog.content, locale)}</ReactMarkdown>
          </div>
        </article>
      </main>
      <ContactFooter profile={site.profile} socials={site.socials} locale={locale} dict={dict} />
    </div>
  );
}
