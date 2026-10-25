'use client';

import { CollectionEditor } from '@/components/admin/CollectionEditor';
import { TextField } from '@/components/admin/fields';
import type { Skill } from '@/lib/api/types';

type SkillInput = { label: string };
const toInput = ({ label }: Skill): SkillInput => ({ label });

export default function SkillsPage() {
  return (
    <CollectionEditor<Skill, SkillInput>
      title="Yetenekler"
      lead="Hakkımda bölümündeki etiketler."
      endpoint="/admin/skills"
      addLabel="Yetenek ekle"
      emptyItem={() => ({ label: '' })}
      toInput={toInput}
      renderFields={(v, set) => <TextField label="Etiket" value={v.label} onChange={(label) => set({ label })} mono placeholder="Go (Golang)" />}
    />
  );
}
