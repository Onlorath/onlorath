'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Starfield } from '../../components/Starfield';
import { Loader2 } from 'lucide-react';
import { projectAPI } from '@/services';
import { Project } from '@/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
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
    projectAPI.list()
      .then((res) => setProjects(res.data || []))
      .catch((err) => console.error('Failed to load projects:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Starfield />
      <div className="aurora-bg"></div>

      

      {/* Main Content */}
      <main className="w-full px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto pt-16 pb-24 relative z-10 flex-grow">
        <header className="mb-16">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4">
            {isEn ? 'Systems' : 'Sistemler'} <span className="text-primary-fixed-dim animate-pulse">_</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            {isEn ? 'Active deployments and mission-critical applications currently operating in the production environment.' : 'Üretim ortamında aktif olarak çalışan görev kritik uygulamalar ve dağıtımlar.'}
          </p>
        </header>

        {loading ? (
          <div className="h-64 flex items-center justify-center w-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary-fixed-dim" />
          </div>
        ) : projects.length === 0 ? (
          <div className="h-64 flex items-center justify-center font-label-mono text-label-mono text-on-surface-variant border border-dashed border-outline-variant/30 rounded-none bg-surface-container/20">
            {isEn ? 'No systems found.' : 'Henüz eklenmiş bir sistem modülü bulunamadı.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {projects.map((project, index) => {
              const layoutType = index % 3;
              
              if (layoutType === 0) {
                // Horizontal 8-col layout
                return (
                  <article key={project.id} className="glass-panel rounded-none overflow-hidden md:col-span-8 flex flex-col transition-all duration-300 group">
                    <div className="p-4 border-b border-primary-fixed-dim/20 flex justify-between items-center bg-surface-container-lowest/50">
                      <span className="font-label-mono text-label-mono text-primary-fixed-dim uppercase tracking-wider">
                        [SYS-0{index + 1}] // {project.title}
                      </span>
                      <span className="px-2 py-1 rounded-none-sm border border-primary-fixed-dim text-primary-fixed-dim font-label-mono text-label-mono flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary-fixed-dim animate-pulse"></span>
                        {project.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="p-8 flex-grow flex flex-col md:flex-row gap-8">
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">{project.title}</h2>
                          <p className="font-body-md text-body-md text-on-surface-variant mb-6 line-clamp-3">
                            {project.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-8">
                            {project.tech?.map((t, i) => (
                              <span key={i} className="px-3 py-1 bg-surface-variant/50 border border-outline-variant rounded-none font-label-mono text-label-mono text-on-surface-variant">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-primary-fixed-dim/20 text-primary-fixed-dim font-label-mono text-label-mono hover:bg-primary-fixed-dim/10 hover:border-primary-fixed-dim transition-all duration-300 rounded-none group-hover:glow-sm w-max">
                          {isEn ? 'View System' : 'Sistemi Görüntüle'}
                          <span className="material-symbols-outlined text-sm">arrow_outward</span>
                        </button>
                      </div>
                      <div className="flex-1 relative rounded-none overflow-hidden border border-outline-variant/30 bg-surface-container-lowest aspect-video group-hover:border-primary-fixed-dim/30 transition-colors">
                        {project.cover_image ? (
                          <div className="bg-cover bg-center w-full h-full opacity-80 group-hover:opacity-100 transition-opacity mix-blend-screen" style={{ backgroundImage: `url('${project.cover_image}')` }}></div>
                        ) : (
                           <div className="w-full h-full flex items-center justify-center">
                             <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">dns</span>
                           </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              } else if (layoutType === 1) {
                // Vertical 4-col layout
                return (
                  <article key={project.id} className="glass-panel rounded-none overflow-hidden md:col-span-4 flex flex-col transition-all duration-300 group">
                    <div className="p-4 border-b border-primary-fixed-dim/20 flex justify-between items-center bg-surface-container-lowest/50">
                      <span className="font-label-mono text-label-mono text-secondary-fixed-dim uppercase tracking-wider">
                        [SYS-0{index + 1}] // {project.title}
                      </span>
                      <span className="px-2 py-1 rounded-none-sm border border-secondary-fixed-dim text-secondary-fixed-dim font-label-mono text-label-mono flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim animate-pulse"></span>
                        {project.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="p-8 flex-grow flex flex-col">
                      <div className="relative rounded-none overflow-hidden border border-outline-variant/30 bg-surface-container-lowest h-48 mb-6 group-hover:border-secondary-fixed-dim/30 transition-colors">
                        {project.cover_image ? (
                          <div className="bg-cover bg-center w-full h-full opacity-80 group-hover:opacity-100 transition-opacity mix-blend-screen" style={{ backgroundImage: `url('${project.cover_image}')` }}></div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">dns</span>
                          </div>
                        )}
                      </div>
                      <h2 className="font-headline-md text-headline-md text-on-surface mb-2">{project.title}</h2>
                      <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow line-clamp-3">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-8">
                        {project.tech?.map((t, i) => (
                          <span key={i} className="px-3 py-1 bg-surface-variant/50 border border-outline-variant rounded-none font-label-mono text-label-mono text-on-surface-variant">
                            {t}
                          </span>
                        ))}
                      </div>
                      <button className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-transparent border border-outline-variant/50 text-on-surface-variant font-label-mono text-label-mono hover:text-secondary-fixed-dim hover:border-secondary-fixed-dim transition-all duration-300 rounded-none">
                        {isEn ? 'View System' : 'Sistemi Görüntüle'}
                        <span className="material-symbols-outlined text-sm">arrow_outward</span>
                      </button>
                    </div>
                  </article>
                );
              } else {
                // Horizontal 12-col layout
                return (
                  <article key={project.id} className="glass-panel rounded-none overflow-hidden md:col-span-12 flex flex-col md:flex-row transition-all duration-300 group">
                    <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-primary-fixed-dim/20 bg-surface-container-lowest/50 p-8 flex flex-col justify-center">
                      <span className="font-label-mono text-label-mono text-primary-fixed-dim uppercase tracking-wider mb-2">
                        [SYS-0{index + 1}] // {project.title}
                      </span>
                      <h2 className="font-headline-md text-headline-md text-on-surface mb-4">{project.title}</h2>
                      <p className="font-body-md text-body-md text-on-surface-variant mb-6 line-clamp-3">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-8">
                        {project.tech?.map((t, i) => (
                          <span key={i} className="px-3 py-1 bg-surface-variant/50 border border-outline-variant rounded-none font-label-mono text-label-mono text-on-surface-variant">
                            {t}
                          </span>
                        ))}
                      </div>
                      <button className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-primary-fixed-dim/20 text-primary-fixed-dim font-label-mono text-label-mono hover:bg-primary-fixed-dim/10 hover:border-primary-fixed-dim transition-all duration-300 rounded-none w-max">
                        {isEn ? 'View System' : 'Sistemi Görüntüle'}
                        <span className="material-symbols-outlined text-sm">arrow_outward</span>
                      </button>
                    </div>
                    <div className="w-full md:w-2/3 p-8 flex items-center justify-center relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-container-highest to-surface-container-lowest">
                      <div className="w-full h-full rounded-none overflow-hidden border border-outline-variant/30 group-hover:border-primary-fixed-dim/30 transition-colors bg-surface-container-lowest">
                        {project.cover_image ? (
                           <div className="bg-cover bg-center w-full h-full opacity-80 group-hover:opacity-100 transition-opacity mix-blend-screen" style={{ backgroundImage: `url('${project.cover_image}')` }}></div>
                        ) : (
                           <div className="w-full h-full flex items-center justify-center">
                             <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">dns</span>
                           </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              }
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-transparent font-label-mono text-label-mono flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-8 max-w-max-width mx-auto mt-24 border-t border-primary-fixed-dim/10 opacity-80 hover:opacity-100 transition-opacity z-10 relative">
        <div className="text-on-surface-variant mb-4 md:mb-0">
          {isEn ? 'All systems online' : 'Tüm sistemler çevrimiçi'}
        </div>
        <div className="flex items-center space-x-6">
          <a className="text-on-surface-variant hover:text-primary-fixed-dim hover:glow-sm transition-all" href="https://github.com/onlorath" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a className="text-on-surface-variant hover:text-primary-fixed-dim hover:glow-sm transition-all" href="https://linkedin.com/in/yusuf-albayrak" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a className="text-on-surface-variant hover:text-primary-fixed-dim hover:glow-sm transition-all" href="mailto:ysfalbayrak02@gmail.com">Email</a>
        </div>
      </footer>
    </>
  );
}
