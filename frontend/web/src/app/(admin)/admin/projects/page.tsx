'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { errorMessage, move } from '@/components/admin/fields';
import styles from '@/components/admin/admin.module.css';
import { api } from '@/lib/api/client';
import type { Project } from '@/lib/api/types';

const MEDIA_LABEL: Record<string, string> = {
  builtin: 'Mini oyun',
  iframe: 'Gömülü demo',
  image: 'Görsel',
  video: 'Video',
  placeholder: 'Yer tutucu',
};

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Project[]>('/admin/projects').then(setProjects, (e) => setError(errorMessage(e)));
  }, []);

  async function reorder(from: number, to: number) {
    if (!projects) return;
    const next = move(projects, from, to);
    setProjects(next);
    try {
      await api.put('/admin/projects/reorder', { ids: next.map((p) => p.id) });
    } catch (e) {
      setError(errorMessage(e));
      setProjects(projects);
    }
  }

  async function remove(p: Project) {
    if (!confirm(`“${p.title.tr}” silinsin mi? Bu işlem geri alınamaz.`)) return;
    try {
      await api.del(`/admin/projects/${p.id}`);
      setProjects((list) => list?.filter((x) => x.id !== p.id) ?? null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Projeler</h1>
          <p className={styles.pageLead}>Ana sayfada ilk proje açık gelir.</p>
        </div>
        <Link href="/admin/projects/new" className="btn-pill btn-primary btn-sm">
          + Yeni proje
        </Link>
      </div>

      {error && <p className={styles.err}>{error}</p>}
      {!projects && !error && <p className={styles.hint}>Yükleniyor…</p>}
      {projects?.length === 0 && <div className={styles.empty}>Henüz proje yok.</div>}

      <div className={styles.list}>
        {projects?.map((p, i) => (
          <div key={p.id} className={`pastel-${p.color} ${styles.row}`}>
            <span className="font-mono" style={{ width: 24, fontSize: 13, color: 'var(--c-strong)', fontWeight: 600 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className={styles.rowSquare} />
            <div className={styles.rowMain}>
              <div className={styles.rowTitle}>{p.title.tr || p.title.en}</div>
              <div className={styles.rowSub}>
                {p.platform.tr} · {MEDIA_LABEL[p.media.type]} · /{p.slug}
              </div>
            </div>
            <div className={styles.rowTools}>
              <span className={`${styles.badge} ${p.published ? styles.badgeOn : styles.badgeOff}`}>{p.published ? 'Yayında' : 'Taslak'}</span>
              <button type="button" className={styles.iconBtn} disabled={i === 0} onClick={() => void reorder(i, i - 1)} aria-label="Yukarı taşı">
                ↑
              </button>
              <button type="button" className={styles.iconBtn} disabled={i === projects.length - 1} onClick={() => void reorder(i, i + 1)} aria-label="Aşağı taşı">
                ↓
              </button>
              <Link href={`/admin/projects/${p.id}`} className="btn-pill btn-secondary btn-xs">
                Düzenle
              </Link>
              <button type="button" className="btn-pill btn-danger btn-xs" onClick={() => void remove(p)}>
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
