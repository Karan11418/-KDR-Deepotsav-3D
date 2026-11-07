interface FooterProps {
  onReplayIntro?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onReplayIntro }) => {
  return (
    <footer className="relative bg-transparent border-0 py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-6 relative z-10">
        {/* Animated Diya Trio */}
        <div className="flex items-center gap-3 text-2xl sm:text-3xl">
          <span className="animate-flame">🪔</span>
          <span className="text-amber-400 font-festive text-xl sm:text-2xl tracking-wide">
            ॐ शुभ दीपावली ॐ
          </span>
          <span className="animate-flame">🪔</span>
        </div>

        {/* Core Headline with Golden Glow */}
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-festive text-amber-200 tracking-wide max-w-2xl text-glow-gold">
          "May The Light Of Diwali Always Shine In Your Life!"
        </h3>

        <p className="text-sm sm:text-base text-amber-100/75 font-body max-w-xl leading-relaxed">
          May the divine warmth of glowing diyas bring boundless good health, peace, prosperity, and joyous smiles to you and your family.
        </p>

        {/* Replay Cinematic Intro Link */}
        {onReplayIntro && (
          <button
            onClick={onReplayIntro}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 hover:bg-black/70 border border-amber-500/25 hover:border-amber-400/60 text-xs text-amber-300 hover:text-amber-200 transition-all cursor-pointer backdrop-blur-xs"
          >
            <span>🎬</span>
            <span>Watch Cinematic Diwali Intro Again</span>
          </button>
        )}

        {/* Delicate Golden Ornament Divider */}
        <div className="flex items-center justify-center gap-3 my-4 opacity-50">
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-amber-400" />
          <span className="text-amber-400 text-xs">✦ 🌸 ✦</span>
          <div className="h-px w-20 bg-gradient-to-l from-transparent to-amber-400" />
        </div>

        {/* Clean Minimal Credit / Copyright */}
        <div className="pt-2 text-xs text-amber-300/60 flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>KDR Deepotsav</span>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <span>Created & Developed by Karan Dhanraj</span>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <span>तमसो मा ज्योतिर्गमय</span>
        </div>
      </div>
    </footer>
  );
};
