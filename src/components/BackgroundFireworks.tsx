import React, { useEffect, useRef, useState, useCallback } from 'react';
import { audioService } from '../services/audioService';

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
  flicker: boolean;
}

interface Rocket {
  x: number;
  y: number;
  targetY: number;
  speed: number;
  color: string;
  pattern: 'chrysanthemum' | 'willow' | 'peony' | 'ring' | 'heart';
  trail: Array<{ x: number; y: number; alpha: number }>;
}

interface AirLamp {
  id: number;
  x: number;
  y: number;
  speed: number;
  swaySpeed: number;
  swayOffset: number;
  size: number;
  color: string;
  glowColor: string;
  alpha: number;
}

const VIBRANT_FIREWORK_COLORS = [
  '#ffd700', // Royal Gold
  '#ff1744', // Sindoor Crimson
  '#00e676', // Emerald
  '#00e5ff', // Cyan Sapphire
  '#ff9100', // Saffron Amber
  '#d500f9', // Radiant Violet
  '#ff4081', // Rose Pink
  '#ffffff', // Diamond White
];

const AIR_LAMP_COLORS = [
  { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.7)' }, // Golden Amber
  { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.7)' }, // Crimson
  { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.7)' }, // Lotus Rose
  { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.7)' }, // Peacock Cyan
  { color: '#f97316', glow: 'rgba(249, 115, 22, 0.7)' }, // Kesari Saffron
];

export const BackgroundFireworks: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<SparkParticle[]>([]);
  const rocketsRef = useRef<Rocket[]>([]);
  const airLampsRef = useRef<AirLamp[]>([]);
  const [flashAlpha, setFlashAlpha] = useState<number>(0);

  // Explode rocket at specific coordinate
  const triggerExplosion = useCallback((x: number, y: number, color: string, pattern: string) => {
    const isWillow = pattern === 'willow';
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = isWillow ? (isMobile ? 80 : 160) : (isMobile ? 65 : 120);
    const isRainbow = Math.random() > 0.75;

    for (let i = 0; i < count; i++) {
      let vx = 0;
      let vy = 0;
      const speed = 2.0 + Math.random() * 4.8;

      if (pattern === 'ring') {
        const angle = (i / count) * Math.PI * 2;
        vx = Math.cos(angle) * (speed * 0.9);
        vy = Math.sin(angle) * (speed * 0.9);
      } else if (pattern === 'heart') {
        const t = (i / count) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        vx = (hx / 16) * speed;
        vy = (hy / 16) * speed;
      } else {
        const angle = Math.random() * Math.PI * 2;
        const rad = Math.random() * speed;
        vx = Math.cos(angle) * rad;
        vy = Math.sin(angle) * rad;
      }

      const pColor = isRainbow
        ? VIBRANT_FIREWORK_COLORS[Math.floor(Math.random() * VIBRANT_FIREWORK_COLORS.length)]
        : color;

      particlesRef.current.push({
        x,
        y,
        vx,
        vy,
        color: pColor,
        alpha: 1,
        decay: isWillow ? 0.008 + Math.random() * 0.006 : 0.016 + Math.random() * 0.014,
        size: isWillow ? 2.4 : 3.2,
        flicker: Math.random() > 0.35,
      });
    }

    setFlashAlpha(0.28);
    audioService.playFireworkSound('burst');
  }, []);

  // Launch rocket
  const launchRocket = useCallback((targetX?: number, targetY?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const startX = targetX !== undefined ? targetX : canvas.width * 0.1 + Math.random() * canvas.width * 0.8;
    const destY = targetY !== undefined ? targetY : canvas.height * 0.12 + Math.random() * canvas.height * 0.38;

    const patterns: Array<Rocket['pattern']> = ['chrysanthemum', 'willow', 'peony', 'ring', 'heart'];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const color = VIBRANT_FIREWORK_COLORS[Math.floor(Math.random() * VIBRANT_FIREWORK_COLORS.length)];

    rocketsRef.current.push({
      x: startX,
      y: canvas.height + 15,
      targetY: destY,
      speed: 7.5 + Math.random() * 3.5,
      color,
      pattern,
      trail: [],
    });

    audioService.playFireworkSound('whistle');
  }, []);

  // Spawn an Air Lamp (Sky Lantern / Akash Deep)
  const spawnAirLamp = useCallback((customX?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const palette = AIR_LAMP_COLORS[Math.floor(Math.random() * AIR_LAMP_COLORS.length)];
    const lampX = customX !== undefined ? customX : Math.random() * canvas.width;

    airLampsRef.current.push({
      id: Date.now() + Math.random(),
      x: lampX,
      y: canvas.height + 40,
      speed: 0.65 + Math.random() * 0.7,
      swaySpeed: 1.2 + Math.random() * 1.5,
      swayOffset: Math.random() * Math.PI * 2,
      size: 16 + Math.random() * 12, // Distinct visual size
      color: palette.color,
      glowColor: palette.glow,
      alpha: 0.95,
    });

    audioService.playLanternRelease();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let rocketTimer = 0;
    let airLampTimer = 0;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Seed initial air lamps floating in the sky
    const isMobileDevice = window.innerWidth < 768;
    const initialLampCount = isMobileDevice ? 9 : 14;
    airLampsRef.current = [];
    for (let i = 0; i < initialLampCount; i++) {
      const palette = AIR_LAMP_COLORS[i % AIR_LAMP_COLORS.length];
      airLampsRef.current.push({
        id: i,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.6 + Math.random() * 0.6,
        swaySpeed: 1 + Math.random() * 1.5,
        swayOffset: Math.random() * Math.PI * 2,
        size: isMobileDevice ? 14 + Math.random() * 8 : 16 + Math.random() * 12,
        color: palette.color,
        glowColor: palette.glow,
        alpha: 0.9,
      });
    }

    // Interactive screen click: launch rocket and/or air lamp
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, input, textarea, a')) return;

      if (Math.random() > 0.4) {
        launchRocket(e.clientX, e.clientY);
      } else {
        spawnAirLamp(e.clientX);
      }
    };
    window.addEventListener('click', handleGlobalClick);

    // Mobile touch tap trigger with passive listener for seamless vertical scrolling
    const handleGlobalTouch = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return;
      const touch = e.touches[0];
      const target = e.target as HTMLElement;
      if (target && target.closest('button, input, textarea, a, canvas')) return;
      if (Math.random() > 0.4) {
        launchRocket(touch.clientX, touch.clientY);
      } else {
        spawnAirLamp(touch.clientX);
      }
    };
    window.addEventListener('touchstart', handleGlobalTouch, { passive: true });

    const render = (time: number) => {
      // Clear with true black backdrop so fireworks and air lamps shine with crisp brilliance
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sky flash illumination when fireworks explode
      setFlashAlpha((f) => {
        if (f > 0.01) {
          ctx.fillStyle = `rgba(255, 220, 160, ${f * 0.35})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          return f * 0.9;
        }
        return 0;
      });

      // ---------------------------------------------------------
      // 1. RENDER & UPDATE AIR LAMPS (SKY LANTERNS / AKASH DEEP)
      // ---------------------------------------------------------
      const lamps = airLampsRef.current;
      for (let l = lamps.length - 1; l >= 0; l--) {
        const lamp = lamps[l];
        lamp.y -= lamp.speed;
        const sway = Math.sin(time * 0.0015 * lamp.swaySpeed + lamp.swayOffset) * 0.8;
        lamp.x += sway;

        // Reset if drifted above top
        if (lamp.y < -50) {
          lamp.y = canvas.height + 40;
          lamp.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(lamp.x, lamp.y);

        // Radiant Outer Soft Glow
        const radius = lamp.size;
        const radGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, radius * 1.8);
        radGrad.addColorStop(0, lamp.glowColor);
        radGrad.addColorStop(0.5, lamp.glowColor.replace('0.7', '0.25'));
        radGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Air Lamp Paper Lantern Body (Octagonal / Cylinder Shape)
        ctx.fillStyle = lamp.color;
        ctx.beginPath();
        ctx.roundRect(-radius * 0.5, -radius * 0.7, radius, radius * 1.3, 4);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Golden Ribs / Lattice Wire on Lantern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.7);
        ctx.lineTo(0, radius * 0.6);
        ctx.stroke();

        // Inner Candle / Diya Flame
        const flameFlicker = Math.sin(time * 0.01 + lamp.id) * 1.5;
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.ellipse(0, radius * 0.15, radius * 0.22 + flameFlicker * 0.5, radius * 0.35, 0, 0, Math.PI * 2);
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fbbf24';
        ctx.fill();

        // Little tassel dangling at bottom of air lamp
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, radius * 0.6);
        ctx.lineTo(sway * 2, radius * 1.05);
        ctx.stroke();

        ctx.restore();
      }

      // ---------------------------------------------------------
      // 2. RENDER & UPDATE ROCKETS
      // ---------------------------------------------------------
      const rockets = rocketsRef.current;
      for (let r = rockets.length - 1; r >= 0; r--) {
        const rk = rockets[r];
        rk.y -= rk.speed;

        rk.trail.push({ x: rk.x, y: rk.y, alpha: 1 });
        if (rk.trail.length > 10) rk.trail.shift();

        // Draw luminous exhaust trail
        rk.trail.forEach((t) => {
          ctx.beginPath();
          ctx.arc(t.x, t.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 230, 140, ${t.alpha})`;
          ctx.fill();
          t.alpha -= 0.1;
        });

        // Rocket head spark
        ctx.save();
        ctx.beginPath();
        ctx.arc(rk.x, rk.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 14;
        ctx.shadowColor = rk.color;
        ctx.fill();
        ctx.restore();

        // Explode when reaching destination altitude
        if (rk.y <= rk.targetY) {
          triggerExplosion(rk.x, rk.y, rk.color, rk.pattern);
          rockets.splice(r, 1);
        }
      }

      // ---------------------------------------------------------
      // 3. RENDER & UPDATE FIREWORK PARTICLES
      // ---------------------------------------------------------
      const particles = particlesRef.current;
      for (let p = particles.length - 1; p >= 0; p--) {
        const pt = particles[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.055; // gravity pull
        pt.vx *= 0.985;
        pt.vy *= 0.985;
        pt.alpha -= pt.decay;

        if (pt.alpha <= 0) {
          particles.splice(p, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.flicker && Math.random() > 0.4 ? pt.alpha * 0.45 : pt.alpha;
        ctx.shadowBlur = 12;
        ctx.shadowColor = pt.color;
        ctx.fill();
        ctx.restore();
      }

      // ---------------------------------------------------------
      // 4. HIGH DENSITY AUTO-SPAWN (BADAO SANKHYA)
      // ---------------------------------------------------------
      rocketTimer++;
      // Launch frequent rockets (every 40-60 frames = ~0.7-1s)
      if (rocketTimer > 50) {
        rocketTimer = 0;
        launchRocket();
      }

      airLampTimer++;
      // Spawn new drifting air lamp periodically
      if (airLampTimer > 180) {
        airLampTimer = 0;
        const maxLamps = window.innerWidth < 768 ? 16 : 24;
        if (airLampsRef.current.length < maxLamps) {
          spawnAirLamp();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('touchstart', handleGlobalTouch);
      cancelAnimationFrame(animId);
    };
  }, [triggerExplosion, launchRocket, spawnAirLamp]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 bg-black opacity-95"
      style={{ willChange: 'transform' }}
    />
  );
};
