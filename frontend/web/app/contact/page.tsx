'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Starfield } from '../../components/Starfield';
import ContactForm from '@/features/contact/components/ContactForm';

export default function ContactPage() {
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

  return (
    <>
      <div className="ambient-aurora" style={{ top: '-200px', right: '-200px', position: 'fixed', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0, 240, 255, 0.08) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: -1, pointerEvents: 'none' }}></div>
      <div className="ambient-aurora" style={{ bottom: '-200px', left: '-200px', background: 'radial-gradient(circle, rgba(116, 0, 159, 0.05) 0%, transparent 70%)', position: 'fixed', width: '600px', height: '600px', filter: 'blur(100px)', zIndex: -1, pointerEvents: 'none' }}></div>
      
      

      {/* Main Content Canvas */}
      <main className="flex-grow w-full px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto py-12 relative z-10 flex flex-col">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary-fixed-dim mb-4">
            Uplink Channel<span className="blinking-cursor">_</span>
          </h1>
          <p className="font-code-sm text-code-sm text-on-surface-variant max-w-2xl">
            {isEn ? 'Establish a direct connection to the main frame. Transmit your coordinates and objectives. Secure connection initialized.' : 'Ana sisteme doğrudan bağlantı kurun. Koordinatlarınızı ve hedeflerinizi iletin. Güvenli bağlantı başlatıldı.'}
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter flex-grow">
          {/* Contact Form (Main Panel) */}
          <div className="lg:col-span-8 flex flex-col">
            <ContactForm lang={lang} />
          </div>

          {/* Signal Sources (Sidebar) */}
          <div className="lg:col-span-4 flex flex-col space-y-gutter">
            <div className="glass-panel p-6 h-full border border-primary-fixed-dim/20 rounded-none relative before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-b before:from-primary-fixed-dim/5 before:to-transparent before:pointer-events-none">
              <span className="font-label-mono text-label-mono text-primary-fixed-dim block mb-6 uppercase tracking-widest border-b border-surface-variant pb-2">
                {isEn ? 'Signal Sources' : 'Sinyal Kaynakları'}
              </span>
              <div className="space-y-4 relative z-10">
                <a href="https://github.com/onlorath" target="_blank" rel="noopener noreferrer" className="group flex items-center p-4 bg-[#0A0A0C] border border-surface-variant hover:border-primary-fixed-dim/50 transition-all duration-300">
                  <div className="w-10 h-10 rounded-full border border-surface-variant flex items-center justify-center bg-surface-container-lowest group-hover:border-primary-fixed-dim/50 transition-colors duration-300">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-fixed-dim glow-hover transition-all duration-300">code</span>
                  </div>
                  <div className="ml-4">
                    <div className="font-label-mono text-label-mono text-on-surface group-hover:text-primary-fixed-dim transition-colors">GitHub</div>
                    <div className="font-code-sm text-code-sm text-surface-variant">/onlorath</div>
                  </div>
                  <span className="material-symbols-outlined ml-auto text-surface-variant group-hover:text-primary-fixed-dim opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">arrow_forward</span>
                </a>
                
                <a href="https://linkedin.com/in/yusuf-albayrak" target="_blank" rel="noopener noreferrer" className="group flex items-center p-4 bg-[#0A0A0C] border border-surface-variant hover:border-primary-fixed-dim/50 transition-all duration-300">
                  <div className="w-10 h-10 rounded-full border border-surface-variant flex items-center justify-center bg-surface-container-lowest group-hover:border-primary-fixed-dim/50 transition-colors duration-300">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-fixed-dim glow-hover transition-all duration-300">work</span>
                  </div>
                  <div className="ml-4">
                    <div className="font-label-mono text-label-mono text-on-surface group-hover:text-primary-fixed-dim transition-colors">LinkedIn</div>
                    <div className="font-code-sm text-code-sm text-surface-variant">/yusuf-albayrak</div>
                  </div>
                  <span className="material-symbols-outlined ml-auto text-surface-variant group-hover:text-primary-fixed-dim opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">arrow_forward</span>
                </a>

                <a href="mailto:ysfalbayrak02@gmail.com" className="group flex items-center p-4 bg-[#0A0A0C] border border-surface-variant hover:border-primary-fixed-dim/50 transition-all duration-300">
                  <div className="w-10 h-10 rounded-full border border-surface-variant flex items-center justify-center bg-surface-container-lowest group-hover:border-primary-fixed-dim/50 transition-colors duration-300">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-fixed-dim glow-hover transition-all duration-300">mail</span>
                  </div>
                  <div className="ml-4">
                    <div className="font-label-mono text-label-mono text-on-surface group-hover:text-primary-fixed-dim transition-colors">Direct Mail</div>
                    <div className="font-code-sm text-code-sm text-surface-variant truncate w-32 md:w-auto">ysfalbayrak02@gmail.com</div>
                  </div>
                  <span className="material-symbols-outlined ml-auto text-surface-variant group-hover:text-primary-fixed-dim opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-transparent font-label-mono text-label-mono flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-8 max-w-max-width mx-auto mt-auto border-t border-primary-fixed-dim/10 opacity-80 hover:opacity-100 transition-opacity z-10 relative">
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
