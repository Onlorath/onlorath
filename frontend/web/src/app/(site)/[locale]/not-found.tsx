import Link from 'next/link';

// Bilingual because not-found boundaries do not receive route params.
export default function NotFound() {
  return (
    <div className="container" style={{ padding: '120px 0', maxWidth: 640 }}>
      <p className="font-mono" style={{ color: 'var(--coral-strong)', fontWeight: 600, marginBottom: 12 }}>
        404
      </p>
      <h1 className="font-display" style={{ fontSize: 40, fontWeight: 700, marginBottom: 28 }}>
        Sayfa bulunamadı · Page not found
      </h1>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/tr" className="btn-pill btn-primary">
          Ana sayfa
        </Link>
        <Link href="/en" className="btn-pill btn-secondary">
          Home
        </Link>
      </div>
    </div>
  );
}
