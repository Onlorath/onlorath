'use client';

import { CollectionEditor } from '@/components/admin/CollectionEditor';
import { TextField } from '@/components/admin/fields';
import styles from '@/components/admin/admin.module.css';
import type { SocialLink } from '@/lib/api/types';

type SocialInput = { label: string; url: string };
const toInput = ({ label, url }: SocialLink): SocialInput => ({ label, url });

export default function SocialsPage() {
  return (
    <CollectionEditor<SocialLink, SocialInput>
      title="Sosyal linkler"
      lead="Footer’daki bağlantılar."
      endpoint="/admin/socials"
      addLabel="Link ekle"
      emptyItem={() => ({ label: '', url: '' })}
      toInput={toInput}
      renderFields={(v, set) => (
        <div className={styles.grid2}>
          <TextField label="Ad" value={v.label} onChange={(label) => set({ ...v, label })} placeholder="GitHub" />
          <TextField label="Adres" value={v.url} onChange={(url) => set({ ...v, url })} mono placeholder="https://github.com/…" />
        </div>
      )}
    />
  );
}
