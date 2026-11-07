import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { audioService } from '../services/audioService';
import confetti from 'canvas-confetti';

interface CinematicIntroProps {
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Scene DOM element refs for GSAP animation
  const skipBtnRef = useRef<HTMLButtonElement>(null);
  const rangoliRef = useRef<HTMLDivElement>(null);
  const creatorIntroRef = useRef<HTMLDivElement>(null);
  const greetingRef = useRef<HTMLDivElement>(null);
  const enterBtnRef = useRef<HTMLDivElement>(null);

  // State
  const [isReadyToEnter, setIsReadyToEnter] = useState(false);

  // Mutable animation references
  const isExitingRef = useRef(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const rafIdRef = useRef<number>(0);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Three.js instances ref for guaranteed 100% clean disposal
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    diyaGroup: THREE.Group;
    flameMesh: THREE.Mesh;
    flameHalo: THREE.Sprite;
    diyaLight: THREE.PointLight;
    particlesMesh: THREE.Points;
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
    textures: THREE.Texture[];
  } | null>(null);

  // Safe exit handler with cleanup and single-execution lock
  const handleExit = useCallback(
    (source: 'skip' | 'enter' | 'auto') => {
      if (isExitingRef.current) return;
      isExitingRef.current = true;

      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }

      // Kill any running GSAP intro animations immediately
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }

      // Save session storage flag safely
      try {
        sessionStorage.setItem('deepotsav_intro_shown', 'true');
      } catch {
        // Ignore session storage errors in strict private browsing
      }

      const overlay = overlayRef.current;
      const camera = threeRef.current?.camera;

      if (source === 'enter') {
        audioService.playDiyaIgniteSound();
        try {
          confetti({
            particleCount: 75,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#ffd700', '#f59e0b', '#fbbf24', '#ff4500'],
          });
        } catch {
          // Silent fallback
        }

        // Cinematic forward push through light rays and fade out
        if (camera) {
          gsap.to(camera.position, {
            z: camera.position.z - 2.8,
            y: camera.position.y + 0.3,
            duration: 0.7,
            ease: 'power2.in',
          });
        }

        if (overlay) {
          gsap.to(overlay, {
            opacity: 0,
            scale: 1.05,
            duration: 0.7,
            ease: 'power2.inOut',
            onComplete: () => {
              onComplete();
            },
          });
        } else {
          onComplete();
        }
      } else {
        // Instant graceful skip / auto exit
        if (overlay) {
          gsap.to(overlay, {
            opacity: 0,
            duration: 0.4,
            ease: 'power1.out',
            onComplete: () => {
              onComplete();
            },
          });
        } else {
          onComplete();
        }
      }
    },
    [onComplete]
  );

  // Keyboard shortcut listener (Escape to skip, Enter to proceed)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleExit('skip');
      } else if (e.key === 'Enter' && isReadyToEnter) {
        e.preventDefault();
        handleExit('enter');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExit, isReadyToEnter]);

  // Main Three.js Scene Setup & GSAP Sequence
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // -----------------------------------------------------------------
    // 1. THREE.JS SCENE SETUP
    // -----------------------------------------------------------------
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const aspect = width / height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    // Adjusted camera distance for mobile vs desktop
    const initialZ = aspect < 1.0 ? 6.2 : 5.0;
    camera.position.set(0, 0.9, initialZ);
    camera.lookAt(0, 0.15, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    const geometriesToDispose: THREE.BufferGeometry[] = [];
    const materialsToDispose: THREE.Material[] = [];
    const texturesToDispose: THREE.Texture[] = [];

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffedd5, 0.35);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffd599, 0.6);
    dirLight.position.set(0, 4, 3);
    scene.add(dirLight);

    // Warm Central Diya Light
    const diyaLight = new THREE.PointLight(0xffa200, 0, 7.5, 1.6);
    diyaLight.position.set(0, 0.6, 0.1);
    scene.add(diyaLight);

    // -----------------------------------------------------------------
    // 2. PROCEDURAL 3D TRADITIONAL CLAY DIYA
    // -----------------------------------------------------------------
    const diyaGroup = new THREE.Group();
    diyaGroup.position.set(0, -0.4, 0);
    scene.add(diyaGroup);

    // Clay Bowl Lathe Geometry
    const bowlPts: THREE.Vector2[] = [];
    bowlPts.push(new THREE.Vector2(0, 0));
    bowlPts.push(new THREE.Vector2(0.35, 0.03));
    bowlPts.push(new THREE.Vector2(0.58, 0.12));
    bowlPts.push(new THREE.Vector2(0.72, 0.28));
    bowlPts.push(new THREE.Vector2(0.76, 0.42));
    bowlPts.push(new THREE.Vector2(0.72, 0.46));
    bowlPts.push(new THREE.Vector2(0.60, 0.42));
    bowlPts.push(new THREE.Vector2(0.42, 0.22));
    bowlPts.push(new THREE.Vector2(0.12, 0.08));
    bowlPts.push(new THREE.Vector2(0, 0.07));

    const diyaClayGeo = new THREE.LatheGeometry(bowlPts, 32);
    geometriesToDispose.push(diyaClayGeo);

    const diyaClayMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412,
      roughness: 0.82,
      metalness: 0.1,
    });
    materialsToDispose.push(diyaClayMat);

    const diyaMesh = new THREE.Mesh(diyaClayGeo, diyaClayMat);
    diyaGroup.add(diyaMesh);

    // Golden Rim Ring (Kundan / Brass Filigree accent)
    const rimGeo = new THREE.TorusGeometry(0.72, 0.024, 16, 32);
    geometriesToDispose.push(rimGeo);

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.25,
    });
    materialsToDispose.push(rimMat);

    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.44;
    diyaGroup.add(rimMesh);

    // Cotton Wick
    const wickGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
    geometriesToDispose.push(wickGeo);
    const wickMat = new THREE.MeshBasicMaterial({ color: 0x1f1f1f });
    materialsToDispose.push(wickMat);
    const wickMesh = new THREE.Mesh(wickGeo, wickMat);
    wickMesh.position.set(0, 0.32, 0);
    wickMesh.rotation.z = 0.1;
    diyaGroup.add(wickMesh);

    // Teardrop Flame Geometry
    const flamePts: THREE.Vector2[] = [];
    for (let f = 0; f <= 16; f++) {
      const t = f / 16;
      const fy = t * 0.46;
      const fr = Math.sin(t * Math.PI) * (1 - t * 0.6) * 0.15;
      flamePts.push(new THREE.Vector2(Math.max(0.005, fr), fy));
    }
    const flameGeo = new THREE.LatheGeometry(flamePts, 16);
    geometriesToDispose.push(flameGeo);

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xfff3d6,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materialsToDispose.push(flameMat);

    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.set(0, 0.4, 0);
    flameMesh.scale.set(0, 0, 0); // Initially unlit
    diyaGroup.add(flameMesh);

    // Radial Golden Flame Glow Sprite
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 128;
    haloCanvas.height = 128;
    const hCtx = haloCanvas.getContext('2d');
    if (hCtx) {
      const grad = hCtx.createRadialGradient(64, 64, 4, 64, 64, 62);
      grad.addColorStop(0, 'rgba(255, 245, 180, 0.95)');
      grad.addColorStop(0.3, 'rgba(251, 191, 36, 0.7)');
      grad.addColorStop(0.65, 'rgba(234, 88, 12, 0.28)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      hCtx.fillStyle = grad;
      hCtx.fillRect(0, 0, 128, 128);
    }
    const haloTex = new THREE.CanvasTexture(haloCanvas);
    texturesToDispose.push(haloTex);

    const haloMat = new THREE.SpriteMaterial({
      map: haloTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0,
    });
    materialsToDispose.push(haloMat);

    const flameHalo = new THREE.Sprite(haloMat);
    flameHalo.position.set(0, 0.62, 0);
    flameHalo.scale.set(1.4, 1.4, 1.4);
    diyaGroup.add(flameHalo);

    // -----------------------------------------------------------------
    // 3. FLOATING GOLDEN PARTICLES (SWARNA KAN)
    // -----------------------------------------------------------------
    const particleCount = aspect < 1.0 ? 250 : 420;
    const particleGeo = new THREE.BufferGeometry();
    geometriesToDispose.push(particleGeo);

    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);
    const particlePhases = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 8.0;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 5.0;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 4.0;

      particleVelocities[i * 3] = (Math.random() - 0.5) * 0.15;
      particleVelocities[i * 3 + 1] = 0.15 + Math.random() * 0.25; // Gentle upward drift
      particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.15;

      particlePhases[i] = Math.random() * Math.PI * 2;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Circle particle texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      const grad = pCtx.createRadialGradient(16, 16, 1, 16, 16, 15);
      grad.addColorStop(0, 'rgba(255, 255, 230, 1)');
      grad.addColorStop(0.4, 'rgba(251, 191, 36, 0.85)');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 32, 32);
    }
    const particleTex = new THREE.CanvasTexture(pCanvas);
    texturesToDispose.push(particleTex);

    const particleMat = new THREE.PointsMaterial({
      size: 0.14,
      map: particleTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0, // Animated in Scene 1
    });
    materialsToDispose.push(particleMat);

    const particlesMesh = new THREE.Points(particleGeo, particleMat);
    scene.add(particlesMesh);

    // Save Three.js references
    threeRef.current = {
      scene,
      camera,
      renderer,
      diyaGroup,
      flameMesh,
      flameHalo,
      diyaLight,
      particlesMesh,
      geometries: geometriesToDispose,
      materials: materialsToDispose,
      textures: texturesToDispose,
    };

    // -----------------------------------------------------------------
    // 4. ANIMATION RENDER LOOP (Organic Flicker & Gentle Drift)
    // -----------------------------------------------------------------
    const startTime = performance.now();
    let lastTime = startTime;
    let flameScaleVal = { value: 0 };
    let haloOpacityVal = { value: 0 };
    let lightIntensityVal = { value: 0 };

    const animate = () => {
      if (isExitingRef.current) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsed = (now - startTime) / 1000;

      // Flame organic flickering
      if (flameScaleVal.value > 0.01) {
        const flick =
          Math.sin(elapsed * 14) * 0.08 +
          Math.cos(elapsed * 9) * 0.05 +
          Math.sin(elapsed * 23) * 0.03;

        const s = flameScaleVal.value;
        flameMesh.scale.set(
          s * (1 + flick * 0.4),
          s * (1 + flick * 0.9),
          s * (1 + flick * 0.4)
        );
        flameMesh.rotation.z = Math.sin(elapsed * 5) * 0.05;

        // Halo pulsate
        haloMat.opacity = haloOpacityVal.value * (1 + flick * 0.25);
        flameHalo.scale.setScalar(1.4 * (1 + flick * 0.15));

        // Point light sync
        diyaLight.intensity = lightIntensityVal.value * (1 + flick * 0.3);
      } else {
        flameMesh.scale.set(0, 0, 0);
        haloMat.opacity = 0;
        diyaLight.intensity = 0;
      }

      // Update particles
      const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        posArray[idx + 1] += particleVelocities[idx + 1] * delta;
        posArray[idx] += Math.sin(elapsed * 1.5 + particlePhases[i]) * 0.003;

        // Reset particle if drifted above ceiling
        if (posArray[idx + 1] > 3.0) {
          posArray[idx + 1] = -3.0;
          posArray[idx] = (Math.random() - 0.5) * 8.0;
        }
      }
      posAttr.needsUpdate = true;

      // Slow majestic Diya rotation
      diyaGroup.rotation.y = Math.sin(elapsed * 0.4) * 0.18;

      renderer.render(scene, camera);
      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    // -----------------------------------------------------------------
    // 5. MASTER GSAP CINEMATIC TIMELINE (8–11 seconds sequence)
    // -----------------------------------------------------------------
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => {
        // Ready for user entry; if no interaction in 4 seconds, gracefully auto-advance
        setIsReadyToEnter(true);
        autoAdvanceTimerRef.current = setTimeout(() => {
          handleExit('auto');
        }, 4500);
      },
    });
    timelineRef.current = tl;

    // SCENE 1: Dark Opening (0.0s - 1.8s)
    // - Slowly reveal floating golden particles and ambient center aura
    tl.to(
      particleMat,
      {
        opacity: 0.85,
        duration: 1.6,
        ease: 'power1.inOut',
      },
      0.2
    );

    tl.to(
      rangoliRef.current,
      {
        opacity: 0.22,
        scale: 1,
        duration: 2.0,
        ease: 'power2.out',
      },
      0.5
    );

    // SCENE 2: Diya Celebration (1.8s - 3.8s)
    // - Traditional Diya ignites with flame expansion and warm glow
    tl.call(
      () => {
        audioService.playTempleBell();
      },
      undefined,
      1.8
    );

    tl.to(
      flameScaleVal,
      {
        value: 1,
        duration: 1.2,
        ease: prefersReducedMotion ? 'power2.out' : 'back.out(1.8)',
      },
      1.8
    );

    tl.to(
      haloOpacityVal,
      {
        value: 0.85,
        duration: 1.2,
      },
      1.8
    );

    tl.to(
      lightIntensityVal,
      {
        value: 4.8,
        duration: 1.4,
      },
      1.8
    );

    // Subtle cinematic camera dolly back
    if (!prefersReducedMotion) {
      tl.to(
        camera.position,
        {
          z: initialZ + 0.4,
          y: 0.75,
          duration: 3.5,
          ease: 'power1.inOut',
        },
        1.8
      );
    }

    // SCENE 3: Creator Introduction (3.8s - 6.8s)
    // - "KDR DEEPOTSAV"
    // - "Created & Developed by"
    // - "KARAN DHANRAJ"
    tl.to(
      creatorIntroRef.current,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.0,
        ease: 'power3.out',
      },
      3.8
    );

    // Staggered golden underline expansion
    const underlineEl = creatorIntroRef.current?.querySelector('.golden-underline');
    if (underlineEl) {
      tl.fromTo(
        underlineEl,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.8, ease: 'power2.out' },
        4.2
      );
    }

    // Hold creator credit prominently for 2.2 seconds, then transition
    tl.to(
      creatorIntroRef.current,
      {
        opacity: 0,
        y: -18,
        scale: 0.95,
        duration: 0.6,
        ease: 'power2.in',
      },
      6.2
    );

    // SCENE 4: Diwali Greeting (6.6s - 9.4s)
    // - "आप सभी को दीपावली की हार्दिक शुभकामनाएँ"
    // - "May your life shine with happiness, prosperity and endless light."
    tl.to(
      greetingRef.current,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.0,
        ease: 'power3.out',
      },
      6.6
    );

    // SCENE 5: Enter Website Button (9.2s onwards)
    // - "ENTER KDR DEEPOTSAV ✨"
    tl.to(
      enterBtnRef.current,
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.8,
        ease: prefersReducedMotion ? 'power2.out' : 'back.out(1.5)',
        onStart: () => {
          setIsReadyToEnter(true);
        },
      },
      9.2
    );

    // -----------------------------------------------------------------
    // 6. RESIZE & TAB VISIBILITY MANAGEMENT
    // -----------------------------------------------------------------
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const newAspect = w / h;
      camera.aspect = newAspect;
      camera.position.z = newAspect < 1.0 ? 6.2 : 5.0;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        tl.pause();
      } else {
        lastTime = performance.now();
        tl.resume();
        rafIdRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // -----------------------------------------------------------------
    // 7. COMPONENT CLEANUP & MEMORY DISPOSAL
    // -----------------------------------------------------------------
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }

      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Deep Three.js disposal
      geometriesToDispose.forEach((g) => g.dispose());
      materialsToDispose.forEach((m) => m.dispose());
      texturesToDispose.forEach((t) => t.dispose());
      renderer.dispose();

      if (renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }

      threeRef.current = null;
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 overflow-hidden bg-black text-[#fbf6e2] font-sans select-none pointer-events-auto"
      style={{
        background:
          'radial-gradient(circle at 50% 55%, #140b28 0%, #070411 45%, #000000 100%)',
      }}
    >
      {/* 3D Three.js Canvas Container (Full Screen) */}
      <div ref={canvasContainerRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Traditional Rotating Rangoli Mandala Background Accent */}
      <div
        ref={rangoliRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[520px] sm:h-[520px] pointer-events-none z-0 opacity-0 scale-90 transition-transform duration-1000"
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full text-amber-500/30 animate-[spin_60s_linear_infinite]"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
        >
          {/* Sacred Mandala Lotus Rings */}
          <circle cx="100" cy="100" r="95" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="82" opacity="0.6" />
          <circle cx="100" cy="100" r="68" strokeDasharray="4 2" />
          <circle cx="100" cy="100" r="50" opacity="0.8" />
          <circle cx="100" cy="100" r="30" strokeDasharray="2 2" />
          {/* Radial Petals */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 360) / 16;
            return (
              <g key={i} transform={`rotate(${angle} 100 100)`}>
                <path
                  d="M100,50 C108,68 112,82 100,100 C88,82 92,68 100,50 Z"
                  fill="rgba(245, 158, 11, 0.08)"
                />
                <circle cx="100" cy="46" r="2.5" fill="rgba(251, 191, 36, 0.4)" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Ambient Vignette & Golden Floor Scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none z-10" />

      {/* FIXED TOP-RIGHT: Universal Ergonomic Skip Intro Pill Button */}
      <button
        ref={skipBtnRef}
        onClick={() => handleExit('skip')}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[100] flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-black/90 hover:bg-black border border-amber-400/80 hover:border-amber-300 text-amber-200 hover:text-amber-100 text-xs sm:text-sm font-semibold tracking-wider backdrop-blur-xl transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.7)] active:scale-95 touch-manipulation pointer-events-auto select-none group"
        title="Skip intro and enter website (Esc)"
        aria-label="Skip intro and enter website"
      >
        <span className="font-bold">SKIP INTRO</span>
        <span className="text-amber-300 text-sm transition-transform group-hover:translate-x-0.5">→</span>
      </button>

      {/* CENTER FOREGROUND CONTENT */}
      <div className="relative z-20 w-full h-full flex flex-col items-center justify-between py-12 px-4 sm:px-6 pointer-events-none text-center">
        {/* Top Header Placeholder to keep vertical balance */}
        <div className="h-8" />

        {/* Dynamic Center Stage for Scenes 3 & 4 */}
        <div className="relative w-full max-w-3xl flex flex-col items-center justify-center my-auto">
          {/* ========================================================= */}
          {/* SCENE 3: CREATOR INTRODUCTION                             */}
          {/* ========================================================= */}
          <div
            ref={creatorIntroRef}
            className="absolute inset-0 flex flex-col items-center justify-center opacity-0 translate-y-4 scale-95 px-2"
          >
            {/* High-contrast backdrop container to ensure 100% crystal-clear readability over 3D diya */}
            <div className="flex flex-col items-center space-y-2 sm:space-y-4 bg-black/75 border border-amber-500/35 backdrop-blur-md px-5 sm:px-10 py-4 sm:py-6 rounded-2xl sm:rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.95)] max-w-full overflow-hidden">
              {/* Title Tag */}
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] uppercase text-amber-300/90 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                <span className="text-amber-400 text-xs animate-pulse">✨</span>
                <span>An Immersive 3D Experience</span>
                <span className="text-amber-400 text-xs animate-pulse">✨</span>
              </span>

              {/* Subtext */}
              <p className="text-[11px] sm:text-xs font-body tracking-[0.25em] uppercase text-amber-200/80 font-medium whitespace-nowrap">
                Created & Developed by
              </p>

              {/* Creator Name (Strictly Single Non-Wrapping Line with Stars) */}
              <div className="relative pt-1 flex flex-col items-center max-w-full">
                <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-cinzel font-bold tracking-wider whitespace-nowrap flex items-center justify-center gap-2 sm:gap-3.5 max-w-full">
                  <span className="text-amber-300 shrink-0 text-xl xs:text-2xl sm:text-3xl lg:text-4xl animate-pulse">✨</span>
                  <span className="animate-intro-creator shrink-0">KARAN DHANRAJ</span>
                  <span className="text-amber-300 shrink-0 text-xl xs:text-2xl sm:text-3xl lg:text-4xl animate-pulse">✨</span>
                </h2>
                {/* Golden Underline Accent */}
                <div className="golden-underline w-28 sm:w-44 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-2.5 origin-center shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SCENE 4: DIWALI GREETING                                 */}
          {/* ========================================================= */}
          <div
            ref={greetingRef}
            className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 opacity-0 translate-y-4 px-2"
          >
            {/* Sacred Auspicious Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-amber-500/40 text-amber-300 text-xs tracking-widest uppercase shadow-xl backdrop-blur-md">
              <span className="animate-flame">🪔</span>
              <span className="font-festive text-amber-300">शुभ दीपोत्सव सन्देश</span>
              <span className="animate-flame">🪔</span>
            </div>

            {/* Traditional Hindi Greeting with Glowing Color Shifting */}
            <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-festive leading-snug animate-intro-greeting max-w-2xl text-balance">
              आप सभी को दीपावली की हार्दिक शुभकामनाएँ
            </h2>

            {/* English Blessing */}
            <p className="text-sm xs:text-base sm:text-lg md:text-xl font-body text-amber-100/90 max-w-xl mx-auto leading-relaxed text-balance italic font-medium"
               style={{ textShadow: '0 0 20px rgba(0, 0, 0, 0.95), 0 0 10px rgba(245, 158, 11, 0.5)' }}>
              "May your life shine with happiness, prosperity and endless light."
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SCENE 5: ENTER WEBSITE BUTTON                             */}
        {/* ========================================================= */}
        <div
          ref={enterBtnRef}
          className="relative z-30 opacity-0 translate-y-4 scale-95 pointer-events-auto pb-4"
        >
          <button
            onClick={() => handleExit('enter')}
            className="group relative inline-flex items-center justify-center gap-3 px-8 sm:px-12 py-3.5 sm:py-4.5 rounded-full font-festive text-base sm:text-lg tracking-wider text-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 transition-all duration-300 cursor-pointer shadow-[0_0_40px_rgba(245,158,11,0.7)] hover:shadow-[0_0_60px_rgba(251,191,36,0.95)] border border-amber-200/90"
          >
            {/* Shimmer pulse effect */}
            <span className="relative z-10 font-bold tracking-widest">ENTER WEBSITE</span>
            <span className="relative z-10 text-lg sm:text-xl group-hover:rotate-12 transition-transform">✨</span>

            {/* Glowing ring animation */}
            <span className="absolute inset-0 rounded-full bg-amber-400/50 blur-md group-hover:blur-lg transition-all -z-10 animate-pulse" />
          </button>
        </div>
      </div>
    </div>
  );
};
