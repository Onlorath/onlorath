'use client';

import React, { useState, useEffect } from 'react';
import { adminBlogAPI } from '@/services';
import { Blog } from '@/types';
import { Plus, Edit2, Trash2, Loader2, FileText, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlogs = async () => {
    try {
      const res = await adminBlogAPI.list();
      setBlogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch admin blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu blog yazısını silmek istediğinize emin misiniz?')) return;
    try {
      await adminBlogAPI.delete(id);
      setBlogs(blogs.filter((b) => b.id !== id));
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
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Blog Yazıları</h1>
          <p className="text-slate-400 mt-1 text-sm">Blog içeriklerini buradan oluşturabilir ve güncelleyebilirsiniz</p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Yeni Yazı Oluştur
        </Link>
      </div>

      <div className="bg-slate-900/20 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
        {blogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            Henüz blog yazısı eklenmemiş.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/40 text-xs font-semibold text-slate-400 font-mono">
                  <th className="p-4 pl-6">Başlık</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4">Tarih</th>
                  <th className="p-4 pr-6 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-white max-w-xs truncate">{blog.title}</td>
                    <td className="p-4 text-slate-400 font-mono text-xs max-w-xs truncate">{blog.slug}</td>
                    <td className="p-4">
                      {blog.published ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                          <CheckCircle className="w-3.5 h-3.5" /> Yayında
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-500/10 px-2 py-1 rounded-md border border-slate-500/20">
                          <XCircle className="w-3.5 h-3.5" /> Taslak
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 text-xs font-mono">
                      {new Date(blog.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/blogs/${blog.id}/edit`}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(blog.id)}
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
