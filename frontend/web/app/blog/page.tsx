'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Starfield } from '../../components/Starfield';
import { Loader2 } from 'lucide-react';
import { blogAPI, Blog } from '../../lib/api';

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<'tr' | 'en'>('tr');

  useEffect(() => {
    const savedLang = localStorage.getItem('onlorath_lang');
    if (savedLang === 'en' || savedLang === 'tr') {
      setLang(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'tr' ? 'en' : 'tr';
    setLang(nextLang);
    localStorage.setItem('onlorath_lang', nextLang);
  };

  const isEn = lang === 'en';

  useEffect(() => {
    blogAPI.list()
      .then((res) => setBlogs(res.data || []))
      .catch((err) => console.error('Failed to load logs:', err))
      .finally(() => setLoading(false));
  }, []);

  const highlightedBlog = blogs.length > 0 ? blogs[0] : null;
  const listBlogs = blogs.length > 1 ? blogs.slice(1) : [];

  return (
    <>
      <Starfield />
      <div className="aurora-bg"></div>

      

      <main className="flex-grow w-full max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12 flex flex-col gap-12 relative z-10">
        <header className="flex flex-col gap-2">
          <div className="font-label-mono text-label-mono text-primary-fixed-dim flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>terminal</span>
            SYS.QUERY: SELECT * FROM MISSION_LOGS ORDER BY TIMESTAMP DESC
          </div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            {isEn ? 'System Logs' : 'Sistem Logları'}<span className="text-primary-fixed-dim cursor-blink">_</span>
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            {isEn ? 'Operational records, system updates, and technical analysis reports. Data is accessible via standard encryption protocols.' : 'Operasyonel kayıtlar, sistem güncellemeleri ve teknik analiz raporları. Veriler standart şifreleme protokolleri ile erişime açıktır.'}
          </p>
        </header>

        {loading ? (
          <div className="h-64 flex items-center justify-center w-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary-fixed-dim" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="h-64 flex items-center justify-center font-label-mono text-label-mono text-on-surface-variant border border-dashed border-outline-variant/30 rounded-none bg-surface-container/20">
            {isEn ? 'No log entries found.' : 'Henüz eklenmiş bir log kaydı bulunamadı.'}
          </div>
        ) : (
          <>
            {highlightedBlog && (
              <Link href={`/blog/${highlightedBlog.slug}`} className="block">
                <section className="glass-panel p-6 md:p-8 rounded-none flex flex-col md:flex-row gap-8 items-center group glow-hover transition-all duration-300 cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/5 rounded-full blur-3xl group-hover:bg-primary-container/10 transition-all"></div>
                  <div className="w-full md:w-1/2 aspect-video rounded-none border border-outline-variant/30 overflow-hidden relative">
                    <div className="absolute top-2 left-2 z-10 bg-surface-container-lowest/80 backdrop-blur font-label-mono text-label-mono text-primary-fixed-dim px-2 py-1 rounded-none border border-primary-fixed-dim/30">
                      {isEn ? 'HIGHLIGHTED_' : 'ÖNE ÇIKAN_'}
                    </div>
                    {highlightedBlog.cover_image ? (
                      <img 
                        src={highlightedBlog.cover_image} 
                        alt={highlightedBlog.title} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105 transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                         <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">description</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full md:w-1/2 flex flex-col gap-4 z-10">
                    <div className="flex gap-2 items-center font-label-mono text-label-mono text-on-surface-variant">
                      <span className="text-secondary-fixed-dim">[{new Date(highlightedBlog.created_at).toLocaleDateString('tr-TR')}]</span>
                      <span className="w-1 h-1 bg-surface-variant rounded-full"></span>
                      <span>{isEn ? 'SYSTEM LOG' : 'SİSTEM LOGU'}</span>
                    </div>
                    <h2 className="font-headline-md text-headline-md text-primary group-hover:text-primary-fixed-dim transition-colors">
                      {highlightedBlog.title}
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3">
                      {highlightedBlog.content.replace(/[#*`_[\]()]/g, '')}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-1 bg-surface-container border border-outline-variant/30 rounded-none text-primary-fixed-dim font-label-mono text-label-mono">LOG</span>
                    </div>
                  </div>
                </section>
              </Link>
            )}

            {listBlogs.length > 0 && (
              <section className="flex flex-col gap-0 border-t border-surface-variant">
                {listBlogs.map((blog) => (
                  <Link key={blog.id} href={`/blog/${blog.slug}`} className="block">
                    <article className="group flex flex-col md:flex-row gap-4 p-4 md:p-6 border-b border-surface-variant hover:bg-surface-container/20 transition-colors cursor-pointer items-start md:items-center">
                      <div className="w-full md:w-48 font-label-mono text-label-mono text-secondary-fixed-dim shrink-0 mt-1 md:mt-0">
                        [{new Date(blog.created_at).toLocaleDateString('tr-TR')}]
                      </div>
                      <div className="flex-grow flex flex-col gap-1">
                        <h3 className="font-headline-md text-[20px] font-medium text-on-surface group-hover:text-primary-fixed-dim transition-colors">
                          {blog.title}
                        </h3>
                        <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
                          {blog.content.replace(/[#*`_[\]()]/g, '')}
                        </p>
                      </div>
                      <div className="hidden lg:flex gap-2 shrink-0">
                        <span className="px-2 py-1 border border-outline-variant/50 rounded-none text-on-surface-variant font-label-mono text-label-mono">LOG</span>
                      </div>
                    </article>
                  </Link>
                ))}
              </section>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-transparent border-t border-primary-fixed-dim/10 mt-auto relative z-20">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-8 max-w-max-width mx-auto">
          <div className="font-label-mono text-label-mono text-primary-fixed-dim mb-4 md:mb-0 opacity-80">
            {isEn ? 'All systems online' : 'Tüm sistemler çevrimiçi'}
          </div>
          <ul className="flex gap-6">
            <li><a className="font-label-mono text-label-mono text-on-surface-variant hover:text-primary-fixed-dim hover:glow-sm transition-all opacity-80 hover:opacity-100" href="https://github.com/onlorath" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><a className="font-label-mono text-label-mono text-on-surface-variant hover:text-primary-fixed-dim hover:glow-sm transition-all opacity-80 hover:opacity-100" href="https://linkedin.com/in/yusuf-albayrak" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            <li><a className="font-label-mono text-label-mono text-on-surface-variant hover:text-primary-fixed-dim hover:glow-sm transition-all opacity-80 hover:opacity-100" href="mailto:ysfalbayrak02@gmail.com">Email</a></li>
          </ul>
        </div>
      </footer>
    </>
  );
}
