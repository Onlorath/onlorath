'use client';

import { useParams, useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { getDictionary } from '@/i18n/dictionaries';
import { isLocale } from '@/lib/i18n';

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const dict = getDictionary(isLocale(locale) ? locale : 'tr').errors;

  // reset() alone only re-renders on the client; refresh() re-runs the server render too.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <div className="container" style={{ padding: '120px 0', maxWidth: 640 }}>
      <h1 className="font-display" style={{ fontSize: 40, fontWeight: 700, marginBottom: 28 }}>
        {dict.title}
      </h1>
      <button type="button" className="btn-pill btn-primary" onClick={retry}>
        {dict.retry}
      </button>
    </div>
  );
}
