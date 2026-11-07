import React, { useState, useEffect } from 'react';
import { audioService } from '../services/audioService';

interface NavigationProps {
  onLightAllDiyas: () => void;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
  onReplayIntro?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  onLightAllDiyas,
  isMusicPlaying,
  onToggleMusic,
  onReplayIntro,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-2.5 sm:top-4 left-0 right-0 z-50 px-2 sm:px-6 pointer-events-none transition-all duration-300">
      {/* Floating Glassmorphic Pill Capsule Navbar */}
      <div
        className={`max-w-4xl mx-auto flex items-center justify-between gap-1.5 xs:gap-2 sm:gap-4 px-3 xs:px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-full border transition-all duration-300 shadow-2xl pointer-events-auto backdrop-blur-md ${
          isScrolled
            ? 'bg-black/70 border-amber-500/35 shadow-amber-500/10'
            : 'bg-black/45 border-amber-500/25'
        }`}
      >
        {/* Brand Wordmark */}
        <a
          href="#"
          className="flex items-center gap-1.5 sm:gap-2 text-base xs:text-lg sm:text-xl font-festive text-amber-200 tracking-wider whitespace-nowrap shrink-0 hover:text-amber-100 transition-colors"
        >
          <span className="text-sm sm:text-lg animate-flame">🪔</span>
          <span className="text-glow-gold truncate">KDR Deepotsav</span>
        </a>

        {/* Clean Center Navigation Anchors for Tablets & Desktop */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-xs sm:text-sm font-medium text-amber-100/80">
          <a
            href="#hero"
            className="hover:text-amber-300 transition-colors whitespace-nowrap"
          >
            3D World
          </a>
          <span className="text-amber-500/30 text-xs" aria-hidden="true">·</span>
          <a
            href="#wishes"
            className="hover:text-amber-300 transition-colors whitespace-nowrap"
          >
            Diwali Blessings
          </a>
        </nav>

        {/* Right Action Icons: Music, Intro & Sparkle */}
        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 shrink-0">
          {/* Festive Music Toggle Pill */}
          <button
            onClick={onToggleMusic}
            title={isMusicPlaying ? 'Pause Festive Music' : 'Play Festive Music'}
            className={`px-2 xs:px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 border ${
              isMusicPlaying
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-xs font-semibold'
                : 'bg-white/5 border-amber-500/20 text-amber-200/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>{isMusicPlaying ? '🎵' : '🔇'}</span>
            <span className="hidden sm:inline">
              {isMusicPlaying ? 'Music ON' : 'Music'}
            </span>
          </button>

          {/* Replay Cinematic Intro Button */}
          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              title="Watch Cinematic Diwali Intro"
              className="px-2 xs:px-2.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 border bg-white/5 border-amber-500/20 text-amber-200/80 hover:bg-amber-400/20 hover:text-amber-200 hover:border-amber-400/50"
            >
              <span>🎬</span>
              <span className="hidden sm:inline">Intro</span>
            </button>
          )}

          {/* Sparkle Celebration Trigger */}
          <button
            onClick={() => {
              onLightAllDiyas();
              audioService.playDiyaIgniteSound();
            }}
            title="Celebrate with Golden Sparkles!"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer border border-amber-300 shrink-0"
          >
            <span>✨</span>
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-amber-200 hover:text-white hover:bg-white/10 cursor-pointer active:scale-95 transition-all"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Floating Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden max-w-xs xs:max-w-sm mx-auto mt-2 rounded-2xl bg-black/90 border border-amber-500/35 backdrop-blur-xl p-3.5 sm:p-4 space-y-2.5 pointer-events-auto shadow-2xl text-center">
          <div className="flex flex-col space-y-1.5 text-xs sm:text-sm font-medium text-amber-100">
            {[
              { href: '#hero', label: '3D World' },
              { href: '#wishes', label: 'Diwali Blessings' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-xl hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
              >
                {link.label}
              </a>
            ))}

            {onReplayIntro && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onReplayIntro();
                }}
                className="py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer font-semibold text-xs mt-1"
              >
                <span>🎬</span>
                <span>Watch Cinematic Intro</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
