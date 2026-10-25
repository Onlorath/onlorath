'use client';

import { useParams } from 'next/navigation';
import { getDictionary } from '@/i18n/dictionaries';
import { isLocale } from '@/lib/i18n';

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  const { locale } = useParams<{ locale: string }>();
  const dict = getDictionary(isLocale(locale) ? locale : 'tr').errors;

  return (
    <div className="container" style={{ padding: '120px 0', maxWidth: 640 }}>
      <h1 className="font-display" style={{ fontSize: 40, fontWeight: 700, marginBottom: 28 }}>
        {dict.title}
      </h1>
      <button type="button" className="btn-pill btn-primary" onClick={reset}>
        {dict.retry}
      </button>
    </div>
  );
}
