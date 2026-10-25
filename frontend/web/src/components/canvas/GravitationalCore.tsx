'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function GravitationalCore() {
  const coreRef = useRef<THREE.Group>(null);
  const innerNucleusRef = useRef<THREE.Mesh>(null);
  const outerWireRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  // Instanced orbital particles around the core (optimized 750 count)
  const particleCount = 750;
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const colorCyan = new THREE.Color('#00f0ff');
    const colorPurple = new THREE.Color('#b026ff');
    const colorPink = new THREE.Color('#ff007f');

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.6 + Math.random() * 2.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.45; // Flattened accretion disk
      pos[i * 3 + 2] = radius * Math.cos(phi);

      const mixVal = Math.random();
      const chosenColor = mixVal > 0.6 ? colorCyan : mixVal > 0.3 ? colorPurple : colorPink;
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;
    }
    return [pos, col];
  }, []);

  const particlesRef = useRef<THREE.Points>(null);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    if (coreRef.current) {
      coreRef.current.position.y = Math.sin(elapsed * 0.8) * 0.15;
    }

    if (innerNucleusRef.current) {
      innerNucleusRef.current.rotation.x += delta * 0.4;
      innerNucleusRef.current.rotation.y += delta * 0.6;
      // Pulse scale
      const scale = 1 + Math.sin(elapsed * 2.2) * 0.08;
      innerNucleusRef.current.scale.setScalar(scale);
    }

    if (outerWireRef.current) {
      outerWireRef.current.rotation.x -= delta * 0.25;
      outerWireRef.current.rotation.z += delta * 0.35;
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = Math.PI / 3 + Math.sin(elapsed * 0.5) * 0.1;
      ring1Ref.current.rotation.z += delta * 0.3;
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.y += delta * 0.4;
      ring2Ref.current.rotation.x = -Math.PI / 4 + Math.cos(elapsed * 0.6) * 0.12;
    }

    if (ring3Ref.current) {
      ring3Ref.current.rotation.z -= delta * 0.5;
      ring3Ref.current.rotation.y = Math.PI / 6 + Math.sin(elapsed * 0.4) * 0.15;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={coreRef} position={[0, 0, 0]}>
      {/* Central Solid Pulsing Core */}
      <mesh ref={innerNucleusRef}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#00f0ff"
          emissiveIntensity={2.5}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Outer Holographic Geometric Wireframe */}
      <mesh ref={outerWireRef}>
        <dodecahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial
          color="#b026ff"
          emissive="#b026ff"
          emissiveIntensity={1.8}
          wireframe
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Orbital Neon Ring 1 (Cyan) - 8x48 segments */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.4, 0.018, 8, 48]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.8} />
      </mesh>

      {/* Orbital Neon Ring 2 (Purple) - 8x48 segments */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[3.1, 0.015, 8, 48]} />
        <meshBasicMaterial color="#b026ff" transparent opacity={0.7} />
      </mesh>

      {/* Orbital Neon Ring 3 (Pink) - 8x48 segments */}
      <mesh ref={ring3Ref}>
        <torusGeometry args={[3.8, 0.012, 8, 48]} />
        <meshBasicMaterial color="#ff007f" transparent opacity={0.6} />
      </mesh>

      {/* Accretion Swarm of Instanced Particle Points */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          vertexColors
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Consolidated Core Point Light emitting neon radiance */}
      <pointLight color="#00f0ff" intensity={10} distance={18} decay={2} />
    </group>
  );
}
