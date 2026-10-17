'use client';

import React from 'react';

interface MirarLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function MirarLogo({ size = 'md', showText = true, className = '' }: MirarLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14 sm:w-16 sm:h-16',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl sm:text-[26px]',
    lg: 'text-3xl sm:text-4xl',
    xl: 'text-5xl sm:text-6xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Professional Cinema Optic Lens Mark */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_12px_rgba(0,242,254,0.25)]"
        >
          <defs>
            <linearGradient id="lensFrameGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#181B22" />
              <stop offset="1" stopColor="#0B0D12" />
            </linearGradient>
            <linearGradient id="lensBorderGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="rgba(255, 255, 255, 0.22)" />
              <stop offset="1" stopColor="rgba(255, 255, 255, 0.04)" />
            </linearGradient>
            <filter id="lensApertureGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Dark Metallic Lens Chassis */}
          <rect
            x="1"
            y="1"
            width="42"
            height="42"
            rx="11"
            fill="url(#lensFrameGrad)"
            stroke="url(#lensBorderGrad)"
            strokeWidth="1.5"
          />

          {/* Precision Optic Calibration Ring */}
          <circle
            cx="22"
            cy="22"
            r="16"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* Horizontal Anamorphic Streak */}
          <path
            d="M7 22H37"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1"
            strokeLinecap="round"
          />

          {/* Left Cyan Aperture Ring */}
          <circle
            cx="18"
            cy="22"
            r="7.5"
            stroke="#00F2FE"
            strokeWidth="2.2"
            fill="#00F2FE"
            fillOpacity="0.12"
            filter="url(#lensApertureGlow)"
          />

          {/* Right Crimson Aperture Ring */}
          <circle
            cx="26"
            cy="22"
            r="7.5"
            stroke="#FF2A54"
            strokeWidth="2.2"
            fill="#FF2A54"
            fillOpacity="0.12"
            filter="url(#lensApertureGlow)"
          />

          {/* Glowing Luminous Center Focal Point */}
          <circle
            cx="22"
            cy="22"
            r="3"
            fill="#FFFFFF"
            filter="url(#lensApertureGlow)"
          />
          <circle
            cx="22"
            cy="22"
            r="1.4"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex items-baseline leading-none">
          <span className={`font-extrabold font-sans ${textSizes[size]} text-white tracking-[-0.03em] lowercase flex items-baseline`}>
            <span>m</span>
            {/* The letter 'i' with chromatic glowing dot */}
            <span className="relative inline-flex flex-col items-center justify-end mx-[0.015em]">
              <span
                className="absolute -top-[0.38em] left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none select-none"
                aria-hidden="true"
              >
                <span className="relative flex items-center justify-center">
                  {/* Left Cyan Circle */}
                  <span className="w-[0.35em] h-[0.35em] rounded-full bg-[#00F2FE] -mr-[0.11em] shadow-[0_0_8px_#00F2FE,0_0_16px_rgba(0,242,254,0.9),0_0_24px_rgba(0,242,254,0.6)]" />
                  {/* Right Crimson Circle */}
                  <span className="w-[0.35em] h-[0.35em] rounded-full bg-[#FF2A54] -ml-[0.11em] shadow-[0_0_8px_#FF2A54,0_0_16px_rgba(255,42,84,0.9),0_0_24px_rgba(255,42,84,0.6)]" />
                  {/* Glowing White Intersection Core */}
                  <span className="absolute w-[0.22em] h-[0.22em] rounded-full bg-white shadow-[0_0_6px_#ffffff,0_0_12px_#ffffff]" />
                </span>
              </span>
              <span>ı</span>
            </span>
            <span>rar</span>
          </span>
        </div>
      )}
    </div>
  );
}
