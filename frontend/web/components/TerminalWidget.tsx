'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Play, AlertCircle } from 'lucide-react';

interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success';
}

export default function TerminalWidget() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<TerminalLine[]>([
    { text: 'onlorathOS v1.0.0 (x86_64-apple-darwin23.4.0)', type: 'output' },
    { text: 'Type "help" to view the available commands.', type: 'output' },
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFirstMount = useRef(true);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const processCommand = (cmd: string, currentHistory: TerminalLine[]) => {
    const args = cmd.toLowerCase().split(' ');
    const command = args[0];

    switch (command) {
      case 'clear':
        setHistory([]);
        break;
      case 'help':
        setHistory([
          ...currentHistory,
          { text: 'Available commands:', type: 'success' },
          { text: '  neofetch   - Display system specifications & profile logo', type: 'output' },
          { text: '  about      - Read a short bio about onlorath', type: 'output' },
          { text: '  skills     - List active and exploring tech stack', type: 'output' },
          { text: '  projects   - Show engineering projects', type: 'output' },
          { text: '  contact    - Retrieve contact links', type: 'output' },
          { text: '  clear      - Clear the terminal screen', type: 'output' },
        ]);
        break;
      case 'neofetch':
        setHistory([
          ...currentHistory,
          { text: `   .---.       onlorath@github.com\n  /     \\      -------------------\n  \\\\     /      OS: macOS Sonoma 14.4 (Darwin)\n   \\\\\   /       Host: Apple Silicon M3 Max\n    \`---\`       Shell: zsh (web-terminal-engine)\n               Uptime: 2 days, 4 hours\n               Editor: VS Code / Neovim\n               Focus: Backend Architecture & Distributed Systems`, type: 'output' },
        ]);
        break;
      case 'about':
        setHistory([
          ...currentHistory,
          { text: 'onlorath - Software Developer & System Architect', type: 'success' },
          { text: 'I build robust systems with Go, establish performant web interfaces with React/Next.js, and configure Docker containers and servers to keep deployments clean. I focus on clean architecture, low latency, and systems engineering.', type: 'output' },
        ]);
        break;
      case 'skills':
        setHistory([
          ...currentHistory,
          { text: 'Tech Stack (Expertise & Exploration):', type: 'success' },
          { text: '  - Backend:  Go (Golang), PostgreSQL, sqlx (no ORM), FastAPI, Python', type: 'output' },
          { text: '  - Frontend: React, Next.js (App Router), Tailwind CSS, TypeScript', type: 'output' },
          { text: '  - Systems:  Docker, Linux, Nginx, Git, CI/CD', type: 'output' },
        ]);
        break;
      case 'projects':
        setHistory([
          ...currentHistory,
          { text: 'Key Projects:', type: 'success' },
          { text: '  1. Core API Architecture (Go + Postgres + Clean Arch + JWT)', type: 'output' },
          { text: '  2. Polyglot AI Microservice Gateway (Go + Python + Docker)', type: 'output' },
        ]);
        break;
      case 'contact':
        setHistory([
          ...currentHistory,
          { text: 'Get in touch:', type: 'success' },
          { text: '  - Email:    [EMAIL_ADDRESS]', type: 'output' },
          { text: '  - GitHub:   github.com/onlorath', type: 'output' },
          { text: '  - LinkedIn: linkedin.com/in/yusuf-albayrak/', type: 'output' },
        ]);
        break;
      default:
        setHistory([
          ...currentHistory,
          { text: `zsh: command not found: ${command}. Type "help" for a list of commands.`, type: 'error' },
        ]);
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
      <div className="p-5 min-h-60 max-h-80 overflow-y-auto text-sm space-y-2 select-text custom-scrollbar">
        {history.map((line, idx) => (
          <div 
            key={idx} 
            className={`whitespace-pre-wrap leading-relaxed ${
              line.type === 'input' ? 'text-emerald-400 font-semibold' :
              line.type === 'error' ? 'text-red-400' :
              line.type === 'success' ? 'text-cyan-400 font-bold' :
              'text-slate-300'
            }`}
          >
            {line.text}
          </div>
        ))}
        
        {/* Terminal Input Line */}
        <div className="flex items-center text-emerald-400 pt-1">
          <span className="font-semibold mr-2 shrink-0">~/onlorath $</span>
          <input
            ref={inputRef}
            type="text"
            className="bg-transparent border-none outline-none text-slate-100 flex-grow py-0 px-0 focus:ring-0 text-sm caret-emerald-400 font-mono"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
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
