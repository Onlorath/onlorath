'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Rocket3DProps {
  introPhase?: 'typing1' | 'typing2' | 'flying' | 'fading' | 'completed';
  onFlyingComplete?: () => void;
}

export default function Rocket3D({ introPhase = 'completed', onFlyingComplete }: Rocket3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);
  const isScrollingRef = useRef(false);
  const scrollDeltaRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const phaseRef = useRef(introPhase);
  const onFlyingCompleteRef = useRef(onFlyingComplete);

  useEffect(() => {
    phaseRef.current = introPhase;
  }, [introPhase]);

  useEffect(() => {
    onFlyingCompleteRef.current = onFlyingComplete;
  }, [onFlyingComplete]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // --- 1. Scene, Camera, Renderer Setup ---
    const scene = new THREE.Scene();

    // Perspective camera for realistic 3D depth. Slightly further back (Z=11.5) to avoid clipping.
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 11.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // --- 2. Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0x06b6d4, 1.6); // Cyan key light
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xd946ef, 1.3); // Fuchsia fill light
    directionalLight2.position.set(-5, -3, 3);
    scene.add(directionalLight2);

    const pointLight = new THREE.PointLight(0xff7700, 2.5, 9); // Orange thruster light
    pointLight.position.set(0, -2, 0);
    scene.add(pointLight);

    // --- 3. Build Procedural Premium Rocket ---
    const rocketGroup = new THREE.Group();

    // Materials (Smooth shaded, premium metallic finishes)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3748, // Metal slate-grey
      metalness: 0.88,
      roughness: 0.22,
      flatShading: false,
    });

    const neonCyanMaterial = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Neon cyan
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
      metalness: 0.2,
      roughness: 0.1,
      flatShading: false,
    });

    const neonFuchsiaMaterial = new THREE.MeshStandardMaterial({
      color: 0xd946ef, // Neon fuchsia
      emissive: 0xc084fc,
      emissiveIntensity: 0.6,
      metalness: 0.2,
      roughness: 0.1,
      flatShading: false,
    });

    const engineMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      metalness: 0.95,
      roughness: 0.15,
      flatShading: false,
    });

    const windowGlassMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0f7fa,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.8,
      metalness: 0.1,
      roughness: 0.05,
    });

    const flameMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const innerFlameMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });

    // 3.1. Main Fuselage (Bulging curved body for sleek spaceship vibe)
    const bodyPoints = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const y = -0.9 + t * 1.8; // Y ranges from -0.9 to 0.9
      const radius = 0.38 + 0.08 * Math.sin(t * Math.PI);
      bodyPoints.push(new THREE.Vector2(radius, y));
    }
    const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
    rocketGroup.add(bodyMesh);

    // 3.2. Nose Cone (Elegant Gothic arch/Ogive curved nose tip)
    const nosePoints = [];
    const noseHeight = 0.75;
    for (let i = 0; i <= 15; i++) {
      const t = i / 15;
      const y = t * noseHeight;
      const radius = 0.38 * Math.cos(t * Math.PI / 2);
      nosePoints.push(new THREE.Vector2(radius, y));
    }
    const noseGeo = new THREE.LatheGeometry(nosePoints, 32);
    const noseMesh = new THREE.Mesh(noseGeo, neonFuchsiaMaterial);
    noseMesh.position.y = 0.9; 
    rocketGroup.add(noseMesh);

    // 3.3. Glowing Decorative Rings (Rounded Torus rings hugging the body curves)
    const ringGeo1 = new THREE.TorusGeometry(0.465, 0.025, 16, 48);
    const ring1 = new THREE.Mesh(ringGeo1, neonFuchsiaMaterial);
    ring1.position.y = -0.1;
    ring1.rotation.x = Math.PI / 2;
    rocketGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(0.44, 0.025, 16, 48);
    const ring2 = new THREE.Mesh(ringGeo2, neonCyanMaterial);
    ring2.position.y = 0.5;
    ring2.rotation.x = Math.PI / 2;
    rocketGroup.add(ring2);

    // 3.4. Glass Cockpit Canopy (Stretched aerodynamic cockpit dome)
    const windowGeo = new THREE.SphereGeometry(0.22, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const windowMesh = new THREE.Mesh(windowGeo, windowGlassMaterial);
    windowMesh.position.set(0, 0.25, 0.32);
    windowMesh.scale.set(1.0, 1.8, 0.65); 
    windowMesh.rotation.set(0.35, 0, 0); // Tilted forward
    rocketGroup.add(windowMesh);

    // 3.5. Side Boosters / Warp Pods (Sleek aerodynamic capsules)
    const boosterGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.9, 32);
    const boosterNoseGeo = new THREE.SphereGeometry(0.11, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const boosterEngineGeo = new THREE.CylinderGeometry(0.07, 0.10, 0.15, 32);

    const leftBooster = new THREE.Group();
    leftBooster.position.set(-0.45, -0.3, 0.1);
    const leftBoosterMesh = new THREE.Mesh(boosterGeo, bodyMaterial);
    const leftBoosterNose = new THREE.Mesh(boosterNoseGeo, neonFuchsiaMaterial);
    leftBoosterNose.position.y = 0.45;
    const leftBoosterEngine = new THREE.Mesh(boosterEngineGeo, engineMaterial);
    leftBoosterEngine.position.y = -0.525;
    leftBooster.add(leftBoosterMesh, leftBoosterNose, leftBoosterEngine);
    rocketGroup.add(leftBooster);

    const rightBooster = new THREE.Group();
    rightBooster.position.set(0.45, -0.3, 0.1);
    const rightBoosterMesh = new THREE.Mesh(boosterGeo, bodyMaterial);
    const rightBoosterNose = new THREE.Mesh(boosterNoseGeo, neonFuchsiaMaterial);
    rightBoosterNose.position.y = 0.45;
    const rightBoosterEngine = new THREE.Mesh(boosterEngineGeo, engineMaterial);
    rightBoosterEngine.position.y = -0.525;
    rightBooster.add(rightBoosterMesh, rightBoosterNose, rightBoosterEngine);
    rocketGroup.add(rightBooster);

    // 3.6. Swept wings (Sleek delta wings for spaceship styling)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0.5);
    wingShape.lineTo(1.1, -0.3); // Extends far out and sweeps back
    wingShape.lineTo(0.95, -0.45);
    wingShape.lineTo(0, -0.15);
    wingShape.closePath();

    const wingExtrudeSettings = {
      depth: 0.015,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.01,
      bevelThickness: 0.01,
    };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
    wingGeo.translate(0, 0, -0.007);
    
    // Left Wing
    const leftWing = new THREE.Mesh(wingGeo, bodyMaterial);
    leftWing.position.set(0.35, -0.3, 0);
    leftWing.rotation.set(0.12, 0, -0.15); // dihedral angle
    rocketGroup.add(leftWing);

    // Right Wing (Mirrored)
    const rightWing = new THREE.Mesh(wingGeo, bodyMaterial);
    rightWing.position.set(-0.35, -0.3, 0);
    rightWing.rotation.set(0.12, Math.PI, -0.15); 
    rocketGroup.add(rightWing);

    // Vertical Tail Fin
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0.4);
    tailShape.lineTo(0.5, -0.1);
    tailShape.lineTo(0.42, -0.2);
    tailShape.lineTo(0, 0.05);
    tailShape.closePath();

    const tailGeo = new THREE.ExtrudeGeometry(tailShape, wingExtrudeSettings);
    tailGeo.translate(0, 0, -0.007);
    
    const tailMesh = new THREE.Mesh(tailGeo, neonFuchsiaMaterial);
    tailMesh.position.set(0, -0.3, -0.35);
    tailMesh.rotation.set(0.2, -Math.PI / 2, 0);
    rocketGroup.add(tailMesh);

    // Wingtip Thruster Nodes
    const wingTipGeo = new THREE.SphereGeometry(0.045, 16, 16);
    
    const leftWingTip = new THREE.Mesh(wingTipGeo, neonCyanMaterial);
    leftWingTip.position.set(1.08, -0.12, 0.09);
    leftWing.add(leftWingTip);

    const rightWingTip = new THREE.Mesh(wingTipGeo, neonCyanMaterial);
    rightWingTip.position.set(1.08, -0.12, 0.09);
    rightWing.add(rightWingTip);

    // 3.7. Main Engine Bell (Curved, flared space engine nozzle)
    const enginePoints = [];
    const engineHeight = 0.3;
    for (let i = 0; i <= 15; i++) {
      const t = i / 15;
      const y = -t * engineHeight;
      const radius = 0.22 + 0.1 * Math.pow(t, 2);
      enginePoints.push(new THREE.Vector2(radius, y));
    }
    const engineGeo = new THREE.LatheGeometry(enginePoints, 32);
    const engineMesh = new THREE.Mesh(engineGeo, engineMaterial);
    engineMesh.position.y = -0.9;
    rocketGroup.add(engineMesh);

    // 3.8. Main & Booster Flames (Smoothed high-poly engines flames)
    const flameGeo = new THREE.ConeGeometry(0.2, 0.9, 32);
    flameGeo.translate(0, -0.45, 0); 
    const innerFlameGeo = new THREE.ConeGeometry(0.1, 0.5, 32);
    innerFlameGeo.translate(0, -0.25, 0);

    // Main Engine Flame
    const mainFlame = new THREE.Mesh(flameGeo, flameMaterial);
    mainFlame.position.y = -1.2;
    rocketGroup.add(mainFlame);

    const mainInnerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMaterial);
    mainInnerFlame.position.y = -1.2;
    rocketGroup.add(mainInnerFlame);

    // Side Booster Flames (Smaller, smooth)
    const boosterFlameGeo = new THREE.ConeGeometry(0.08, 0.4, 32);
    boosterFlameGeo.translate(0, -0.2, 0);

    const leftFlame = new THREE.Mesh(boosterFlameGeo, flameMaterial);
    leftFlame.position.set(-0.42, -0.92, 0);
    rocketGroup.add(leftFlame);

    const rightFlame = new THREE.Mesh(boosterFlameGeo, flameMaterial);
    rightFlame.position.set(0.42, -0.92, 0);
    rocketGroup.add(rightFlame);

    // Add everything to the scene
    scene.add(rocketGroup);

    // Set initial scale & rotation
    rocketGroup.scale.set(1.2, 1.2, 1.2);
    rocketGroup.rotation.y = 0.5;

    // --- 4. Scroll Event Listeners ---
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      
      scrollProgressRef.current = progress;

      const currentDelta = scrollTop - lastScrollYRef.current;
      scrollDeltaRef.current = Math.min(Math.abs(currentDelta) * 0.05, 2.5); 
      lastScrollYRef.current = scrollTop;

      isScrollingRef.current = true;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        scrollDeltaRef.current = 0;
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Handle screen resize
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      renderer.setSize(newWidth, newHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // --- 5. Animation Render Loop ---
    let currentY = 3.6;
    let currentRotationX = 0;
    let currentRotationZ = 0;
    let currentFlameScale = 0.2;

    // Flight transition tracking variables
    let flyStartTime = 0;
    let startX = 0;
    let startY = 3.6;
    let startRotX = 0;
    let startRotY = 0.5;
    let startRotZ = 0.2;
    let hasNotifiedComplete = false;

    const animate = () => {
      const wWidth = window.innerWidth;
      const wHeight = window.innerHeight;

      // 5.1. Visible dimensions mapping
      const visibleHeight = 2 * 11.5 * Math.tan((20 * Math.PI) / 180); // ~8.37
      const visibleWidth = visibleHeight * (wWidth / wHeight);

      // Target position on the right of the screen (mimics old w-48 layout)
      const targetLandingX = ((wWidth / 2) - 90) * visibleHeight / wHeight;

      const activePhase = phaseRef.current;

      if (activePhase === 'typing1' || activePhase === 'typing2') {
        // Rocket floats in center-right of the screen (shifted further right to avoid text overlap)
        const time = performance.now() * 0.001;
        const targetX = 2.4 + Math.cos(time * 1.2) * 0.04;
        const targetY = Math.sin(time * 1.8) * 0.1;

        // Smoothly update positions (immediate follow)
        rocketGroup.position.x = targetX;
        rocketGroup.position.y = targetY;
        rocketGroup.position.z = 0;

        // Slow idle spin on Y axis
        rocketGroup.rotation.y += 0.015;
        
        // Gentle hover rotations on X/Z
        currentRotationX += (0.1 - currentRotationX) * 0.05;
        currentRotationZ += (0.1 - currentRotationZ) * 0.05;
        rocketGroup.rotation.x = currentRotationX;
        rocketGroup.rotation.z = currentRotationZ;

        // Idle thrusters
        const targetFlameScale = 0.35;
        currentFlameScale += (targetFlameScale - currentFlameScale) * 0.1;
        const flicker = 1.0 + (Math.random() - 0.5) * 0.12;

        mainFlame.scale.set(currentFlameScale * flicker, currentFlameScale * flicker * 1.3, currentFlameScale * flicker);
        mainInnerFlame.scale.set(currentFlameScale * 0.6 * flicker, currentFlameScale * 0.6 * flicker * 1.1, currentFlameScale * 0.6 * flicker);
        leftFlame.scale.set(currentFlameScale * 0.8 * flicker, currentFlameScale * 0.8 * flicker * 1.1, currentFlameScale * 0.8 * flicker);
        rightFlame.scale.set(currentFlameScale * 0.8 * flicker, currentFlameScale * 0.8 * flicker * 1.1, currentFlameScale * 0.8 * flicker);
        pointLight.intensity = currentFlameScale * 2.5;
        pointLight.position.y = targetY - 1.2;

      } else if (activePhase === 'flying') {
        // --- Flying Transition State ---
        if (flyStartTime === 0) {
          flyStartTime = performance.now();
          startX = rocketGroup.position.x;
          startY = rocketGroup.position.y;
          startRotX = rocketGroup.rotation.x;
          startRotY = rocketGroup.rotation.y;
          startRotZ = rocketGroup.rotation.z;
        }

        const elapsed = performance.now() - flyStartTime;
        const duration = 1500; // 1.5 seconds
        const t = Math.min(elapsed / duration, 1.0);
        
        // Easing: Smoothstep (Cubic ease-in-out)
        const ease = t * t * (3 - 2 * t);

        // Interpolate coordinates
        rocketGroup.position.x = THREE.MathUtils.lerp(startX, targetLandingX, ease);
        rocketGroup.position.y = THREE.MathUtils.lerp(startY, 3.6, ease);
        rocketGroup.position.z = 0;

        // Interpolate rotations
        rocketGroup.rotation.x = THREE.MathUtils.lerp(startRotX, 0, ease);
        rocketGroup.rotation.y = THREE.MathUtils.lerp(startRotY, 0.5, ease);
        rocketGroup.rotation.z = THREE.MathUtils.lerp(startRotZ, 0.2, ease);

        // Update tracking variables to seamlessly hand over to playing phase
        currentY = rocketGroup.position.y;
        currentRotationX = rocketGroup.rotation.x;
        currentRotationZ = rocketGroup.rotation.z;

        // Boosters full blast during flying!
        const targetFlameScale = 1.3;
        currentFlameScale += (targetFlameScale - currentFlameScale) * 0.15;
        const flicker = 1.0 + (Math.random() - 0.5) * 0.15;

        mainFlame.scale.set(currentFlameScale * flicker, currentFlameScale * flicker * 1.6, currentFlameScale * flicker);
        mainInnerFlame.scale.set(currentFlameScale * 0.6 * flicker, currentFlameScale * 0.6 * flicker * 1.4, currentFlameScale * 0.6 * flicker);
        leftFlame.scale.set(currentFlameScale * flicker, currentFlameScale * flicker * 1.3, currentFlameScale * flicker);
        rightFlame.scale.set(currentFlameScale * flicker, currentFlameScale * flicker * 1.3, currentFlameScale * flicker);
        pointLight.intensity = currentFlameScale * 4.0;
        pointLight.position.y = currentY - 1.2;

        if (t === 1.0 && !hasNotifiedComplete) {
          hasNotifiedComplete = true;
          if (onFlyingCompleteRef.current) {
            onFlyingCompleteRef.current();
          }
        }

      } else {
        // --- Playing / Completed State (Normal Scroll Behavior) ---
        // Smoothly lock onto targetLandingX
        rocketGroup.position.x = targetLandingX;

        const moonHeightPx = 120; // height of the moon curve in px
        const moonHeightWebGL = (moonHeightPx / wHeight) * visibleHeight;
        const bottomTouchdownY = (-visibleHeight / 2) + moonHeightWebGL + 0.95; // perfect contact offset
        
        const targetY = 3.6 - scrollProgressRef.current * (3.6 - bottomTouchdownY);
        currentY += (targetY - currentY) * 0.1; 
        rocketGroup.position.y = currentY;

        const isLanded = scrollProgressRef.current > 0.97;

        // Rotation/Tilt Interpolation
        let targetRotX = 0;
        let targetRotZ = 0.2; // Default tilt towards left profile

        if (isLanded) {
          targetRotX = 0;
          targetRotZ = 0;
          rocketGroup.rotation.y += (0.5 - rocketGroup.rotation.y) * 0.1;
        } else {
          // Idle spin around Y axis
          rocketGroup.rotation.y += 0.012;

          if (isScrollingRef.current) {
            const dir = lastScrollYRef.current - document.documentElement.scrollTop;
            if (dir < 0) {
              targetRotX = 0.35;
              targetRotZ = 0.3;
            } else {
              targetRotX = -0.15;
              targetRotZ = 0.12;
            }
          }
        }

        currentRotationX += (targetRotX - currentRotationX) * 0.08;
        currentRotationZ += (targetRotZ - currentRotationZ) * 0.08;
        rocketGroup.rotation.x = currentRotationX;
        rocketGroup.rotation.z = currentRotationZ;

        // Flame Scale & Flickering
        const targetFlameScale = isLanded ? 0 : (isScrollingRef.current ? 1.0 + scrollDeltaRef.current : 0.2);
        currentFlameScale += (targetFlameScale - currentFlameScale) * 0.15;
        
        const flicker = isLanded ? 0 : (1.0 + (Math.random() - 0.5) * 0.15);

        if (isLanded) {
          mainFlame.scale.set(0, 0, 0);
          mainInnerFlame.scale.set(0, 0, 0);
          leftFlame.scale.set(0, 0, 0);
          rightFlame.scale.set(0, 0, 0);
          pointLight.intensity = 0;
        } else {
          mainFlame.scale.set(currentFlameScale * flicker, currentFlameScale * flicker * 1.5, currentFlameScale * flicker);
          mainInnerFlame.scale.set(currentFlameScale * 0.6 * flicker, currentFlameScale * 0.6 * flicker * 1.3, currentFlameScale * 0.6 * flicker);
          leftFlame.scale.set(currentFlameScale * flicker, currentFlameScale * flicker * 1.3, currentFlameScale * flicker);
          rightFlame.scale.set(currentFlameScale * flicker, currentFlameScale * flicker * 1.3, currentFlameScale * flicker);
          pointLight.intensity = currentFlameScale * 3.5;
          pointLight.position.y = currentY - 1.2;
        }
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // --- Cleanup ---
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      
      // Dispose materials & geometries
      bodyGeo.dispose();
      noseGeo.dispose();
      ringGeo1.dispose();
      ringGeo2.dispose();
      windowGeo.dispose();
      boosterGeo.dispose();
      boosterNoseGeo.dispose();
      boosterEngineGeo.dispose();
      wingGeo.dispose();
      tailGeo.dispose();
      wingTipGeo.dispose();
      engineGeo.dispose();
      flameGeo.dispose();
      innerFlameGeo.dispose();
      boosterFlameGeo.dispose();
      
      bodyMaterial.dispose();
      neonCyanMaterial.dispose();
      neonFuchsiaMaterial.dispose();
      engineMaterial.dispose();
      windowGlassMaterial.dispose();
      flameMaterial.dispose();
      innerFlameMaterial.dispose();

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="hidden md:block fixed inset-0 h-screen w-full z-[110] pointer-events-none"
    />
  );
}
