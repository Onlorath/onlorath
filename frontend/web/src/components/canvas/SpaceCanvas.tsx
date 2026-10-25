'use client';

import { Canvas } from '@react-three/fiber';
import { CameraRig } from './CameraRig';
import { GravitationalCore } from './GravitationalCore';
import { StarfieldBuffer } from './StarfieldBuffer';
import { ConstellationGraph } from './ConstellationGraph';
import { PostEffects } from './PostEffects';

export function SpaceCanvas() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'auto' }}>
      <Canvas
        camera={{ position: [0, 0.8, 8.5], fov: 60, near: 0.1, far: 300 }}
        dpr={[1, 1.25]}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          alpha: true,
          stencil: false,
          depth: true,
          precision: 'mediump',
        }}
      >
        {/* Balanced space illumination */}
        <ambientLight intensity={0.45} />
        <directionalLight position={[8, 16, 12]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-8, -8, -8]} intensity={0.6} color="#b026ff" />

        {/* State Machine Camera Rig */}
        <CameraRig />

        {/* WebGL Scene Nodes */}
        <StarfieldBuffer />
        <GravitationalCore />
        <ConstellationGraph />

        {/* Optimized Post Processing Pass */}
        <PostEffects />
      </Canvas>
    </div>
  );
}
