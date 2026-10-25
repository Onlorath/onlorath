'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA_CONFIGS, sceneFSM } from '@/lib/stateMachine';
import { AppState } from '@/types';

// Pre-allocated Vector3 and Math singletons to prevent GC allocations inside useFrame (Big-O Space O(1))
const TARGET_POS = new THREE.Vector3();
const TARGET_LOOK = new THREE.Vector3();
const CURRENT_LOOK = new THREE.Vector3();
const MOUSE_OFFSET = new THREE.Vector2();

export function CameraRig() {
  const { camera } = useThree();
  const activeStateRef = useRef<AppState>(sceneFSM.getState());
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Initial camera coordinates
    const initialConfig = CAMERA_CONFIGS[activeStateRef.current];
    camera.position.set(...initialConfig.position);
    CURRENT_LOOK.set(...initialConfig.target);
    camera.lookAt(CURRENT_LOOK);

    // Subscribe to FSM state changes
    const unsubscribeState = sceneFSM.subscribeState((nextState) => {
      activeStateRef.current = nextState;
    });

    // Subtle parallax mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      unsubscribeState();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [camera]);

  useFrame((_, delta) => {
    const config = CAMERA_CONFIGS[activeStateRef.current];
    if (!config) return;

    // Smooth Lerp factor based on frame delta time
    const lerpSpeed = sceneFSM.getIsWarping() ? 6.5 : 3.2;
    const factor = 1 - Math.exp(-lerpSpeed * delta);

    // Target position with subtle parallax offset
    MOUSE_OFFSET.set(mouseRef.current.x * 0.4, -mouseRef.current.y * 0.3);
    TARGET_POS.set(
      config.position[0] + MOUSE_OFFSET.x,
      config.position[1] + MOUSE_OFFSET.y,
      config.position[2]
    );

    TARGET_LOOK.set(
      config.target[0] + MOUSE_OFFSET.x * 0.3,
      config.target[1] + MOUSE_OFFSET.y * 0.3,
      config.target[2]
    );

    // In-place vector interpolation without heap allocation
    camera.position.lerp(TARGET_POS, factor);
    CURRENT_LOOK.lerp(TARGET_LOOK, factor);
    camera.lookAt(CURRENT_LOOK);

    // Dynamic FOV interpolation if perspective camera
    if ('fov' in camera && typeof camera.fov === 'number') {
      const pCam = camera as THREE.PerspectiveCamera;
      if (Math.abs(pCam.fov - config.fov) > 0.05) {
        pCam.fov = THREE.MathUtils.lerp(pCam.fov, config.fov, factor);
        pCam.updateProjectionMatrix();
      }
    }
  });

  return null;
}
