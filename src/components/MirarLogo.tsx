'use client';

import React from 'react';

interface MirarLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function MirarLogo({ size = 'md', showText = true, className = '' }: MirarLogoProps) {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-sm tracking-tight',
    md: 'text-base tracking-tight',
    lg: 'text-xl tracking-tight',
    xl: 'text-3xl tracking-tight',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Quirky & Fun Mirar Mascot / Eyewear Icon */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_10px_rgba(239,68,68,0.25)]"
        >
          {/* Quirky Outer Cinema Frame with bridge */}
          <rect
            x="3"
            y="11"
            width="42"
            height="26"
            rx="13"
            fill="#121318"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="2"
          />

          {/* Left Eye (Cyan Cinema Lens) */}
          <circle cx="16" cy="24" r="9" fill="#0E2A38" stroke="#06B6D4" strokeWidth="2.5" />
          {/* Left Pupil (Playfully looking slightly upward/forward) */}
          <circle cx="17.5" cy="22.5" r="4.5" fill="#F8FAFC" />
          <circle cx="19" cy="21" r="1.8" fill="#06B6D4" />
          {/* Cute highlight sparkle */}
          <circle cx="15.5" cy="20.5" r="1.2" fill="#FFFFFF" />

          {/* Quirky Bridge Line */}
          <path
            d="M23 23C24 21.5 24 21.5 25 23"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Right Eye (Playful Coral / Magenta Cinema Lens - Slightly tilted/quirky) */}
          <circle cx="32" cy="24" r="9" fill="#38101E" stroke="#F43F5E" strokeWidth="2.5" />
          {/* Right Pupil (Wide & curious) */}
          <circle cx="30.5" cy="22.5" r="4.5" fill="#F8FAFC" />
          <circle cx="29" cy="21" r="1.8" fill="#F43F5E" />
          {/* Cute highlight sparkle */}
          <circle cx="32.5" cy="20.5" r="1.2" fill="#FFFFFF" />

          {/* Cheeky little popcorn grin or wink arc underneath */}
          <path
            d="M20 31.5C22.5 33.5 25.5 33.5 28 31.5"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex items-baseline">
          <span className={`font-black font-sans ${textSizes[size]} text-white tracking-wider lowercase`}>
            mirar
          </span>
          {/* Playful dot on the 'r' or badge */}
          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#06B6D4] to-[#F43F5E] ml-0.5 inline-block animate-pulse" />
        </div>
      )}
    </div>
  );
}
