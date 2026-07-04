'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Play, AlertCircle, Loader2 } from 'lucide-react';
import { chatAPI } from '../lib/api';
import { parseTerminalMarkdown } from '../lib/terminalMarkdown';

interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success';
  isMarkdown?: boolean;
}

interface TerminalWidgetProps {
  lang?: 'tr' | 'en';
}

export default function TerminalWidget({ lang = 'tr' }: TerminalWidgetProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<TerminalLine[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const [placeholder, setPlaceholder] = useState('');

  // Initial welcome message translation
  useEffect(() => {
    if (lang === 'en') {
      setHistory([
        { text: 'onlorathOS v1.0.0 (x86_64-apple-darwin23.4.0)', type: 'output' },
        { text: '--------------------------------------------------', type: 'output' },
        { text: '💬 Type your message directly here and press Enter to chat with AI.', type: 'success' },
        { text: '⚙️ Type "help" to list available system commands.', type: 'output' },
      ]);
    } else {
      setHistory([
        { text: 'onlorathOS v1.0.0 (x86_64-apple-darwin23.4.0)', type: 'output' },
        { text: '--------------------------------------------------', type: 'output' },
        { text: '💬 Yapay zeka ile doğrudan konuşmak için buraya yazın ve Enter\'a basın.', type: 'success' },
        { text: '⚙️ Sistem komutlarını listelemek için "help" yazın.', type: 'output' },
      ]);
    }
  }, [lang]);

  // Typing simulation placeholder translations
  useEffect(() => {
    const phrases = lang === 'en' ? [
      "What are Yusuf's projects?",
      "What is Yusuf's university and major?",
      "What is his experience in Go and NestJS?",
      "How can I contact Yusuf?"
    ] : [
      "Yusuf'un projeleri neler?",
      "Yusuf'un okuduğu okul ve bölüm nedir?",
      "Go ve NestJS tecrübesi nedir?",
      "Yusuf ile nasıl iletişime geçebilirim?"
    ];

    let currentPhraseIdx = 0;
    let currentCharIdx = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;

    const tick = () => {
      const currentPhrase = phrases[currentPhraseIdx];

      if (isDeleting) {
        setPlaceholder(currentPhrase.substring(0, currentCharIdx - 1));
        currentCharIdx--;

        if (currentCharIdx === 0) {
          isDeleting = false;
          currentPhraseIdx = (currentPhraseIdx + 1) % phrases.length;
          timeoutId = setTimeout(tick, 500);
        } else {
          timeoutId = setTimeout(tick, 40);
        }
      } else {
        setPlaceholder(currentPhrase.substring(0, currentCharIdx + 1));
        currentCharIdx++;

        if (currentCharIdx === currentPhrase.length) {
          isDeleting = true;
          timeoutId = setTimeout(tick, 2000);
        } else {
          timeoutId = setTimeout(tick, 80);
        }
      }
    };

    timeoutId = setTimeout(tick, 1000);

    return () => clearTimeout(timeoutId);
  }, [lang]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputAreaRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  const scrollToBottom = () => {
    if (outputAreaRef.current) {
      outputAreaRef.current.scrollTo({
        top: outputAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    scrollToBottom();
  }, [history]);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmedInput = input.trim();
      if (!trimmedInput) return;

      const newHistory = [...history, { text: `~/onlorath $ ${input}`, type: 'input' as const }];
      setHistory(newHistory);

      const updatedCmdHistory = [...commandHistory, input];
      setCommandHistory(updatedCmdHistory);
      setHistoryPointer(updatedCmdHistory.length);

      processCommand(trimmedInput, newHistory);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;

      const newPointer = historyPointer > 0 ? historyPointer - 1 : 0;
      setHistoryPointer(newPointer);
      setInput(commandHistory[newPointer]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newPointer = historyPointer + 1;
      if (newPointer >= commandHistory.length) {
        setHistoryPointer(commandHistory.length);
        setInput('');
      } else {
        setHistoryPointer(newPointer);
        setInput(commandHistory[newPointer]);
      }
    }
  };

  const sendChatMessage = (message: string, currentHistory: TerminalLine[]) => {
    setIsChatLoading(true);
    const thinkingText = lang === 'en' ? '[ AI is thinking... ]' : '[ Yapay Zeka Düşünüyor... ]';
    
    setHistory([
      ...currentHistory,
      { text: thinkingText, type: 'output' },
    ]);

    chatAPI.sendMessage({
      conversation_id: conversationIdRef.current || undefined,
      message: message,
    })
      .then((res) => {
        const { conversation_id, reply } = res.data;
        conversationIdRef.current = conversation_id;
        setHistory((prev) => {
          const filtered = prev.filter((line) => line.text !== thinkingText);
          return [
            ...filtered,
            { text: reply, type: 'output' as const, isMarkdown: true },
          ];
        });
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.error || err.message || (lang === 'en' ? 'AI service unreachable.' : 'AI servisine ulaşılamıyor.');
        setHistory((prev) => {
          const filtered = prev.filter((line) => line.text !== thinkingText);
          return [
            ...filtered,
            { text: `Error: ${errorMsg}`, type: 'error' as const },
          ];
        });
      })
      .finally(() => {
        setIsChatLoading(false);
      });
  };

  const processCommand = (cmd: string, currentHistory: TerminalLine[]) => {
    const trimmed = cmd.trim();
    const lowerCmd = trimmed.toLowerCase();
    const args = lowerCmd.split(' ');
    const command = args[0];

    // If starts with "chat ", extract message or handle reset
    if (lowerCmd.startsWith('chat ')) {
      const chatMessage = trimmed.substring(5).trim();
      if (chatMessage === '--new' || chatMessage === '-n') {
        conversationIdRef.current = null;
        setHistory([
          ...currentHistory,
          { text: lang === 'en' ? '[ New AI chat session initialized ]' : '[ Yeni AI sohbet oturumu başlatıldı ]', type: 'success' },
        ]);
        return;
      }
      if (chatMessage) {
        sendChatMessage(chatMessage, currentHistory);
        return;
      }
    }

    switch (command) {
      case 'clear':
        setHistory([]);
        conversationIdRef.current = null;
        break;
      case 'help':
        if (lang === 'en') {
          setHistory([
            ...currentHistory,
            { text: 'Available System Commands:', type: 'success' },
            { text: '  neofetch   - Display system specs and profile logo', type: 'output' },
            { text: '  about      - Brief biography of onlorath', type: 'output' },
            { text: '  skills     - List the active technology stack', type: 'output' },
            { text: '  projects   - Show engineering projects', type: 'output' },
            { text: '  contact    - Retrieve contact links', type: 'output' },
            { text: '  new        - Reset the AI chat session history', type: 'output' },
            { text: '  clear      - Clear the screen', type: 'output' },
            { text: '\n💬 Any other inputs will be directly forwarded as messages to the AI assistant.', type: 'success' },
          ]);
        } else {
          setHistory([
            ...currentHistory,
            { text: 'Mevcut Sistem Komutları:', type: 'success' },
            { text: '  neofetch   - Sistem özelliklerini ve profil logosunu gösterir', type: 'output' },
            { text: '  about      - onlorath hakkında kısa biyografi', type: 'output' },
            { text: '  skills     - Aktif teknoloji yığınını listeler', type: 'output' },
            { text: '  projects   - Mühendislik projelerini gösterir', type: 'output' },
            { text: '  contact    - İletişim linklerini getirir', type: 'output' },
            { text: '  new        - AI sohbet oturumunu sıfırlar', type: 'output' },
            { text: '  clear      - Ekranı temizler', type: 'output' },
            { text: '\n💬 Bu komutlar dışındaki her yazıyı yapay zekaya doğrudan mesaj olarak iletebilirsiniz.', type: 'success' },
          ]);
        }
        break;
      case 'neofetch':
        setHistory([
          ...currentHistory,
          { text: `   .---.       onlorath@github.com\n  /     \\      -------------------\n  \\\\     /      OS: macOS Sonoma 14.4 (Darwin)\n   \\\\\   /       Host: Apple Silicon M3 Max\n    \`---\`       Shell: zsh (web-terminal-engine)\n               Uptime: 2 days, 4 hours\n               Editor: VS Code / Neovim\n               Focus: Backend Architecture & Distributed Systems`, type: 'output' },
        ]);
        break;
      case 'about':
        if (lang === 'en') {
          setHistory([
            ...currentHistory,
            { text: 'onlorath - Software Developer & System Architect', type: 'success' },
            { text: 'I build robust systems with Go, establish performant web interfaces with React/Next.js, and configure Docker containers and servers to keep deployments clean. I focus on clean architecture, low latency, and systems engineering.', type: 'output' },
          ]);
        } else {
          setHistory([
            ...currentHistory,
            { text: 'onlorath - Yazılım Geliştirici & Sistem Mimarı', type: 'success' },
            { text: 'Go ile yüksek performanslı sistemler geliştiriyor, React/Next.js ile modern arayüzler tasarlıyor, Docker ve Linux sunucuları ile dağıtık mimariler yönetiyorum. Temiz mimari, düşük gecikme ve sistem mühendisliğine odaklanıyorum.', type: 'output' },
          ]);
        }
        break;
      case 'skills':
        if (lang === 'en') {
          setHistory([
            ...currentHistory,
            { text: 'Tech Stack (Expertise & Exploration):', type: 'success' },
            { text: '  - Backend:  Go (Golang), PostgreSQL, sqlx (no ORM), FastAPI, Python', type: 'output' },
            { text: '  - Frontend: React, Next.js (App Router), Tailwind CSS, TypeScript', type: 'output' },
            { text: '  - Systems:  Docker, Linux, Nginx, Git, CI/CD', type: 'output' },
          ]);
        } else {
          setHistory([
            ...currentHistory,
            { text: 'Teknoloji Yığını (Deneyim & Araştırma):', type: 'success' },
            { text: '  - Backend:  Go (Golang), PostgreSQL, sqlx (ORM yok), FastAPI, Python', type: 'output' },
            { text: '  - Frontend: React, Next.js (App Router), Tailwind CSS, TypeScript', type: 'output' },
            { text: '  - Sistem:   Docker, Linux, Nginx, Git, CI/CD', type: 'output' },
          ]);
        }
        break;
      case 'projects':
        if (lang === 'en') {
          setHistory([
            ...currentHistory,
            { text: 'Key Projects:', type: 'success' },
            { text: '  1. Core API Architecture (Go + Postgres + Clean Arch + JWT)', type: 'output' },
            { text: '  2. Polyglot AI Microservice Gateway (Go + Python + Docker)', type: 'output' },
          ]);
        } else {
          setHistory([
            ...currentHistory,
            { text: 'Önemli Projeler:', type: 'success' },
            { text: '  1. Çekirdek API Mimarisi (Go + Postgres + Clean Arch + JWT)', type: 'output' },
            { text: '  2. Çok Dilli Yapay Zeka Ağ Geçidi (Go + Python + Docker)', type: 'output' },
          ]);
        }
        break;
      case 'contact':
        if (lang === 'en') {
          setHistory([
            ...currentHistory,
            { text: 'Get in touch:', type: 'success' },
            { text: '  - Email:    ysfalbayrak02@gmail.com', type: 'output' },
            { text: '  - GitHub:   github.com/onlorath', type: 'output' },
            { text: '  - LinkedIn: linkedin.com/in/yusuf-albayrak/', type: 'output' },
          ]);
        } else {
          setHistory([
            ...currentHistory,
            { text: 'İletişim Bilgileri:', type: 'success' },
            { text: '  - E-posta:  ysfalbayrak02@gmail.com', type: 'output' },
            { text: '  - GitHub:   github.com/onlorath', type: 'output' },
            { text: '  - LinkedIn: linkedin.com/in/yusuf-albayrak/', type: 'output' },
          ]);
        }
        break;
      case 'new':
        conversationIdRef.current = null;
        setHistory([
          ...currentHistory,
          { text: lang === 'en' ? '[ New AI chat session initialized ]' : '[ Yeni AI sohbet oturumu başlatıldı ]', type: 'success' },
        ]);
        break;
      default:
        // Any other text input is treated directly as an AI chat message
        sendChatMessage(cmd, currentHistory);
        break;
    }
  };

  return (
    <div
      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden font-mono shadow-2xl backdrop-blur-md cursor-text"
      onClick={focusInput}
    >
      {/* Terminal Title Bar */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 select-none">
          <TerminalIcon className="w-3.5 h-3.5" />
          zsh - guest@onlorath-server
        </div>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Terminal Output Area */}
      <div ref={outputAreaRef} className="p-5 min-h-[320px] max-h-[480px] overflow-y-auto text-sm space-y-2 select-text custom-scrollbar">
        {history.map((line, idx) => (
          <div
            key={idx}
            className={`whitespace-pre-wrap leading-relaxed ${line.type === 'input' ? 'text-emerald-400 font-semibold' :
                line.type === 'error' ? 'text-red-400' :
                  line.type === 'success' ? 'text-cyan-400 font-bold' :
                    'text-slate-300'
              }`}
          >
            {line.isMarkdown ? parseTerminalMarkdown(line.text) : line.text}
          </div>
        ))}

        {/* Terminal Input Line */}
        <div className="flex items-center text-emerald-400 pt-1">
          <span className="font-semibold mr-2 shrink-0">
            {isChatLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span className="text-cyan-400">{lang === 'en' ? 'processing' : 'işleniyor'}</span>
              </span>
            ) : (
              '~/onlorath $'
            )}
          </span>
          <input
            ref={inputRef}
            type="text"
            className="bg-transparent border-none outline-none text-slate-100 flex-grow py-0 px-0 focus:ring-0 text-sm caret-emerald-400 font-mono disabled:opacity-50 placeholder-slate-700"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isChatLoading}
            placeholder={placeholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
