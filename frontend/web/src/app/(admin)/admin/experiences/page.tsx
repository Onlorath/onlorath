'use client';

import { CollectionEditor } from '@/components/admin/CollectionEditor';
import { ColorPicker, LocalizedField, TextField } from '@/components/admin/fields';
import styles from '@/components/admin/admin.module.css';
import type { Experience, ExperienceInput } from '@/lib/api/types';
import { emptyText } from '@/lib/i18n';

const empty = (): ExperienceInput => ({ period: emptyText(), title: '', subtitle: emptyText(), tag: emptyText(), color: 'sky' });
const toInput = ({ period, title, subtitle, tag, color }: Experience): ExperienceInput => ({ period, title, subtitle, tag, color });

export default function ExperiencesPage() {
  return (
    <CollectionEditor<Experience, ExperienceInput>
      title="Deneyim"
      lead="Hakkımda bölümündeki zaman çizelgesi."
      endpoint="/admin/experiences"
      addLabel="Deneyim ekle"
      emptyItem={empty}
      toInput={toInput}
      renderFields={(v, set) => (
        <>
          <div className={styles.grid2}>
            <TextField label="Kurum / proje" value={v.title} onChange={(title) => set({ ...v, title })} />
            <LocalizedField label="Dönem" value={v.period} onChange={(period) => set({ ...v, period })} placeholder="2023 — 2025" />
          </div>
          <div className={styles.grid3}>
            <LocalizedField label="Alt başlık" value={v.subtitle} onChange={(subtitle) => set({ ...v, subtitle })} />
            <LocalizedField label="Etiket" value={v.tag} onChange={(tag) => set({ ...v, tag })} placeholder="SaaS" />
            <ColorPicker label="Etiket rengi" value={v.color} onChange={(color) => set({ ...v, color })} />
          </div>
        </>
      )}
    />
  );
}
