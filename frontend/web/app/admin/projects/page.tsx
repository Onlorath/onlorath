'use client';

import React, { useState, useEffect } from 'react';
import { adminProjectAPI } from '@/services';
import { Project } from '@/types';
import { Plus, Edit2, Trash2, Loader2, FolderKanban, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await adminProjectAPI.list();
      setProjects(res.data || []);
    } catch (err) {
      console.error('Failed to fetch admin projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu projeyi silmek istediğinize emin misiniz?')) return;
    try {
      await adminProjectAPI.delete(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      alert('Silme işlemi başarısız.');
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Projeler & Sistemler</h1>
          <p className="text-slate-400 mt-1 text-sm">Portfolio projelerinizi ve sistem durumlarını yönetin</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="px-4 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold text-sm flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Yeni Proje Oluştur
        </Link>
      </div>

      <div className="bg-slate-900/20 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
        {projects.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            <FolderKanban className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            Henüz proje eklenmemiş.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/40 text-xs font-semibold text-slate-400 font-mono">
                  <th className="p-4 pl-6">Başlık</th>
                  <th className="p-4">Durum (Status)</th>
                  <th className="p-4">Teknolojiler</th>
                  <th className="p-4">Sıralama</th>
                  <th className="p-4 pr-6 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-white max-w-xs truncate">{project.title}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md border ${
                        project.status === 'In Orbit' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' :
                        project.status === 'Landed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                        'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs truncate">
                      <div className="flex gap-1.5 flex-wrap">
                        {project.tech.map((t, idx) => (
                          <span key={idx} className="text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-slate-350">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-xs">{project.sort_order}</td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/projects/${project.id}/edit`}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="p-2 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 transition-colors border border-red-500/10"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
