'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Database, Server, GitBranch, Layout, ChevronRight, FileText } from 'lucide-react';
import TerminalWidget from '../components/TerminalWidget';
import Rocket3D from '../components/Rocket3D';
import ChatWidget from '../components/ChatWidget';
import Link from 'next/link';

// Custom SVG components to replace brand icons
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


// Harici kütüphanesiz saf Canvas Yıldız Motoru
const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;
    let stars: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
    }> = [];

    const initStars = () => {
      stars = Array.from({ length: 200 }).map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random()
      }));
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();

        star.x += star.vx;
        star.y += star.vy;

        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        star.alpha += (Math.random() - 0.5) * 0.05;
        if (star.alpha < 0.1) star.alpha = 0.1;
        if (star.alpha > 1) star.alpha = 1;
      });

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-60 mix-blend-screen" />;
};



export default function App() {
  const skills = [
    { category: "Core Systems", icon: <Server className="w-5 h-5 text-cyan-400" />, items: ["Go (Golang) / NestJS", "PostgreSQL / MongoDB", "Linux / Nginx / Redis", "Docker / Kubernetes"] },
    { category: "Interface & State", icon: <Layout className="w-5 h-5 text-fuchsia-400" />, items: ["React / Next.js", "Redux / Redux Toolkit", "Tailwind CSS / TypeScript", "JavaScript (ES6+)"] },
    { category: "AI & Cloud Integration", icon: <Database className="w-5 h-5 text-indigo-400" />, items: ["OpenAI & Gemini APIs", "RAG (Retrieval-Augmented)", "FastAPI / Python", "AWS / Azure / GCP"] }
  ];



  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      
      {/* Nebula Efekti */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050505] to-[#050505]"></div>
      <Starfield />
      <Rocket3D />
      <ChatWidget />

      <div className="relative z-10 flex flex-col min-h-screen">
        <nav className="border-b border-white/5 bg-[#050505]/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="font-mono text-xl font-bold tracking-tighter text-white flex items-center select-none">
              <span className="text-cyan-500">~/</span>onlorath<span className="animate-pulse text-fuchsia-500">_</span>
            </div>
            <div className="flex space-x-6 text-sm font-medium">
              <a href="#about" className="hover:text-cyan-400 transition-colors">Yörünge</a>
              <a href="#skills" className="hover:text-cyan-400 transition-colors">Modüller</a>
              <Link href="/projects" className="hover:text-cyan-400 transition-colors">Sistemler</Link>
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-6 py-24 md:py-32 flex-grow w-full">
          
          <section id="about" className="mb-48 grid md:grid-cols-12 gap-8 items-center scroll-mt-24">
            <div className="md:col-span-7 flex flex-col justify-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight drop-shadow-[0_0_15px_rgba(34,211,238,0.2)] animate-fade-in-up">
                Yazılım Geliştirici & <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-500">
                  Sistem Mimarı.
                </span>
              </h1>
              <p className="text-lg text-slate-400 max-w-xl leading-relaxed mb-8">
                2.5 yıldan fazla profesyonel deneyime sahip Full Stack Geliştirici olarak GoLang, TypeScript, NestJS ve React kullanarak performanslı mikroservis mimarileri tasarlıyor, yapay zeka entegrasyonları kuruyor ve Kubernetes/Docker altyapı yönetimiyle ölçeklenebilir sistemler inşa ediyorum.
              </p>
              <div className="flex flex-wrap gap-4 mb-4">
                <a href="#projects" className="px-5 py-3 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all font-medium flex items-center text-sm">
                  Sistemleri İncele <ChevronRight className="w-4 h-4 ml-1.5" />
                </a>
                <a 
                  href="/CV.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-5 py-3 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 hover:bg-fuchsia-500/20 transition-all font-medium flex items-center text-sm"
                >
                  CV'mi Görüntüle <FileText className="w-4 h-4 ml-1.5" />
                </a>
                <a href="mailto:ysfalbayrak02@gmail.com" className="px-5 py-3 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all font-medium flex items-center border border-slate-800/80 text-sm">
                  İletişime Geç (Email)
                </a>
              </div>
              <p className="text-xs font-mono text-cyan-500/70">Ateşlemeyi başlatmak için aşağı kaydırın ↓</p>
            </div>

            {/* Interactive Terminal Widget */}
            <div className="md:col-span-5 w-full relative z-10">
              <TerminalWidget />
            </div>
          </section>

          <section id="skills" className="mb-48 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
              <Terminal className="w-6 h-6 mr-3 text-cyan-400" /> Teknoloji Modülleri
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {skills.map((skill, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:bg-slate-900/60 transition-all backdrop-blur-md group">
                  <div className="flex items-center mb-4">
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                      {skill.icon}
                    </div>
                    <h3 className="ml-3 font-semibold text-white tracking-wide">{skill.category}</h3>
                  </div>
                  <ul className="space-y-2 font-mono text-sm">
                    {skill.items.map((item, i) => (
                      <li key={i} className="flex items-center text-slate-400 group-hover:text-slate-300 transition-colors">
                        <span className="text-cyan-500/50 mr-2">▹</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section id="projects" className="mb-48 scroll-mt-24 md:pr-16">
            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-8 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
              <div className="absolute top-1/2 right-4 -translate-y-1/2 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-300" />
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-white flex items-center tracking-tight">
                    <GitBranch className="w-6 h-6 mr-3 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" /> 
                    Mimari & Projeler
                  </h2>
                  <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                    Sıfırdan tasarladığım k3s/Kubernetes müzik platformu (Muzigin.com), Clean Architecture Go kurumsal backend tasarımları ve mikroservis entegrasyonlarımı detaylı olarak inceleyin.
                  </p>
                </div>
                
                <Link 
                  href="/projects" 
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/10 active:scale-98 transition-all whitespace-nowrap text-sm"
                >
                  Tüm Projeleri İncele <ChevronRight className="w-4.5 h-4.5" />
                </Link>
              </div>
            </div>
          </section>



        </main>

        {/* Footer & Ay Yüzeyi */}
        <footer className="relative pt-32 pb-8 overflow-hidden mt-auto">
          {/* Vektörel Ay Yüzeyi */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-slate-900 rounded-t-[100%] border-t border-slate-800 -z-10 shadow-[0_-10px_40px_rgba(255,255,255,0.05)]">
            {/* Krater detayları */}
            <div className="absolute top-8 left-[20%] w-12 h-4 rounded-[100%] bg-slate-950/50 border border-slate-800/50"></div>
            <div className="absolute top-16 left-[60%] w-24 h-6 rounded-[100%] bg-slate-950/50 border border-slate-800/50"></div>
            <div className="absolute top-12 left-[80%] w-8 h-2 rounded-[100%] bg-slate-950/50 border border-slate-800/50"></div>
          </div>

          <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-end text-sm text-slate-500 relative z-10 h-full">
            <p className="font-mono">© {new Date().getFullYear()} onlorath. // Touchdown confirmed.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="https://github.com/onlorath" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors flex items-center"><Github className="w-4 h-4 mr-1"/> GitHub</a>
              <a href="https://linkedin.com/in/yusuf-albayrak" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors flex items-center"><Linkedin className="w-4 h-4 mr-1"/> LinkedIn</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

