import React from 'react';

interface LogoProps {
  primaryColor?: string;
  secondaryColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  primaryColor = '#1EB53A',
  secondaryColor = '#00A3DD',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11 sm:w-12 sm:h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div
      id="app-logo"
      className={`relative inline-flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105 select-none ${sizeClasses[size]} ${className}`}
      title="Tafsiri Radiolojia - CXR Radiology Report Interpreter"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          {/* Document Gradient */}
          <linearGradient id="docGrad" x1="10" y1="8" x2="68" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F1F5F9" />
          </linearGradient>

          {/* CXR Radiograph Dark Viewport */}
          <radialGradient id="cxrGlow" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#0a2e3a" />
            <stop offset="70%" stopColor="#04131a" />
            <stop offset="100%" stopColor="#02090d" />
          </radialGradient>

          {/* Lens Rim Gradient */}
          <linearGradient id="lensRimGrad" x1="30" y1="20" x2="85" y2="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>

          {/* Handle Gradient */}
          <linearGradient id="handleGrad" x1="72" y1="68" x2="94" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Lung Air Field Glow */}
          <linearGradient id="lungField" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.15" />
          </linearGradient>

          {/* Glass reflection */}
          <linearGradient id="glassReflect" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Clip path for CXR within the magnifying glass lens */}
          <clipPath id="lensClip">
            <circle cx="58" cy="46" r="23.5" />
          </clipPath>
        </defs>

        {/* 1. DOCUMENT (Medical Report Paper) */}
        {/* Soft shadow */}
        <rect x="8" y="10" width="58" height="78" rx="7" fill="#000000" fillOpacity="0.08" />
        
        {/* Main Document Body */}
        <rect
          x="7"
          y="8"
          width="58"
          height="78"
          rx="7"
          fill="url(#docGrad)"
          stroke="#0F172A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Top-Right Page Fold / Header Accent */}
        <path
          d="M7 16 C7 11.58 10.58 8 15 8 H57 C61.42 8 65 11.58 65 16 V22 H7 V16 Z"
          fill="#E2E8F0"
        />
        {/* Hospital cross badge on document top left */}
        <path
          d="M16 12 H18 V18 H16 Z M13 14 H21 V16 H13 Z"
          fill={primaryColor}
        />

        {/* Report Text Lines */}
        <rect x="25" y="13" width="28" height="3" rx="1.5" fill="#64748B" />
        <rect x="14" y="27" width="24" height="2.5" rx="1.25" fill="#94A3B8" />
        <rect x="14" y="34" width="20" height="2.5" rx="1.25" fill="#CBD5E1" />
        <rect x="14" y="41" width="18" height="2.5" rx="1.25" fill="#CBD5E1" />
        <rect x="14" y="48" width="16" height="2.5" rx="1.25" fill="#94A3B8" />
        <rect x="14" y="55" width="20" height="2.5" rx="1.25" fill="#CBD5E1" />
        <rect x="14" y="62" width="26" height="2.5" rx="1.25" fill="#CBD5E1" />
        <rect x="14" y="69" width="22" height="2.5" rx="1.25" fill="#94A3B8" />
        <rect x="14" y="76" width="14" height="2.5" rx="1.25" fill="#CBD5E1" />

        {/* 2. MAGNIFYING GLASS HANDLE (underneath lens edge) */}
        <g id="lens-handle">
          {/* Handle shadow */}
          <line x1="75" y1="65" x2="94" y2="84" stroke="#000000" strokeOpacity="0.2" strokeWidth="8" strokeLinecap="round" />
          {/* Handle metal joint */}
          <line x1="73" y1="63" x2="77" y2="67" stroke="#94A3B8" strokeWidth="6" strokeLinecap="round" />
          {/* Handle stick */}
          <line
            x1="76"
            y1="66"
            x2="93"
            y2="83"
            stroke="url(#handleGrad)"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          {/* Handle highlight */}
          <line x1="77" y1="65" x2="90" y2="78" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* 3. LENS CONTENT (CHEST X-RAY / CXR) */}
        <g clipPath="url(#lensClip)" id="cxr-view">
          {/* Dark Radiograph Background */}
          <rect x="30" y="18" width="56" height="56" fill="url(#cxrGlow)" />

          {/* Subtle Radiographic Grid Lines */}
          <circle cx="58" cy="46" r="23.5" stroke="#38BDF8" strokeOpacity="0.15" strokeWidth="1" fill="none" />
          <line x1="34" y1="46" x2="82" y2="46" stroke="#38BDF8" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="58" y1="22" x2="58" y2="70" stroke="#38BDF8" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="2 2" />

          {/* CXR: Lung Fields (Left & Right Dark/Air cavities with blue-cyan glow) */}
          {/* Left Lung Field (anatomical right, viewer left) */}
          <path
            d="M55 33 C53 31 46 33 44 38 C42 43 42 53 45 57 C48 60 53 58 55 56 C55 49 55 41 55 33 Z"
            fill="url(#lungField)"
          />
          {/* Right Lung Field (anatomical left, viewer right) */}
          <path
            d="M61 33 C63 31 70 33 72 38 C74 43 74 53 71 57 C68 60 63 58 61 56 C61 49 61 41 61 33 Z"
            fill="url(#lungField)"
          />

          {/* CXR: Heart / Cardiac Silhouette */}
          <path
            d="M57 44 C57 44 54 48 54 53 C54 57 58 58 64 57 C67 56 67 52 64 48 C61 44 58 44 57 44 Z"
            fill="#FFFFFF"
            fillOpacity="0.75"
          />

          {/* CXR: Spine & Mediastinum Column (Center) */}
          <path
            d="M56.5 26 H59.5 V65 H56.5 Z"
            fill="#FFFFFF"
            fillOpacity="0.6"
          />
          {/* Vertebral disc markers */}
          <line x1="56.5" y1="30" x2="59.5" y2="30" stroke="#04131a" strokeWidth="0.8" />
          <line x1="56.5" y1="34" x2="59.5" y2="34" stroke="#04131a" strokeWidth="0.8" />
          <line x1="56.5" y1="38" x2="59.5" y2="38" stroke="#04131a" strokeWidth="0.8" />
          <line x1="56.5" y1="42" x2="59.5" y2="42" stroke="#04131a" strokeWidth="0.8" />
          <line x1="56.5" y1="46" x2="59.5" y2="46" stroke="#04131a" strokeWidth="0.8" />
          <line x1="56.5" y1="50" x2="59.5" y2="50" stroke="#04131a" strokeWidth="0.8" />
          <line x1="56.5" y1="54" x2="59.5" y2="54" stroke="#04131a" strokeWidth="0.8" />

          {/* CXR: Clavicles (Collarbones) */}
          <path
            d="M44 32 C48 31 54 33 57 34"
            stroke="#FFFFFF"
            strokeOpacity="0.9"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M72 32 C68 31 62 33 59 34"
            stroke="#FFFFFF"
            strokeOpacity="0.9"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* CXR: Rib Arches (Bones) */}
          {/* Left Ribs */}
          <path d="M56 36 C49 35 44 38 43 41" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M56 40 C48 39 43 43 42 46" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M56 45 C47 44 43 48 43 51" stroke="#FFFFFF" strokeOpacity="0.75" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M56 50 C48 50 44 53 45 56" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M56 55 C50 55 47 57 48 59" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" fill="none" />

          {/* Right Ribs */}
          <path d="M60 36 C67 35 72 38 73 41" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M60 40 C68 39 73 43 74 46" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M60 45 C69 44 73 48 73 51" stroke="#FFFFFF" strokeOpacity="0.75" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M60 50 C68 50 72 53 71 56" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M60 55 C66 55 69 57 68 59" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" fill="none" />

          {/* CXR: Diaphragm Dome Curves (Bottom of lungs) */}
          <path d="M43 58 C47 55 52 56 56 58" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M60 58 C64 56 69 55 73 58" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="1.5" strokeLinecap="round" fill="none" />

          {/* Diagnostic "CXR" Watermark Badge inside view */}
          <rect x="42" y="24" width="13" height="5.5" rx="1.5" fill="#1EB53A" fillOpacity="0.85" />
          <text x="44" y="28.2" fill="#FFFFFF" fontSize="3.8" fontWeight="bold" fontFamily="sans-serif">
            CXR
          </text>

          {/* Glass Reflection Arc */}
          <path
            d="M39 31 A23.5 23.5 0 0 1 77 31 C70 24 46 24 39 31 Z"
            fill="url(#glassReflect)"
          />
        </g>

        {/* 4. MAGNIFYING GLASS RIM & BEZEL */}
        {/* Outer Ring */}
        <circle
          cx="58"
          cy="46"
          r="24"
          stroke="#0F172A"
          strokeWidth="3.2"
          fill="none"
        />
        {/* Inner Colored Accent Ring */}
        <circle
          cx="58"
          cy="46"
          r="23"
          stroke="url(#lensRimGrad)"
          strokeWidth="1.8"
          fill="none"
        />

        {/* Lens Glass Highlight Glint (Top left of lens) */}
        <path
          d="M42 34 A20 20 0 0 1 54 27"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />
        <circle cx="39" cy="38" r="1.2" fill="#FFFFFF" fillOpacity="0.8" />
      </svg>
    </div>
  );
};
