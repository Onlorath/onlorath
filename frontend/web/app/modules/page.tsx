'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Starfield } from '../../components/Starfield';

export default function ModulesPage() {
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
      <Starfield />
      <Starfield />
      <div className="aurora-bg"></div>

      

      {/* Main Content */}
      <main className="flex-grow w-full px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto pt-12 pb-24 flex flex-col gap-12 z-10 relative">
        {/* Architecture Header */}
        <header className="flex flex-col gap-6 items-center text-center">
          <h1 className="font-display text-headline-lg-mobile md:text-display text-inverse-surface">
            {isEn ? 'Capability' : 'Yetenek'} <span className="text-primary-fixed-dim">{isEn ? 'Modules' : 'Modülleri'}</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            {isEn ? 'Technology stacks and operational modules forming the core of the main system. Each module is optimized for high performance and scalability.' : 'Ana sistemin temelini oluşturan teknoloji yığınları ve operasyonel modüller. Her bir modül yüksek performans ve ölçeklenebilirlik için optimize edilmiştir.'}
          </p>

          {/* Abstract Nodes Diagram (CSS based) */}
          <div className="w-full max-w-3xl h-32 md:h-48 relative mt-8 opacity-80 pointer-events-none hidden md:block">
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-fixed-dim/30 to-transparent"></div>
            {/* Center Node */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary-fixed-dim rounded-full shadow-[0_0_15px_rgba(0,240,255,0.8)] z-10"></div>
            {/* Left Nodes */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-secondary-fixed-dim rounded-full shadow-[0_0_10px_rgba(236,178,255,0.5)]"></div>
            <div className="absolute top-3/4 left-1/3 w-2 h-2 bg-primary-fixed-dim/50 rounded-full"></div>
            {/* Right Nodes */}
            <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-secondary-fixed-dim rounded-full shadow-[0_0_10px_rgba(236,178,255,0.5)]"></div>
            <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-primary-fixed-dim/50 rounded-full"></div>
            {/* Connecting lines */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <line stroke="rgba(236,178,255,0.2)" strokeWidth="1" x1="25%" x2="50%" y1="25%" y2="50%"></line>
              <line stroke="rgba(0,219,233,0.2)" strokeWidth="1" x1="33%" x2="50%" y1="75%" y2="50%"></line>
              <line stroke="rgba(236,178,255,0.2)" strokeWidth="1" x1="75%" x2="50%" y1="33%" y2="50%"></line>
              <line stroke="rgba(0,219,233,0.2)" strokeWidth="1" x1="66%" x2="50%" y1="66%" y2="50%"></line>
            </svg>
          </div>
        </header>

        {/* Modules Grid (Bento Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Go */}
          <div className="glass-panel p-6 rounded-none flex flex-col gap-4 glow-hover transition-all duration-300 relative group">
            <div className="flex justify-between items-start">
              <span className="font-label-mono text-label-mono text-on-surface-variant">MOD_01</span>
              <div className="status-dot"></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[32px] text-primary-fixed-dim">code</span>
              <h3 className="font-headline-md text-headline-md text-inverse-surface">Go (Golang)</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
              {isEn ? 'Core language for high-performance microservices and concurrent system architectures.' : 'Yüksek performanslı mikroservisler ve eşzamanlı sistem mimarileri için ana çekirdek dili.'}
            </p>
            <div className="bg-surface-container-lowest/50 p-3 rounded-none border border-surface-variant/50 font-code-sm text-code-sm text-primary-fixed-dim/80">
              go run cmd/server/main.go
            </div>
          </div>

          {/* Card 2: TypeScript */}
          <div className="glass-panel p-6 rounded-none flex flex-col gap-4 glow-hover transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="font-label-mono text-label-mono text-on-surface-variant">MOD_02</span>
              <div className="status-dot"></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[32px] text-secondary-fixed-dim">javascript</span>
              <h3 className="font-headline-md text-headline-md text-inverse-surface">TypeScript</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
              {isEn ? 'Type-safe frontend and backend systems. Operational stability with strict type checking.' : 'Tip güvenli frontend ve backend sistemleri. Katı tip denetimi ile operasyonel stabilite.'}
            </p>
            <div className="bg-surface-container-lowest/50 p-3 rounded-none border border-surface-variant/50 font-code-sm text-code-sm text-secondary-fixed-dim/80">
              tsc --build tsconfig.json
            </div>
          </div>

          {/* Card 3: NestJS */}
          <div className="glass-panel p-6 rounded-none flex flex-col gap-4 glow-hover transition-all duration-300 lg:row-span-2">
            <div className="flex justify-between items-start">
              <span className="font-label-mono text-label-mono text-on-surface-variant">MOD_03</span>
              <div className="status-dot"></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[32px] text-[#e0234e]">api</span>
              <h3 className="font-headline-md text-headline-md text-inverse-surface">NestJS</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {isEn ? 'Modular architecture framework for scalable, enterprise-grade server-side applications. Dependency injection and modular structures.' : 'Ölçeklenebilir, kurumsal seviye sunucu tarafı uygulamaları için modüler mimari çerçevesi. Dependency injection ve modüler yapılar.'}
            </p>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <div className="flex justify-between font-label-mono text-label-mono text-on-surface-variant">
                <span>CPU_USAGE</span>
                <span>12%</span>
              </div>
              <div className="w-full h-1 bg-surface-variant rounded-none overflow-hidden">
                <div className="h-full bg-[#e0234e] w-[12%]"></div>
              </div>
            </div>
            <div className="bg-surface-container-lowest/50 p-3 rounded-none border border-surface-variant/50 font-code-sm text-code-sm text-on-surface-variant">
              nest start --watch
            </div>
          </div>

          {/* Card 4: React & Next.js */}
          <div className="glass-panel p-6 rounded-none flex flex-col gap-4 glow-hover transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="font-label-mono text-label-mono text-on-surface-variant">MOD_04</span>
              <div className="status-dot"></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[32px] text-[#61dafb]">integration_instructions</span>
              <h3 className="font-headline-md text-headline-md text-inverse-surface">React &amp; Next.js</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
              {isEn ? 'Dynamic, reactive, and high-performance user interface systems.' : 'Dinamik, reaktif ve yüksek performanslı kullanıcı arayüzü sistemleri.'}
            </p>
            <div className="bg-surface-container-lowest/50 p-3 rounded-none border border-surface-variant/50 font-code-sm text-code-sm text-on-surface-variant">
              npm run dev
            </div>
          </div>

          {/* Card 5: Kubernetes */}
          <div className="glass-panel p-6 rounded-none flex flex-col gap-4 glow-hover transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="font-label-mono text-label-mono text-on-surface-variant">MOD_05</span>
              <div className="status-dot"></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[32px] text-[#326ce5]">dns</span>
              <h3 className="font-headline-md text-headline-md text-inverse-surface">Kubernetes</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
              {isEn ? 'Container orchestration, automatic scaling, and system deployment.' : 'Konteyner orkestrasyonu, otomatik ölçeklendirme ve sistem dağıtımı.'}
            </p>
            <div className="bg-surface-container-lowest/50 p-3 rounded-none border border-surface-variant/50 font-code-sm text-code-sm text-on-surface-variant">
              kubectl apply -f config.yml
            </div>
          </div>

          {/* Card 6: AI Integrations */}
          <div className="glass-panel p-6 rounded-none flex flex-col gap-4 glow-hover transition-all duration-300 md:col-span-2 lg:col-span-3">
            <div className="flex justify-between items-start">
              <span className="font-label-mono text-label-mono text-on-surface-variant">MOD_06</span>
              <div className="status-dot" style={{ backgroundColor: 'var(--color-secondary-fixed-dim)', boxShadow: '0 0 8px var(--color-secondary-fixed-dim)' }}></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[32px] text-secondary-fixed-dim">memory</span>
              <h3 className="font-headline-md text-headline-md text-inverse-surface">AI &amp; LLM Integrations</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <p className="font-body-md text-body-md text-on-surface-variant md:w-1/2">
                {isEn ? 'Integration of OpenAI, Anthropic, and open-source LLM models into systems. Design of LangChain and custom vector database (Pinecone/Milvus) architectures.' : 'OpenAI, Anthropic ve açık kaynak LLM modellerinin sistemlere entegrasyonu. LangChain ve özel vektör veritabanı (Pinecone/Milvus) mimarileri tasarımı.'}
              </p>
              <div className="md:w-1/2 bg-surface-container-lowest/50 p-4 rounded-none border border-surface-variant/50 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-primary-fixed-dim font-code-sm text-code-sm">
                  <span className="material-symbols-outlined text-sm">terminal</span>
                  <span>{isEn ? 'Agent Response Time' : 'Ajan Yanıt Süresi'}</span>
                </div>
                <div className="flex items-end gap-2 h-12">
                  <div className="w-1/5 bg-primary-fixed-dim/20 h-[40%] rounded-none"></div>
                  <div className="w-1/5 bg-primary-fixed-dim/40 h-[60%] rounded-none"></div>
                  <div className="w-1/5 bg-primary-fixed-dim/60 h-[30%] rounded-none"></div>
                  <div className="w-1/5 bg-primary-fixed-dim/80 h-[80%] rounded-none"></div>
                  <div className="w-1/5 bg-primary-fixed-dim h-[100%] rounded-none shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
