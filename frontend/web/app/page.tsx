'use client';

import React from 'react';
import Link from 'next/link';
import { Terminal, Code2, Database, Server, GitBranch, Layout, ChevronRight, Mail } from 'lucide-react';
import TerminalWidget from '../components/TerminalWidget';
import ContactForm from '../components/ContactForm';

// Custom SVG components to replace removed brand icons from lucide-react
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

export default function App() {
  const skills = [
    { 
      category: "Backend & Systems", 
      icon: <Server className="w-5 h-5 text-emerald-400" />, 
      items: ["Go (Golang)", "PostgreSQL", "Linux / Nginx", "Docker"] 
    },
    { 
      category: "Frontend & UI", 
      icon: <Layout className="w-5 h-5 text-cyan-400" />, 
      items: ["React", "Next.js", "Tailwind CSS", "TypeScript"] 
    },
    { 
      category: "AI & Data (Exploring)", 
      icon: <Database className="w-5 h-5 text-purple-400" />, 
      items: ["Python", "FastAPI", "Microservices"] 
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-emerald-500/30">
      
      {/* Navigation */}
      <nav className="border-b border-slate-900/50 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-mono text-xl font-bold tracking-tighter text-white select-none">
            <span className="text-emerald-400">~/</span>onlorath<span className="animate-pulse">_</span>
          </div>
          <div className="flex space-x-6 text-sm font-medium">
            <Link href="#about" className="hover:text-emerald-400 transition-colors">Hakkımda</Link>
            <Link href="#skills" className="hover:text-emerald-400 transition-colors">Yetenekler</Link>
            <Link href="/projects" className="hover:text-emerald-400 transition-colors">Sistemler</Link>
            <Link href="#contact" className="hover:text-emerald-400 transition-colors">İletişim</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        
        {/* Hero Section */}
        <section id="about" className="mb-24 grid md:grid-cols-12 gap-8 items-center scroll-mt-24">
          <div className="md:col-span-7 flex flex-col justify-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
              Yazılım Geliştirici & <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                Sistem Mimarı.
              </span>
            </h1>
            <p className="text-base md:text-lg text-slate-400 max-w-xl leading-relaxed mb-8">
              Performanslı backend sistemleri tasarlıyor, modern arayüzler inşa ediyor ve farklı teknolojileri (Go, React, Python) aynı ekosistemde buluşturan ölçeklenebilir altyapılar kuruyorum. Öğrenmeyi bir varış noktası değil, bir mühendislik disiplini olarak görüyorum.
            </p>
            <div className="flex space-x-4">
              <Link href="/projects" className="px-5 py-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-medium flex items-center text-sm">
                Projeleri İncele <ChevronRight className="w-4 h-4 ml-1.5" />
              </Link>
              <Link href="#contact" className="px-5 py-3 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all font-medium flex items-center border border-slate-800 text-sm">
                <Mail className="w-4 h-4 mr-1.5" /> İletişim
              </Link>
            </div>
          </div>

          {/* Interactive Terminal Widget */}
          <div className="md:col-span-5 w-full">
            <TerminalWidget />
          </div>
        </section>

        {/* Skills Section */}
        <section id="skills" className="mb-24 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
            <Terminal className="w-6 h-6 mr-3 text-emerald-400" /> Teknoloji Yığını
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {skills.map((skill, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 hover:border-slate-700/80 hover:bg-slate-900/60 transition-all duration-200">
                <div className="flex items-center mb-4">
                  {skill.icon}
                  <h3 className="ml-3 font-semibold text-white">{skill.category}</h3>
                </div>
                <ul className="space-y-2.5 font-mono text-sm">
                  {skill.items.map((item, i) => (
                    <li key={i} className="flex items-center text-slate-400">
                      <span className="text-emerald-500/80 mr-2">▹</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>


        {/* Contact Section */}
        <section id="contact" className="mb-12 scroll-mt-24 grid md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5 space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Mail className="w-6 h-6 mr-3 text-emerald-400" /> Bağlantı Kurun
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Sistem entegrasyonu, Go backend yapılandırmaları veya genel yazılım çözümleri hakkında görüşmek için aşağıdaki kanallardan ya da formu doldurarak iletişime geçebilirsiniz.
            </p>
            <div className="space-y-3 pt-2 font-mono text-sm">
              <div className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 transition-colors">
                <span className="text-slate-600">Email:</span>
                <a href="mailto:contact@onlorath.com" className="underline decoration-emerald-500/30">contact@onlorath.com</a>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 w-full">
            <ContactForm />
          </div>
        </section>

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
