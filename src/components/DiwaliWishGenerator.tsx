import React, { useState, useEffect } from 'react';

interface WishTemplate {
  english: string;
  hindi: string;
  tag: string;
}

const WISH_TEMPLATES: WishTemplate[] = [
  {
    english: 'Wishing You A Diwali Filled With Happiness, Prosperity, Peace & Endless Smiles!',
    hindi: 'दीपावली का यह पावन पर्व आपके जीवन में सुख, समृद्धि, शांति और अपार खुशियाँ लेकर आए।',
    tag: 'Heartfelt',
  },
  {
    english: 'May the radiant divine light of millions of diyas illuminate your path to greatness, wisdom, and success.',
    hindi: 'दीपों का दिव्य प्रकाश आपके जीवन के हर मार्ग को ज्ञान, वैभव और सफलता से आलोकित करे।',
    tag: 'Spiritual',
  },
  {
    english: 'May Goddess Lakshmi bestow boundless wealth, and Lord Ganesha bless you with health, wisdom, and victory in every dream.',
    hindi: 'माँ लक्ष्मी की असीम कृपा और भगवान गणेश का मंगलमय आशीर्वाद सदैव आपके परिवार पर बना रहे।',
    tag: 'Prosperity',
  },
  {
    english: 'Sparkles in the sky, laughter in our hearts, and sweetness on our lips. Happy Diwali to you and your lovely family!',
    hindi: 'आकाश में आतिशबाज़ी, मन में उल्लास, और जीवन में मिठास। आप सभी को सपरिवार मंगलमय दीपोत्सव!',
    tag: 'Family',
  },
  {
    english: 'Just as the earthen diya conquers the deepest darkness, may your courage conquer all obstacles and shine eternally bright.',
    hindi: 'मिट्टी के दीपक की भाँति आपका साहस हर अंधकार को चीरकर सदैव जगमगाता रहे। शुभ दीपावली!',
    tag: 'Inspirational',
  },
  {
    english: 'May the supreme festival of lights bring triumph of good over evil, purity of thought, and boundless joy to your home.',
    hindi: 'यह पावन दीपोत्सव असत्य पर सत्य की विजय, विचारों की पवित्रता और आपके आँगन में खुशियों की वर्षा लाए।',
    tag: 'Divine Grace',
  },
  {
    english: 'Light a diya of hope, burn the crackers of sorrow, and shower sweets of love. Wishing you a truly blissful Diwali!',
    hindi: 'आशा का एक दीप जलाएं, दुखों का नाश करें और प्रेम की मिठास बिखेरें। आप सभी को मंगलमयी दीपावली!',
    tag: 'Joy & Love',
  },
  {
    english: 'May your business, career, and household blossom like the auspicious lotus under the shower of divine blessings this Diwali.',
    hindi: 'इस पावन दीपावली पर आपका व्यापार, कार्यक्षेत्र और परिवार दिव्य आशीर्वाद से कमल पुष्प की भाँति प्रफुल्लित रहे।',
    tag: 'Success & Wealth',
  },
  {
    english: 'May radiant health, unbroken harmony, and joyful togetherness illuminate every corner of your heart and home forever.',
    hindi: 'उत्तम स्वास्थ्य, अटूट सद्भाव और प्रेममयी एकजुटता आपके हृदय और घर के हर कोने को सदा आलोकित रखे।',
    tag: 'Harmony',
  },
  {
    english: 'Let the melody of temple bells, the fragrance of incense, and glowing golden diyas awaken sacred peace in your life.',
    hindi: 'मंदिर के घंटों की मधुर गूंज, धूप-दीप की सुगंध और स्वर्णिम दीप आपके जीवन में अखंड शांति का संचार करें।',
    tag: 'Eternal Peace',
  },
];

export const DiwaliWishGenerator: React.FC = () => {
  const [wishIndex, setWishIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Automatically cycle through wishes smoothly every 5.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setWishIndex((prev) => (prev + 1) % WISH_TEMPLATES.length);
        setIsTransitioning(false);
      }, 450); // smooth fade transition timing
    }, 5500);

    return () => clearInterval(timer);
  }, []);

  const currentWish = WISH_TEMPLATES[wishIndex];

  return (
    <section id="wishes" className="py-8 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
      {/* Subtle Auspicious Tag */}
      <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-black/40 border border-amber-500/25 backdrop-blur-md text-[10px] sm:text-xs text-amber-300 uppercase tracking-wider sm:tracking-widest mb-3 sm:mb-4 max-w-[95%]">
        <span>🪔</span>
        <span className="truncate">दीपावली पावन शुभकामना · Diwali Blessings ({wishIndex + 1}/{WISH_TEMPLATES.length})</span>
        <span>🪔</span>
      </div>

      {/* Floating Ethereal Greeting (100% Transparent, Animated Shifting Colors) */}
      <div className="relative py-4 sm:py-6 px-2 sm:px-8">
        {/* Animated Main English Wish with Continuous Automatic Color Shifting */}
        <blockquote
          className={`text-xl xs:text-2xl sm:text-3xl md:text-4xl font-festive leading-relaxed tracking-wide transition-all duration-500 drop-shadow-xl animate-festive-text ${
            isTransitioning ? 'opacity-0 scale-98 translate-y-1' : 'opacity-100 scale-100 translate-y-0'
          }`}
        >
          "{currentWish.english}"
        </blockquote>

        {/* Animated Hindi Wish with Matching Continuous Color Shifting */}
        <p
          className={`text-sm sm:text-lg md:text-xl font-body italic mt-3 sm:mt-4 max-w-2xl mx-auto leading-relaxed transition-all duration-500 animate-festive-subtext ${
            isTransitioning ? 'opacity-0 scale-98' : 'opacity-100 scale-100'
          }`}
        >
          {currentWish.hindi}
        </p>

        {/* Delicate Golden Lotus Divider */}
        <div className="flex items-center justify-center gap-3 my-4 sm:my-6 opacity-60">
          <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-amber-400" />
          <span className="text-amber-400 text-xs sm:text-sm animate-pulse">🌸</span>
          <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-amber-400" />
        </div>

        {/* Sleek Minimal Auto-Advancing Wish Indicators (Replaces All Buttons) */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-1">
          {WISH_TEMPLATES.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 sm:h-1.5 rounded-full transition-all duration-500 ${
                idx === wishIndex
                  ? 'w-5 sm:w-7 bg-gradient-to-r from-amber-400 to-amber-200 shadow-xs shadow-amber-400/50'
                  : 'w-1 sm:w-1.5 bg-amber-500/20'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
