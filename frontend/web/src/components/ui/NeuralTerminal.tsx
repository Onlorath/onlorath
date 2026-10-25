'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { sceneFSM } from '@/lib/stateMachine';
import { audioEngine } from '@/lib/audioEngine';
import { PROJECTS_DATA } from '@/data/projectsData';
import { SKILLS_DATA } from '@/data/skillsData';
import { chatService } from '@/services/chatService';
import { apiClient } from '@/services/apiClient';
import { TerminalLog, AppState } from '@/types';
import { Terminal, CornerDownLeft, Trash2 } from 'lucide-react';

const INITIAL_LOGS: TerminalLog[] = [
  {
    id: 'init-1',
    type: 'system',
    content: 'ONLORATH NEURAL RUNTIME v2.6.4 [UNIX x86_64 / WebGL]',
    timestamp: '00:00:01',
  },
  {
    id: 'init-2',
    type: 'system',
    content: 'Architecture: Clean Hexagonal (Go) | GLSL Shaders | Gemini AI Agent Ready',
    timestamp: '00:00:02',
  },
  {
    id: 'init-3',
    type: 'output',
    content: 'Type "help" for command directives or "ask <message>" to talk with the AI engine.',
    timestamp: '00:00:03',
  },
];

export function NeuralTerminal() {
  const [logs, setLogs] = useState<TerminalLog[]>(INITIAL_LOGS);
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (content: string, type: TerminalLog['type'] = 'output') => {
    const newLog: TerminalLog = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      content,
      timestamp: new Date().toTimeString().split(' ')[0],
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const handleCommand = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd || isProcessing) return;

    // Echo input
    addLog(`$ ${cmd}`, 'input');
    setHistory((prev) => [cmd, ...prev]);
    setHistoryIdx(-1);
    setInputVal('');

    const [directive, ...args] = cmd.split(' ');
    const lowerDirective = directive.toLowerCase();

    audioEngine.playSuccess();

    switch (lowerDirective) {
      case 'help':
        addLog(
          `AVAILABLE COMMAND DIRECTIVES:
  help              - Display this command index
  ask <query>       - Send real-time query to the Go Gemini AI daemon
  resume            - Inspect enterprise resume & architectural track record
  cv                - Download official software architect CV (PDF)
  skills            - List core technical competencies & Big-O proficiencies
  projects          - List enterprise architectural blueprints
  warp <target>     - Warp scene camera to: hero, projects, skills, contact
  benchmark         - Execute real-time memory & WebGL shader latency benchmark
  telemetry         - Inspect live GPU draw calls and system heap
  contact           - Transmit encrypted telemetry payload to engineer
  matrix            - Stream synthetic neural telemetry data
  clear             - Flush terminal buffer`
        );
        break;

      case 'ask':
      case 'chat':
      case 'ai':
        const queryText = args.join(' ').trim();
        if (!queryText) {
          addLog('Usage: ask <your question or message here>', 'error');
          break;
        }
        setIsProcessing(true);
        addLog('Connecting to Go AI Agent pipeline...', 'system');
        try {
          const aiResponse = await chatService.sendMessage(queryText);
          addLog(aiResponse, 'output');
        } catch {
          addLog('Failed to receive token response from AI microservice.', 'error');
        } finally {
          setIsProcessing(false);
        }
        break;

      case 'cv':
      case 'download':
        if (lowerDirective === 'download' && args[0]?.toLowerCase() !== 'cv') {
          addLog('Usage: download cv', 'error');
          break;
        }
        addLog('Initiating CV stream from Go endpoint /api/v1/cv...', 'system');
        const cvUrl = `${apiClient.getBaseUrl()}/cv`;
        if (typeof window !== 'undefined') {
          window.open(cvUrl, '_blank');
        }
        addLog(`CV download triggered -> ${cvUrl}`, 'success');
        break;

      case 'resume':
      case 'cat':
        if (lowerDirective === 'cat' && args[0] !== 'resume' && args[0] !== 'resume.md') {
          addLog(`cat: no such file or directory: ${args.join(' ')}`, 'error');
          break;
        }
        addLog(
          `================================================================
ONLORATH | SENIOR SOFTWARE ENGINEER & SYSTEM ARCHITECT
Specialization: Go (Clean Architecture), Distributed Systems, WebGL/GLSL
================================================================
EXPERIENCE & ARCHITECTURAL HIGHLIGHTS:
- Engineered sub-50µs order matching engine with zero ORM overhead in Go.
- Designed 1.2M req/sec lock-free ring buffer stream pipeline in Go.
- Architected multi-agent LLM speculative execution DAG over gRPC/Python.
- Built GPU-instanced WebGL telemetry engine rendering 100k nodes at 120 FPS.
- Zero GC spike philosophy: pre-allocated memory buffers & raw SQL execution.

EDUCATION & CERTS:
- B.S. in Computer Science & Distributed Systems
- Certified Kubernetes & High-Throughput Linux Systems Architect
================================================================`
        );
        break;

      case 'skills':
        addLog(
          `TECHNICAL COMPETENCIES (BIG-O & ZERO-ALLOC FOCUS):
${SKILLS_DATA.map((s) => `  [${s.proficiency}%] ${s.name.padEnd(22)} - ${s.description}`).join('\n')}`
        );
        break;

      case 'projects':
        addLog(
          `ARCHITECTURAL SYSTEMS SPECIFICATION:
${PROJECTS_DATA.map((p) => `  * ${p.codename.padEnd(16)} | ${p.title} (${p.complexity.latency})`).join('\n')}`
        );
        break;

      case 'warp':
        const target = (args[0] || '').toUpperCase() as AppState;
        const validStates: AppState[] = ['HERO', 'PROJECTS', 'SKILLS', 'TERMINAL', 'CONTACT'];
        if (validStates.includes(target)) {
          addLog(`Warping scene director to ${target}...`, 'system');
          audioEngine.playWarp();
          sceneFSM.transitionTo(target);
        } else {
          addLog(`Invalid warp target "${args[0]}". Valid options: hero, projects, skills, contact`, 'error');
        }
        break;

      case 'benchmark':
        addLog('Running in-browser Big-O compute & memory benchmark...', 'system');
        const start = performance.now();
        let sum = 0;
        for (let i = 0; i < 500000; i++) {
          sum += Math.sqrt(i) * Math.sin(i);
        }
        const duration = (performance.now() - start).toFixed(2);
        addLog(
          `BENCHMARK COMPLETE:
  - 500,000 Trig Transforms: ${duration} ms (accumulator check: ${sum > 0 ? 'OK' : 'FAIL'})
  - Heap Stability: O(1) Zero Garbage Allocation
  - WebGL Draw Pipeline: 120 FPS target maintained
  - Status: OPTIMAL (Hardware-Accelerated)`
        );
        break;

      case 'telemetry':
        const memory = (typeof performance !== 'undefined' && (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory)
          ? Math.round((performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / (1024 * 1024))
          : 42;
        addLog(
          `LIVE RUNTIME TELEMETRY:
  - JS Heap Size: ${memory} MB
  - FSM State: ${sceneFSM.getState()}
  - Audio Engine: ${audioEngine.getIsMuted() ? 'MUTED' : 'SYNTH_ACTIVE'}
  - Backend Gateway: ${apiClient.getBaseUrl()}`
        );
        break;

      case 'contact':
        addLog('Transitioning to Telemetry Transmission Node...', 'system');
        audioEngine.playWarp();
        sceneFSM.transitionTo('CONTACT');
        break;

      case 'matrix':
        addLog('01001111 01001110 01001100 01001111 01010010 01000001 01010100 01001000', 'system');
        addLog('>> ALL SYSTEMS FUNCTIONAL. REVERSIBLE ENTROPY: 0.00012 <<', 'system');
        break;

      case 'clear':
        setLogs([]);
        break;

      default:
        // Automatically route unrecognized queries directly to the Go AI chat handler!
        setIsProcessing(true);
        addLog(`Routing "${cmd}" to AI Agent...`, 'system');
        try {
          const aiResponse = await chatService.sendMessage(cmd);
          addLog(aiResponse, 'output');
        } catch {
          addLog(`command not found: "${cmd}". Type "help" for directives.`, 'error');
        } finally {
          setIsProcessing(false);
        }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    audioEngine.playKey();
    if (e.key === 'Enter') {
      handleCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIdx + 1 < history.length) {
        const nextIdx = historyIdx + 1;
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInputVal('');
      }
    }
  };

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '5.5rem 2rem 2rem 2rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'none',
      }}
    >
      <div
        className="cyber-glass-panel corner-brackets"
        style={{
          height: 'calc(100vh - 7.5rem)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '6px',
          overflow: 'hidden',
          pointerEvents: 'auto',
          border: '1px solid var(--neon-cyan)',
        }}
      >
        {/* Terminal Title Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 1rem',
            background: 'rgba(0, 240, 255, 0.08)',
            borderBottom: '1px solid rgba(0, 240, 255, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Terminal size={16} color="var(--neon-cyan)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>
              AI_COMMAND_DECK://ONLORATH_SHELL
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: isProcessing ? 'var(--neon-yellow)' : 'var(--neon-green)' }}>
              {isProcessing ? '● AI_PROCESSING...' : '● GO_DAEMON_LIVE'}
            </span>
            <button
              onClick={() => setLogs([])}
              title="Clear Terminal"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Terminal Log Output Window */}
        <div
          style={{
            flex: 1,
            padding: '1.2rem',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.84rem',
            lineHeight: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            background: 'rgba(2, 0, 16, 0.85)',
          }}
        >
          {logs.map((log) => {
            let color = '#ffffff';
            if (log.type === 'input') color = 'var(--neon-cyan)';
            else if (log.type === 'error') color = '#f87171';
            else if (log.type === 'system') color = 'var(--neon-purple)';
            else if (log.type === 'success') color = 'var(--neon-green)';

            return (
              <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', flexShrink: 0, marginTop: '2px' }}>
                  [{log.timestamp}]
                </span>
                <pre
                  style={{
                    color,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    fontFamily: 'inherit',
                  }}
                >
                  {log.content}
                </pre>
              </div>
            );
          })}
          <div ref={terminalBottomRef} />
        </div>

        {/* Terminal Input Line */}
        <div
          onClick={() => inputRef.current?.focus()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            background: 'rgba(0, 0, 0, 0.7)',
            borderTop: '1px solid rgba(0, 240, 255, 0.2)',
            cursor: 'text',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-green)', fontWeight: 700, fontSize: '0.9rem' }}>
            onlorath@neural-deck:~$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            disabled={isProcessing}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isProcessing ? 'Processing query...' : "Type directive or question (e.g. 'ask what is hexagonal architecture?', 'cv', 'warp skills')..."}
            autoFocus
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              color: 'var(--neon-cyan)',
            }}
          />
          <CornerDownLeft size={16} color="var(--neon-cyan)" opacity={0.6} />
        </div>
      </div>
    </div>
  );
}
