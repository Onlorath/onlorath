'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '@/components/Logo';
import { useAuth } from './AuthProvider';
import styles from './admin.module.css';

const NAV = [
  { href: '/admin', label: 'Genel bakış' },
  { href: '/admin/profile', label: 'Profil & metinler' },
  { href: '/admin/projects', label: 'Projeler' },
  { href: '/admin/experiences', label: 'Deneyim' },
  { href: '/admin/skills', label: 'Yetenekler' },
  { href: '/admin/socials', label: 'Sosyal linkler' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/messages', label: 'Mesajlar' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/admin/login';

  useEffect(() => {
    if (ready && !user && !isLogin) router.replace('/admin/login');
  }, [ready, user, isLogin, router]);

  if (isLogin) return <>{children}</>;

  if (!ready || !user) {
    return <div className={styles.centered}>Yükleniyor…</div>;
  }

  if (user.role !== 'admin') {
    return (
      <div className={styles.centered}>
        <p>Bu alana erişim yetkin yok.</p>
        <button type="button" className="btn-pill btn-secondary btn-sm" onClick={() => void logout()}>
          Çıkış yap
        </button>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.brand}>
          <Logo text="admin" />
        </Link>
        <nav className={styles.nav} aria-label="Yönetim menüsü">
          {NAV.map((item) => {
            const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? styles.navActive : styles.navItem} aria-current={active ? 'page' : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.sidebarFoot}>
          <a href="/tr" target="_blank" rel="noreferrer" className={styles.navItem}>
            Siteyi görüntüle ↗
          </a>
          <span className={styles.userEmail}>{user.email}</span>
          <button type="button" className="btn-pill btn-secondary btn-xs" onClick={() => void logout()}>
            Çıkış yap
          </button>
        </div>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
