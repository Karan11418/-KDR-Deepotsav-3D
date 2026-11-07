import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { audioService } from '../../services/audioService';

interface DiwaliSceneProps {
  onDiyaClick?: (diyaIndex: number) => void;
  activeCameraPreset?: 'hero' | 'courtyard' | 'sky' | 'shrine';
  isCinemaMode?: boolean;
  onSceneLoaded?: () => void;
  onStatsUpdate?: (stats: { litDiyas: number; totalDiyas: number; fireworksBursts: number }) => void;
}

// Reusable math helpers outside render loop (Zero GC directive)
const _targetVec = new THREE.Vector3();
const _tempRay = new THREE.Raycaster();
const _pointer = new THREE.Vector2();

export const DiwaliScene: React.FC<DiwaliSceneProps> = ({
  onDiyaClick,
  activeCameraPreset = 'hero',
  isCinemaMode = false,
  onSceneLoaded,
  onStatsUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [litCount, setLitCount] = useState(16);
  const litCountRef = useRef(16);
  const fireworksBurstCountRef = useRef(0);

  // References for mutable animation state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const diyasRef = useRef<Array<{
    group: THREE.Group;
    flame: THREE.Mesh;
    light: THREE.PointLight;
    glow: THREE.Sprite;
    isLit: boolean;
    initialY: number;
    baseIntensity: number;
  }>>([]);
  const fireworksRef = useRef<Array<{
    points: THREE.Points;
    velocities: Float32Array;
    colors: Float32Array;
    lifetimes: Float32Array;
    age: number;
    maxAge: number;
    light: THREE.PointLight;
    alive: boolean;
  }>>([]);
  const airLamps3DRef = useRef<Array<{
    group: THREE.Group;
    speed: number;
    swaySpeed: number;
    swayOffset: number;
  }>>([]);

  const cameraTargetRef = useRef(new THREE.Vector3(0, 3, 0));
  const cameraDesiredPosRef = useRef(new THREE.Vector3(0, 6, 26));

  // Handle camera presets
  useEffect(() => {
    switch (activeCameraPreset) {
      case 'courtyard':
        cameraDesiredPosRef.current.set(0, 2.5, 9);
        cameraTargetRef.current.set(0, 1.2, 0);
        break;
      case 'sky':
        cameraDesiredPosRef.current.set(0, 5, 24);
        cameraTargetRef.current.set(0, 18, -10);
        break;
      case 'shrine':
        cameraDesiredPosRef.current.set(0, 1.8, 5);
        cameraTargetRef.current.set(0, 1.5, 0);
        break;
      case 'hero':
      default:
        cameraDesiredPosRef.current.set(0, 6, 26);
        cameraTargetRef.current.set(0, 3.5, 0);
        break;
    }
  }, [activeCameraPreset]);

  // Launch a 3D firework burst
  const triggerFirework = useCallback((x?: number, y?: number, z?: number, colorHex?: number) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const burstX = x !== undefined ? x : (Math.random() - 0.5) * 32;
    const burstY = y !== undefined ? y : 11 + Math.random() * 14;
    const burstZ = z !== undefined ? z : -12 + (Math.random() - 0.5) * 16;

    const colorsList = [0xffd700, 0xff1744, 0x00e676, 0x00e5ff, 0xff9100, 0xd500f9, 0xffffff];
    const pickedColor = colorHex || colorsList[Math.floor(Math.random() * colorsList.length)];
    const particleCount = 280; // Increased density

    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);

    const baseColor = new THREE.Color(pickedColor);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = burstX;
      positions[i * 3 + 1] = burstY;
      positions[i * 3 + 2] = burstZ;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 3.5 + Math.random() * 6.5;

      velocities[i * 3] = speed * Math.sin(phi) * Math.cos(theta);
      velocities[i * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
      velocities[i * 3 + 2] = speed * Math.cos(phi);

      const col = baseColor.clone();
      if (Math.random() > 0.3) {
        col.offsetHSL(0.08 * (Math.random() - 0.5), 0, 0.15);
      }
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      lifetimes[i] = 1.3 + Math.random() * 0.9;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.3, 'rgba(255,230,120,0.9)');
      grad.addColorStop(1, 'rgba(255,100,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.95,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: texture,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const burstLight = new THREE.PointLight(pickedColor, 10, 45, 1.5);
    burstLight.position.set(burstX, burstY, burstZ);
    scene.add(burstLight);

    fireworksRef.current.push({
      points,
      velocities,
      colors,
      lifetimes,
      age: 0,
      maxAge: 2.2,
      light: burstLight,
      alive: true,
    });

    fireworksBurstCountRef.current++;
    audioService.playFireworkSound('burst');

    if (onStatsUpdate) {
      onStatsUpdate({
        litDiyas: litCountRef.current,
        totalDiyas: diyasRef.current.length,
        fireworksBursts: fireworksBurstCountRef.current,
      });
    }
  }, [onStatsUpdate]);

  // Toggle individual diya
  const toggleDiya = useCallback((index: number) => {
    const diya = diyasRef.current[index];
    if (!diya) return;

    diya.isLit = !diya.isLit;
    diya.flame.visible = diya.isLit;
    diya.light.visible = diya.isLit;
    diya.glow.visible = diya.isLit;

    if (diya.isLit) {
      audioService.playDiyaIgniteSound();
      triggerFirework(diya.group.position.x, diya.group.position.y + 2, diya.group.position.z, 0xffb703);
    }

    const currentLit = diyasRef.current.filter((d) => d.isLit).length;
    litCountRef.current = currentLit;
    setLitCount(currentLit);

    if (onDiyaClick) {
      onDiyaClick(index);
    }
    if (onStatsUpdate) {
      onStatsUpdate({
        litDiyas: currentLit,
        totalDiyas: diyasRef.current.length,
        fireworksBursts: fireworksBurstCountRef.current,
      });
    }
  }, [onDiyaClick, onStatsUpdate, triggerFirework]);

  // Main 3D Engine Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // Pure Black Scene for Maximum High-Contrast Fireworks & Air Lamp Brilliance
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x000000, 0.014);

    const isMobile = container.clientWidth < 640 || (container.clientWidth / container.clientHeight) < 1.0;
    const initialAspect = container.clientWidth / container.clientHeight;

    const camera = new THREE.PerspectiveCamera(
      initialAspect < 1.0 ? 52 : 45,
      initialAspect,
      0.1,
      250
    );
    if (initialAspect < 1.0) {
      cameraDesiredPosRef.current.set(0, 7.8, 33);
      camera.position.set(0, 7.8, 33);
    } else {
      cameraDesiredPosRef.current.set(0, 6, 26);
      camera.position.set(0, 6, 26);
    }
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Optimized pixel ratio for mobile to prevent GPU heating and maintain smooth 60 FPS
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, isMobile ? 1.5 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    // PURE BLACK BACKGROUND
    renderer.setClearColor(0x000000, 1);

    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // -------------------------------------------------------------
    // LIGHTING RIG
    // -------------------------------------------------------------
    const hemiLight = new THREE.HemisphereLight(0x312e81, 0x0f0b1e, 0.5);
    scene.add(hemiLight);

    const moonLight = new THREE.DirectionalLight(0xfffbeb, 0.85);
    moonLight.position.set(15, 28, 12);
    if (!isSoftwareGl) {
      moonLight.castShadow = true;
      moonLight.shadow.mapSize.width = 1024;
      moonLight.shadow.mapSize.height = 1024;
      moonLight.shadow.bias = -0.0004;
    }
    scene.add(moonLight);

    const courtyardGlow = new THREE.PointLight(0xf59e0b, 3.2, 35, 1.2);
    courtyardGlow.position.set(0, 4, 2);
    scene.add(courtyardGlow);

    // -------------------------------------------------------------
    // PROCEDURAL PALACE & GHAT ARCHITECTURE
    // -------------------------------------------------------------
    const palaceGroup = new THREE.Group();
    scene.add(palaceGroup);

    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0xf5ebd7,
      roughness: 0.35,
      metalness: 0.1,
    });
    const sandstoneMat = new THREE.MeshStandardMaterial({
      color: 0xc89666,
      roughness: 0.7,
      metalness: 0.05,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.85,
    });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x02040a,
      roughness: 0.08,
      metalness: 0.95,
    });

    // 1. Water River / Sarayu Ghat reflection plane
    const waterGeo = new THREE.PlaneGeometry(140, 60);
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(0, -0.05, 20);
    waterMesh.receiveShadow = !isSoftwareGl;
    palaceGroup.add(waterMesh);

    // 2. Multi-tier Courtyard Stone Steps (Ghats)
    const stepCount = 5;
    for (let i = 0; i < stepCount; i++) {
      const stepWidth = 36 - i * 1.5;
      const stepDepth = 2.2;
      const stepHeight = 0.45;
      const stepGeo = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
      const stepMesh = new THREE.Mesh(stepGeo, sandstoneMat);
      stepMesh.position.set(0, i * stepHeight + stepHeight / 2, 8 - i * stepDepth);
      stepMesh.receiveShadow = !isSoftwareGl;
      stepMesh.castShadow = !isSoftwareGl;
      palaceGroup.add(stepMesh);
    }

    // 3. Main Courtyard Terrace
    const terraceGeo = new THREE.BoxGeometry(40, 0.6, 20);
    const terraceMesh = new THREE.Mesh(terraceGeo, marbleMat);
    terraceMesh.position.set(0, stepCount * 0.45 + 0.3, -3);
    terraceMesh.receiveShadow = !isSoftwareGl;
    palaceGroup.add(terraceMesh);

    // 4. Central Grand Temple Shikhara & Sanctum
    const sanctumBaseGeo = new THREE.BoxGeometry(10, 6, 8);
    const sanctumBase = new THREE.Mesh(sanctumBaseGeo, sandstoneMat);
    sanctumBase.position.set(0, 5.5, -7);
    sanctumBase.castShadow = !isSoftwareGl;
    sanctumBase.receiveShadow = !isSoftwareGl;
    palaceGroup.add(sanctumBase);

    // Grand Shikhara / Dome
    const domePoints: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const y = t * 6.5;
      const radius = Math.sin(t * Math.PI) * 2.8 * (1 - t * 0.3) + 0.05;
      domePoints.push(new THREE.Vector2(Math.max(0.01, radius), y));
    }
    const domeGeo = new THREE.LatheGeometry(domePoints, 24);
    const domeMesh = new THREE.Mesh(domeGeo, marbleMat);
    domeMesh.position.set(0, 8.5, -7);
    domeMesh.castShadow = !isSoftwareGl;
    palaceGroup.add(domeMesh);

    // Golden Kalash on top
    const kalashBaseGeo = new THREE.CylinderGeometry(0.5, 0.8, 1, 16);
    const kalashBase = new THREE.Mesh(kalashBaseGeo, goldTrimMat);
    kalashBase.position.set(0, 15.3, -7);
    palaceGroup.add(kalashBase);

    const kalashSphereGeo = new THREE.SphereGeometry(0.55, 16, 16);
    const kalashSphere = new THREE.Mesh(kalashSphereGeo, goldTrimMat);
    kalashSphere.position.set(0, 16.2, -7);
    palaceGroup.add(kalashSphere);

    // 5. Flanking Royal Chattris
    const createChattri = (posX: number, posZ: number) => {
      const chattriGroup = new THREE.Group();
      chattriGroup.position.set(posX, 2.8, posZ);

      const baseGeo = new THREE.CylinderGeometry(3.2, 3.5, 0.6, 8);
      const base = new THREE.Mesh(baseGeo, sandstoneMat);
      base.position.y = 0.3;
      chattriGroup.add(base);

      const pillarRadius = 2.4;
      for (let p = 0; p < 6; p++) {
        const angle = (p / 6) * Math.PI * 2;
        const px = Math.cos(angle) * pillarRadius;
        const pz = Math.sin(angle) * pillarRadius;

        const colGeo = new THREE.CylinderGeometry(0.2, 0.25, 4.2, 12);
        const col = new THREE.Mesh(colGeo, marbleMat);
        col.position.set(px, 2.7, pz);
        col.castShadow = !isSoftwareGl;
        chattriGroup.add(col);

        const capGeo = new THREE.BoxGeometry(0.6, 0.3, 0.6);
        const cap = new THREE.Mesh(capGeo, goldTrimMat);
        cap.position.set(px, 4.8, pz);
        chattriGroup.add(cap);
      }

      const chattriDomeGeo = new THREE.SphereGeometry(2.8, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const chattriDome = new THREE.Mesh(chattriDomeGeo, sandstoneMat);
      chattriDome.position.y = 5.0;
      chattriGroup.add(chattriDome);

      const finialGeo = new THREE.ConeGeometry(0.3, 1.2, 12);
      const finial = new THREE.Mesh(finialGeo, goldTrimMat);
      finial.position.y = 8.2;
      chattriGroup.add(finial);

      return chattriGroup;
    };

    palaceGroup.add(createChattri(-14, -6));
    palaceGroup.add(createChattri(14, -6));
    palaceGroup.add(createChattri(-22, -10));
    palaceGroup.add(createChattri(22, -10));

    // 6. Royal Columns along terrace arcade
    for (let c = -8; c <= 8; c += 2.2) {
      if (Math.abs(c) < 3) continue;
      const colGeo = new THREE.CylinderGeometry(0.25, 0.3, 4.8, 12);
      const colMesh = new THREE.Mesh(colGeo, marbleMat);
      colMesh.position.set(c, 5.2, -3.2);
      colMesh.castShadow = !isSoftwareGl;
      palaceGroup.add(colMesh);

      const archArchGeo = new THREE.TorusGeometry(1.1, 0.15, 8, 16, Math.PI);
      const arch = new THREE.Mesh(archArchGeo, sandstoneMat);
      arch.position.set(c + 1.1, 7.5, -3.2);
      arch.rotation.z = Math.PI;
      palaceGroup.add(arch);
    }

    // -------------------------------------------------------------
    // PROCEDURAL 3D AIR LAMPS (FLOATING SKY LANTERNS)
    // -------------------------------------------------------------
    const airLampsGroup = new THREE.Group();
    scene.add(airLampsGroup);
    airLamps3DRef.current = [];

    const airLampColors = [0xf59e0b, 0xef4444, 0xec4899, 0xf97316, 0x06b6d4];
    for (let al = 0; al < 16; al++) {
      const lampItem = new THREE.Group();
      const col = airLampColors[al % airLampColors.length];

      const lx = (Math.random() - 0.5) * 55;
      const ly = 4 + Math.random() * 26;
      const lz = -14 - Math.random() * 24;
      lampItem.position.set(lx, ly, lz);

      // Lantern cylinder body
      const lBodyGeo = new THREE.CylinderGeometry(0.48, 0.4, 1.15, 10);
      const lBodyMat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.9,
      });
      const lBody = new THREE.Mesh(lBodyGeo, lBodyMat);
      lampItem.add(lBody);

      // Inner flame point light
      const lLight = new THREE.PointLight(col, 1.5, 12, 1.5);
      lampItem.add(lLight);

      // Golden bottom tassel
      const tasselGeo = new THREE.ConeGeometry(0.12, 0.45, 6);
      const tasselMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      const tassel = new THREE.Mesh(tasselGeo, tasselMat);
      tassel.position.y = -0.75;
      lampItem.add(tassel);

      airLampsGroup.add(lampItem);

      airLamps3DRef.current.push({
        group: lampItem,
        speed: 0.4 + Math.random() * 0.45,
        swaySpeed: 1 + Math.random() * 1.6,
        swayOffset: Math.random() * Math.PI * 2,
      });
    }

    // -------------------------------------------------------------
    // PROCEDURAL 3D DIYAS
    // -------------------------------------------------------------
    const diyaPositions: Array<{ x: number; y: number; z: number }> = [
      { x: 0, y: 0.5, z: 9 },
      { x: -2.5, y: 0.5, z: 9 },
      { x: 2.5, y: 0.5, z: 9 },
      { x: -5, y: 0.5, z: 8.8 },
      { x: 5, y: 0.5, z: 8.8 },
      { x: -1.5, y: 0.95, z: 6.8 },
      { x: 1.5, y: 0.95, z: 6.8 },
      { x: -4, y: 0.95, z: 6.8 },
      { x: 4, y: 0.95, z: 6.8 },
      { x: 0, y: 1.4, z: 4.6 },
      { x: -3, y: 1.4, z: 4.6 },
      { x: 3, y: 1.4, z: 4.6 },
      { x: -8, y: 2.6, z: 0 },
      { x: 8, y: 2.6, z: 0 },
      { x: -12, y: 2.6, z: 1 },
      { x: 12, y: 2.6, z: 1 },
    ];

    const diyaClayMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.85,
      metalness: 0.05,
    });
    const diyaBrassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.3,
      metalness: 0.8,
    });
    const diyaWickMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 });

    const flameCanvas = document.createElement('canvas');
    flameCanvas.width = 64;
    flameCanvas.height = 64;
    const fCtx = flameCanvas.getContext('2d');
    if (fCtx) {
      const grad = fCtx.createRadialGradient(32, 38, 2, 32, 38, 28);
      grad.addColorStop(0, 'rgba(255, 255, 220, 1)');
      grad.addColorStop(0.35, 'rgba(251, 191, 36, 0.85)');
      grad.addColorStop(0.7, 'rgba(249, 115, 22, 0.4)');
      grad.addColorStop(1, 'rgba(234, 88, 12, 0)');
      fCtx.fillStyle = grad;
      fCtx.fillRect(0, 0, 64, 64);
    }
    const flameSpriteTex = new THREE.CanvasTexture(flameCanvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: flameSpriteTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    diyasRef.current = [];

    diyaPositions.forEach((pos, idx) => {
      const diyaGroup = new THREE.Group();
      diyaGroup.position.set(pos.x, pos.y, pos.z);
      diyaGroup.userData = { diyaIndex: idx, isDiya: true };

      const bowlPts: THREE.Vector2[] = [];
      bowlPts.push(new THREE.Vector2(0, 0));
      bowlPts.push(new THREE.Vector2(0.45, 0.04));
      bowlPts.push(new THREE.Vector2(0.65, 0.18));
      bowlPts.push(new THREE.Vector2(0.75, 0.35));
      bowlPts.push(new THREE.Vector2(0.68, 0.42));
      bowlPts.push(new THREE.Vector2(0.58, 0.38));
      bowlPts.push(new THREE.Vector2(0.25, 0.15));
      bowlPts.push(new THREE.Vector2(0, 0.12));
      const bowlGeo = new THREE.LatheGeometry(bowlPts, 20);
      const isBrass = idx % 3 === 0;
      const bowlMesh = new THREE.Mesh(bowlGeo, isBrass ? diyaBrassMat : diyaClayMat);
      bowlMesh.castShadow = !isSoftwareGl;
      diyaGroup.add(bowlMesh);

      const wickGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8);
      const wickMesh = new THREE.Mesh(wickGeo, diyaWickMat);
      wickMesh.position.set(0.18, 0.35, 0);
      wickMesh.rotation.z = -0.3;
      diyaGroup.add(wickMesh);

      const flamePts: THREE.Vector2[] = [];
      for (let f = 0; f <= 16; f++) {
        const t = f / 16;
        const fy = t * 0.55;
        const fr = Math.sin(t * Math.PI) * (1 - t * 0.7) * 0.18;
        flamePts.push(new THREE.Vector2(Math.max(0.005, fr), fy));
      }
      const flameGeo = new THREE.LatheGeometry(flamePts, 12);
      const flameMeshMat = new THREE.MeshBasicMaterial({
        color: 0xffedd5,
        transparent: true,
        opacity: 0.95,
      });
      const flameMesh = new THREE.Mesh(flameGeo, flameMeshMat);
      flameMesh.position.set(0.2, 0.42, 0);
      diyaGroup.add(flameMesh);

      const glowSprite = new THREE.Sprite(spriteMat);
      glowSprite.position.set(0.2, 0.55, 0);
      glowSprite.scale.set(1.4, 1.4, 1.4);
      diyaGroup.add(glowSprite);

      const diyaLight = new THREE.PointLight(0xffa500, 1.8, 7, 1.5);
      diyaLight.position.set(0.2, 0.6, 0);
      diyaGroup.add(diyaLight);

      const shadowDiscGeo = new THREE.CircleGeometry(0.65, 16);
      const shadowDiscMat = new THREE.MeshBasicMaterial({
        color: 0x05030a,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      });
      const shadowDisc = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
      shadowDisc.rotation.x = -Math.PI / 2;
      shadowDisc.position.y = 0.01;
      diyaGroup.add(shadowDisc);

      scene.add(diyaGroup);

      diyasRef.current.push({
        group: diyaGroup,
        flame: flameMesh,
        light: diyaLight,
        glow: glowSprite,
        isLit: true,
        initialY: pos.y,
        baseIntensity: 1.8,
      });
    });

    setLitCount(diyasRef.current.length);
    litCountRef.current = diyasRef.current.length;

    // -------------------------------------------------------------
    // CELESTIAL ELEMENTS (Crescent Moon, Starfield, Floating Sparks)
    // -------------------------------------------------------------
    const moonGroup = new THREE.Group();
    moonGroup.position.set(16, 26, -35);
    const moonGeo = new THREE.SphereGeometry(2.4, 24, 24);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moonGroup.add(moon);

    const moonGlow = new THREE.Sprite(spriteMat);
    moonGlow.scale.set(12, 12, 12);
    moonGroup.add(moonGlow);
    scene.add(moonGroup);

    const starCount = 750;
    const starPositions = new Float32Array(starCount * 3);
    for (let s = 0; s < starCount; s++) {
      starPositions[s * 3] = (Math.random() - 0.5) * 160;
      starPositions[s * 3 + 1] = 10 + Math.random() * 80;
      starPositions[s * 3 + 2] = -50 - Math.random() * 60;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.65,
      transparent: true,
      opacity: 0.9,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // Floating Golden Sparks
    const emberCount = 180;
    const emberPositions = new Float32Array(emberCount * 3);
    const emberVelocities = new Float32Array(emberCount * 3);
    for (let e = 0; e < emberCount; e++) {
      emberPositions[e * 3] = (Math.random() - 0.5) * 28;
      emberPositions[e * 3 + 1] = Math.random() * 12;
      emberPositions[e * 3 + 2] = (Math.random() - 0.5) * 18;

      emberVelocities[e * 3] = (Math.random() - 0.5) * 0.3;
      emberVelocities[e * 3 + 1] = 0.3 + Math.random() * 0.7;
      emberVelocities[e * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
    const emberMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.55,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const emberPoints = new THREE.Points(emberGeo, emberMat);
    scene.add(emberPoints);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    if (onSceneLoaded) {
      onSceneLoaded();
    }

    let mouseX = 0;
    let mouseY = 0;

    const handlePointerMove = (evt: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerDown = (evt: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      _pointer.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;

      _tempRay.setFromCamera(_pointer, camera);
      const interactiveObjects = diyasRef.current.map((d) => d.group);
      const intersects = _tempRay.intersectObjects(interactiveObjects, true);

      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData?.isDiya && obj.parent) {
          obj = obj.parent;
        }
        if (obj && typeof obj.userData?.diyaIndex === 'number') {
          toggleDiya(obj.userData.diyaIndex);
          return;
        }
      }

      if (_pointer.y > -0.2) {
        const worldX = _pointer.x * 16;
        const worldY = 8 + (_pointer.y + 0.2) * 14;
        triggerFirework(worldX, worldY, -10 + Math.random() * 5);
      }
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerdown', handlePointerDown);

    let frameId = 0;
    const startTime = performance.now();
    let lastTime = startTime;
    let autoFireworkTimer = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsed = (now - startTime) / 1000;

      // Camera smooth damping
      const parallaxX = mouseX * 0.8;
      const parallaxY = mouseY * 0.5;

      _targetVec.copy(cameraDesiredPosRef.current);
      _targetVec.x += parallaxX;
      _targetVec.y += parallaxY;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetVec.x, 3.0, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetVec.y, 3.0, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetVec.z, 3.0, delta);

      camera.lookAt(cameraTargetRef.current);

      // Animate 3D Air Lamps Floating Upwards
      airLamps3DRef.current.forEach((lamp) => {
        lamp.group.position.y += lamp.speed * delta;
        lamp.group.position.x += Math.sin(elapsed * lamp.swaySpeed + lamp.swayOffset) * 0.02;

        if (lamp.group.position.y > 34) {
          lamp.group.position.y = 2;
          lamp.group.position.x = (Math.random() - 0.5) * 55;
        }
      });

      // Animate Diya Flames & Lights
      diyasRef.current.forEach((diya, i) => {
        if (!diya.isLit) return;
        const flicker = Math.sin(elapsed * 12 + i * 2.3) * 0.18 + Math.cos(elapsed * 7.5 + i) * 0.1;
        diya.flame.scale.set(
          1 + flicker * 0.6,
          1 + flicker,
          1 + flicker * 0.6
        );
        diya.light.intensity = diya.baseIntensity + flicker * 0.6;
        diya.glow.scale.set(
          1.4 + flicker * 0.4,
          1.4 + flicker * 0.4,
          1.4 + flicker * 0.4
        );
      });

      // Animate Rising Golden Embers
      const emberPosAttr = emberGeo.getAttribute('position') as THREE.BufferAttribute;
      const emberArr = emberPosAttr.array as Float32Array;
      for (let e = 0; e < emberCount; e++) {
        emberArr[e * 3 + 1] += emberVelocities[e * 3 + 1] * delta;
        emberArr[e * 3] += Math.sin(elapsed * 2 + e) * 0.02;
        if (emberArr[e * 3 + 1] > 18) {
          emberArr[e * 3 + 1] = 0.5;
          emberArr[e * 3] = (Math.random() - 0.5) * 28;
          emberArr[e * 3 + 2] = (Math.random() - 0.5) * 18;
        }
      }
      emberPosAttr.needsUpdate = true;

      // Update Fireworks Particles
      const activeFireworks = fireworksRef.current;
      for (let fw = activeFireworks.length - 1; fw >= 0; fw--) {
        const item = activeFireworks[fw];
        item.age += delta;

        if (item.age >= item.maxAge) {
          scene.remove(item.points);
          scene.remove(item.light);
          item.points.geometry.dispose();
          (item.points.material as THREE.Material).dispose();
          item.alive = false;
          activeFireworks.splice(fw, 1);
          continue;
        }

        const decay = 1 - item.age / item.maxAge;
        (item.points.material as THREE.PointsMaterial).opacity = decay;
        item.light.intensity = decay * 10;

        const posAttr = item.points.geometry.getAttribute('position') as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;

        for (let p = 0; p < item.velocities.length / 3; p++) {
          item.velocities[p * 3 + 1] -= 2.6 * delta;

          posArray[p * 3] += item.velocities[p * 3] * delta;
          posArray[p * 3 + 1] += item.velocities[p * 3 + 1] * delta;
          posArray[p * 3 + 2] += item.velocities[p * 3 + 2] * delta;
        }
        posAttr.needsUpdate = true;
      }

      // Faster auto-burst frequency (every 2.8s instead of 5.5s)
      autoFireworkTimer += delta;
      if (autoFireworkTimer > 2.8) {
        autoFireworkTimer = 0;
        triggerFirework();
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const aspect = w / h;
      camera.aspect = aspect;
      camera.fov = aspect < 1.0 ? 52 : 45;
      camera.updateProjectionMatrix();
      if (aspect < 1.0) {
        cameraDesiredPosRef.current.set(0, 7.8, 33);
      } else {
        cameraDesiredPosRef.current.set(0, 6, 26);
      }
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);

      diyasRef.current.forEach((d) => {
        d.flame.geometry.dispose();
        scene.remove(d.group);
      });
      fireworksRef.current.forEach((f) => {
        scene.remove(f.points);
        scene.remove(f.light);
        f.points.geometry.dispose();
      });

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [triggerFirework, toggleDiya, onSceneLoaded]);

  const lightAllDiyas = useCallback(() => {
    diyasRef.current.forEach((diya) => {
      diya.isLit = true;
      diya.flame.visible = true;
      diya.light.visible = true;
      diya.glow.visible = true;
    });
    litCountRef.current = diyasRef.current.length;
    setLitCount(diyasRef.current.length);
    audioService.playDiyaIgniteSound();
    triggerFirework(0, 15, -8, 0xffd700);
    if (onStatsUpdate) {
      onStatsUpdate({
        litDiyas: diyasRef.current.length,
        totalDiyas: diyasRef.current.length,
        fireworksBursts: fireworksBurstCountRef.current,
      });
    }
  }, [triggerFirework, onStatsUpdate]);

  const extinguishAllDiyas = useCallback(() => {
    diyasRef.current.forEach((diya) => {
      diya.isLit = false;
      diya.flame.visible = false;
      diya.light.visible = false;
      diya.glow.visible = false;
    });
    litCountRef.current = 0;
    setLitCount(0);
    if (onStatsUpdate) {
      onStatsUpdate({
        litDiyas: 0,
        totalDiyas: diyasRef.current.length,
        fireworksBursts: fireworksBurstCountRef.current,
      });
    }
  }, [onStatsUpdate]);

  return (
    <div className="relative w-full h-full min-h-[550px] overflow-hidden select-none bg-black">
      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-crosshair" />
    </div>
  );
};
