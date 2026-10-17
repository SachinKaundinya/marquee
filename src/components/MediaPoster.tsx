'use client';

import React, { useState } from 'react';
import { Film, Tv } from 'lucide-react';
import { MediaType } from '@/types/media';

interface MediaPosterProps {
  src?: string;
  title: string;
  mediaType?: MediaType;
  year?: number;
  className?: string;
  priority?: boolean;
}

export function MediaPoster({
  src,
  title,
  mediaType = 'movie',
  year,
  className = '',
}: MediaPosterProps) {
  const [hasError, setHasError] = useState(false);

  // Fallback cinematic artwork generator with subtle tone variation
  const getPosterAccent = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 18%, 14%)`;
  };

  const backgroundColor = getPosterAccent(title);

  return (
    <div
      className={`relative aspect-[2/3] w-full rounded-md overflow-hidden bg-[#14161B] border border-white/[0.08] select-none ${className}`}
    >
      {!hasError && src ? (
        <img
          src={src}
          alt={title}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover brightness-[0.96] transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
      ) : (
        /* Stylized Cinematic Fallback Poster */
        <div
          className="w-full h-full p-3 flex flex-col justify-between relative overflow-hidden"
          style={{ backgroundColor }}
        >
          {/* Subtle geometric lighting */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/[0.04] blur-2xl pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

          {/* Top icon */}
          <div className="relative z-10 flex items-center justify-between text-[#8E93A0]">
            {mediaType === 'tv' ? (
              <Tv className="w-4 h-4 stroke-[1.5]" />
            ) : (
              <Film className="w-4 h-4 stroke-[1.5]" />
            )}
            {year && (
              <span className="text-[10px] font-mono tabular-nums text-[#8E93A0]">
                {year}
              </span>
            )}
          </div>

          {/* Bottom Title */}
          <div className="relative z-10">
            <div className="text-[10px] uppercase tracking-widest text-[#8E93A0] mb-0.5 font-medium">
              {mediaType === 'tv' ? 'Series' : 'Feature'}
            </div>
            <h5 className="text-xs font-semibold text-[#F3F4F6] line-clamp-3 leading-tight tracking-tight">
              {title}
            </h5>
          </div>
        </div>
      )}
    </div>
  );
}
