'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { sceneFSM } from '@/lib/stateMachine';
import { AppState } from '@/types';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { HUDHeader } from '@/components/ui/HUDHeader';
import { HeroView } from '@/components/ui/HeroView';
import { ProjectMatrix } from '@/components/ui/ProjectMatrix';
import { SkillMatrixView } from '@/components/ui/SkillMatrixView';
import { NeuralTerminal } from '@/components/ui/NeuralTerminal';
import { ContactNode } from '@/components/ui/ContactNode';

// Dynamic import for WebGL Canvas with SSR disabled to ensure WebGL context safety
const SpaceCanvas = dynamic(
  () => import('@/components/canvas/SpaceCanvas').then((mod) => mod.SpaceCanvas),
  { ssr: false }
);

export default function Home() {
  const [currentState, setCurrentState] = useState<AppState>('HERO');

  useEffect(() => {
    // Subscribe to state changes
    const unsub = sceneFSM.subscribeState((nextState) => {
      setCurrentState(nextState);
    });

    return () => {
      unsub();
    };
  }, []);

  return (
    <ErrorBoundary>
      <main
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#030014',
        }}
      >
        {/* 3D WebGL Canvas Layer */}
        <SpaceCanvas />

        {/* Global HUD Header */}
        <HUDHeader />

        {/* Active View Layer */}
        <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%' }}>
          {currentState === 'HERO' && <HeroView />}
          {currentState === 'PROJECTS' && <ProjectMatrix />}
          {currentState === 'SKILLS' && <SkillMatrixView />}
          {currentState === 'TERMINAL' && <NeuralTerminal />}
          {currentState === 'CONTACT' && <ContactNode />}
        </div>
      </main>
    </ErrorBoundary>
  );
}
