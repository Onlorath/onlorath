'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { errorMessage } from '@/components/admin/fields';
import { ProjectEditor } from '@/components/admin/ProjectEditor';
import styles from '@/components/admin/admin.module.css';
import { api } from '@/lib/api/client';
import type { Project } from '@/lib/api/types';

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Project>(`/admin/projects/${id}`).then(setProject, (e) => setError(errorMessage(e)));
  }, [id]);

  if (error) return <p className={styles.err}>{error}</p>;
  if (!project) return <p className={styles.hint}>Yükleniyor…</p>;
  // key: remount the editor when navigating from /new to the created project
  return <ProjectEditor key={project.id} initial={project} />;
}
