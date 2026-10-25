'use client';

import { useState, useEffect } from 'react';
import { SKILLS_DATA } from '@/data/skillsData';
import { sceneFSM } from '@/lib/stateMachine';
import { audioEngine } from '@/lib/audioEngine';
import { SkillNode } from '@/types';
import { Cpu, CheckCircle2, Link2, Sparkles, Orbit } from 'lucide-react';

export function SkillMatrixView() {
  const [focusedId, setFocusedId] = useState<string>(SKILLS_DATA[0].id);

  useEffect(() => {
    return sceneFSM.subscribeNode((id) => {
      if (id) setFocusedId(id);
    });
  }, []);

  const activeNode = SKILLS_DATA.find((s) => s.id === focusedId) || SKILLS_DATA[0];

  const handleNodeClick = (node: SkillNode) => {
    audioEngine.playClick();
    setFocusedId(node.id);
    sceneFSM.setFocusedNode(node.id);
  };

  return (
    <div
      style={{
        maxWidth: '1200px',
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
          gridTemplateColumns: 'minmax(280px, 340px) 1fr',
          gap: '1.5rem',
          height: 'calc(100vh - 7.5rem)',
          pointerEvents: 'auto',
        }}
      >
        {/* Left List of Nodes */}
        <div
          className="cyber-glass-panel corner-brackets"
          style={{
            padding: '1.2rem',
            borderRadius: '6px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div style={{ paddingBottom: '0.6rem', borderBottom: '1px solid rgba(0, 240, 255, 0.2)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--neon-cyan)' }}>
              MODULE: NEURAL_CONSTELLATION
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
              3D SKILL NODES
            </div>
          </div>

          {SKILLS_DATA.map((skill) => {
            const isSelected = skill.id === activeNode.id;
            return (
              <button
                key={skill.id}
                onClick={() => handleNodeClick(skill)}
                style={{
                  textAlign: 'left',
                  background: isSelected ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? `1px solid ${skill.accentColor}` : '1px solid rgba(255, 255, 255, 0.06)',
                  padding: '0.8rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      color: skill.accentColor,
                    }}
                  >
                    {skill.category}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      color: '#ffffff',
                      fontWeight: 600,
                    }}
                  >
                    {skill.proficiency}%
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  {skill.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Detail Card (Synchronized with 3D Graph) */}
        <div
          className="cyber-glass-panel corner-brackets"
          style={{
            padding: '1.8rem',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.4rem',
            overflowY: 'auto',
          }}
        >
          {/* Node Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: activeNode.accentColor, marginBottom: '0.3rem' }}>
                NODE://{activeNode.id.toUpperCase()}
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
                {activeNode.name}
              </h2>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                PROFICIENCY INDEX
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: activeNode.accentColor }}>
                {activeNode.proficiency}%
              </div>
            </div>
          </div>

          {/* Description */}
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {activeNode.description}
          </p>

          {/* Core Strengths */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--neon-cyan)', marginBottom: '0.6rem', fontWeight: 700 }}>
              ARCHITECTURAL COMPETENCIES &amp; IMPLEMENTATION DEPTH
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.6rem' }}>
              {activeNode.coreStrengths.map((strength, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(3, 0, 20, 0.6)',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    fontSize: '0.85rem',
                    color: '#ffffff',
                  }}
                >
                  <CheckCircle2 size={16} color={activeNode.accentColor} style={{ flexShrink: 0 }} />
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics Card */}
          <div
            style={{
              background: 'rgba(8, 10, 28, 0.8)',
              border: `1px solid ${activeNode.accentColor}44`,
              padding: '1rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
            }}
          >
            <Orbit size={20} color={activeNode.accentColor} />
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                TELEMETRY BENCHMARK
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: '#ffffff', fontWeight: 600 }}>
                {activeNode.metrics}
              </div>
            </div>
          </div>

          {/* Connected 3D Node Links */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Link2 size={14} />
              <span>INTERCONNECTED GRAPH EDGES (CLICK TO WARP)</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {activeNode.connections.map((connId) => {
                const targetNode = SKILLS_DATA.find((s) => s.id === connId);
                if (!targetNode) return null;
                return (
                  <button
                    key={connId}
                    onClick={() => handleNodeClick(targetNode)}
                    className="cyber-btn"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                  >
                    <span>→ {targetNode.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
