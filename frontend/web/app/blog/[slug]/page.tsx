'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, FileText, Calendar } from 'lucide-react';
import { blogAPI } from '@/services';
import { Blog } from '@/types';
import { parseTerminalMarkdown } from '@/features/terminal/utils/terminalMarkdown';
import { useParams } from 'next/navigation';

const Github = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      blogAPI.getBySlug(slug)
        .then((res) => setBlog(res.data))
        .catch((err) => console.error('Failed to load blog log:', err))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-fuchsia-400" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans text-slate-500">
        <p className="mb-4">Log kaydı bulunamadı.</p>
        <Link href="/blog" className="text-fuchsia-450 hover:underline text-xs font-mono">
          [ LOG LİSTESİNE DÖN ]
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-350 font-sans selection:bg-fuchsia-500/30 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-slate-900/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-mono text-xl font-bold tracking-tighter text-white select-none">
            <span className="text-fuchsia-400">~/</span>onlorath<span className="animate-pulse">_</span>
          </Link>
          <div className="flex space-x-6 text-sm font-medium">
            <Link href="/#about" className="hover:text-fuchsia-400 transition-colors">Hakkımda</Link>
            <Link href="/#skills" className="hover:text-fuchsia-400 transition-colors">Yetenekler</Link>
            <Link href="/blog" className="text-fuchsia-400 transition-colors">Loglar</Link>
            <Link href="/projects" className="hover:text-fuchsia-400 transition-colors">Sistemler</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 relative flex-grow w-full">
        {/* Background visual accents */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-600/5 rounded-full blur-3xl pointer-events-none" />

        <Link 
          href="/blog" 
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-fuchsia-400 transition-colors mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Tüm Loglara Dön</span>
        </Link>

        <article className="space-y-8 relative z-10">
          <header className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {blog.title}
            </h1>
            <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(blog.created_at).toLocaleDateString('tr-TR')} tarihinde kaydedildi.</span>
            </div>
          </header>

          {blog.cover_image && (
            <div className="rounded-2xl overflow-hidden border border-slate-900 max-h-96 w-full">
              <img src={blog.cover_image} alt={blog.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="text-sm md:text-base leading-relaxed text-slate-300 space-y-4 select-text">
            {parseTerminalMarkdown(blog.content)}
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/60 py-8 bg-slate-950 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} onlorath. Engineered systematically.</p>
          <div className="flex space-x-6 mt-4 md:mt-0 font-mono text-xs">
            <a href="https://github.com/onlorath" target="_blank" rel="noopener noreferrer" className="hover:text-fuchsia-400 transition-colors flex items-center gap-1.5">
              <Github className="w-4 h-4"/> GitHub
            </a>
            <a href="https://www.linkedin.com/in/yusuf-albayrak/" target="_blank" rel="noopener noreferrer" className="hover:text-fuchsia-400 transition-colors flex items-center gap-1.5">
              <Linkedin className="w-4 h-4"/> LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
