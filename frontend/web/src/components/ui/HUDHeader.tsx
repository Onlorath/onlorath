'use client';

import { useState, useEffect } from 'react';
import { sceneFSM } from '@/lib/stateMachine';
import { audioEngine } from '@/lib/audioEngine';
import { AppState } from '@/types';
import { Volume2, VolumeX, Activity, Cpu, Terminal as TerminalIcon, Layers, Orbit, Send } from 'lucide-react';

interface NavItem {
  state: AppState;
  label: string;
  code: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { state: 'HERO', label: 'OVERVIEW', code: 'MOD_01', icon: Orbit },
  { state: 'PROJECTS', label: 'ARCHITECTURE', code: 'MOD_02', icon: Layers },
  { state: 'SKILLS', label: 'CONSTELLATION', code: 'MOD_03', icon: Cpu },
  { state: 'TERMINAL', label: 'COMMAND_DECK', code: 'MOD_04', icon: TerminalIcon },
  { state: 'CONTACT', label: 'TELEMETRY', code: 'MOD_05', icon: Send },
];

export function HUDHeader() {
  const [currentState, setCurrentState] = useState<AppState>(sceneFSM.getState());
  const [isMuted, setIsMuted] = useState(false);
  const [fps, setFps] = useState(60);
  const [latency, setLatency] = useState(18);

  useEffect(() => {
    const unsub = sceneFSM.subscribeState((state) => {
      setCurrentState(state);
    });

    // FPS / Performance estimation loop
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const measure = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const measuredFps = Math.round((frameCount * 1000) / (now - lastTime));
        setFps(measuredFps);
        setLatency(Math.round(16 + Math.sin(now / 1000) * 4));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(measure);
    };

    animId = requestAnimationFrame(measure);

    return () => {
      unsub();
      cancelAnimationFrame(animId);
    };
  }, []);

  const handleStateClick = (state: AppState) => {
    if (state === currentState) return;
    audioEngine.playWarp();
    sceneFSM.transitionTo(state);
  };

  const handleMuteToggle = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      audioEngine.playClick();
      audioEngine.startAmbientDrone();
    }
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1.5rem',
        background: 'linear-gradient(to bottom, rgba(3, 0, 20, 0.85) 0%, rgba(3, 0, 20, 0.4) 70%, transparent 100%)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0, 240, 255, 0.15)',
        pointerEvents: 'auto',
      }}
    >
      {/* Brand Identity / Status HUD */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
        <button
          onClick={() => handleStateClick('HERO')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              border: '1px solid var(--neon-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px var(--neon-cyan-glow)',
              transform: 'rotate(45deg)',
              background: 'rgba(0, 240, 255, 0.1)',
            }}
          >
            <span
              style={{
                display: 'block',
                transform: 'rotate(-45deg)',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '0.75rem',
                color: 'var(--neon-cyan)',
              }}
            >
              Ω
            </span>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '0.95rem',
                letterSpacing: '0.12em',
                color: '#ffffff',
              }}
            >
              ONLORATH<span className="neon-glow-cyan">_CORE</span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--neon-green)',
                letterSpacing: '0.08em',
              }}
            >
              ● FSM_ACTIVE // SYS_STABLE
            </div>
          </div>
        </button>
      </div>

      {/* Navigation State Switcher */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'rgba(8, 10, 28, 0.65)',
          padding: '0.25rem 0.4rem',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = currentState === item.state;
          const Icon = item.icon;
          return (
            <button
              key={item.state}
              onClick={() => handleStateClick(item.state)}
              style={{
                background: isActive ? 'rgba(0, 240, 255, 0.18)' : 'transparent',
                border: isActive ? '1px solid var(--neon-cyan)' : '1px solid transparent',
                color: isActive ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                padding: '0.45rem 0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderRadius: '3px',
                transition: 'all 0.18s ease',
                textShadow: isActive ? '0 0 8px var(--neon-cyan-glow)' : 'none',
              }}
            >
              <Icon size={14} />
              <span style={{ fontWeight: 600 }}>{item.label}</span>
              <span
                style={{
                  fontSize: '0.6rem',
                  opacity: 0.6,
                  display: 'none',
                }}
              >
                [{item.code}]
              </span>
            </button>
          );
        })}
      </nav>

      {/* Telemetry Counter & Audio Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
        {/* Live FPS & Latency stats */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            paddingRight: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Activity size={13} color="var(--neon-green)" />
            <span>{fps} FPS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ color: 'var(--neon-cyan)' }}>{latency}ms</span>
          </div>
        </div>

        {/* Synthetic Audio Mute Controller */}
        <button
          onClick={handleMuteToggle}
          title={isMuted ? 'Unmute Synthetic Audio' : 'Mute Audio'}
          style={{
            background: 'rgba(0, 240, 255, 0.08)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            color: isMuted ? 'var(--text-muted)' : 'var(--neon-cyan)',
            padding: '0.45rem',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </header>
  );
}
