'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';

const TerminalWidget = dynamic(() => import('@/features/terminal/components/TerminalWidget'), { ssr: false });
const Rocket3D = dynamic(() => import('@/features/3d-graphics/components/Rocket3D'), { ssr: false });
const Starfield = dynamic(() => import('../components/Starfield').then(mod => mod.Starfield), { ssr: false });

const Typewriter = ({ text, speed = 30 }: { text: string; speed?: number }) => {


  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <>
      {displayedText}
      <span className="terminal-cursor"></span>
    </>
  );
};

const translations = {
  tr: {
    orbit: "Yörünge",
    modules: "Modüller",
    logs: "Loglar",
    systems: "Sistemler",
    contact: "İletişim",
    connecting: "Sistem başlatılıyor...",
    online: "Sistemler çevrimiçi. Yörüngeye giriliyor...",
    titlePart1: "Yazılım Geliştirici",
    titlePart2: "Sistem Mimarı",
    aboutText: "Yüksek performanslı, ölçeklenebilir sistemler inşa ediyorum. Karmaşık mimarileri optimize ediyor ve derinlemesine teknik çözümler üretiyorum. Hoş geldiniz, orbitime girdiniz.",
    viewSystems: "Sistemleri İncele",
    viewCV: "CV'mi Görüntüle",
    contactEmail: "İletişime Geç",
    allSystemsOnline: "Tüm sistemler çevrimiçi",
  },
  en: {
    orbit: "Orbit",
    modules: "Modules",
    logs: "Logs",
    systems: "Systems",
    contact: "Contact",
    connecting: "Establishing secure connection...",
    online: "Systems online. Entering orbit...",
    titlePart1: "Software Developer",
    titlePart2: "& System Architect",
    aboutText: "I build high-performance, scalable systems. I optimize complex architectures and craft deep technical solutions. Welcome, you have entered my orbit.",
    viewSystems: "Explore Systems",
    viewCV: "View Resume",
    contactEmail: "Get in Touch",
    allSystemsOnline: "All systems online",
  }
};

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [isIntroRunning, setIsIntroRunning] = useState(true);
  const [introPhase, setIntroPhase] = useState<'typing1' | 'typing2' | 'flying' | 'fading' | 'completed'>('typing1');
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
      }, 2000);

      const timer3 = setTimeout(() => {
        setIntroPhase('fading');
      }, 3500);

      const timer4 = setTimeout(() => {
        setIntroPhase('completed');
        setIsIntroRunning(false);
      }, 5500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
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

  if (!isMounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <>
      {/* Boot Sequence */}
      {introPhase !== 'completed' && typeof document !== 'undefined' && document.getElementById('portal-root') && createPortal(
        <div className={`boot-screen font-label-mono text-primary-fixed-dim ${introPhase === 'fading' ? 'opacity-0' : 'opacity-100'}`} style={{ zIndex: 9999 }}>
          <div className="text-lg">
            {introPhase === 'typing1' && <Typewriter text={t.connecting} speed={35} />}
            {(introPhase === 'typing2' || introPhase === 'flying' || introPhase === 'fading') && <Typewriter text={t.online} speed={25} />}
          </div>
        </div>,
        document.getElementById('portal-root')!
      )}

      {/* Ambient Background */}
      <div className="aurora-bg">
        <ErrorBoundary>
          <Starfield />
        </ErrorBoundary>
      </div>

      {/* typeof document !== 'undefined' && document.getElementById('portal-root') && createPortal(
        <ErrorBoundary fallback={<div className="fixed inset-0 z-[9999] bg-red-900 text-white p-10 flex flex-col items-center justify-center text-center"><h1 className="text-4xl font-bold mb-4">WEBGL ERROR</h1><p>Rocket3D failed to load.</p></div>}>
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
        </ErrorBoundary>,
        document.getElementById('portal-root')!
      ) */}

      {/* TopNavBar Component */}
      

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col items-center justify-center relative w-full max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-24 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter w-full items-center min-h-[716px]">
          {/* Left Content: Hero Typography & CTAs */}
          <div className="col-span-1 lg:col-span-7 flex flex-col space-y-8 z-20">
            <div className="space-y-4">

              <h1 className="font-display text-display text-on-surface glow-text leading-tight">
                {t.titlePart1} <br /><span className="text-surface-variant">&amp;</span> {t.titlePart2}
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                {t.aboutText}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/projects" className="btn-primary font-label-mono text-label-mono px-6 py-3 rounded-DEFAULT flex items-center gap-2">
                <span>{t.viewSystems}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
              <a href="/CV.pdf" target="_blank" rel="noopener noreferrer" className="btn-glass font-label-mono text-label-mono px-6 py-3 rounded-DEFAULT flex items-center gap-2 backdrop-blur-md">
                <span className="material-symbols-outlined text-[16px]">description</span>
                <span>{t.viewCV}</span>
              </a>
              <Link href="/contact" className="btn-glass font-label-mono text-label-mono px-6 py-3 rounded-DEFAULT flex items-center gap-2 backdrop-blur-md border-transparent hover:border-primary-fixed-dim/20 text-primary-fixed-dim">
                <span>{t.contactEmail}</span>
              </Link>
            </div>
          </div>
          
          {/* Right Content: 3D Scene placeholder space (Rocket3D handles its own absolute positioning) */}
          <div className="col-span-1 lg:col-span-5 relative h-[400px] lg:h-[600px] w-full z-10 opacity-80 mix-blend-screen pointer-events-none">
            {/* The Rocket3D component floats over the UI, we don't need the inline three.js script from Stitch */}
          </div>
        </div>

        {/* Bottom: AI Terminal Glass Panel */}
        <div className="w-full mt-24 lg:mt-32 relative z-20">
           {/* Wrap TerminalWidget inside a container if needed, or let TerminalWidget be updated */}
           <TerminalWidget lang={lang} />
        </div>
      </main>

      {/* Footer Component */}
      <footer className="bg-transparent full-width bottom-0 border-t border-primary-fixed-dim/10 flat no shadows opacity-80 hover:opacity-100 transition-opacity z-50">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-desktop py-8 max-w-max-width mx-auto mt-24">
          <div className="font-label-mono text-primary-fixed-dim mb-4 md:mb-0">© {new Date().getFullYear()} onlorath. // {t.allSystemsOnline}</div>
          <div className="flex space-x-6">
            <a href="https://github.com/onlorath" target="_blank" rel="noopener noreferrer" className="font-label-mono text-label-mono text-on-surface-variant hover:text-primary-fixed-dim hover:glow-sm transition-all">GitHub</a>
            <a href="https://linkedin.com/in/yusuf-albayrak" target="_blank" rel="noopener noreferrer" className="font-label-mono text-label-mono text-on-surface-variant hover:text-primary-fixed-dim hover:glow-sm transition-all">LinkedIn</a>
            <a href="mailto:ysfalbayrak02@gmail.com" className="font-label-mono text-label-mono text-on-surface-variant hover:text-primary-fixed-dim hover:glow-sm transition-all">Email</a>
          </div>
        </div>
      </footer>
    </>
  );
}
