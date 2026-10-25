'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { errorMessage } from '@/components/admin/fields';
import styles from '@/components/admin/admin.module.css';
import { api } from '@/lib/api/client';
import type { AdminStats } from '@/lib/api/types';

const CARDS: { key: keyof AdminStats; label: string; href: string; color: string }[] = [
  { key: 'projects', label: 'Proje', href: '/admin/projects', color: 'coral' },
  { key: 'blogs_published', label: 'Yayındaki yazı', href: '/admin/blog', color: 'sky' },
  { key: 'blogs', label: 'Toplam yazı', href: '/admin/blog', color: 'lavender' },
  { key: 'unread_messages', label: 'Okunmamış mesaj', href: '/admin/messages', color: 'butter' },
];

const SHORTCUTS = [
  { href: '/admin/profile', title: 'Profil & metinler' },
  { href: '/admin/projects/new', title: 'Yeni proje' },
  { href: '/admin/blog/new', title: 'Yeni blog yazısı' },
  { href: '/admin/experiences', title: 'Deneyim' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<AdminStats>('/admin/stats').then(setStats, (e) => setError(errorMessage(e)));
  }, []);

  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Genel bakış</h1>
      </div>

      {error && <p className={styles.err}>{error}</p>}

      <div className={styles.stats}>
        {CARDS.map((c) => (
          <Link key={c.key} href={c.href} className={`pastel-${c.color} ${styles.stat}`}>
            <span className={styles.statValue}>{stats ? stats[c.key] : '–'}</span>
            <span className={styles.statLabel}>{c.label}</span>
          </Link>
        ))}
      </div>

      <div className={styles.grid2}>
        {SHORTCUTS.map((s) => (
          <Link key={s.href} href={s.href} className={styles.card}>
            <h2 className={styles.cardTitle}>{s.title} →</h2>
          </Link>
        ))}
      </div>
    </>
  );
}
