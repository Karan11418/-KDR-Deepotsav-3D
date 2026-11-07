import React from 'react';
import { DiyaTypography3D } from './3d/DiyaTypography3D';

export const InteractiveDiyas: React.FC = () => {
  return (
    <section id="diyas" className="py-10 sm:py-16 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 px-2">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold tracking-widest text-amber-400 uppercase mb-2 sm:mb-3">
          <span>Sacred Radiance</span>
          <span aria-hidden="true">·</span>
          <span>दीप प्रज्वलन</span>
          <span aria-hidden="true">·</span>
          <span>Infinite Golden Lights</span>
        </div>
        <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-festive text-amber-200 tracking-wide mb-2 sm:mb-3">
          Interactive Diya Sanctuary
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-amber-100/75 font-body leading-relaxed text-balance">
          Every earthen lamp lit dispels darkness, ignorance, and despair. Hundreds of traditional clay diyas ignite in an eternal celebratory dance, filling your world with warmth and auspicious grace.
        </p>
      </div>

      {/* Grand 3D Diya Typography "HAPPY DIWALI" Showcase (Full Width & 100% Transparent) */}
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center px-1 sm:px-4">
        <DiyaTypography3D className="w-full" />
      </div>
    </section>
  );
};
