import { notFound } from 'next/navigation';
import { About } from '@/components/site/About';
import { ContactFooter } from '@/components/site/ContactFooter';
import { Hero } from '@/components/site/Hero';
import { ProjectList } from '@/components/site/ProjectList';
import { SiteHeader } from '@/components/site/SiteHeader';
import { getDictionary } from '@/i18n/dictionaries';
import { getSite } from '@/lib/api/server';
import { isLocale } from '@/lib/i18n';

export const revalidate = 60;
export const maxDuration = 60;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const site = await getSite();

  return (
    <div className="container">
      <SiteHeader locale={locale} logoText={site.profile.logo_text || site.profile.name} dict={dict} />
      <main>
        <Hero profile={site.profile} locale={locale} />
        <ProjectList projects={site.projects} locale={locale} dict={dict} />
        <About profile={site.profile} experiences={site.experiences} skills={site.skills} locale={locale} dict={dict} />
      </main>
      <ContactFooter profile={site.profile} socials={site.socials} locale={locale} dict={dict} />
    </div>
  );
}
