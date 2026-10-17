'use client';

import React from 'react';
import { X, Check, Database, Film } from 'lucide-react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiSettingsModal({ isOpen, onClose }: ApiSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-[#14161B] border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.06)] p-6 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#8E93A0]" />
            <h3 className="text-base font-medium text-[#F3F4F6] tracking-tight">
              Entertainment Database Engines
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8E93A0] hover:text-white hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TMDb Engine Status */}
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-xs text-emerald-400">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              TMDb API v3 & v4 Connected
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200">
              Active
            </span>
          </div>
          <p className="text-emerald-400/90 leading-relaxed text-[11px]">
            Live daily trending films & TV shows, multi-search, and high-resolution official posters are active.
          </p>
        </div>

        {/* OMDb Engine Status */}
        <div className="mb-5 p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-xs text-emerald-400">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5" />
              OMDb (IMDb) Engine Connected
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200">
              Active (44535897)
            </span>
          </div>
          <p className="text-emerald-400/90 leading-relaxed text-[11px]">
            Direct fallback to IMDb database with verified Amazon CDN poster artwork.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-lg bg-[#F4F4F6] hover:bg-white text-[#0A0B0D] text-xs font-medium transition-colors cursor-pointer shadow-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
