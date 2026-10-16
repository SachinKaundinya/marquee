'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number; // 0 to 5
  onChange?: (val: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  showLabel = true,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    if (readOnly || !onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    const computedVal = isHalf ? starIndex - 0.5 : starIndex;
    setHoverValue(computedVal);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    if (readOnly || !onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    const computedVal = isHalf ? starIndex - 0.5 : starIndex;
    onChange(computedVal);
  };

  return (
    <div className="inline-flex items-center gap-2 select-none">
      <div
        className={`flex items-center gap-1 ${readOnly ? '' : 'cursor-pointer'}`}
        onMouseLeave={() => !readOnly && setHoverValue(null)}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const filled = displayValue >= starIndex;
          const half = !filled && displayValue >= starIndex - 0.5;

          return (
            <div
              key={starIndex}
              className="relative p-0.5 group active:scale-95 transition-transform duration-75"
              onMouseMove={(e) => handleMouseMove(e, starIndex)}
              onClick={(e) => handleClick(e, starIndex)}
            >
              {/* Background Empty Star */}
              <Star
                className={`${starSizes[size]} text-white/15 stroke-[1.5] transition-colors duration-100`}
              />

              {/* Half Star Fill */}
              {half && (
                <div className="absolute inset-y-0.5 left-0.5 w-[50%] overflow-hidden pointer-events-none">
                  <Star
                    className={`${starSizes[size]} fill-[#E5A93C] text-[#E5A93C] stroke-none drop-shadow-[0_1px_4px_rgba(229,169,60,0.25)]`}
                  />
                </div>
              )}

              {/* Full Star Fill */}
              {filled && (
                <div className="absolute inset-y-0.5 left-0.5 overflow-hidden pointer-events-none">
                  <Star
                    className={`${starSizes[size]} fill-[#E5A93C] text-[#E5A93C] stroke-none drop-shadow-[0_1px_4px_rgba(229,169,60,0.25)]`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showLabel && (
        <span className="text-xs text-[#8E93A0] tabular-nums font-medium tracking-tight">
          {displayValue > 0 ? `(${displayValue.toFixed(1)} / 5.0)` : '(Unrated)'}
        </span>
      )}
    </div>
  );
}
