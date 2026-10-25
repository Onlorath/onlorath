'use client';

import { sceneFSM } from '@/lib/stateMachine';
import { audioEngine } from '@/lib/audioEngine';
import { Layers, Terminal, ArrowRight, ShieldCheck, Zap, Server, Network } from 'lucide-react';

export function HeroView() {
  const handleWarp = (target: 'PROJECTS' | 'TERMINAL' | 'SKILLS') => {
    audioEngine.playWarp();
    sceneFSM.transitionTo(target);
  };

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '6rem 2rem 2rem 2rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div style={{ maxWidth: '780px', pointerEvents: 'auto' }}>
        {/* Security / System Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            background: 'rgba(0, 240, 255, 0.08)',
            border: '1px solid var(--neon-cyan)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--neon-cyan)',
            marginBottom: '1.2rem',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)',
          }}
        >
          <Zap size={14} className="animate-cyber-pulse" />
          <span>ENTERPRISE SYSTEM ARCHITECTURE & AI RUNTIME</span>
        </div>

        {/* Title Headline */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.4rem, 5vw, 4.2rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: '1.2rem',
            color: '#ffffff',
          }}
        >
          ENGINEERING FOR{' '}
          <span className="neon-glow-cyan">EXTREME SCALE</span> &amp;{' '}
          <span className="neon-glow-purple">ZERO ALLOCATION</span>
        </h1>

        {/* Sub-headline Philosophy */}
        <p
          style={{
            fontSize: 'clamp(1rem, 1.4vw, 1.2rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '2rem',
            maxWidth: '680px',
          }}
        >
          Senior Software Engineer specializing in <strong style={{ color: '#ffffff' }}>Clean Hexagonal Go Backends</strong>,{' '}
          <strong style={{ color: '#ffffff' }}>Sub-millisecond Distributed Pipelines</strong>, and{' '}
          <strong style={{ color: '#ffffff' }}>GPU-Accelerated WebGL/Three.js Shaders</strong>. No bloated ORMs, no runtime GC spikes.
        </p>

        {/* Fast Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          <button
            className="cyber-btn"
            onClick={() => handleWarp('PROJECTS')}
            style={{ fontSize: '0.9rem', padding: '0.8rem 1.6rem' }}
          >
            <Layers size={16} />
            <span>EXPLORE SYSTEM ARCHITECTURES</span>
            <ArrowRight size={16} />
          </button>

          <button
            className="cyber-btn cyber-btn-purple"
            onClick={() => handleWarp('TERMINAL')}
            style={{ fontSize: '0.9rem', padding: '0.8rem 1.6rem' }}
          >
            <Terminal size={16} />
            <span>LAUNCH AI COMMAND DECK</span>
          </button>
        </div>

        {/* Real-Time Benchmark HUD Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            maxWidth: '720px',
          }}
        >
          <div className="cyber-glass-panel" style={{ padding: '1rem', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--neon-cyan)', marginBottom: '0.3rem' }}>
              <Server size={14} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>THROUGHPUT</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
              1.2M <span style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)' }}>ops/s</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Lock-free Go ring buffers
            </div>
          </div>

          <div className="cyber-glass-panel" style={{ padding: '1rem', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--neon-purple)', marginBottom: '0.3rem' }}>
              <Zap size={14} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>LATENCY SLA</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
              &lt; 350 <span style={{ fontSize: '0.8rem', color: 'var(--neon-purple)' }}>µs</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              P99 deterministic bounds
            </div>
          </div>

          <div className="cyber-glass-panel" style={{ padding: '1rem', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--neon-green)', marginBottom: '0.3rem' }}>
              <ShieldCheck size={14} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>PERSISTENCE</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
              0% <span style={{ fontSize: '0.8rem', color: 'var(--neon-green)' }}>ORM</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              100% Raw SQL &amp; sqlx
            </div>
          </div>

          <div className="cyber-glass-panel" style={{ padding: '1rem', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--neon-pink)', marginBottom: '0.3rem' }}>
              <Network size={14} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>WEBGL RENDER</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
              120 <span style={{ fontSize: '0.8rem', color: 'var(--neon-pink)' }}>FPS</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Zero-GC instanced shaders
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
