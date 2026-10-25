'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { errorMessage } from '@/components/admin/fields';
import styles from '@/components/admin/admin.module.css';
import { api } from '@/lib/api/client';
import type { Blog } from '@/lib/api/types';
import { formatDate } from '@/lib/format';

export default function BlogAdminPage() {
  const [blogs, setBlogs] = useState<Blog[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Blog[]>('/admin/blogs').then(setBlogs, (e) => setError(errorMessage(e)));
  }, []);

  async function remove(b: Blog) {
    if (!confirm(`“${b.title.tr}” silinsin mi? Bu işlem geri alınamaz.`)) return;
    try {
      await api.del(`/admin/blogs/${b.id}`);
      setBlogs((list) => list?.filter((x) => x.id !== b.id) ?? null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Blog</h1>
          <p className={styles.pageLead}>Taslaklar sitede görünmez.</p>
        </div>
        <Link href="/admin/blog/new" className="btn-pill btn-primary btn-sm">
          + Yeni yazı
        </Link>
      </div>

      {error && <p className={styles.err}>{error}</p>}
      {!blogs && !error && <p className={styles.hint}>Yükleniyor…</p>}
      {blogs?.length === 0 && <div className={styles.empty}>Henüz yazı yok.</div>}

      <div className={styles.list}>
        {blogs?.map((b) => (
          <div key={b.id} className={styles.row}>
            <div className={styles.rowMain}>
              <div className={styles.rowTitle}>{b.title.tr || b.title.en}</div>
              <div className={styles.rowSub}>
                /{b.slug} · {b.published ? `yayın: ${formatDate(b.published_at, 'tr')}` : `güncelleme: ${formatDate(b.updated_at, 'tr')}`}
              </div>
            </div>
            <div className={styles.rowTools}>
              <span className={`${styles.badge} ${b.published ? styles.badgeOn : styles.badgeOff}`}>{b.published ? 'Yayında' : 'Taslak'}</span>
              {b.published && (
                <a href={`/tr/blog/${b.slug}`} target="_blank" rel="noreferrer" className="btn-pill btn-secondary btn-xs">
                  Gör ↗
                </a>
              )}
              <Link href={`/admin/blog/${b.id}`} className="btn-pill btn-secondary btn-xs">
                Düzenle
              </Link>
              <button type="button" className="btn-pill btn-danger btn-xs" onClick={() => void remove(b)}>
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
