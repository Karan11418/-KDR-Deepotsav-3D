import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { DiwaliScene } from './components/3d/DiwaliScene';
import { InteractiveDiyas } from './components/InteractiveDiyas';
import { DiwaliWishGenerator } from './components/DiwaliWishGenerator';
import { BackgroundFireworks } from './components/BackgroundFireworks';
import { Footer } from './components/Footer';
import { CinematicIntro } from './components/CinematicIntro';
import { audioService } from './services/audioService';
import confetti from 'canvas-confetti';

export default function App() {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });

  // Cinematic Intro state (plays once per session, or when replayed)
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('deepotsav_intro_shown') !== 'true';
    } catch {
      return true;
    }
  });

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  // Stats from 3D scene
  const [, setSceneStats] = useState({
    litDiyas: 16,
    totalDiyas: 16,
    fireworksBursts: 0,
  });

  // Track mouse position for subtle custom golden spark cursor on desktop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const toggleMusic = () => {
    if (isMusicPlaying) {
      audioService.stopMusic();
      setIsMusicPlaying(false);
    } else {
      audioService.startMusic();
      setIsMusicPlaying(true);
    }
  };

  const handleLightAllDiyas = () => {
    audioService.playDiyaIgniteSound();
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#ffd700', '#f59e0b', '#fbbf24', '#ff4500'],
    });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      audioService.playTempleBell();
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#fbf6e2] font-sans selection:bg-amber-500/30 selection:text-amber-200 relative overflow-x-hidden">
      {/* Full-Screen Cinematic Diwali Intro (Sequence: Dark -> Golden Glow -> 3D Diya -> Creator -> Greeting -> Enter Website) */}
      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}

      {/* High-Density Atmospheric Fireworks & Glowing Air Lamps across Pure Black Background */}
      <BackgroundFireworks />

      {/* Custom Festive Cursor Sparkle on Desktop */}
      <div
        className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 hidden lg:block"
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      >
        <div className="w-4 h-4 rounded-full bg-amber-400/40 blur-[2px] flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
        </div>
      </div>

      {/* Top Navigation */}
      <Navigation
        onLightAllDiyas={handleLightAllDiyas}
        isMusicPlaying={isMusicPlaying}
        onToggleMusic={toggleMusic}
        onReplayIntro={handleReplayIntro}
      />

      {/* ========================================================= */}
      {/* 1. HERO SECTION – MAGICAL 3D DIWALI WORLD                 */}
      {/* ========================================================= */}
      <section
        id="hero"
        className="relative w-full h-screen min-h-[640px] flex items-center justify-center overflow-hidden z-10 bg-black"
      >
        {/* Full-Bleed 3D WebGL Canvas */}
        <div className="absolute inset-0 z-0">
          <DiwaliScene
            activeCameraPreset="hero"
            onStatsUpdate={setSceneStats}
          />
        </div>

        {/* Ambient Gradient Scrim for Content Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none opacity-85" />

        {/* Hero Text Content with Animated Shimmer & Crystal Clear Backdrop Scrim */}
        <div className="relative z-10 max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 text-center space-y-4 sm:space-y-6 select-none hero-text-backdrop rounded-2xl sm:rounded-3xl">
          {/* Main Hero Heading with Continuous Shimmer & Glowing Halo Animation */}
          <h1 className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-festive tracking-wide animate-hero-heading py-1 sm:py-2 break-words">
            ✨ HAPPY DIWALI ✨
          </h1>

          {/* Subheading with High Contrast and Animated Radiant Pulse */}
          <p
            className="text-sm xs:text-base sm:text-xl md:text-2xl font-body text-amber-100 font-medium max-w-2xl mx-auto leading-relaxed text-balance"
            style={{
              textShadow:
                '0 2px 4px rgba(0, 0, 0, 0.95), 0 0 15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(245, 158, 11, 0.65)',
            }}
          >
            "May Your Life Shine Brighter Than A Million Diyas!"
          </p>
        </div>

        {/* Scroll Down Indicator */}
        <button
          onClick={() => scrollToSection('diyas')}
          className="absolute bottom-5 sm:bottom-10 left-1/2 -translate-x-1/2 z-10 text-amber-300/70 hover:text-amber-200 flex flex-col items-center gap-1 transition-colors cursor-pointer text-xs"
        >
          <span>Explore Celebrations</span>
          <span className="animate-bounce text-sm">↓</span>
        </button>
      </section>

      {/* ========================================================= */}
      {/* 2. INTERACTIVE DIYA SANCTUARY                             */}
      {/* ========================================================= */}
      <div className="relative z-10">
        <InteractiveDiyas />
      </div>

      {/* Decorative Hairline Transition */}
      <div className="relative z-10 max-w-6xl mx-auto h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent my-6" />

      {/* ========================================================= */}
      {/* 3. DIWALI WISH & GREETING CARD STUDIO                     */}
      {/* ========================================================= */}
      <div className="relative z-10">
        <DiwaliWishGenerator />
      </div>

      {/* ========================================================= */}
      {/* 4. CELEBRATORY FOOTER                                     */}
      {/* ========================================================= */}
      <div className="relative z-10">
        <Footer onReplayIntro={handleReplayIntro} />
      </div>
    </div>
  );
}
