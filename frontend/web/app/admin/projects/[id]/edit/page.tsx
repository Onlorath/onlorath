'use client';

import React, { useState, useEffect } from 'react';
import { adminProjectAPI, Project } from '../../../../../lib/api';
import ProjectForm from '../../../../../components/ProjectForm';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function EditProjectPage() {
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      adminProjectAPI.getById(id)
        .then((res) => setProject(res.data))
        .catch((err) => console.error('Failed to load project details:', err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-red-400 font-mono text-sm">
        Proje bulunamadı.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Projeyi Düzenle</h1>
        <p className="text-slate-400 mt-1.5 text-sm">Sistem modülü detaylarını ve görsellerini güncelleyin</p>
      </div>
      <ProjectForm initialData={project} isEdit={true} />
    </div>
  );
}
