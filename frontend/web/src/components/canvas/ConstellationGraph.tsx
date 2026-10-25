'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SKILLS_DATA } from '@/data/skillsData';
import { sceneFSM } from '@/lib/stateMachine';
import { audioEngine } from '@/lib/audioEngine';
import { SkillNode } from '@/types';

interface NodeProps {
  node: SkillNode;
  isFocused: boolean;
  onSelect: (nodeId: string) => void;
}

function SkillGraphNode({ node, isFocused, onSelect }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.7;
      ringRef.current.rotation.y += delta * 0.4;
    }
    if (meshRef.current) {
      const targetScale = isFocused ? 1.5 : hovered ? 1.25 : 1.0;
      // In-place scalar math - zero heap allocations inside useFrame
      const currentScale = meshRef.current.scale.x;
      if (Math.abs(currentScale - targetScale) > 0.005) {
        const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.12);
        meshRef.current.scale.setScalar(nextScale);
      }
    }
  });

  return (
    <group position={node.position}>
      {/* Interactive Core Sphere - Optimized 16x16 geometry */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          audioEngine.playClick();
          onSelect(node.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          setHovered(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
          setHovered(false);
        }}
      >
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color={node.accentColor}
          emissive={node.accentColor}
          emissiveIntensity={isFocused ? 3.0 : hovered ? 2.2 : 1.4}
          roughness={0.25}
          metalness={0.75}
        />
      </mesh>

      {/* Orbiting Ring - Low-overhead 8x32 geometry */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.32, 0.008, 8, 32]} />
        <meshBasicMaterial
          color={node.accentColor}
          transparent
          opacity={isFocused || hovered ? 0.85 : 0.35}
        />
      </mesh>
    </group>
  );
}

export function ConstellationGraph() {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    return sceneFSM.subscribeNode((id) => setFocusedId(id));
  }, []);

  // Compute static line segments connecting nodes
  const linePositions = useMemo(() => {
    const coords: number[] = [];
    const nodeMap = new Map(SKILLS_DATA.map((n) => [n.id, n]));

    SKILLS_DATA.forEach((node) => {
      node.connections.forEach((targetId) => {
        const target = nodeMap.get(targetId);
        if (target) {
          coords.push(...node.position);
          coords.push(...target.position);
        }
      });
    });

    return new Float32Array(coords);
  }, []);

  const linesRef = useRef<THREE.LineSegments>(null);

  useFrame((state) => {
    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.35 + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.15;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 3D Interconnecting Laser Lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Nodes */}
      {SKILLS_DATA.map((node) => (
        <SkillGraphNode
          key={node.id}
          node={node}
          isFocused={focusedId === node.id}
          onSelect={(id) => sceneFSM.setFocusedNode(id === focusedId ? null : id)}
        />
      ))}
    </group>
  );
}
