'use client';

import { useState } from 'react';
import { PROJECTS_DATA } from '@/data/projectsData';
import { audioEngine } from '@/lib/audioEngine';
import { ProjectArchitecture } from '@/types';
import { CheckCircle2, ChevronRight, Cpu, GitBranch, Terminal, ShieldAlert, Sparkles } from 'lucide-react';

const CODE_SNIPPETS: Record<string, string> = {
  'stream-core': `// Go Hexagonal Ingestion Port with Zero-Allocation Ring Buffer
package ringbuffer

import (
	"sync/atomic"
	"unsafe"
)

type EventSlot[T any] struct {
	sequence uint64
	data     T
	_pad     [56]byte // Cache-line padding to eliminate false sharing
}

type DisruptorRing[T any] struct {
	buffer   []EventSlot[T]
	mask     uint64
	cursor   uint64 // atomic
	_pad     [56]byte
}

func (r *DisruptorRing[T]) Publish(item T) {
	seq := atomic.AddUint64(&r.cursor, 1) - 1
	slot := &r.buffer[seq&r.mask]
	for atomic.LoadUint64(&slot.sequence) != seq {
		// Low-latency CPU pause intrinsic
		hardwareYield()
	}
	slot.data = item
	atomic.StoreUint64(&slot.sequence, seq+1)
}`,
  'neural-mesh': `# Speculative DAG Execution Engine with Asynchronous Token Streaming
import asyncio
from typing import AsyncGenerator, Dict, List

class SpeculativeAgentGraph:
    def __init__(self, dag_adjacency: Dict[str, List[str]]):
        self.dag = dag_adjacency
        self.cache = TensorMemoryMappedCache(device="cuda:0")

    async def execute_stream(self, prompt: str) -> AsyncGenerator[str, None]:
        # Launch root agents & concurrently pre-warm speculative branches
        tasks = [self._evaluate_node(node, prompt) for node in self.dag["root"]]
        async for token_chunk in asyncio.as_completed(tasks):
            res = await token_chunk
            if res.confidence > 0.94:
                yield res.token_stream
                self.cache.commit(res.embeddings)`,
  'shader-telemetry': `// Custom GLSL Vertex Shader - GPU-Instanced Particle Orbit Transform
precision highp float;

attribute vec3 instancePosition;
attribute vec3 instanceColor;
attribute float instanceScale;

uniform float uTime;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec3 vColor;

void main() {
    vColor = instanceColor;
    
    // Trigonometric non-linear spatial deformation
    vec3 pos = instancePosition;
    float theta = uTime * 0.4 + length(pos.xz) * 0.5;
    pos.x += sin(theta) * 0.35;
    pos.y += cos(theta * 1.2) * 0.25;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (18.0 * instanceScale) / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
}`,
  'order-matching': `// Deterministic Go Order Book Matching Core (Zero ORM / Raw SQL WAL)
package engine

import (
	"context"
	"database/sql"
)

type MatchEngine struct {
	db  *sql.DB
	wal *sql.Stmt // Prepared write-ahead log statement
}

func (m *MatchEngine) ExecuteLimitOrder(ctx context.Context, order *Order) (*MatchResult, error) {
	// 1. In-Memory O(1) Match Resolution
	match := m.book.Match(order)
	
	// 2. Asynchronous Batched WAL Persistence via Raw Prepared Statement
	_, err := m.wal.ExecContext(ctx, match.ID, match.Price, match.Qty, match.Timestamp)
	if err != nil {
		return nil, ErrWALWriteFailure
	}
	return match, nil
}`,
};

export function ProjectMatrix() {
  const [selectedId, setSelectedId] = useState<string>(PROJECTS_DATA[0].id);
  const selectedProject = PROJECTS_DATA.find((p) => p.id === selectedId) || PROJECTS_DATA[0];

  const handleSelect = (project: ProjectArchitecture) => {
    audioEngine.playClick();
    setSelectedId(project.id);
  };

  return (
    <div
      style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '5.5rem 2rem 2rem 2rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '1.5rem',
          height: 'calc(100vh - 7.5rem)',
          pointerEvents: 'auto',
        }}
      >
        {/* Left Sidebar: Project System Selector */}
        <div
          className="cyber-glass-panel corner-brackets"
          style={{
            padding: '1.2rem',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem',
            overflowY: 'auto',
          }}
        >
          <div style={{ paddingBottom: '0.6rem', borderBottom: '1px solid rgba(0, 240, 255, 0.2)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--neon-cyan)' }}>
              MODULE: ARCHITECTURAL_BLUEPRINTS
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
              SYSTEM MATRIX
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {PROJECTS_DATA.map((proj) => {
              const isSelected = proj.id === selectedId;
              return (
                <button
                  key={proj.id}
                  onClick={() => handleSelect(proj)}
                  style={{
                    textAlign: 'left',
                    background: isSelected ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '0.85rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.65rem',
                        color: isSelected ? 'var(--neon-cyan)' : 'var(--text-muted)',
                      }}
                    >
                      {proj.codename}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6rem',
                        color: proj.status === 'PRODUCTION' ? 'var(--neon-green)' : 'var(--neon-yellow)',
                        padding: '0.1rem 0.4rem',
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: '2px',
                      }}
                    >
                      {proj.status}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      marginBottom: '0.3rem',
                    }}
                  >
                    {proj.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {proj.shortDesc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content: Deep Architectural Analysis */}
        <div
          className="cyber-glass-panel corner-brackets"
          style={{
            padding: '1.6rem',
            borderRadius: '6px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.4rem',
          }}
        >
          {/* Header & Meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--neon-cyan)',
                    padding: '0.2rem 0.5rem',
                    background: 'rgba(0, 240, 255, 0.1)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '2px',
                  }}
                >
                  {selectedProject.category}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  ID: {selectedProject.codename}
                </span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
                {selectedProject.title}
              </h2>
            </div>

            {/* Quick Stat Badges */}
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              {selectedProject.stats.map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '4px',
                    textAlign: 'right',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--neon-cyan)' }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.92rem' }}>
            {selectedProject.fullDesc}
          </p>

          {/* Big-O Complexity Matrix */}
          <div
            style={{
              background: 'rgba(3, 0, 20, 0.65)',
              border: '1px solid rgba(176, 38, 255, 0.3)',
              borderRadius: '4px',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Cpu size={15} color="var(--neon-purple)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--neon-purple)', fontWeight: 700 }}>
                BIG-O COMPLEXITY &amp; THROUGHPUT SPECIFICATIONS
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>TIME COMPLEXITY:</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>
                  {selectedProject.complexity.time}
                </div>
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>SPACE FOOTPRINT:</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>
                  {selectedProject.complexity.space}
                </div>
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>THROUGHPUT BOUND:</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>
                  {selectedProject.complexity.throughput}
                </div>
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>P99 LATENCY SLA:</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--neon-green)', fontWeight: 600 }}>
                  {selectedProject.complexity.latency}
                </div>
              </div>
            </div>
          </div>

          {/* Architectural Decisions */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--neon-cyan)', marginBottom: '0.6rem', fontWeight: 700 }}>
              ENTERPRISE ARCHITECTURAL DECISIONS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {selectedProject.architecturalDecisions.map((dec, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={15} color="var(--neon-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{dec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan A (Tutorial Standard) vs Plan B (Enterprise Senior Architect) */}
          <div
            style={{
              background: 'rgba(8, 10, 28, 0.8)',
              border: '1px solid rgba(255, 0, 127, 0.3)',
              borderRadius: '4px',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <GitBranch size={15} color="var(--neon-pink)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--neon-pink)', fontWeight: 700 }}>
                RATIONAL TRADE-OFFS: PLAN A (MARKET STANDARD) VS PLAN B (SYSTEM ARCHITECT)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.6rem' }}>
              <div style={{ background: 'rgba(255, 0, 127, 0.05)', padding: '0.6rem', borderRadius: '3px', borderLeft: '2px solid var(--neon-pink)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--neon-pink)', fontWeight: 600 }}>
                  [ PLAN A: CONVENTIONAL / TUTORIAL APPROACH ]
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {selectedProject.tradeOffs.planA}
                </div>
              </div>

              <div style={{ background: 'rgba(0, 255, 157, 0.05)', padding: '0.6rem', borderRadius: '3px', borderLeft: '2px solid var(--neon-green)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--neon-green)', fontWeight: 600 }}>
                  [ PLAN B: MATHEMATICAL / LOW-LEVEL ARCHITECTURE ]
                </div>
                <div style={{ fontSize: '0.8rem', color: '#ffffff', marginTop: '0.2rem' }}>
                  {selectedProject.tradeOffs.planB}
                </div>
              </div>
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '3px' }}>
              <strong style={{ color: 'var(--neon-cyan)' }}>Architect Rationale:</strong> {selectedProject.tradeOffs.rationale}
            </div>
          </div>

          {/* Architecture Code Snippet */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Terminal size={14} />
                <span>CORE IMPLEMENTATION BLUEPRINT</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                ZERO ALLOCATION / ZERO ORM
              </span>
            </div>
            <pre
              style={{
                background: 'rgba(3, 0, 16, 0.9)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                borderRadius: '4px',
                padding: '1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: '#38bdf8',
                overflowX: 'auto',
                lineHeight: 1.45,
              }}
            >
              <code>{CODE_SNIPPETS[selectedProject.id]}</code>
            </pre>
          </div>

          {/* Tech Stack Badges */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              CORE TECH STACK
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {selectedProject.techStack.map((tech) => (
                <span
                  key={tech}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--text-primary)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '3px',
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
