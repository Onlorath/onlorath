'use client';

import React from 'react';
import Link from 'next/link';
import { GitBranch, Code2, ChevronLeft } from 'lucide-react';

// Custom SVG components to replace brand icons from lucide-react
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

export default function ProjectsPage() {
  const projects = [
    {
      title: "Core API Architecture",
      tech: ["Go", "PostgreSQL", "Clean Architecture", "JWT"],
      description: "Hexagonal mimari prensipleriyle sıfırdan yazılmış, ORM kullanılmadan sqlx ile optimize edilmiş ve HttpOnly cookie tabanlı güvenli JWT rotasyonuna sahip kurumsal seviye backend sistemi.",
      status: "Completed (Local)"
    },
    {
      title: "Polyglot AI Microservice",
      tech: ["Go", "Python", "Docker", "Nginx"],
      description: "Go tabanlı ana API Gateway üzerinden iç ağda Python tabanlı yapay zeka servisine (FastAPI) bağlanan, konteynerize edilmiş çok dilli (polyglot) mikroservis laboratuvarı.",
      status: "In Development"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-emerald-500/30">
      
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-mono text-xl font-bold tracking-tighter text-white select-none">
            <span className="text-emerald-400">~/</span>onlorath<span className="animate-pulse">_</span>
          </Link>
          <div className="flex space-x-6 text-sm font-medium">
            <Link href="/#about" className="hover:text-emerald-400 transition-colors">Hakkımda</Link>
            <Link href="/#skills" className="hover:text-emerald-400 transition-colors">Yetenekler</Link>
            <Link href="/projects" className="text-emerald-400 transition-colors">Sistemler</Link>
            <Link href="/#contact" className="hover:text-emerald-400 transition-colors">İletişim</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20 relative">
        {/* Background visual accents */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="mb-10 relative z-10">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-emerald-400 transition-colors mb-6 group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Ana Sayfaya Dön</span>
          </Link>

          <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center tracking-tight mb-4">
            <GitBranch className="w-8 h-8 mr-3 text-cyan-400" /> Mimari & Projeler
          </h2>
          <p className="text-slate-400 max-w-xl text-sm md:text-base leading-relaxed">
            Tasarladığım, optimize ettiğim ve geliştirdiğim temel mimari katmanları ve altyapı projeleri.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 relative z-10 mb-20">
          {projects.map((project, idx) => (
            <div key={idx} className="group bg-slate-900/30 border border-slate-800/80 rounded-xl p-6 hover:bg-slate-900/60 hover:border-slate-700/80 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-15 transition-all duration-300 group-hover:scale-110">
                <Code2 className="w-24 h-24 text-slate-400" />
              </div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="text-xl font-bold text-white tracking-tight">{project.title}</h3>
                <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 rounded border border-slate-750 text-slate-300">
                  {project.status}
                </span>
              </div>
              
              <p className="text-slate-400 text-sm leading-relaxed mb-6 relative z-10 flex-grow">
                {project.description}
              </p>
              
              <div className="flex flex-wrap gap-2 relative z-10 mt-auto">
                {project.tech.map((t, i) => (
                  <span key={i} className="text-xs font-mono text-cyan-400 bg-cyan-400/5 border border-cyan-500/10 px-2.5 py-1 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/60 py-8 bg-slate-950">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} onlorath. Engineered systematically.</p>
          <div className="flex space-x-6 mt-4 md:mt-0 font-mono text-xs">
            <a href="https://github.com/onlorath" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <Github className="w-4 h-4"/> GitHub
            </a>
            <a href="https://www.linkedin.com/in/yusuf-albayrak/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <Linkedin className="w-4 h-4"/> LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
