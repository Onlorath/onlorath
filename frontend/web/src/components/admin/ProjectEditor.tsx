'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ProjectMedia } from '@/components/site/ProjectMedia';
import { getDictionary } from '@/i18n/dictionaries';
import { api } from '@/lib/api/client';
import {
  BUILTIN_GAMES,
  MEDIA_TYPES,
  PLACEHOLDER_ICONS,
  type MediaType,
  type Project,
  type ProjectAction,
  type ProjectInput,
  type ProjectMeta,
} from '@/lib/api/types';
import { emptyText } from '@/lib/i18n';
import {
  ColorPicker,
  errorMessage,
  LocalizedField,
  move,
  OrderTools,
  SaveBar,
  SelectField,
  TextField,
  Toggle,
  UploadField,
  type SaveStatus,
} from './fields';
import styles from './admin.module.css';

const MEDIA_OPTIONS: { value: MediaType; label: string }[] = [
  { value: 'builtin', label: 'Yerleşik mini oyun' },
  { value: 'iframe', label: 'Gömülü demo (iframe: Unity WebGL, itch.io…)' },
  { value: 'image', label: 'Görsel' },
  { value: 'video', label: 'Video (mp4 / webm)' },
  { value: 'placeholder', label: 'Yer tutucu (ikon + açıklama)' },
];
const ICON_LABEL: Record<string, string> = {
  play: 'Oynat',
  monitor: 'Ekran',
  file: 'Belge',
  board: 'Pano',
  dollar: 'Para',
  code: 'Kod',
  image: 'Görsel',
};
const GAME_LABEL: Record<string, string> = { balloons: 'Balon Patlatma' };

export const newProject = (): ProjectInput => ({
  slug: '',
  published: true,
  category: 'software',
  color: 'coral',
  title: emptyText(),
  platform: emptyText(),
  status_label: emptyText(),
  description: emptyText(),
  meta: [],
  actions: [],
  media: { type: 'placeholder', icon: 'play', caption: emptyText() },
  tech: [],
});

function toInput(p: Project): ProjectInput {
  const { slug, published, category, color, title, platform, status_label, description, meta, actions, media, tech } = p;
  return { slug, published, category, color, title, platform, status_label, description, meta, actions, media, tech };
}

const previewDict = getDictionary('tr');

export function ProjectEditor({ initial }: { initial?: Project }) {
  const router = useRouter();
  const [form, setForm] = useState<ProjectInput>(() => (initial ? toInput(initial) : newProject()));
  const [techText, setTechText] = useState(() => (initial?.tech ?? []).join(', '));
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' });

  const set = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setStatus({ kind: 'idle' });
  };
  const setMeta = (meta: ProjectMeta[]) => set('meta', meta);
  const setActions = (actions: ProjectAction[]) => set('actions', actions);
  const media = form.media;
  const setMedia = (patch: Partial<ProjectInput['media']>) => set('media', { ...media, ...patch });

  async function save(e: FormEvent) {
    e.preventDefault();
    setStatus({ kind: 'saving' });
    const body: ProjectInput = {
      ...form,
      tech: techText.split(',').map((t) => t.trim()).filter(Boolean),
      media: { ...media, height: media.height ? Number(media.height) : 0 },
    };
    try {
      if (initial) {
        const saved = await api.put<Project>(`/admin/projects/${initial.id}`, body);
        setForm(toInput(saved));
        setStatus({ kind: 'saved' });
      } else {
        const saved = await api.post<Project>('/admin/projects', body);
        router.replace(`/admin/projects/${saved.id}`);
      }
    } catch (err) {
      setStatus({ kind: 'error', message: errorMessage(err) });
    }
  }

  return (
    <form onSubmit={save}>
      <div className={styles.pageHead}>
        <div>
          <Link href="/admin/projects" className={styles.hint}>
            ← Projeler
          </Link>
          <h1 className={styles.pageTitle}>{initial ? form.title.tr || 'Proje' : 'Yeni proje'}</h1>
        </div>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Satır</h2>
        <div className={styles.stack}>
          <LocalizedField label="Başlık" value={form.title} onChange={(v) => set('title', v)} />
          <div className={styles.grid2}>
            <LocalizedField label="Tür · platform" value={form.platform} onChange={(v) => set('platform', v)} placeholder="Oyun · Web" />
            <LocalizedField label="Durum etiketi" value={form.status_label} onChange={(v) => set('status_label', v)} placeholder="Oynanabilir" />
          </div>
          <div className={styles.grid3}>
            <SelectField
              label="Kategori (filtre)"
              value={form.category}
              onChange={(v) => set('category', v)}
              options={[
                { value: 'game', label: 'Oyun' },
                { value: 'software', label: 'Yazılım & Altyapı' },
              ]}
            />
            <ColorPicker label="Renk" value={form.color} onChange={(v) => set('color', v)} />
            <div className={styles.field} style={{ justifyContent: 'flex-end' }}>
              <Toggle label="Yayında" checked={form.published} onChange={(v) => set('published', v)} />
            </div>
          </div>
          <div className={styles.grid2}>
            <TextField label="Slug" hint="boşsa başlıktan üretilir" value={form.slug} onChange={(v) => set('slug', v)} mono />
            <TextField label="Teknolojiler" hint="virgülle ayır · sohbet asistanı kullanır" value={techText} onChange={setTechText} />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Detay</h2>
        <p className={styles.cardHint}>Satır açıldığında sağda görünür.</p>
        <div className={styles.stack}>
          <LocalizedField label="Açıklama" value={form.description} onChange={(v) => set('description', v)} multiline />

          <div className={styles.field}>
            <span className={styles.label}>Bilgi satırları</span>
            <div className={styles.repeater}>
              {form.meta.map((m, i) => (
                <div key={i} className={styles.repeatItem}>
                  <div className={styles.repeatBody}>
                    <div className={styles.grid2}>
                      <LocalizedField label="Etiket" value={m.label} onChange={(v) => setMeta(form.meta.map((x, j) => (j === i ? { ...x, label: v } : x)))} placeholder="Araçlar" />
                      <LocalizedField label="Değer" value={m.value} onChange={(v) => setMeta(form.meta.map((x, j) => (j === i ? { ...x, value: v } : x)))} mono={m.mono} />
                    </div>
                    <Toggle label="Mono yazı tipi (araç listeleri için)" checked={m.mono} onChange={(v) => setMeta(form.meta.map((x, j) => (j === i ? { ...x, mono: v } : x)))} />
                  </div>
                  <OrderTools index={i} count={form.meta.length} onMove={(a, b) => setMeta(move(form.meta, a, b))} onRemove={() => setMeta(form.meta.filter((_, j) => j !== i))} />
                </div>
              ))}
              <button
                type="button"
                className="btn-pill btn-secondary btn-xs"
                style={{ alignSelf: 'flex-start' }}
                onClick={() => setMeta([...form.meta, { label: emptyText(), value: emptyText(), mono: false }])}
              >
                + Satır ekle
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Butonlar</span>
            <div className={styles.repeater}>
              {form.actions.map((a, i) => (
                <div key={i} className={styles.repeatItem}>
                  <div className={styles.repeatBody}>
                    <LocalizedField label="Yazı" value={a.label} onChange={(v) => setActions(form.actions.map((x, j) => (j === i ? { ...x, label: v } : x)))} />
                    <div className={styles.grid2}>
                      <TextField label="Bağlantı" value={a.url} onChange={(v) => setActions(form.actions.map((x, j) => (j === i ? { ...x, url: v } : x)))} mono placeholder="https://…" />
                      <SelectField
                        label="Stil"
                        value={a.variant}
                        onChange={(v) => setActions(form.actions.map((x, j) => (j === i ? { ...x, variant: v } : x)))}
                        options={[
                          { value: 'primary', label: 'Koyu (birincil)' },
                          { value: 'secondary', label: 'Açık (ikincil)' },
                        ]}
                      />
                    </div>
                  </div>
                  <OrderTools index={i} count={form.actions.length} onMove={(x, y) => setActions(move(form.actions, x, y))} onRemove={() => setActions(form.actions.filter((_, j) => j !== i))} />
                </div>
              ))}
              <button
                type="button"
                className="btn-pill btn-secondary btn-xs"
                style={{ alignSelf: 'flex-start' }}
                onClick={() => setActions([...form.actions, { label: emptyText(), url: '', variant: form.actions.length ? 'secondary' : 'primary' }])}
              >
                + Buton ekle
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Önizleme alanı</h2>
        <p className={styles.cardHint}>Satır açıldığında solda görünen alan.</p>
        <div className={styles.stack}>
          <div className={styles.grid2}>
            <SelectField label="Tür" value={media.type} options={MEDIA_OPTIONS.filter((o) => MEDIA_TYPES.includes(o.value))} onChange={(type) => setMedia({ type })} />
            <TextField
              label="Yükseklik (px)"
              hint="boşsa 320 / oyun 350"
              type="number"
              value={media.height ? String(media.height) : ''}
              onChange={(v) => setMedia({ height: v ? Number(v) : 0 })}
            />
          </div>

          {media.type === 'builtin' && (
            <SelectField
              label="Mini oyun"
              value={media.key || BUILTIN_GAMES[0]}
              options={BUILTIN_GAMES.map((k) => ({ value: k, label: GAME_LABEL[k] ?? k }))}
              onChange={(key) => setMedia({ key })}
            />
          )}
          {media.type === 'iframe' && <TextField label="Demo adresi" value={media.url ?? ''} onChange={(url) => setMedia({ url })} mono placeholder="https://itch.io/embed-upload/…" />}
          {media.type === 'image' && (
            <UploadField label="Görsel" value={media.url ?? ''} onChange={(url) => setMedia({ url })} accept="image/png,image/jpeg,image/webp,image/gif" imagePreview />
          )}
          {media.type === 'video' && <UploadField label="Video" value={media.url ?? ''} onChange={(url) => setMedia({ url })} accept="video/mp4,video/webm" />}
          {media.type === 'placeholder' && (
            <SelectField
              label="İkon"
              value={media.icon || 'play'}
              options={PLACEHOLDER_ICONS.map((k) => ({ value: k, label: ICON_LABEL[k] ?? k }))}
              onChange={(icon) => setMedia({ icon })}
            />
          )}
          <LocalizedField label="Açıklama / başlık" value={media.caption} onChange={(caption) => setMedia({ caption })} />

          <div className={`pastel-${form.color}`} style={{ display: 'flex', background: 'var(--c-soft)', padding: 20, borderRadius: 20 }}>
            <ProjectMedia media={{ ...media, key: media.type === 'builtin' ? media.key || BUILTIN_GAMES[0] : media.key }} locale="tr" dict={previewDict} />
          </div>
        </div>
      </section>

      <SaveBar status={status} label={initial ? 'Kaydet' : 'Projeyi oluştur'} />
    </form>
  );
}
