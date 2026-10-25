'use client';

import { useEffect, useState } from 'react';
import { errorMessage } from '@/components/admin/fields';
import styles from '@/components/admin/admin.module.css';
import { api } from '@/lib/api/client';
import type { ContactMessage } from '@/lib/api/types';

const dateTime = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ContactMessage[]>('/admin/messages').then(setMessages, (e) => setError(errorMessage(e)));
  }, []);

  async function setRead(m: ContactMessage, read: boolean) {
    try {
      await api.patch(`/admin/messages/${m.id}`, { read });
      setMessages((list) => list?.map((x) => (x.id === m.id ? { ...x, read } : x)) ?? null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function remove(m: ContactMessage) {
    if (!confirm(`${m.name} adlı kişinin mesajı silinsin mi?`)) return;
    try {
      await api.del(`/admin/messages/${m.id}`);
      setMessages((list) => list?.filter((x) => x.id !== m.id) ?? null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const unread = messages?.filter((m) => !m.read).length ?? 0;

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Mesajlar</h1>
          {messages && <p className={styles.pageLead}>{unread} okunmamış</p>}
        </div>
      </div>

      {error && <p className={styles.err}>{error}</p>}
      {!messages && !error && <p className={styles.hint}>Yükleniyor…</p>}
      {messages?.length === 0 && <div className={styles.empty}>Henüz mesaj yok.</div>}

      <div className={styles.list}>
        {messages?.map((m) => (
          <article key={m.id} className={`${styles.row} ${styles.message} ${m.read ? '' : styles.messageUnread}`}>
            <div className={styles.messageHead}>
              <div>
                <span className={styles.rowTitle}>{m.name}</span>{' '}
                <a href={`mailto:${m.email}`} className={styles.hint}>
                  {m.email}
                </a>
              </div>
              <span className={styles.rowSub}>
                {dateTime.format(new Date(m.created_at))} · {m.locale.toUpperCase()}
              </span>
            </div>
            <p className={styles.messageBody}>{m.message}</p>
            <div className={styles.headActions}>
              <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: onlorath')}`} className="btn-pill btn-primary btn-xs" onClick={() => !m.read && void setRead(m, true)}>
                Yanıtla
              </a>
              <button type="button" className="btn-pill btn-secondary btn-xs" onClick={() => void setRead(m, !m.read)}>
                {m.read ? 'Okunmadı işaretle' : 'Okundu işaretle'}
              </button>
              <button type="button" className="btn-pill btn-danger btn-xs" onClick={() => void remove(m)}>
                Sil
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
