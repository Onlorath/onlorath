'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/components/admin/AuthProvider';
import { errorMessage, TextField } from '@/components/admin/fields';
import styles from '@/components/admin/admin.module.css';

export default function LoginPage() {
  const { user, ready, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) router.replace('/admin');
  }, [ready, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace('/admin');
    } catch (err) {
      const msg = errorMessage(err);
      setError(msg === 'invalid email or password' ? 'E-posta veya şifre hatalı.' : msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.loginWrap}>
      <form className={`${styles.card} ${styles.loginCard} ${styles.stack}`} onSubmit={onSubmit}>
        <Logo text="onlorath" />
        <h1 className={styles.pageTitle}>Yönetim girişi</h1>
        <TextField label="E-posta" type="email" value={email} onChange={setEmail} required />
        <TextField label="Şifre" type="password" value={password} onChange={setPassword} required />
        <button type="submit" className="btn-pill btn-primary" disabled={busy}>
          {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
        {error && (
          <p role="alert" className={styles.err}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
