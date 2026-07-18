'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<'tr' | 'en'>('tr');
  const pathname = usePathname();

  useEffect(() => {
    const savedLang = localStorage.getItem('onlorath_lang');
    if (savedLang === 'en' || savedLang === 'tr') {
      setLang(savedLang);
    }
    
    // Listen for language changes from other components/tabs
    const handleStorageChange = () => {
      const currentLang = localStorage.getItem('onlorath_lang');
      if (currentLang === 'en' || currentLang === 'tr') setLang(currentLang);
    };
    
    window.addEventListener('languageChange', handleStorageChange);
    return () => window.removeEventListener('languageChange', handleStorageChange);
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'tr' ? 'en' : 'tr';
    setLang(nextLang);
    localStorage.setItem('onlorath_lang', nextLang);
    window.dispatchEvent(new Event('languageChange')); // Notify pages
  };

  const isEn = lang === 'en';

  const navLinks = [
    { path: '/', labelTR: 'Yörünge', labelEN: 'Orbit' },
    { path: '/modules', labelTR: 'Modüller', labelEN: 'Modules' },
    { path: '/blog', labelTR: 'Loglar', labelEN: 'Logs' },
    { path: '/projects', labelTR: 'Sistemler', labelEN: 'Systems' },
    { path: '/contact', labelTR: 'İletişim', labelEN: 'Contact' }
  ];

  const getLinkClasses = (path: string) => {
    const isActive = pathname === path || (path !== '/' && pathname.startsWith(path));
    if (isActive) {
      return "font-label-mono text-label-mono text-primary-fixed-dim border-b-2 border-primary-fixed-dim pb-1 transition-all rounded px-2 pt-1";
    }
    return "font-label-mono text-label-mono text-on-surface-variant hover:text-primary-fixed-dim hover:backdrop-blur-2xl hover:bg-surface-container/20 transition-all rounded px-2 py-1";
  };
  
  const getMobileLinkClasses = (path: string) => {
    const isActive = pathname === path || (path !== '/' && pathname.startsWith(path));
    if (isActive) {
      return "text-primary-fixed-dim py-2 border-b border-primary-fixed-dim/10";
    }
    return "text-on-surface-variant py-2 border-b border-primary-fixed-dim/10";
  };

  return (
    <header className="bg-surface-container/10 backdrop-blur-xl docked full-width top-0 sticky z-50 border-b border-primary-fixed-dim/20 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto py-4">
        <Link href="/" className="font-label-mono text-body-lg font-bold text-primary-fixed-dim tracking-tighter hover:glow-sm transition-all scale-95 hover:scale-100 duration-200 ease-out flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
          ~/onlorath_<span className="cursor-blink">_</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link key={link.path} href={link.path} className={getLinkClasses(link.path)}>
              {isEn ? link.labelEN : link.labelTR}
            </Link>
          ))}
        </nav>
        <div onClick={toggleLanguage} className="hidden md:flex font-label-mono text-label-mono text-primary-fixed-dim cursor-pointer border border-primary-fixed-dim/30 px-2 py-1 rounded hover:bg-primary-fixed-dim/10 transition-colors">
          TR/EN
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-primary-fixed-dim p-2">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
      
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-primary-fixed-dim/20 bg-surface-container/95 backdrop-blur-xl px-6 py-4 flex flex-col space-y-4 font-label-mono text-label-mono">
          {navLinks.map((link) => (
            <Link key={link.path} href={link.path} onClick={() => setMobileMenuOpen(false)} className={getMobileLinkClasses(link.path)}>
              {isEn ? link.labelEN : link.labelTR}
            </Link>
          ))}
          <div className="pt-2 border-t border-primary-fixed-dim/20 flex justify-between items-center">
            <span className="text-on-surface-variant">DİL</span>
            <button onClick={toggleLanguage} className="text-primary-fixed-dim">{lang === 'tr' ? 'English (EN)' : 'Türkçe (TR)'}</button>
          </div>
        </div>
      )}
    </header>
  );
}
