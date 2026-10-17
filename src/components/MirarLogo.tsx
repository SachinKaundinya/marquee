'use client';

import React from 'react';

interface MirarLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function MirarLogo({ size = 'md', showText = true, className = '' }: MirarLogoProps) {
  const iconSizes = {
    sm: 'h-6 w-9',
    md: 'h-8 w-12',
    lg: 'h-10 w-[58px]',
    xl: 'h-14 w-[82px]',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl sm:text-[26px]',
    lg: 'text-3xl sm:text-4xl',
    xl: 'text-5xl sm:text-6xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Precision Oval VR Goggle Visor Logomark */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 206 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_14px_rgba(0,242,254,0.3)]"
        >
          <defs>
            {/* Bezel Metallic Rim Gradient (Precision Machined Titanium) */}
            <linearGradient id="bezelRim" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4E5568" />
              <stop offset="50%" stopColor="#242833" />
              <stop offset="100%" stopColor="#14171F" />
            </linearGradient>

            {/* Visor Faceplate Dark Glass Gradient */}
            <linearGradient id="visorGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#161820" />
              <stop offset="100%" stopColor="#0B0C10" />
            </linearGradient>

            {/* Cyan Lens Gradient */}
            <linearGradient id="cyanLens" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3BF8FF" />
              <stop offset="100%" stopColor="#00AEEF" />
            </linearGradient>

            {/* Magenta Lens Gradient */}
            <linearGradient id="magentaLens" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF3366" />
              <stop offset="100%" stopColor="#E80040" />
            </linearGradient>

            {/* Ring Specular Glare */}
            <linearGradient id="ringShine" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
              <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>

            <filter id="visorGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Bezel / Goggle Frame (Elliptical / Stadium shape) */}
          <rect
            x="1"
            y="1"
            width="204"
            height="138"
            rx="69"
            fill="#1A1D26"
            stroke="url(#bezelRim)"
            strokeWidth="2.5"
          />

          {/* Inner Recessed Visor Chamfer */}
          <rect
            x="5"
            y="5"
            width="196"
            height="130"
            rx="65"
            fill="url(#visorGlass)"
            stroke="#050608"
            strokeWidth="2"
          />

          {/* Dual Internal Optical Lenses */}
          <g>
            {/* LEFT LENS: CYAN */}
            <g transform="translate(62, 70)">
              <circle cx="0" cy="0" r="43" stroke="url(#cyanLens)" strokeWidth="12" fill="#00E5FF" fillOpacity="0.04" />
              <circle cx="0" cy="0" r="25" stroke="#3BF8FF" strokeWidth="1.2" strokeOpacity="0.3" strokeDasharray="2 3" />
              <circle cx="0" cy="0" r="3.5" fill="#3BF8FF" fillOpacity="0.85" />
              <circle cx="0" cy="0" r="42" stroke="url(#ringShine)" strokeWidth="10" fill="none" />
            </g>

            {/* RIGHT LENS: MAGENTA */}
            <g transform="translate(144, 70)">
              <circle cx="0" cy="0" r="43" stroke="url(#magentaLens)" strokeWidth="12" fill="#FF2A55" fillOpacity="0.04" />
              <circle cx="0" cy="0" r="25" stroke="#FF3366" strokeWidth="1.2" strokeOpacity="0.3" strokeDasharray="2 3" />
              <circle cx="0" cy="0" r="3.5" fill="#FF3366" fillOpacity="0.85" />
              <circle cx="0" cy="0" r="42" stroke="url(#ringShine)" strokeWidth="10" fill="none" />
            </g>

            {/* ADDITIVE OVERLAP NEXUS */}
            <g style={{ mixBlendMode: 'screen' }}>
              <path
                d="M 103,40.5 A 43,43 0 0,1 127,70 A 43,43 0 0,1 103,99.5 A 43,43 0 0,1 79,70 A 43,43 0 0,1 103,40.5 Z"
                fill="#B44DFF"
                fillOpacity="0.35"
              />
              <path
                d="M 103,40.5 A 43,43 0 0,1 127,70 A 43,43 0 0,1 103,99.5 A 43,43 0 0,1 79,70 A 43,43 0 0,1 103,40.5 Z"
                stroke="#FFFFFF"
                strokeWidth="1.6"
                strokeOpacity="0.5"
              />
            </g>

            {/* Luminous Glowing Core */}
            <circle cx="103" cy="70" r="6" fill="#FFFFFF" filter="url(#visorGlow)" />
            <circle cx="103" cy="70" r="2.5" fill="#FFFFFF" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex items-baseline leading-none">
          <span className={`font-black font-sans ${textSizes[size]} text-white tracking-[-0.03em] lowercase flex items-baseline leading-none`}>
            <span>m</span>
            {/* The letter 'i' with natural dot position & radiant glowing aura */}
            <span className="inline-flex flex-col items-center justify-end mx-[0.02em] leading-none self-baseline">
              <span className="relative flex items-center justify-center mb-[0.08em] pointer-events-none select-none">
                {/* Ethereal Ambient Radial Glow Aura (Vibrant Neon Glow) */}
                <span
                  className="absolute -inset-2.5 rounded-full pointer-events-none opacity-90 animate-pulse"
                  style={{
                    background: 'radial-gradient(circle, rgba(0,242,254,0.85) 0%, rgba(255,42,84,0.85) 50%, rgba(0,0,0,0) 80%)',
                    filter: 'blur(5px)',
                  }}
                />
                {/* Left Cyan Circle */}
                <span className="w-[0.34em] h-[0.34em] rounded-full bg-[#00F2FE] -mr-[0.11em] shadow-[0_0_10px_#00F2FE,0_0_20px_rgba(0,242,254,0.9),0_0_30px_rgba(0,242,254,0.6)]" />
                {/* Right Magenta Circle */}
                <span className="w-[0.34em] h-[0.34em] rounded-full bg-[#FF2A54] -ml-[0.11em] shadow-[0_0_10px_#FF2A54,0_0_20px_rgba(255,42,84,0.9),0_0_30px_rgba(255,42,84,0.6)]" />
                {/* Glowing White Intersection Core */}
                <span className="absolute w-[0.20em] h-[0.20em] rounded-full bg-white shadow-[0_0_8px_#ffffff,0_0_16px_#ffffff]" />
              </span>
              <span className="leading-none">ı</span>
            </span>
            <span>rar</span>
          </span>
        </div>
      )}
    </div>
  );
}
