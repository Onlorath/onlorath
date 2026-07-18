'use client';

import React, { useEffect, useRef } from 'react';

export const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Array<{
      x: number;
      y: number;
      radius: number;
      phase: number;
      speed: number;
      minAlpha: number;
      maxAlpha: number;
    }> = [];
    
    let shootingStars: Array<{
      x: number;
      y: number;
      length: number;
      speed: number;
      angle: number;
      opacity: number;
      active: boolean;
    }> = [];

    const initStars = () => {
      stars = Array.from({ length: 200 }).map(() => {
        const minAlpha = 0.05 + Math.random() * 0.15;
        const maxAlpha = minAlpha + 0.3 + Math.random() * 0.5;
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: 0.5 + Math.random() * 1.0,
          phase: Math.random() * Math.PI * 2,
          speed: 1.0 + Math.random() * 3.0,
          minAlpha,
          maxAlpha
        };
      });
    };

    const spawnShootingStar = () => {
      if (Math.random() < 0.02) { // 2% chance per frame to spawn a shooting star
        shootingStars.push({
          x: Math.random() * canvas.width,
          y: 0,
          length: 50 + Math.random() * 100,
          speed: 10 + Math.random() * 10,
          angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1), // Down-right roughly 45 degrees
          opacity: 1,
          active: true
        });
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = performance.now() * 0.001;

      // Draw normal stars
      stars.forEach(star => {
        const alpha = star.minAlpha + (star.maxAlpha - star.minAlpha) * (Math.sin(time * star.speed + star.phase) + 1) * 0.5;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 219, 233, ${alpha})`;
        ctx.fill();
      });

      // Spawn and draw shooting stars
      spawnShootingStar();
      
      shootingStars.forEach((star, index) => {
        if (!star.active) return;
        
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x - Math.cos(star.angle) * star.length, star.y - Math.sin(star.angle) * star.length);
        
        const gradient = ctx.createLinearGradient(
          star.x, star.y, 
          star.x - Math.cos(star.angle) * star.length, 
          star.y - Math.sin(star.angle) * star.length
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
        gradient.addColorStop(0.1, `rgba(0, 219, 233, ${star.opacity * 0.8})`);
        gradient.addColorStop(1, 'rgba(0, 219, 233, 0)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        
        // Fade out
        if (star.y > canvas.height || star.x > canvas.width) {
            star.active = false;
        }
      });
      
      shootingStars = shootingStars.filter(s => s.active);

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-60 mix-blend-screen" />;
};
