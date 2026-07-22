'use client';

import React, { useState, useEffect } from 'react';
import { adminBlogAPI, adminProjectAPI } from '@/services';
import { FileText, FolderKanban, Plus, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ blogs: 0, projects: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [blogsRes, projectsRes] = await Promise.all([
          adminBlogAPI.list(),
          adminProjectAPI.list(),
        ]);
        setStats({
          blogs: (blogsRes.data || []).length,
          projects: (projectsRes.data || []).length,
        });
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-400 mt-1.5 text-sm">Onlorath CMS yönetim paneli</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Blogs Card */}
        <div className="bg-slate-900/30 border border-white/5 p-6 rounded-2xl backdrop-blur-md flex items-center justify-between group hover:border-cyan-500/30 transition-all duration-300">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">Blog Yazıları</span>
            <div className="text-4xl font-extrabold text-white">{stats.blogs}</div>
            <div className="flex gap-3 pt-2">
              <Link
                href="/admin/blogs/new"
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Yeni Oluştur
              </Link>
              <Link
                href="/admin/blogs"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Yönet <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl group-hover:scale-105 transition-transform duration-300">
            <FileText className="w-8 h-8" />
          </div>
        </div>

        {/* Projects Card */}
        <div className="bg-slate-900/30 border border-white/5 p-6 rounded-2xl backdrop-blur-md flex items-center justify-between group hover:border-fuchsia-500/30 transition-all duration-300">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">Mimari & Projeler</span>
            <div className="text-4xl font-extrabold text-white">{stats.projects}</div>
            <div className="flex gap-3 pt-2">
              <Link
                href="/admin/projects/new"
                className="inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Yeni Oluştur
              </Link>
              <Link
                href="/admin/projects"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Yönet <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="p-4 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 rounded-xl group-hover:scale-105 transition-transform duration-300">
            <FolderKanban className="w-8 h-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
