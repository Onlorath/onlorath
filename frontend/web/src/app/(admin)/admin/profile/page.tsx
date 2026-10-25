'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  errorMessage,
  LocalizedField,
  move,
  OrderTools,
  SaveBar,
  TextField,
  UploadField,
  type SaveStatus,
} from '@/components/admin/fields';
import styles from '@/components/admin/admin.module.css';
import { api } from '@/lib/api/client';
import type { Profile } from '@/lib/api/types';
import { emptyText } from '@/lib/i18n';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' });

  useEffect(() => {
    api.get<Profile>('/admin/profile').then(setProfile, (e) => setStatus({ kind: 'error', message: errorMessage(e) }));
  }, []);

  if (!profile) return <p className={styles.hint}>{status.kind === 'error' ? status.message : 'Yükleniyor…'}</p>;

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setProfile({ ...profile, [key]: value });
    setStatus({ kind: 'idle' });
  };
  const paragraphs = profile.about_paragraphs;

  async function save(e: FormEvent) {
    e.preventDefault();
    setStatus({ kind: 'saving' });
    try {
      setProfile(await api.put<Profile>('/admin/profile', profile));
      setStatus({ kind: 'saved' });
    } catch (err) {
      setStatus({ kind: 'error', message: errorMessage(err) });
    }
  }

  return (
    <form onSubmit={save}>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Profil & metinler</h1>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Kimlik</h2>
        <div className={styles.grid2}>
          <TextField label="İsim" value={profile.name} onChange={(v) => set('name', v)} required />
          <TextField label="Logo yazısı" value={profile.logo_text} onChange={(v) => set('logo_text', v)} required />
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Hero</h2>
        <p className={styles.cardHint}>
          Başlıkta vurgu için <code>[[sky:kelime]]</code>, eğik vurgu için <code>[[coral~:kelime]]</code> yaz. Renkler: coral, sky, butter, lavender,
          sage. Açıklamada <code>**kalın**</code> kullanılabilir.
        </p>
        <div className={styles.stack}>
          <LocalizedField label="Başlık" value={profile.hero_headline} onChange={(v) => set('hero_headline', v)} multiline rows={3} />
          <LocalizedField label="Açıklama" value={profile.hero_lead} onChange={(v) => set('hero_lead', v)} multiline rows={3} />
          <div className={styles.grid2}>
            <LocalizedField label="Unvan" value={profile.role_title} onChange={(v) => set('role_title', v)} />
            <LocalizedField label="Konum satırı" value={profile.location_line} onChange={(v) => set('location_line', v)} />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Hakkımda</h2>
        <p className={styles.cardHint}>İlk paragraf koyu, diğerleri soluk renkte gösterilir.</p>
        <div className={styles.stack}>
          <LocalizedField label="Bölüm başlığı" value={profile.about_title} onChange={(v) => set('about_title', v)} />
          <div className={styles.repeater}>
            {paragraphs.map((p, i) => (
              <div key={i} className={styles.repeatItem}>
                <div className={styles.repeatBody}>
                  <LocalizedField
                    label={`Paragraf ${i + 1}`}
                    value={p}
                    multiline
                    onChange={(v) => set('about_paragraphs', paragraphs.map((x, j) => (j === i ? v : x)))}
                  />
                </div>
                <OrderTools
                  index={i}
                  count={paragraphs.length}
                  onMove={(from, to) => set('about_paragraphs', move(paragraphs, from, to))}
                  onRemove={() => set('about_paragraphs', paragraphs.filter((_, j) => j !== i))}
                />
              </div>
            ))}
            <button type="button" className="btn-pill btn-secondary btn-xs" style={{ alignSelf: 'flex-start' }} onClick={() => set('about_paragraphs', [...paragraphs, emptyText()])}>
              + Paragraf ekle
            </button>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>İletişim & footer</h2>
        <div className={styles.stack}>
          <LocalizedField label="E-posta üstündeki metin" value={profile.contact_lead} onChange={(v) => set('contact_lead', v)} />
          <TextField label="E-posta" type="email" value={profile.email} onChange={(v) => set('email', v)} />
          <LocalizedField label="Footer notu" value={profile.footer_note} onChange={(v) => set('footer_note', v)} hint="© yıl ve isimden sonra" />
          <UploadField
            label="CV (PDF)"
            value={profile.cv_url}
            onChange={(v) => set('cv_url', v)}
            accept="application/pdf"
            hint="Boşsa sunucudaki assets/CV.pdf kullanılır"
          />
        </div>
      </section>

      <SaveBar status={status} />
    </form>
  );
}
