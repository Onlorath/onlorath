import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { ChatWidget } from '@/components/site/ChatWidget';
import { getDictionary } from '@/i18n/dictionaries';
import { getSite } from '@/lib/api/server';
import { fontVariables } from '@/lib/fonts';
import { isLocale, pick } from '@/lib/i18n';
import '../../globals.css';

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

// Content is edited live in /admin, so every page renders per request (no build-time prerender).
export const dynamic = 'force-dynamic';

export const viewport: Viewport = { themeColor: '#f8f5ef' };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  try {
    const { profile } = await getSite();
    const name = profile.name || profile.logo_text;
    const role = pick(profile.role_title, locale) || undefined;
    return {
      title: { default: `${name} — ${dict.meta.title}`, template: `%s — ${name}` },
      description: role,
      alternates: { languages: { tr: '/tr', en: '/en' } },
      openGraph: { title: `${name} — ${dict.meta.title}`, description: role, locale },
    };
  } catch {
    return { title: dict.meta.title };
  }
}

export default async function SiteLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} className={fontVariables}>
      <body>
        {children}
        <ChatWidget locale={locale} dict={getDictionary(locale).chat} />
      </body>
    </html>
  );
}
