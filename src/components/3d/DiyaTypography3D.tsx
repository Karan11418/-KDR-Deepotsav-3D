import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { audioService } from '../../services/audioService';
import confetti from 'canvas-confetti';

interface DiyaTypography3DProps {
  onAllLit?: () => void;
  className?: string;
}

interface DiyaPoint {
  x: number;
  y: number;
  z: number;
  line: 'HAPPY' | 'DIWALI';
  char: string;
  charIndex: number;
  order: number;
}

// Generate sampled letter stroke points for "HAPPY" and "DIWALI"
// Upright, straight front-facing coordinates for optimal readability
function generateTypographyPoints(): DiyaPoint[] {
  const points: DiyaPoint[] = [];

  function sampleSegment(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    step: number,
    line: 'HAPPY' | 'DIWALI',
    char: string,
    charIndex: number,
    offsetX: number,
    offsetY: number
  ) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const count = Math.max(2, Math.round(dist / step));
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const x = x1 + (x2 - x1) * t + offsetX;
      const y = y1 + (y2 - y1) * t + offsetY;
      // Subtle depth curvature so text feels beautifully spatial
      const z = -Math.cos((x / 3.4) * 0.7) * 0.15;
      points.push({
        x,
        y,
        z,
        line,
        char,
        charIndex,
        order: points.length,
      });
    }
  }

  function sampleArc(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
    count: number,
    line: 'HAPPY' | 'DIWALI',
    char: string,
    charIndex: number,
    offsetX: number,
    offsetY: number
  ) {
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const angle = startAngle + (endAngle - startAngle) * t;
      const x = cx + Math.cos(angle) * r + offsetX;
      const y = cy + Math.sin(angle) * r + offsetY;
      const z = -Math.cos((x / 3.4) * 0.7) * 0.15;
      points.push({
        x,
        y,
        z,
        line,
        char,
        charIndex,
        order: points.length,
      });
    }
  }

  const step = 0.17; // Spacing for crisp, dense letter lines
  const letterH = 1.15;

  // -------------------------------------------------------------
  // LINE 1: HAPPY (5 letters, upright, centered)
  // -------------------------------------------------------------
  const happyW = 0.82;
  const happyGap = 0.36;
  const happyTotalW = 5 * happyW + 4 * happyGap;
  const happyStartX = -happyTotalW / 2;
  const happyY = 0.25;

  // H
  {
    const ox = happyStartX + 0 * (happyW + happyGap);
    sampleSegment(0, 0, 0, letterH, step, 'HAPPY', 'H', 0, ox, happyY);
    sampleSegment(happyW, 0, happyW, letterH, step, 'HAPPY', 'H', 0, ox, happyY);
    sampleSegment(0, letterH * 0.5, happyW, letterH * 0.5, step, 'HAPPY', 'H', 0, ox, happyY);
  }
  // A
  {
    const ox = happyStartX + 1 * (happyW + happyGap);
    sampleSegment(0, 0, happyW * 0.5, letterH, step, 'HAPPY', 'A', 1, ox, happyY);
    sampleSegment(happyW * 0.5, letterH, happyW, 0, step, 'HAPPY', 'A', 1, ox, happyY);
    sampleSegment(happyW * 0.2, letterH * 0.38, happyW * 0.8, letterH * 0.38, step, 'HAPPY', 'A', 1, ox, happyY);
  }
  // P
  {
    const ox = happyStartX + 2 * (happyW + happyGap);
    sampleSegment(0, 0, 0, letterH, step, 'HAPPY', 'P', 2, ox, happyY);
    sampleSegment(0, letterH, happyW * 0.6, letterH, step, 'HAPPY', 'P', 2, ox, happyY);
    sampleArc(happyW * 0.6, letterH * 0.75, letterH * 0.25, Math.PI / 2, -Math.PI / 2, 8, 'HAPPY', 'P', 2, ox, happyY);
    sampleSegment(happyW * 0.6, letterH * 0.5, 0, letterH * 0.5, step, 'HAPPY', 'P', 2, ox, happyY);
  }
  // P
  {
    const ox = happyStartX + 3 * (happyW + happyGap);
    sampleSegment(0, 0, 0, letterH, step, 'HAPPY', 'P', 3, ox, happyY);
    sampleSegment(0, letterH, happyW * 0.6, letterH, step, 'HAPPY', 'P', 3, ox, happyY);
    sampleArc(happyW * 0.6, letterH * 0.75, letterH * 0.25, Math.PI / 2, -Math.PI / 2, 8, 'HAPPY', 'P', 3, ox, happyY);
    sampleSegment(happyW * 0.6, letterH * 0.5, 0, letterH * 0.5, step, 'HAPPY', 'P', 3, ox, happyY);
  }
  // Y
  {
    const ox = happyStartX + 4 * (happyW + happyGap);
    sampleSegment(0, letterH, happyW * 0.5, letterH * 0.52, step, 'HAPPY', 'Y', 4, ox, happyY);
    sampleSegment(happyW, letterH, happyW * 0.5, letterH * 0.52, step, 'HAPPY', 'Y', 4, ox, happyY);
    sampleSegment(happyW * 0.5, letterH * 0.52, happyW * 0.5, 0, step, 'HAPPY', 'Y', 4, ox, happyY);
  }

  // -------------------------------------------------------------
  // LINE 2: DIWALI (6 letters, upright, centered)
  // -------------------------------------------------------------
  const diwaliW = 0.72;
  const diwaliGap = 0.32;
  const diwaliTotalW = 6 * diwaliW + 5 * diwaliGap;
  const diwaliStartX = -diwaliTotalW / 2;
  const diwaliY = -1.35;

  // D
  {
    const ox = diwaliStartX + 0 * (diwaliW + diwaliGap);
    sampleSegment(0, 0, 0, letterH, step, 'DIWALI', 'D', 5, ox, diwaliY);
    sampleSegment(0, letterH, diwaliW * 0.45, letterH, step, 'DIWALI', 'D', 5, ox, diwaliY);
    sampleArc(diwaliW * 0.45, letterH * 0.5, letterH * 0.5, Math.PI / 2, -Math.PI / 2, 12, 'DIWALI', 'D', 5, ox, diwaliY);
    sampleSegment(diwaliW * 0.45, 0, 0, 0, step, 'DIWALI', 'D', 5, ox, diwaliY);
  }
  // I
  {
    const ox = diwaliStartX + 1 * (diwaliW + diwaliGap);
    sampleSegment(diwaliW * 0.15, letterH, diwaliW * 0.85, letterH, step, 'DIWALI', 'I', 6, ox, diwaliY);
    sampleSegment(diwaliW * 0.5, 0, diwaliW * 0.5, letterH, step, 'DIWALI', 'I', 6, ox, diwaliY);
    sampleSegment(diwaliW * 0.15, 0, diwaliW * 0.85, 0, step, 'DIWALI', 'I', 6, ox, diwaliY);
  }
  // W
  {
    const ox = diwaliStartX + 2 * (diwaliW + diwaliGap);
    sampleSegment(0, letterH, diwaliW * 0.24, 0, step, 'DIWALI', 'W', 7, ox, diwaliY);
    sampleSegment(diwaliW * 0.24, 0, diwaliW * 0.5, letterH * 0.72, step, 'DIWALI', 'W', 7, ox, diwaliY);
    sampleSegment(diwaliW * 0.5, letterH * 0.72, diwaliW * 0.76, 0, step, 'DIWALI', 'W', 7, ox, diwaliY);
    sampleSegment(diwaliW * 0.76, 0, diwaliW, letterH, step, 'DIWALI', 'W', 7, ox, diwaliY);
  }
  // A
  {
    const ox = diwaliStartX + 3 * (diwaliW + diwaliGap);
    sampleSegment(0, 0, diwaliW * 0.5, letterH, step, 'DIWALI', 'A', 8, ox, diwaliY);
    sampleSegment(diwaliW * 0.5, letterH, diwaliW, 0, step, 'DIWALI', 'A', 8, ox, diwaliY);
    sampleSegment(diwaliW * 0.2, letterH * 0.38, diwaliW * 0.8, letterH * 0.38, step, 'DIWALI', 'A', 8, ox, diwaliY);
  }
  // L
  {
    const ox = diwaliStartX + 4 * (diwaliW + diwaliGap);
    sampleSegment(0, 0, 0, letterH, step, 'DIWALI', 'L', 9, ox, diwaliY);
    sampleSegment(0, 0, diwaliW * 0.88, 0, step, 'DIWALI', 'L', 9, ox, diwaliY);
  }
  // I
  {
    const ox = diwaliStartX + 5 * (diwaliW + diwaliGap);
    sampleSegment(diwaliW * 0.15, letterH, diwaliW * 0.85, letterH, step, 'DIWALI', 'I', 10, ox, diwaliY);
    sampleSegment(diwaliW * 0.5, 0, diwaliW * 0.5, letterH, step, 'DIWALI', 'I', 6, ox, diwaliY);
    sampleSegment(diwaliW * 0.15, 0, diwaliW * 0.85, 0, step, 'DIWALI', 'I', 10, ox, diwaliY);
  }

  return points;
}

export const DiyaTypography3D: React.FC<DiyaTypography3DProps> = ({ onAllLit, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // References for mutable state in the animation loop
  const pointsRef = useRef<DiyaPoint[]>([]);
  const litIndexRef = useRef<number>(0);
  const litStatesRef = useRef<Float32Array>(new Float32Array(0));
  const flameIntensitiesRef = useRef<Float32Array>(new Float32Array(0));
  const flamePhasesRef = useRef<Float32Array>(new Float32Array(0));

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const diyaMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const flameMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const haloMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const pointLightRefs = useRef<THREE.PointLight[]>([]);

  // Camera targets (straight front-facing perspective)
  const cameraCurrentPos = useRef(new THREE.Vector3(0, 0, 4.0));
  const cameraTargetPos = useRef(new THREE.Vector3(0, 0, 7.3));
  const cameraLookAtCurrent = useRef(new THREE.Vector3(0, 0, 0));
  const mouseParallax = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Generate Typography Points (Upright & Straight)
    const pts = generateTypographyPoints();
    pointsRef.current = pts;
    const count = pts.length;

    litStatesRef.current = new Float32Array(count);
    flameIntensitiesRef.current = new Float32Array(count);
    flamePhasesRef.current = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      flamePhasesRef.current[i] = Math.random() * Math.PI * 2;
    }

    // 2. Scene Setup (100% Transparent Background, NO FOG)
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const getResponsiveCameraZ = () => {
      const w = container.clientWidth;
      if (w < 380) return 11.6;
      if (w < 480) return 10.2;
      if (w < 640) return 9.0;
      if (w < 768) return 8.2;
      return 7.3;
    };

    const initialZ = getResponsiveCameraZ();
    cameraCurrentPos.current.set(0, 0, initialZ);
    cameraTargetPos.current.set(0, 0, initialZ);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, initialZ);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true, // Transparent canvas
    });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.setClearColor(0x000000, 0); // 100% transparent

    container.appendChild(renderer.domElement);

    // -------------------------------------------------------------
    // LIGHTING RIG
    // -------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.55);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffd599, 0.85);
    dirLight.position.set(0, 4, 6);
    scene.add(dirLight);

    const lightPositions = [
      { x: -2.0, y: 0.8, col: 0xffa500 },
      { x: 2.0, y: 0.8, col: 0xff8c00 },
      { x: -2.2, y: -0.8, col: 0xffb703 },
      { x: 2.2, y: -0.8, col: 0xff7700 },
      { x: 0, y: 0, col: 0xffea00 },
    ];
    pointLightRefs.current = [];
    lightPositions.forEach((lp) => {
      const pl = new THREE.PointLight(lp.col, 0, 5.5, 1.6);
      pl.position.set(lp.x, lp.y, 0.4);
      scene.add(pl);
      pointLightRefs.current.push(pl);
    });

    // -------------------------------------------------------------
    // 3D DIYA MESH (Terracotta Clay Bowl & Wick)
    // -------------------------------------------------------------
    const diyaPts: THREE.Vector2[] = [];
    diyaPts.push(new THREE.Vector2(0, 0));
    diyaPts.push(new THREE.Vector2(0.06, 0.01));
    diyaPts.push(new THREE.Vector2(0.09, 0.025));
    diyaPts.push(new THREE.Vector2(0.10, 0.05));
    diyaPts.push(new THREE.Vector2(0.09, 0.065));
    diyaPts.push(new THREE.Vector2(0.07, 0.055));
    diyaPts.push(new THREE.Vector2(0.02, 0.02));
    diyaPts.push(new THREE.Vector2(0, 0.018));

    const diyaGeo = new THREE.LatheGeometry(diyaPts, 16);
    const diyaMat = new THREE.MeshStandardMaterial({
      color: 0xba521d,
      roughness: 0.75,
      metalness: 0.12,
    });
    const diyaInstMesh = new THREE.InstancedMesh(diyaGeo, diyaMat, count);
    diyaMeshRef.current = diyaInstMesh;

    const dummy = new THREE.Object3D();
    pts.forEach((pt, i) => {
      dummy.position.set(pt.x, pt.y - 0.04, pt.z);
      dummy.rotation.set(0.35, 0, 0); // Tilted forward so users see inside the lamp
      dummy.scale.set(1.0, 1.0, 1.0);
      dummy.updateMatrix();
      diyaInstMesh.setMatrixAt(i, dummy.matrix);
    });
    diyaInstMesh.instanceMatrix.needsUpdate = true;
    scene.add(diyaInstMesh);

    // -------------------------------------------------------------
    // 3D TEARDROP FLAME MESH (Instanced)
    // -------------------------------------------------------------
    const flamePts: THREE.Vector2[] = [];
    for (let f = 0; f <= 12; f++) {
      const t = f / 12;
      const fy = t * 0.11;
      const fr = Math.sin(t * Math.PI) * (1 - t * 0.65) * 0.032;
      flamePts.push(new THREE.Vector2(Math.max(0.002, fr), fy));
    }
    const flameGeo = new THREE.LatheGeometry(flamePts, 10);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flameInstMesh = new THREE.InstancedMesh(flameGeo, flameMat, count);
    flameMeshRef.current = flameInstMesh;
    scene.add(flameInstMesh);

    // -------------------------------------------------------------
    // FLAME GLOW SPRITES (Instanced Golden Radial Halos)
    // -------------------------------------------------------------
    const haloGeo = new THREE.PlaneGeometry(0.36, 0.36);

    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 64;
    haloCanvas.height = 64;
    const hCtx = haloCanvas.getContext('2d');
    if (hCtx) {
      const radGrad = hCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
      radGrad.addColorStop(0, 'rgba(255, 235, 160, 0.95)');
      radGrad.addColorStop(0.35, 'rgba(245, 158, 11, 0.7)');
      radGrad.addColorStop(0.7, 'rgba(234, 88, 12, 0.25)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      hCtx.fillStyle = radGrad;
      hCtx.fillRect(0, 0, 64, 64);
    }
    const haloTex = new THREE.CanvasTexture(haloCanvas);

    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85,
    });
    const haloInstMesh = new THREE.InstancedMesh(haloGeo, haloMat, count);
    haloMeshRef.current = haloInstMesh;
    scene.add(haloInstMesh);

    // Initial hidden flame positions
    pts.forEach((pt, i) => {
      dummy.position.set(pt.x, pt.y + 0.04, pt.z + 0.03);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      flameInstMesh.setMatrixAt(i, dummy.matrix);

      dummy.position.set(pt.x, pt.y + 0.06, pt.z + 0.01);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      haloInstMesh.setMatrixAt(i, dummy.matrix);
    });
    flameInstMesh.instanceMatrix.needsUpdate = true;
    haloInstMesh.instanceMatrix.needsUpdate = true;

    // -------------------------------------------------------------
    // INTERACTION & MOUSE PARALLAX
    // -------------------------------------------------------------
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const maxOffset = window.innerWidth < 768 ? 0.22 : 0.45;
      mouseParallax.current.x = nx * maxOffset;
      mouseParallax.current.y = ny * (maxOffset * 0.6);
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });

    // -------------------------------------------------------------
    // CONTINUOUS MESMERIZING ANIMATION LOOP
    // -------------------------------------------------------------
    let frameId = 0;
    const startTime = performance.now();
    let lastTime = startTime;
    let lightTimer = 0;
    let loopPhase: 'lighting' | 'celebrating' | 'fading' = 'lighting';
    let phaseTimer = 0;

    const tick = () => {
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsed = (now - startTime) / 1000;

      // State machine for seamless continuous loop
      if (loopPhase === 'lighting') {
        lightTimer += delta;
        const interval = 0.022; // Steady, hypnotic wave lighting
        if (lightTimer >= interval) {
          lightTimer = 0;
          const curr = litIndexRef.current;
          if (curr < count) {
            litStatesRef.current[curr] = 1;
            litIndexRef.current++;

            if (curr % 14 === 0) {
              audioService.playTempleBell();
            }
          } else {
            // All lit! Transition to celebrating
            loopPhase = 'celebrating';
            phaseTimer = 0;
            audioService.playDiyaIgniteSound();
            confetti({
              particleCount: 65,
              spread: 85,
              origin: { y: 0.5 },
              colors: ['#ffd700', '#f59e0b', '#fbbf24', '#ff4500'],
            });
            if (onAllLit) onAllLit();
          }
        }
      } else if (loopPhase === 'celebrating') {
        phaseTimer += delta;
        // Hold full celebration with all flames dancing for 5 seconds
        if (phaseTimer >= 5.0) {
          loopPhase = 'fading';
          phaseTimer = 0;
        }
      } else if (loopPhase === 'fading') {
        phaseTimer += delta;
        // Gentle wave dimming over 1.4 seconds
        const fadeRatio = 1 - Math.min(1, phaseTimer / 1.4);
        for (let i = 0; i < count; i++) {
          litStatesRef.current[i] = fadeRatio;
        }
        if (phaseTimer >= 1.4) {
          // Restart loop
          litStatesRef.current.fill(0);
          flameIntensitiesRef.current.fill(0);
          litIndexRef.current = 0;
          loopPhase = 'lighting';
          phaseTimer = 0;
        }
      }

      // Smooth camera pull-back straight forward
      const targetPos = cameraTargetPos.current.clone();
      targetPos.x += mouseParallax.current.x;
      targetPos.y += mouseParallax.current.y;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetPos.x, 2.0, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetPos.y, 2.0, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetPos.z, 2.0, delta);

      const lookTarget = new THREE.Vector3(0, 0, 0);
      cameraLookAtCurrent.current.lerp(lookTarget, 0.05);
      camera.lookAt(cameraLookAtCurrent.current);

      // Animate Flames & Halos (Organic desynchronized flickering)
      const litRatio = litIndexRef.current / count;
      pointLightRefs.current.forEach((pl) => {
        pl.intensity = THREE.MathUtils.damp(pl.intensity, litRatio * 2.2, 3.0, delta);
      });

      for (let i = 0; i < count; i++) {
        const targetScale = litStatesRef.current[i];
        const pt = pts[i];
        const phase = flamePhasesRef.current[i];

        flameIntensitiesRef.current[i] = THREE.MathUtils.damp(
          flameIntensitiesRef.current[i],
          targetScale,
          10,
          delta
        );
        const intensity = flameIntensitiesRef.current[i];

        if (intensity > 0.01) {
          const flick =
            Math.sin(elapsed * 12 + phase) * 0.15 +
            Math.cos(elapsed * 7.5 + i * 1.5) * 0.08;
          const scaleX = (1 + flick * 0.6) * intensity;
          const scaleY = (1 + flick * 1.2) * intensity;
          const scaleZ = (1 + flick * 0.6) * intensity;

          // Upright flame
          dummy.position.set(pt.x, pt.y + 0.04, pt.z + 0.03);
          dummy.scale.set(scaleX, scaleY, scaleZ);
          dummy.rotation.set(0, 0, flick * 0.15);
          dummy.updateMatrix();
          flameInstMesh.setMatrixAt(i, dummy.matrix);

          // Front-facing halo glow
          dummy.position.set(pt.x, pt.y + 0.06, pt.z + 0.01);
          const haloScale = (1 + flick * 0.3) * intensity;
          dummy.scale.set(haloScale, haloScale, haloScale);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          haloInstMesh.setMatrixAt(i, dummy.matrix);
        } else {
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          flameInstMesh.setMatrixAt(i, dummy.matrix);
          haloInstMesh.setMatrixAt(i, dummy.matrix);
        }
      }

      flameInstMesh.instanceMatrix.needsUpdate = true;
      haloInstMesh.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const targetZ = getResponsiveCameraZ();
      cameraTargetPos.current.z = targetZ;
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(frameId);

      diyaGeo.dispose();
      diyaMat.dispose();
      flameGeo.dispose();
      flameMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      renderer.dispose();

      if (renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onAllLit]);

  return (
    <div
      className={`relative w-full h-[380px] xs:h-[440px] sm:h-[540px] md:h-[620px] bg-transparent border-0 shadow-none pointer-events-auto select-none overflow-visible touch-pan-y ${
        className || ''
      }`}
    >
      {/* 3D WebGL Canvas (100% Transparent, floating directly in the starry fireworks sky) */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-pan-y" />
    </div>
  );
};
