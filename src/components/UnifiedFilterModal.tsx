'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, SlidersHorizontal, RotateCcw, Tv, Film, Calendar, Sparkles } from 'lucide-react';
import { drawerTransition, tapScale } from '@/tokens/motion';
import { COMMON_GENRES } from '@/components/GenreFilterModal';
import { DECADE_OPTIONS } from '@/components/DecadeFilterModal';

interface UnifiedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlyStreamingNow: boolean;
  onToggleStreamingNow: () => void;
  selectedGenres: string[];
  onToggleGenre: (genre: string) => void;
  selectedDecades: string[];
  onToggleDecade: (decadeId: string) => void;
  onClearAll: () => void;
  matchingCount?: number;
}

export function UnifiedFilterModal({
  isOpen,
  onClose,
  onlyStreamingNow,
  onToggleStreamingNow,
  selectedGenres,
  onToggleGenre,
  selectedDecades,
  onToggleDecade,
  onClearAll,
  matchingCount,
}: UnifiedFilterModalProps) {
  if (!isOpen) return null;

  const totalActiveCount =
    selectedGenres.length + selectedDecades.length + (onlyStreamingNow ? 1 : 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Bottom Sheet on Mobile, Centered Modal on Tablet/Desktop */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={drawerTransition}
          className="relative w-full max-w-lg bg-[#121418] border border-white/[0.09] shadow-[0_24px_64px_rgba(0,0,0,0.85)] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#0E1013] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/[0.06] text-white border border-white/[0.08]">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#F3F4F6] tracking-tight">
                  Filters
                </h3>
                <span className="text-[11px] text-[#8E93A0]">
                  {totalActiveCount === 0
                    ? 'No filters applied'
                    : `${totalActiveCount} active filter${totalActiveCount > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {totalActiveCount > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="px-2.5 py-1 rounded-lg text-xs text-[#8E93A0] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3 h-3 shrink-0" />
                  <span className="whitespace-nowrap">Reset all</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#8E93A0] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Filter Sections */}
          <div className="p-5 overflow-y-auto space-y-6 scrollbar-none flex-1">
            {/* Section 1: Availability / Streaming */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-white tracking-tight uppercase tracking-wider text-[11px] text-[#8E93A0]">
                  Availability
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleStreamingNow}
                className={`w-full px-4 py-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                  onlyStreamingNow
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#181A20] border-white/[0.06] text-[#D1D5DB] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      onlyStreamingNow
                        ? 'bg-emerald-500 border-emerald-400 text-black'
                        : 'border-white/20 bg-white/[0.04]'
                    }`}
                  >
                    {onlyStreamingNow && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">Streaming Now</div>
                    <div className="text-[11px] text-[#8E93A0]">
                      Only show titles included in my subscriptions
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Section 2: Genres Multi-Select */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E93A0]">
                  Genres {selectedGenres.length > 0 && `(${selectedGenres.length})`}
                </span>
                {selectedGenres.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      selectedGenres.forEach((g) => onToggleGenre(g));
                    }}
                    className="text-[11px] text-[#8E93A0] hover:text-white transition-colors"
                  >
                    Clear genres
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_GENRES.map((genre) => {
                  const isSelected = selectedGenres.includes(genre);
                  return (
                    <motion.button
                      key={genre}
                      type="button"
                      whileTap={tapScale}
                      onClick={() => onToggleGenre(genre)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-white text-black font-semibold border-white shadow-sm'
                          : 'bg-[#181A20] text-[#D1D5DB] border-white/[0.06] hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[2.5] shrink-0" />}
                      <span className="whitespace-nowrap">{genre}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Decades / Era */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E93A0]">
                  Release Era {selectedDecades.length > 0 && `(${selectedDecades.length})`}
                </span>
                {selectedDecades.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      selectedDecades.forEach((d) => onToggleDecade(d));
                    }}
                    className="text-[11px] text-[#8E93A0] hover:text-white transition-colors"
                  >
                    Clear decades
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                {DECADE_OPTIONS.map((dec) => {
                  const isSelected = selectedDecades.includes(dec.id);
                  return (
                    <button
                      key={dec.id}
                      type="button"
                      onClick={() => onToggleDecade(dec.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-sm'
                          : 'bg-[#181A20] text-[#D1D5DB] border-white/[0.06] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{dec.label}</span>
                        {isSelected && <Check className="w-3 h-3 stroke-[2.5] text-amber-400" />}
                      </div>
                      <span className="text-[10px] text-[#8E93A0] block mt-0.5">
                        {dec.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/[0.08] bg-[#0E1013] flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-[#F3F4F6] transition-colors cursor-pointer shadow-sm text-center whitespace-nowrap"
            >
              <span className="whitespace-nowrap">
                {typeof matchingCount === 'number'
                  ? `Show ${matchingCount} Title${matchingCount === 1 ? '' : 's'}`
                  : 'Apply Filters'}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
