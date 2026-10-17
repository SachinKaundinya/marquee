'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Filter, RotateCcw } from 'lucide-react';
import { drawerTransition, tapScale } from '@/tokens/motion';

export const COMMON_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Biography',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'Film-Noir',
  'Game-Show',
  'History',
  'Horror',
  'Music',
  'Musical',
  'Mystery',
  'News',
  'Reality-TV',
  'Romance',
  'Sci-Fi',
  'Short',
  'Sport',
  'Talk-Show',
  'Thriller',
  'War',
  'Western',
];

interface GenreFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGenres: string[];
  onToggleGenre: (genre: string) => void;
  onClearGenres: () => void;
}

export function GenreFilterModal({
  isOpen,
  onClose,
  selectedGenres,
  onToggleGenre,
  onClearGenres,
}: GenreFilterModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={drawerTransition}
          className="relative w-full max-w-md bg-[#14161B] border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.06)] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#101216]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-white/[0.04] text-white border border-white/[0.08]">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#F3F4F6] tracking-tight">
                  Filter by Genre
                </h3>
                <span className="text-[11px] text-[#8E93A0]">
                  {selectedGenres.length === 0
                    ? 'All genres showing in For You'
                    : `${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''} selected`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedGenres.length > 0 && (
                <button
                  type="button"
                  onClick={onClearGenres}
                  className="px-2 py-1 rounded text-xs text-[#8E93A0] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#8E93A0] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Genre Chips Grid */}
          <div className="p-5 overflow-y-auto max-h-[60vh]">
            <p className="text-xs text-[#8E93A0] mb-3.5 leading-relaxed">
              Tap genres to single or multi-select. Your feed will automatically filter to titles matching these genres.
            </p>

            <div className="flex flex-wrap gap-2">
              {COMMON_GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => onToggleGenre(genre)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black border-white font-semibold shadow-sm scale-[1.02]'
                        : 'bg-white/[0.02] text-[#8E93A0] border-white/[0.08] hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    <span>{genre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Done Action */}
          <div className="p-4 border-t border-white/[0.08] bg-[#101216] flex items-center justify-between gap-3">
            <span className="text-xs text-[#8E93A0] tabular-nums">
              {selectedGenres.length === 0
                ? 'Showing all genres'
                : `${selectedGenres.length} active filter${selectedGenres.length > 1 ? 's' : ''}`}
            </span>
            <motion.button
              whileTap={tapScale}
              onClick={onClose}
              className="py-2 px-5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-[#F3F4F6] transition-colors cursor-pointer shadow-sm"
            >
              Done
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
