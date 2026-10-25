import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AuthProvider } from '@/components/admin/AuthProvider';
import { fontVariables } from '@/lib/fonts';
import '../../globals.css';

export const metadata: Metadata = {
  title: { default: 'Yönetim', template: '%s — Yönetim' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={fontVariables}>
      <body>
        <AuthProvider>
          <AdminShell>{children}</AdminShell>
        </AuthProvider>
      </body>
    </html>
  );
}
