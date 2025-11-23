import React, { useEffect, useState } from 'react';

interface HeroSectionProps {
  onExploreClick: () => void;
  onTraceClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick, onTraceClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const quotes = [
    { line1: 'From Soil', line2: 'to Soul' },
    { line1: 'From Farm', line2: 'to Future' },
    { line1: 'From Earth', line2: 'to Excellence' },
    { line1: 'From Seed', line2: 'to Success' },
    { line1: 'From Hills', line2: 'to Heart' },
    { line1: 'From Nature', line2: 'to Nourishment' },
    { line1: 'From Trust', line2: 'to Taste' },
    { line1: 'From Origin', line2: 'to Organic' }
  ];

  const heroImages = [
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=2000&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=80'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const currentQuote = quotes[currentQuoteIndex];
    const fullText = `${currentQuote.line1}\n${currentQuote.line2}`;

    if (isTyping) {
      if (displayText.length < fullText.length) {
        const timeout = setTimeout(() => {
          setDisplayText(fullText.slice(0, displayText.length + 1));
        }, 100);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2500);
        return () => clearTimeout(timeout);
      }
    } else {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 75);
        return () => clearTimeout(timeout);
      } else {
        setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
        setIsTyping(true);
      }
    }
  }, [displayText, isTyping, currentQuoteIndex]);

  return (
    <section className="relative min-h-screen flex items-start justify-center overflow-hidden pt-16 sm:pt-20 md:pt-24 lg:pt-28 bg-gray-900">
      <div className="absolute inset-0 z-0">
        {heroImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-2000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{
              transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`,
              transition: 'opacity 2s ease-in-out'
            }}
          >
            <img src={img} alt="Kolli Hills" className="w-full h-full object-cover scale-105 sm:scale-110" loading="eager" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/60 sm:from-black/60 sm:via-black/40 sm:to-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 sm:from-black/70 sm:to-black/20"></div>
      </div>

      <div className="absolute inset-0 z-[5] pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center pt-2 sm:pt-4 pb-8 sm:pb-12">
        <div className="mb-4 sm:mb-6 md:mb-8" style={{ animation: 'fadeIn 0.8s ease-out' }}>
          <div className="inline-block relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-cyan-400 blur-xl sm:blur-2xl opacity-30 sm:opacity-40 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl">
              <div className="bg-black/50 sm:bg-black/40 backdrop-blur-xl sm:backdrop-blur-2xl px-4 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5 rounded-xl border border-white/20">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <div className="relative flex-shrink-0">
                    <img src="/brand-logo.svg" alt="Root Verse" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg" />
                  </div>
                  <div className="text-left min-w-0">
                    <h3 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-white via-green-100 to-cyan-100 bg-clip-text text-transparent tracking-tight leading-none">
                      ROOT VERSE
                    </h3>
                    <p className="text-[9px] sm:text-xs md:text-sm text-green-300 font-semibold tracking-[0.2em] sm:tracking-[0.3em] uppercase mt-0.5 sm:mt-1">
                      Authentic & Traceable
                    </p>
                  </div>
                  <div className="ml-1 sm:ml-2 md:ml-4 pl-1 sm:pl-2 md:pl-4 border-l border-white/30 hidden xs:flex">
                    <div className="flex flex-col items-center">
                      <svg className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.51.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[8px] sm:text-[10px] md:text-xs text-white/80 font-bold uppercase tracking-wider mt-0.5 sm:mt-1">Organic</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse mr-2 flex-shrink-0"></div>
            <span className="text-white/90 text-xs sm:text-sm font-semibold tracking-wide">
              Blockchain-Powered Transparency
            </span>
          </div>
        </div>

        <h1 className="relative mb-4 sm:mb-6">
          <div className="h-32 xs:h-40 sm:h-48 md:h-56 lg:h-64 xl:h-72 flex flex-col items-center justify-center px-2 sm:px-4">
            {displayText.split('\n').map((line, index) => (
              <span
                key={index}
                className="block text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-tight tracking-tight mb-1 sm:mb-2 text-center transform hover:scale-105 transition-transform duration-500"
                style={{
                  animation: 'typeWriter 0.5s ease-out',
                  minHeight: index === 0 ? '1.1em' : '1.05em',
                  textShadow: '0 4px 8px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.1)'
                }}
              >
                {line}
                {index === displayText.split('\n').length - 1 && isTyping && (
                  <span className="inline-block w-0.5 sm:w-1 h-8 xs:h-10 sm:h-12 md:h-14 lg:h-16 xl:h-20 bg-white ml-1 sm:ml-2 animate-blink"></span>
                )}
              </span>
            ))}
            {displayText.length === 0 && (
              <span className="block text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-tight tracking-tight">
                <span className="inline-block w-0.5 sm:w-1 h-8 xs:h-10 sm:h-12 md:h-14 lg:h-16 xl:h-20 bg-white animate-blink"></span>
              </span>
            )}
          </div>
          <div className="absolute -bottom-2 sm:-bottom-4 left-1/2 transform -translate-x-1/2 w-16 sm:w-24 md:w-32 h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full"></div>
        </h1>

        <p className="text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-white mb-3 sm:mb-4 font-light tracking-wide px-2 sm:px-4" style={{ animation: 'fadeIn 1s ease-out 0.4s backwards' }}>
          Every leaf, bean, and drop tells a story
        </p>

        <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white/80 max-w-xs sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto mb-8 sm:mb-12 md:mb-14 leading-relaxed font-light px-2 sm:px-4" style={{ animation: 'fadeIn 1s ease-out 0.6s backwards' }}>
          Experience complete transparency from Kolli Hills to your home, secured on an immutable blockchain ledger
        </p>

        <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 md:gap-6 justify-center px-2 sm:px-4" style={{ animation: 'fadeIn 1s ease-out 0.8s backwards' }}>
          <button
            onClick={onExploreClick}
            className="group relative px-6 sm:px-8 md:px-10 lg:px-12 py-3.5 sm:py-4 md:py-5 lg:py-6 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-full font-bold text-sm sm:text-base md:text-lg lg:text-xl hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-500 overflow-hidden hover:scale-105 touch-manipulation active:scale-95"
          >
            <span className="relative z-10 flex items-center justify-center">
              <span className="hidden xs:inline">Explore Supply Chain</span>
              <span className="xs:hidden">Explore</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 ml-2 sm:ml-3 group-hover:translate-x-1 sm:group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </button>
          <button
            onClick={onTraceClick}
            className="group px-6 sm:px-8 md:px-10 lg:px-12 py-3.5 sm:py-4 md:py-5 lg:py-6 bg-white/10 backdrop-blur-xl text-white rounded-full font-bold text-sm sm:text-base md:text-lg lg:text-xl hover:bg-white/20 transition-all duration-500 border-2 border-white/40 hover:border-white/60 hover:shadow-2xl hover:shadow-white/20 hover:scale-105 flex items-center justify-center touch-manipulation active:scale-95"
          >
            <span className="hidden xs:inline">Trace a Product</span>
            <span className="xs:hidden">Trace</span>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 ml-2 sm:ml-3 group-hover:rotate-45 sm:group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce z-20 hidden sm:block">
        <div className="flex flex-col items-center group cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
          <div className="w-4 h-6 sm:w-5 sm:h-8 border-2 border-white/30 rounded-full flex items-start justify-center p-1 group-hover:border-white/50 transition-colors">
            <div className="w-0.5 sm:w-1 h-1.5 sm:h-2 bg-white rounded-full animate-pulse"></div>
          </div>
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white/50 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      <style>{`
        @media (min-width: 475px) {
          .xs\\:flex-row { flex-direction: row; }
          .xs\\:inline { display: inline; }
          .xs\\:hidden { display: none; }
          .xs\\:h-40 { height: 10rem; }
          .xs\\:text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
          .xs\\:h-10 { height: 2.5rem; }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: translateY(0);} }
        @keyframes typeWriter { from { opacity: 0; transform: translateY(8px) scale(0.98);} to { opacity: 1; transform: translateY(0) scale(1);} }
        @keyframes blink { 0%, 50% { opacity: 1;} 51%, 100% { opacity: 0.2; } }
        @keyframes float { 0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2;} 50% { transform: translateY(-50px) translateX(25px); opacity: 0.4; } }
        .animate-blink { animation: blink 1s ease-in-out infinite; }
        .touch-manipulation { touch-action: manipulation; }
        .duration-2000 { transition-duration: 2s; }
        @media (max-width: 768px) { button { min-height: 44px; min-width: 44px; } }
        @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; } }
      `}</style>
    </section>
  );
};

export default HeroSection;
