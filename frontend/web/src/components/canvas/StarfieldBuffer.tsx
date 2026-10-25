'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sceneFSM } from '@/lib/stateMachine';

export function StarfieldBuffer() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 8000;

  const [positions, colors, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sc = new Float32Array(count);

    const cyan = new THREE.Color('#00f0ff');
    const purple = new THREE.Color('#b026ff');
    const blue = new THREE.Color('#38bdf8');
    const white = new THREE.Color('#ffffff');

    for (let i = 0; i < count; i++) {
      // Distribute in a deep sphere space
      const radius = 10 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      const roll = Math.random();
      let chosen = white;
      if (roll > 0.85) chosen = cyan;
      else if (roll > 0.65) chosen = purple;
      else if (roll > 0.45) chosen = blue;

      col[i * 3] = chosen.r;
      col[i * 3 + 1] = chosen.g;
      col[i * 3 + 2] = chosen.b;

      sc[i] = 0.5 + Math.random() * 1.5;
    }

    return [pos, col, sc];
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const isWarping = sceneFSM.getIsWarping();

    // Constant slow orbital drift
    pointsRef.current.rotation.y += delta * 0.015;
    pointsRef.current.rotation.x += delta * 0.008;

    // Mathematical Hyperspace Warp Stretch along Z-axis without allocating memory
    const targetScaleZ = isWarping ? 3.8 : 1.0;
    pointsRef.current.scale.z = THREE.MathUtils.damp(pointsRef.current.scale.z, targetScaleZ, 8, delta);
    
    if (isWarping) {
      pointsRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[scales, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
