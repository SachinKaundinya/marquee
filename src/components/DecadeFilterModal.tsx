'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Calendar, RotateCcw } from 'lucide-react';
import { drawerTransition, tapScale } from '@/tokens/motion';

export interface DecadeOption {
  id: string;
  label: string;
  description: string;
  startYear: number;
  endYear: number;
}

export const DECADE_OPTIONS: DecadeOption[] = [
  { id: '2020s', label: '2020s', description: '2020 – Present', startYear: 2020, endYear: 2099 },
  { id: '2010s', label: '2010s', description: '2010 – 2019', startYear: 2010, endYear: 2019 },
  { id: '2000s', label: '2000s', description: '2000 – 2009', startYear: 2000, endYear: 2009 },
  { id: '1990s', label: '1990s', description: '1990 – 1999', startYear: 1990, endYear: 1999 },
  { id: '1980s', label: '1980s', description: '1980 – 1989', startYear: 1980, endYear: 1989 },
  { id: '1970s', label: '1970s', description: '1970 – 1979', startYear: 1970, endYear: 1979 },
  { id: '1960s', label: '1960s', description: '1960 – 1969', startYear: 1960, endYear: 1969 },
  { id: '1950s', label: '1950s', description: '1950 – 1959', startYear: 1950, endYear: 1959 },
  { id: 'pre-1950', label: '1940s & Earlier', description: 'Up to 1949', startYear: 1880, endYear: 1949 },
];

export function matchesDecades(releaseYear: number | undefined, selectedDecades: string[]): boolean {
  if (selectedDecades.length === 0) return true;
  if (!releaseYear) return false;
  return selectedDecades.some((decId) => {
    const opt = DECADE_OPTIONS.find((d) => d.id === decId);
    if (!opt) return false;
    return releaseYear >= opt.startYear && releaseYear <= opt.endYear;
  });
}

interface DecadeFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDecades: string[];
  onToggleDecade: (decadeId: string) => void;
  onClearDecades: () => void;
}

export function DecadeFilterModal({
  isOpen,
  onClose,
  selectedDecades,
  onToggleDecade,
  onClearDecades,
}: DecadeFilterModalProps) {
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
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#F3F4F6] tracking-tight">
                  Filter by Decade
                </h3>
                <span className="text-[11px] text-[#8E93A0]">
                  {selectedDecades.length === 0
                    ? 'All eras and release years'
                    : `${selectedDecades.length} decade${selectedDecades.length > 1 ? 's' : ''} selected`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedDecades.length > 0 && (
                <button
                  type="button"
                  onClick={onClearDecades}
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

          {/* Decades Grid (in descending order) */}
          <div className="p-5 overflow-y-auto max-h-[60vh]">
            <p className="text-xs text-[#8E93A0] mb-3.5 leading-relaxed">
              Select one or multiple decades in descending order from the current era to filter your recommendations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DECADE_OPTIONS.map((dec) => {
                const isSelected = selectedDecades.includes(dec.id);
                return (
                  <button
                    key={dec.id}
                    type="button"
                    onClick={() => onToggleDecade(dec.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-sm scale-[1.01]'
                        : 'bg-white/[0.02] text-[#8E93A0] border-white/[0.08] hover:bg-white/[0.05] hover:text-[#F3F4F6]'
                    }`}
                  >
                    <div>
                      <div className={`text-sm font-semibold ${isSelected ? 'text-black' : 'text-white'}`}>
                        {dec.label}
                      </div>
                      <div className={`text-[11px] ${isSelected ? 'text-black/70' : 'text-[#8E93A0]'}`}>
                        {dec.description}
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ml-2 transition-colors ${
                        isSelected
                          ? 'bg-black text-white'
                          : 'border border-white/20 bg-white/[0.04]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Done Action */}
          <div className="p-4 border-t border-white/[0.08] bg-[#101216] flex items-center justify-between gap-3">
            <span className="text-xs text-[#8E93A0] tabular-nums">
              {selectedDecades.length === 0
                ? 'Showing all decades'
                : `${selectedDecades.length} active decade${selectedDecades.length > 1 ? 's' : ''}`}
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
