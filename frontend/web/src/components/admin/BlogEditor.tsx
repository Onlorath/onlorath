'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '@/lib/api/client';
import type { Blog, BlogInput } from '@/lib/api/types';
import { emptyText, LOCALES, type Locale } from '@/lib/i18n';
import { errorMessage, LocalizedField, SaveBar, TextField, Toggle, UploadField, type SaveStatus } from './fields';
import styles from './admin.module.css';

const toInput = ({ slug, title, excerpt, content, cover_image, published }: Blog): BlogInput => ({ slug, title, excerpt, content, cover_image, published });

const empty = (): BlogInput => ({ slug: '', title: emptyText(), excerpt: emptyText(), content: emptyText(), cover_image: '', published: false });

export function BlogEditor({ initial }: { initial?: Blog }) {
  const router = useRouter();
  const [form, setForm] = useState<BlogInput>(() => (initial ? toInput(initial) : empty()));
  const [previewLang, setPreviewLang] = useState<Locale>('tr');
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' });

  const set = <K extends keyof BlogInput>(key: K, value: BlogInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setStatus({ kind: 'idle' });
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    setStatus({ kind: 'saving' });
    try {
      if (initial) {
        setForm(toInput(await api.put<Blog>(`/admin/blogs/${initial.id}`, form)));
        setStatus({ kind: 'saved' });
      } else {
        const saved = await api.post<Blog>('/admin/blogs', form);
        router.replace(`/admin/blog/${saved.id}`);
      }
    } catch (err) {
      const msg = errorMessage(err);
      setStatus({ kind: 'error', message: msg === 'blog slug already exists' ? 'Bu slug başka bir yazıda kullanılıyor.' : msg });
    }
  }

  return (
    <form onSubmit={save}>
      <div className={styles.pageHead}>
        <div>
          <Link href="/admin/blog" className={styles.hint}>
            ← Blog
          </Link>
          <h1 className={styles.pageTitle}>{initial ? form.title.tr || 'Yazı' : 'Yeni yazı'}</h1>
        </div>
        {initial?.published && (
          <a href={`/tr/blog/${form.slug}`} target="_blank" rel="noreferrer" className="btn-pill btn-secondary btn-sm">
            Sitede gör ↗
          </a>
        )}
      </div>

      <section className={styles.card}>
        <div className={styles.stack}>
          <LocalizedField label="Başlık" value={form.title} onChange={(v) => set('title', v)} />
          <LocalizedField label="Özet" hint="listede ve paylaşım önizlemesinde" value={form.excerpt} onChange={(v) => set('excerpt', v)} multiline rows={2} />
          <div className={styles.grid2}>
            <TextField label="Slug" hint="boşsa TR başlıktan üretilir" value={form.slug} onChange={(v) => set('slug', v)} mono />
            <div className={styles.field} style={{ justifyContent: 'flex-end' }}>
              <Toggle label="Yayınla" checked={form.published} onChange={(v) => set('published', v)} />
            </div>
          </div>
          <UploadField label="Kapak görseli" value={form.cover_image} onChange={(v) => set('cover_image', v)} accept="image/png,image/jpeg,image/webp,image/gif" imagePreview />
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>İçerik</h2>
        <p className={styles.cardHint}>Markdown: başlıklar (#), listeler, bağlantılar, kod blokları, tablolar. Görsel için önce yükleyip adresini kullan.</p>
        <div className={styles.grid2}>
          <LocalizedField label="Metin" value={form.content} onChange={(v) => set('content', v)} multiline rows={22} mono />
          <div className={styles.field}>
            <div className={styles.label}>
              <span>Önizleme</span>
              <span className={styles.langTabs}>
                {LOCALES.map((l) => (
                  <button key={l} type="button" className={l === previewLang ? styles.langTabActive : styles.langTab} onClick={() => setPreviewLang(l)}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </span>
            </div>
            <div className={`prose ${styles.preview}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content[previewLang] || '_Henüz içerik yok._'}</ReactMarkdown>
            </div>
          </div>
        </div>
      </section>

      <SaveBar status={status} label={initial ? 'Kaydet' : 'Yazıyı oluştur'} />
    </form>
  );
}
