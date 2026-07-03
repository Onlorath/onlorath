'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Rocket3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);
  const isScrollingRef = useRef(false);
  const scrollDeltaRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = 180;
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

    // Materials
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3748, // Metal slate-grey
      metalness: 0.85,
      roughness: 0.25,
      flatShading: true,
    });

    const neonCyanMaterial = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Neon cyan
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
      metalness: 0.2,
      roughness: 0.1,
      flatShading: true,
    });

    const neonFuchsiaMaterial = new THREE.MeshStandardMaterial({
      color: 0xd946ef, // Neon fuchsia
      emissive: 0xc084fc,
      emissiveIntensity: 0.6,
      metalness: 0.2,
      roughness: 0.1,
      flatShading: true,
    });

    const engineMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      metalness: 0.95,
      roughness: 0.15,
      flatShading: true,
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

    // 3.1. Main Fuselage (Ana Gövde)
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.8, 6);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
    bodyMesh.position.y = 0;
    rocketGroup.add(bodyMesh);

    // 3.2. Nose Cone (Burun Kısmı)
    const noseGeo = new THREE.ConeGeometry(0.35, 0.7, 6);
    const noseMesh = new THREE.Mesh(noseGeo, neonFuchsiaMaterial);
    noseMesh.position.y = 1.25; 
    rocketGroup.add(noseMesh);

    // 3.3. Glowing Decorative Rings (Gövde Üzerindeki Neon Halkalar)
    const ringGeo1 = new THREE.CylinderGeometry(0.46, 0.46, 0.06, 6, 1);
    const ring1 = new THREE.Mesh(ringGeo1, neonFuchsiaMaterial);
    ring1.position.y = -0.1;
    rocketGroup.add(ring1);

    const ringGeo2 = new THREE.CylinderGeometry(0.39, 0.39, 0.06, 6, 1);
    const ring2 = new THREE.Mesh(ringGeo2, neonCyanMaterial);
    ring2.position.y = 0.5;
    rocketGroup.add(ring2);

    // 3.4. Glass Cockpit Window (Kokpit Penceresi)
    const windowGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const windowMesh = new THREE.Mesh(windowGeo, windowGlassMaterial);
    windowMesh.position.set(0, 0.6, 0.36);
    windowMesh.scale.set(1.0, 1.0, 0.4); // Flatten sphere against fuselage
    rocketGroup.add(windowMesh);

    // 3.5. Side Boosters (Yanal Yardımcı Roketler)
    const boosterGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.9, 5);
    const boosterNoseGeo = new THREE.ConeGeometry(0.12, 0.25, 5);
    const boosterEngineGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.12, 5);

    const leftBooster = new THREE.Group();
    leftBooster.position.set(-0.42, -0.3, 0);
    const leftBoosterMesh = new THREE.Mesh(boosterGeo, bodyMaterial);
    const leftBoosterNose = new THREE.Mesh(boosterNoseGeo, neonFuchsiaMaterial);
    leftBoosterNose.position.y = 0.575;
    const leftBoosterEngine = new THREE.Mesh(boosterEngineGeo, engineMaterial);
    leftBoosterEngine.position.y = -0.51;
    leftBooster.add(leftBoosterMesh, leftBoosterNose, leftBoosterEngine);
    rocketGroup.add(leftBooster);

    const rightBooster = new THREE.Group();
    rightBooster.position.set(0.42, -0.3, 0);
    const rightBoosterMesh = new THREE.Mesh(boosterGeo, bodyMaterial);
    const rightBoosterNose = new THREE.Mesh(boosterNoseGeo, neonFuchsiaMaterial);
    rightBoosterNose.position.y = 0.575;
    const rightBoosterEngine = new THREE.Mesh(boosterEngineGeo, engineMaterial);
    rightBoosterEngine.position.y = -0.51;
    rightBooster.add(rightBoosterMesh, rightBoosterNose, rightBoosterEngine);
    rocketGroup.add(rightBooster);

    // 3.6. Fins / Wings (Kanatlar - 3-way symmetry around the base)
    const finGeo = new THREE.BoxGeometry(0.06, 0.65, 0.35);
    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3;
      const finMesh = new THREE.Mesh(finGeo, neonCyanMaterial);
      
      finMesh.position.set(
        Math.cos(angle) * 0.45,
        -0.7,
        Math.sin(angle) * 0.45
      );
      finMesh.rotation.y = -angle;
      finMesh.rotation.z = 0.22; 
      rocketGroup.add(finMesh);
    }

    // 3.7. Main Engine Bell (Ana Motor Çıkışı)
    const engineGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.3, 6);
    const engineMesh = new THREE.Mesh(engineGeo, engineMaterial);
    engineMesh.position.y = -1.05;
    rocketGroup.add(engineMesh);

    // 3.8. Main & Booster Flames (Ana ve Yan Roket Alevleri)
    const flameGeo = new THREE.ConeGeometry(0.2, 0.9, 6);
    flameGeo.translate(0, -0.45, 0); 
    const innerFlameGeo = new THREE.ConeGeometry(0.1, 0.5, 6);
    innerFlameGeo.translate(0, -0.25, 0);

    // Main Engine Flame
    const mainFlame = new THREE.Mesh(flameGeo, flameMaterial);
    mainFlame.position.y = -1.2;
    rocketGroup.add(mainFlame);

    const mainInnerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMaterial);
    mainInnerFlame.position.y = -1.2;
    rocketGroup.add(mainInnerFlame);

    // Side Booster Flames (Smaller)
    const boosterFlameGeo = new THREE.ConeGeometry(0.08, 0.4, 5);
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
      const newHeight = window.innerHeight;
      renderer.setSize(width, newHeight);
      camera.aspect = width / newHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // --- 5. Animation Render Loop ---
    let currentY = 3.6;
    let currentRotationX = 0;
    let currentRotationZ = 0;
    let currentFlameScale = 0.2;

    const animate = () => {
      // 5.1. Y Position Interpolation (Smooth glide based on dynamic touchdown point)
      const visibleHeight = 2 * 11.5 * Math.tan((20 * Math.PI) / 180); // ~8.37
      const moonHeightPx = 120; // height of the moon curve in px
      const moonHeightWebGL = (moonHeightPx / window.innerHeight) * visibleHeight;
      const bottomTouchdownY = (-visibleHeight / 2) + moonHeightWebGL + 0.95; // perfect contact offset
      
      const targetY = 3.6 - scrollProgressRef.current * (3.6 - bottomTouchdownY);
      currentY += (targetY - currentY) * 0.1; 
      rocketGroup.position.y = currentY;

      const isLanded = scrollProgressRef.current > 0.97;

      // 5.2. Rotation/Tilt Interpolation (Dynamic response to scroll velocity)
      let targetRotX = 0;
      let targetRotZ = 0.2; // Default tilt towards left profile

      if (isLanded) {
        // Aligns perfectly vertically and stays facing slightly front-side
        targetRotX = 0;
        targetRotZ = 0;
        rocketGroup.rotation.y += (0.5 - rocketGroup.rotation.y) * 0.1;
      } else {
        // Idle spin around Y axis
        rocketGroup.rotation.y += 0.012;

        if (isScrollingRef.current) {
          const dir = lastScrollYRef.current - document.documentElement.scrollTop;
          if (dir < 0) {
            // Scrolling down -> Tilt nose slightly forward and left
            targetRotX = 0.35;
            targetRotZ = 0.3;
          } else {
            // Scrolling up -> Tilt nose slightly backward and right
            targetRotX = -0.15;
            targetRotZ = 0.12;
          }
        }
      }

      currentRotationX += (targetRotX - currentRotationX) * 0.08;
      currentRotationZ += (targetRotZ - currentRotationZ) * 0.08;
      rocketGroup.rotation.x = currentRotationX;
      rocketGroup.rotation.z = currentRotationZ;

      // 5.3. Flame Scale & Flickering
      const targetFlameScale = isLanded ? 0 : (isScrollingRef.current ? 1.0 + scrollDeltaRef.current : 0.2);
      currentFlameScale += (targetFlameScale - currentFlameScale) * 0.15;
      
      const flicker = isLanded ? 0 : (1.0 + (Math.random() - 0.5) * 0.15);

      if (isLanded) {
        // Cut engine flames
        mainFlame.scale.set(0, 0, 0);
        mainInnerFlame.scale.set(0, 0, 0);
        leftFlame.scale.set(0, 0, 0);
        rightFlame.scale.set(0, 0, 0);
        pointLight.intensity = 0;
      } else {
        // Scale central main flames
        mainFlame.scale.set(currentFlameScale * flicker, currentFlameScale * flicker * 1.5, currentFlameScale * flicker);
        mainInnerFlame.scale.set(currentFlameScale * 0.6 * flicker, currentFlameScale * 0.6 * flicker * 1.3, currentFlameScale * 0.6 * flicker);
        
        // Scale booster flames
        leftFlame.scale.set(currentFlameScale * flicker, currentFlameScale * flicker * 1.3, currentFlameScale * flicker);
        rightFlame.scale.set(currentFlameScale * flicker, currentFlameScale * flicker * 1.3, currentFlameScale * flicker);

        // Control point light intensity based on flame
        pointLight.intensity = currentFlameScale * 3.5;
        pointLight.position.y = currentY - 1.2;
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
      finGeo.dispose();
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
      className="hidden md:block fixed -right-2 top-0 h-screen w-48 z-50 pointer-events-none"
    />
  );
}
