import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

interface SplashScreenProps {
  brandName?: string;
  brandAccent?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  brandName = 'Tafsiri',
  brandAccent = 'Radiolojia',
  tagline = 'Elewa Ripoti Yako ya Radiolojia • Understand Your Radiology Report',
  primaryColor = '#1EB53A',
  secondaryColor = '#00A3DD',
  accentColor = '#FCD116',
  onFinish,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Hold splash screen for 1.8s
    const holdTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1800);

    // After fadeout completes (0.5s duration), unmount / notify
    const finishTimer = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) {
        onFinish();
      }
    }, 2300);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div
      id="app-splash-screen"
      aria-hidden="true"
      className={`fixed inset-0 z-100 flex flex-col items-center justify-center bg-white select-none transition-opacity duration-500 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#ffffff',
      }}
    >
      {/* Background ambient decorative glow */}
      <div
        className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-20 pointer-events-none animate-pulse"
        style={{
          background: `radial-gradient(circle, ${primaryColor} 0%, ${secondaryColor} 50%, transparent 70%)`,
        }}
      />

      <div className="relative flex flex-col items-center justify-center p-6 text-center z-10">
        {/* Animated Logo Container */}
        <div className="relative splash-logo-enter flex items-center justify-center mb-6">
          {/* Pulsing glow ring beneath the logo */}
          <div
            className="absolute inset-0 -m-4 rounded-3xl opacity-40 blur-lg animate-pulse"
            style={{
              background: `radial-gradient(circle, ${primaryColor}40 0%, ${secondaryColor}30 60%, transparent 100%)`,
            }}
          />

          {/* Centered App Logo */}
          <div className="relative transform transition-transform duration-700">
            <Logo
              size="xl"
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-xl"
            />
          </div>
        </div>

        {/* Brand Name & Title */}
        <div className="splash-text-enter space-y-2 max-w-sm sm:max-w-md mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-1.5 font-sans">
            <span>{brandName}</span>
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-sky-600"
              style={{
                backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              }}
            >
              {brandAccent}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            {tagline}
          </p>
        </div>

        {/* Sleek Minimal Loading Shimmer Bar */}
        <div className="mt-8 w-40 sm:w-48 h-1 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
          <div
            className="absolute top-0 bottom-0 splash-shimmer-bar rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${primaryColor}, ${accentColor}, ${secondaryColor}, transparent)`,
            }}
          />
        </div>

        {/* Subtle Tanzania Flag Tricolor Indicator Dots */}
        <div className="mt-5 flex items-center gap-1.5 opacity-75">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#0f172a' }} />
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
        </div>
      </div>
    </div>
  );
};
