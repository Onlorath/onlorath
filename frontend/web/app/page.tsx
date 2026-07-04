'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Database, Server, Layout, ChevronRight, FileText, Menu, X, Radio, Activity, Cpu, Mail } from 'lucide-react';
import TerminalWidget from '../components/TerminalWidget';
import Rocket3D from '../components/Rocket3D';
import Link from 'next/link';
import { blogAPI, projectAPI, Blog, Project } from '../lib/api';

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
      phase: number;
      speed: number;
      minAlpha: number;
      maxAlpha: number;
    }> = [];

    const initStars = () => {
      stars = Array.from({ length: 200 }).map(() => {
        const minAlpha = 0.05 + Math.random() * 0.15;
        const maxAlpha = minAlpha + 0.3 + Math.random() * 0.5;
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: 0.5 + Math.random() * 1.0,
          phase: Math.random() * Math.PI * 2,
          speed: 1.0 + Math.random() * 3.0,
          minAlpha,
          maxAlpha
        };
      });
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
      const time = performance.now() * 0.001;
      
      stars.forEach(star => {
        const alpha = star.minAlpha + (star.maxAlpha - star.minAlpha) * (Math.sin(time * star.speed + star.phase) + 1) * 0.5;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
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

const Typewriter = ({ text, speed = 30 }: { text: string; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <h2 className="font-mono text-lg md:text-xl font-medium tracking-tight text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">
      {displayedText}
      <span className="animate-pulse text-fuchsia-500 ml-1 font-bold">_</span>
    </h2>
  );
};

const translations = {
  tr: {
    orbit: "Yörünge",
    modules: "Modüller",
    logs: "Loglar (Blog)",
    systems: "Sistemler (Projeler)",
    contact: "İletişim",
    connecting: "Bağlantı kuruluyor...",
    online: "Sistemler çevrimiçi. Yörüngeye giriliyor...",
    titlePart1: "Yazılım Geliştirici &",
    titlePart2: "Sistem Mimarı.",
    aboutText: "2.5 yıldan fazla profesyonel deneyime sahip Full Stack Geliştirici olarak GoLang, TypeScript, NestJS ve React kullanarak performanslı mikroservis mimarileri tasarlıyor, yapay zeka entegrasyonları kuruyor ve Kubernetes/Docker altyapı yönetimiyle ölçeklenebilir sistemler inşa ediyorum.",
    viewSystems: "Sistemleri İncele",
    viewCV: "CV'mi Görüntüle",
    contactEmail: "İletişime Geç (Email)",
    shellTitle: "Interactive Shell",
    shellSubtitle: "Sistem hakkında detaylı bilgi edinmek için komut girin veya yapay zeka ile doğrudan sohbete başlayın.",
    telemetryTitle: "Telemetry Dashboard (Modüller)",
    coreSystems: "Core Systems",
    interfaceState: "Interface & State",
    aiCloud: "AI & Cloud",
    missionLogs: "Mission Log (Yazılar)",
    readLog: "[ LOGU OKU → ]",
    activeProjects: "Active Systems (Projeler)",
    viewAll: "Tümünü Gör",
    offlineSystems: "Sistem modülleri şu an çevrimdışı.",
    getInTouch: "Get in Touch",
    contactDesc: "Sistem mimarisi, entegrasyonlar veya iş birliği projeleri hakkında doğrudan iletişim kurun.",
    emailLabel: "E-POSTA",
    githubLabel: "GITHUB",
    linkedinLabel: "LINKEDIN",
    touchdown: "Touchdown confirmed.",
  },
  en: {
    orbit: "Orbit",
    modules: "Modules",
    logs: "Logs (Blog)",
    systems: "Systems (Projects)",
    contact: "Contact",
    connecting: "Establishing connection...",
    online: "Systems online. Entering orbit...",
    titlePart1: "Software Developer &",
    titlePart2: "System Architect.",
    aboutText: "A Full Stack Developer with over 2.5 years of professional experience, I design high-performance microservice architectures using GoLang, TypeScript, NestJS, and React, establish AI integrations, and build scalable systems with Kubernetes/Docker infrastructure management.",
    viewSystems: "Explore Systems",
    viewCV: "View Resume",
    contactEmail: "Contact (Email)",
    shellTitle: "Interactive Shell",
    shellSubtitle: "Enter a command or start chatting with AI to learn more about the system.",
    telemetryTitle: "Telemetry Dashboard (Modules)",
    coreSystems: "Core Systems",
    interfaceState: "Interface & State",
    aiCloud: "AI & Cloud",
    missionLogs: "Mission Log (Latest Posts)",
    readLog: "[ READ LOG → ]",
    activeProjects: "Active Systems (Projects)",
    viewAll: "View All",
    offlineSystems: "System modules are currently offline.",
    getInTouch: "Get in Touch",
    contactDesc: "Get in touch directly regarding system architecture, integrations, or collaboration projects.",
    emailLabel: "EMAIL",
    githubLabel: "GITHUB",
    linkedinLabel: "LINKEDIN",
    touchdown: "Touchdown confirmed.",
  }
};

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [isIntroRunning, setIsIntroRunning] = useState(true);
  const [introPhase, setIntroPhase] = useState<'typing1' | 'typing2' | 'flying' | 'fading' | 'completed'>('typing1');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<'tr' | 'en'>('tr');

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // Synchronize language state
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [blogsRes, projectsRes] = await Promise.all([
          blogAPI.list(),
          projectAPI.list(),
        ]);
        setBlogs((blogsRes.data || []).slice(0, 3)); // Display last 3 blog posts
        setProjects(projectsRes.data || []);
      } catch (err) {
        console.error('Failed to load dynamic homepage data:', err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);
    }

    const lastIntroTime = localStorage.getItem('last_intro_time');
    const now = Date.now();

    if (lastIntroTime && now - parseInt(lastIntroTime, 10) < 600000) {
      setIsIntroRunning(false);
      setIntroPhase('completed');
    } else {
      localStorage.setItem('last_intro_time', now.toString());

      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      if (isMobile) {
        // Skip flying animation on mobile
        const timer1 = setTimeout(() => {
          setIntroPhase('fading');
          setTimeout(() => {
            setIntroPhase('completed');
            setIsIntroRunning(false);
          }, 800);
        }, 1500);
        return () => clearTimeout(timer1);
      }

      const timer1 = setTimeout(() => {
        setIntroPhase('typing2');
      }, 1500);

      const timer2 = setTimeout(() => {
        setIntroPhase('flying');
      }, 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (isIntroRunning) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isIntroRunning, isMounted]);

  const t = translations[lang];

  const skills = [
    { category: t.coreSystems, icon: <Server className="w-5 h-5 text-cyan-400" />, items: ["Go (Golang) / NestJS", "PostgreSQL / MongoDB", "Linux / Nginx / Redis", "Docker / Kubernetes"] },
    { category: t.interfaceState, icon: <Layout className="w-5 h-5 text-fuchsia-400" />, items: ["React / Next.js", "Redux / Redux Toolkit", "Tailwind CSS / TypeScript", "JavaScript (ES6+)"] },
    { category: t.aiCloud, icon: <Database className="w-5 h-5 text-indigo-400" />, items: ["OpenAI & Gemini APIs", "RAG (Retrieval-Augmented)", "FastAPI / Python", "AWS / Azure / GCP"] }
  ];

  if (!isMounted) {
    return <div className="min-h-screen bg-[#050505]" />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      
      {/* Nebula Efekti */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050505] to-[#050505]"></div>
      <Starfield />
      <Rocket3D 
        introPhase={introPhase} 
        onFlyingComplete={() => {
          setIntroPhase('fading');
          setTimeout(() => {
            setIntroPhase('completed');
            setIsIntroRunning(false);
          }, 1000);
        }}
      />

      {/* Intro Overlay */}
      {introPhase !== 'completed' && (
        <div 
          className={`fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-[100] transition-opacity duration-1000 ${
            introPhase === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Background grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

          {/* Typewriter message */}
          <div className="text-center relative z-10 space-y-4 px-6 max-w-lg">
            <div className="h-8 flex items-center justify-center">
              {introPhase === 'typing1' && (
                <Typewriter text={t.connecting} speed={35} />
              )}
              {(introPhase === 'typing2' || introPhase === 'flying' || introPhase === 'fading') && (
                <Typewriter text={t.online} speed={25} />
              )}
            </div>

            {/* Decorative loading bar */}
            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mt-8 relative mx-auto">
              <div 
                className={`h-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-full transition-all duration-[3000ms] ease-out ${
                  introPhase !== 'typing1' ? 'w-full' : 'w-1/3'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        <nav className="border-b border-white/5 bg-[#050505]/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="font-mono text-xl font-bold tracking-tighter text-white flex items-center select-none">
              <span className="text-cyan-500">~/</span>onlorath<span className="animate-pulse text-fuchsia-500">_</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <a href="#about" className="hover:text-cyan-400 transition-colors">{t.orbit}</a>
              <a href="#skills" className="hover:text-cyan-400 transition-colors">{t.modules}</a>
              <a href="#blog" className="hover:text-cyan-400 transition-colors">{t.logs}</a>
              <Link href="/projects" className="hover:text-cyan-400 transition-colors">{t.systems}</Link>
              <a href="#contact" className="hover:text-cyan-400 transition-colors">{t.contact}</a>
              <button 
                onClick={toggleLanguage}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all font-mono text-xs flex items-center gap-1 select-none"
              >
                <span>🌐</span> {lang === 'tr' ? 'EN' : 'TR'}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1 text-slate-400 hover:text-white transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/5 bg-[#050505]/95 backdrop-blur-xl px-6 py-4 flex flex-col space-y-4 text-sm font-medium animate-fade-in-down">
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-cyan-400 py-2 transition-colors border-b border-white/5"
              >
                {t.orbit}
              </a>
              <a
                href="#skills"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-cyan-400 py-2 transition-colors border-b border-white/5"
              >
                {t.modules}
              </a>
              <a
                href="#blog"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-cyan-400 py-2 transition-colors border-b border-white/5"
              >
                {t.logs}
              </a>
              <Link
                href="/projects"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-cyan-400 py-2 transition-colors border-b border-white/5"
              >
                {t.systems}
              </Link>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-cyan-400 py-2 transition-colors"
              >
                {t.contact}
              </a>
              <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-mono">LANGUAGE / DİL</span>
                <button 
                  onClick={toggleLanguage}
                  className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-350 hover:text-cyan-400 font-mono text-xs"
                >
                  🌐 {lang === 'tr' ? 'English (EN)' : 'Türkçe (TR)'}
                </button>
              </div>
            </div>
          )}
        </nav>

        <main className="max-w-5xl mx-auto px-6 py-24 md:py-32 flex-grow w-full">
          
          <section id="about" className="mb-24 scroll-mt-24">
            <div className="max-w-3xl mx-auto flex flex-col items-center text-center justify-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight drop-shadow-[0_0_15px_rgba(34,211,238,0.2)] animate-fade-in-up">
                {t.titlePart1} <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-500">
                  {t.titlePart2}
                </span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-2xl">
                {t.aboutText}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="#projects" className="px-5 py-3 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all font-medium flex items-center text-sm">
                  {t.viewSystems} <ChevronRight className="w-4 h-4 ml-1.5" />
                </a>
                <a 
                  href="/CV.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-5 py-3 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 hover:bg-fuchsia-500/20 transition-all font-medium flex items-center text-sm"
                >
                  {t.viewCV} <FileText className="w-4 h-4 ml-1.5" />
                </a>
                <a href="mailto:ysfalbayrak02@gmail.com" className="px-5 py-3 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all font-medium flex items-center border border-slate-800/80 text-sm">
                  {t.contactEmail}
                </a>
              </div>
            </div>
          </section>

          {/* Interactive Terminal Console Section */}
          <section className="mb-48 max-w-4xl mx-auto w-full relative z-10 scroll-mt-24">
            <div className="text-center mb-6">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[10px] uppercase tracking-wider">
                {t.shellTitle}
              </span>
              <p className="text-slate-400 text-xs mt-2.5 font-mono">
                {t.shellSubtitle}
              </p>
            </div>
            <TerminalWidget lang={lang} />
          </section>

          <section id="skills" className="mb-48 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
              <Activity className="w-6 h-6 mr-3 text-cyan-400" /> {t.telemetryTitle}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {skills.map((skillGroup, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md hover:border-cyan-500/30 transition-all duration-300 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
                    {idx === 0 ? <Server className="w-16 h-16 text-cyan-400" /> : idx === 1 ? <Layout className="w-16 h-16 text-fuchsia-400" /> : <Database className="w-16 h-16 text-indigo-400" />}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${idx === 0 ? 'bg-cyan-400' : idx === 1 ? 'bg-fuchsia-500' : 'bg-indigo-500'}`}></span>
                    {skillGroup.category}
                  </h3>
                  <ul className="space-y-2.5 font-mono text-sm">
                    {skillGroup.items.map((name, i) => (
                      <li key={i} className="flex items-center text-slate-400 group-hover:text-slate-200 transition-colors">
                        <span className={`mr-2.5 ${idx === 0 ? 'text-cyan-500/60' : idx === 1 ? 'text-fuchsia-500/60' : 'text-indigo-500/60'}`}>▹</span> {name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Mission Log (Blog Feed) */}
          {blogs.length > 0 && (
            <section id="blog" className="mb-48 scroll-mt-24">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                <Radio className="w-6 h-6 mr-3 text-fuchsia-400 animate-pulse" /> {t.missionLogs}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {blogs.map((blog) => (
                  <Link
                    key={blog.id}
                    href={`/blog/${blog.slug}`}
                    className="group flex flex-col bg-slate-950/40 border border-slate-900 rounded-2xl overflow-hidden hover:border-fuchsia-500/30 transition-all duration-300 hover:translate-y-[-2px] h-full"
                  >
                    {blog.cover_image ? (
                      <div className="h-40 w-full overflow-hidden relative">
                        <img
                          src={blog.cover_image}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="h-40 w-full bg-slate-950 border-b border-slate-900 flex items-center justify-center text-slate-750">
                        <FileText className="w-12 h-12" />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1 space-y-3">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        {new Date(blog.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR')}
                      </span>
                      <h3 className="font-bold text-white text-base leading-snug group-hover:text-fuchsia-400 transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed flex-grow">
                        {blog.content.replace(/[#*`_[\]()]/g, '')}
                      </p>
                      <div className="text-[11px] font-semibold text-fuchsia-400 tracking-wider flex items-center font-mono pt-2">
                        {t.readLog}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Active Systems (Projects Grid) */}
          <section id="projects" className="mb-48 scroll-mt-24">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                <Cpu className="w-6 h-6 mr-3 text-cyan-400" /> {t.activeProjects}
              </h2>
              <Link
                href="/projects"
                className="text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                {t.viewAll} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="p-8 text-center text-slate-600 font-mono text-xs border border-dashed border-slate-900 rounded-2xl bg-slate-950/20">
                {t.offlineSystems}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {projects.slice(0, 4).map((project) => (
                  <div
                    key={project.id}
                    className="group relative bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between h-full"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors leading-snug">
                          {project.title}
                        </h3>
                        <span className={`shrink-0 flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                          project.status === 'In Orbit' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' :
                          project.status === 'Landed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                          'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 animate-pulse'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            project.status === 'In Orbit' ? 'bg-cyan-400 animate-ping' :
                            project.status === 'Landed' ? 'bg-emerald-400' :
                            'bg-yellow-400'
                          }`}></span>
                          {project.status === 'In Orbit' ? (lang === 'en' ? 'In Orbit' : 'Yörüngede') :
                           project.status === 'Landed' ? (lang === 'en' ? 'Landed' : 'İniş Yaptı') :
                           (lang === 'en' ? 'In Development' : 'Geliştiriliyor')}
                        </span>
                      </div>

                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                        {project.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-5">
                      {project.tech.map((t, idx) => (
                        <span key={idx} className="text-[10px] font-mono text-cyan-400 bg-cyan-400/5 border border-cyan-500/10 px-2 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Get in Touch Section */}
          <section id="contact" className="mb-24 scroll-mt-24 max-w-xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-white mb-4 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
              {t.getInTouch}
            </h2>
            <p className="text-slate-400 text-sm text-center mb-8 max-w-sm mx-auto leading-relaxed">
              {t.contactDesc}
            </p>
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4">
              <a
                href="mailto:ysfalbayrak02@gmail.com"
                className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-850 hover:border-cyan-500/30 hover:bg-slate-950 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-mono">{t.emailLabel}</div>
                    <div className="text-sm font-semibold text-white">ysfalbayrak02@gmail.com</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </a>

              <a
                href="https://github.com/onlorath"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-850 hover:border-fuchsia-500/30 hover:bg-slate-950 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 group-hover:scale-105 transition-transform">
                    <Github className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-mono">{t.githubLabel}</div>
                    <div className="text-sm font-semibold text-white">github.com/onlorath</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </a>

              <a
                href="https://linkedin.com/in/yusuf-albayrak"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-850 hover:border-indigo-500/30 hover:bg-slate-950 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
                    <Linkedin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-mono">{t.linkedinLabel}</div>
                    <div className="text-sm font-semibold text-white">linkedin.com/in/yusuf-albayrak</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </a>
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
            <p className="font-mono">© {new Date().getFullYear()} onlorath. // {t.touchdown}</p>
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
