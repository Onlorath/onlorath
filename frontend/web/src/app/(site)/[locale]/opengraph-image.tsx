import { ImageResponse } from 'next/og';
import { getDictionary } from '@/i18n/dictionaries';
import { getSite } from '@/lib/api/server';
import { isLocale, pick } from '@/lib/i18n';

// Link preview image (Open Graph / Twitter) built from the logo mark and the profile.
export const alt = 'onlorath';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

const MARK = ['#e8765a', '#d9a826', '#529a66', '#4f83cc', '#7f65c4', '#2b2826'];

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'tr';
  const dict = getDictionary(locale);

  let name = '';
  let logo = '';
  let role = '';
  try {
    const { profile } = await getSite();
    name = profile.name;
    logo = profile.logo_text;
    role = pick(profile.role_title, locale);
  } catch {
    // API asleep or down: fall back to a generic card rather than failing the preview.
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: '#f8f5ef',
          color: '#2b2826',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', width: 108, gap: 8 }}>
            {MARK.map((c) => (
              <div key={c} style={{ width: 30, height: 30, borderRadius: 8, background: c }} />
            ))}
          </div>
          {logo && <div style={{ fontSize: 44, fontWeight: 800 }}>{logo}</div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05 }}>
            {name || dict.meta.title}
          </div>
          {role && <div style={{ fontSize: 40, color: '#6b6560' }}>{role}</div>}
        </div>

        <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden' }}>
          {MARK.slice(0, 5).map((c) => (
            <div key={c} style={{ flex: 1, background: c }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
